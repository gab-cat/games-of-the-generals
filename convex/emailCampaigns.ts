// Bulk announcement emails. Today: the one "Generals Online is back" send.
//
// The audience comes from seasonRecords (the Season 1-2 records saved before the
// Season 3 reset), because every profile now reads 0 games. A player gets it when
// they have a real sign-in account (not a guest), a valid email, finished at least
// one game, aren't banned right now and haven't unsubscribed. One email per address.
//
// Each send is reserved as a "pending" row before Cloudflare is called and marked
// "sent" or "failed" after, so a resumed or repeated run never mails anyone twice.
// A run handles one page, then schedules the next. Throttling pauses for a minute.
//
//   Count only:   npx convex run --prod emailCampaigns:sendRelaunch '{"dryRun":true}'
//   Test to one:  npx convex run --prod emailCampaigns:sendRelaunch '{"onlyEmails":["you@example.com"]}'
//   Send to all:  npx convex run --prod emailCampaigns:sendRelaunch '{}'
//   Progress:     npx convex run --prod emailCampaigns:campaignStats '{}'
//   Pause:        npx convex env set --prod RELAUNCH_PAUSED true (remove it, then run again to resume)
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  type ActionCtx,
  httpAction,
  internalAction,
  internalMutation,
  internalQuery,
  type QueryCtx,
} from "./_generated/server";
import { EmailSendError, sendEmail } from "./cloudflareEmail";
import { relaunchEmail, type SignInMethod } from "./emails/templates";

export const RELAUNCH_CAMPAIGN = "relaunch-2026-11";
const SEASON = 2; // seasonRecords.season for everything before Season 3
const PAGE_SIZE = 60;
// One at a time with a gap: four in parallel got throttled on the first page.
const CONCURRENCY = 1;
const GAP_MS = 400;
const MAX_FAILURES_IN_A_ROW = 15;

const EMAIL = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;
const SIGN_IN_ORDER: SignInMethod[] = ["google", "github", "password"];

type Recipient = {
  userId: Id<"users">;
  email: string;
  username: string;
  rank: string;
  gamesPlayed: number;
  wins: number;
  signInMethod: SignInMethod;
};

async function isBannedNow(ctx: QueryCtx, userId: Id<"users">, now: number) {
  const active = await ctx.db
    .query("userModeration")
    .withIndex("by_target_active", (q) => q.eq("targetUserId", userId).eq("isActive", true))
    .collect();
  return active.some((m) => m.action === "ban" && (!m.expiresAt || m.expiresAt > now));
}

// One page of season records, filtered to who should get the email and hasn't yet.
export const audiencePage = internalQuery({
  args: { campaign: v.string(), cursor: v.union(v.string(), v.null()), numItems: v.number() },
  handler: async (ctx, { campaign, cursor, numItems }) => {
    const now = Date.now();
    const page = await ctx.db
      .query("seasonRecords")
      .withIndex("by_season_place", (q) => q.eq("season", SEASON))
      .paginate({ cursor, numItems });

    const skipped: Record<string, number> = {};
    const skip = (why: string) => (skipped[why] = (skipped[why] ?? 0) + 1);
    const recipients: Recipient[] = [];

    for (const r of page.page) {
      if (r.gamesPlayed < 1) { skip("no finished games"); continue; }
      const user = await ctx.db.get(r.userId);
      if (!user) { skip("account deleted"); continue; }
      if (user.isAnonymous) { skip("guest"); continue; }
      const email = (user.email ?? "").trim().toLowerCase();
      if (!EMAIL.test(email)) { skip("no valid email"); continue; }

      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", r.userId))
        .collect();
      const providers = new Set(accounts.map((a) => a.provider));
      const signInMethod = SIGN_IN_ORDER.find((p) => providers.has(p));
      if (!signInMethod) { skip("no sign-in account"); continue; }

      if (await isBannedNow(ctx, r.userId, now)) { skip("banned"); continue; }
      const optedOut = await ctx.db
        .query("emailOptOuts")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (optedOut) { skip("unsubscribed"); continue; }
      const already = await ctx.db
        .query("emailCampaignSends")
        .withIndex("by_campaign_email", (q) => q.eq("campaign", campaign).eq("email", email))
        .first();
      if (already) { skip(`already ${already.status}`); continue; }

      recipients.push({
        userId: r.userId,
        email,
        username: r.username,
        rank: r.rank,
        gamesPlayed: r.gamesPlayed,
        wins: r.wins,
        signInMethod,
      });
    }

    return { recipients, skipped, scanned: page.page.length, isDone: page.isDone, cursor: page.continueCursor };
  },
});

// Claims the address for this campaign. Null means someone already has it (a
// duplicate email across two accounts, or a send that already happened).
export const reserve = internalMutation({
  args: { campaign: v.string(), userId: v.id("users"), email: v.string() },
  handler: async (ctx, { campaign, userId, email }) => {
    const existing = await ctx.db
      .query("emailCampaignSends")
      .withIndex("by_campaign_email", (q) => q.eq("campaign", campaign).eq("email", email))
      .first();
    if (existing) return null;
    const token = crypto.randomUUID().replace(/-/g, "");
    const id = await ctx.db.insert("emailCampaignSends", {
      campaign,
      userId,
      email,
      token,
      status: "pending",
      createdAt: Date.now(),
    });
    return { id, token };
  },
});

export const finish = internalMutation({
  args: {
    id: v.id("emailCampaignSends"),
    outcome: v.union(
      v.object({ status: v.literal("sent"), messageId: v.string() }),
      v.object({ status: v.literal("failed"), error: v.string() }),
      // Throttled before anything was sent: free the address for the next try.
      v.object({ status: v.literal("release") }),
    ),
  },
  handler: async (ctx, { id, outcome }) => {
    if (outcome.status === "release") {
      await ctx.db.delete(id);
    } else if (outcome.status === "sent") {
      await ctx.db.patch(id, { status: "sent", messageId: outcome.messageId, sentAt: Date.now() });
    } else {
      await ctx.db.patch(id, { status: "failed", error: outcome.error.slice(0, 500) });
    }
  },
});

function unsubscribeUrl(token: string): string {
  const site = process.env.CONVEX_SITE_URL;
  if (!site) throw new Error("CONVEX_SITE_URL is not set");
  return `${site}/email/unsubscribe?t=${token}`;
}

export const sendRelaunch = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
    /** Only these addresses, for a test send. They are marked sent like anyone else. */
    onlyEmails: v.optional(v.array(v.string())),
    cursor: v.optional(v.union(v.string(), v.null())),
    /** Running totals carried between pages. */
    totals: v.optional(v.record(v.string(), v.number())),
  },
  handler: async (ctx, args): Promise<Record<string, number> | string> => {
    const campaign = RELAUNCH_CAMPAIGN;
    const only = args.onlyEmails?.map((e) => e.trim().toLowerCase());
    const totals: Record<string, number> = { ...args.totals };
    const add = (key: string, n = 1) => (totals[key] = (totals[key] ?? 0) + n);
    let cursor = args.cursor ?? null;

    // Pause switch: npx convex env set --prod RELAUNCH_PAUSED true
    if (!args.dryRun && process.env.RELAUNCH_PAUSED === "true") {
      console.warn("[relaunch] paused by RELAUNCH_PAUSED; run sendRelaunch again to resume", totals);
      return "Paused";
    }

    // A dry run or a test send scans every page in this one call; a real send does
    // one page per call so no single action runs long.
    for (;;) {
      const page = await ctx.runQuery(internal.emailCampaigns.audiencePage, {
        campaign,
        cursor,
        numItems: PAGE_SIZE * (args.dryRun || only ? 5 : 1),
      });
      add("scanned", page.scanned);
      for (const [why, n] of Object.entries(page.skipped)) add(`skipped: ${why}`, n);

      const recipients = only ? page.recipients.filter((r) => only.includes(r.email)) : page.recipients;
      if (args.dryRun) {
        add("would send", recipients.length);
      } else {
        const result = await sendBatch(ctx, campaign, recipients);
        for (const [k, n] of Object.entries(result.counts)) add(k, n);
        if (result.stop) {
          console.error(`[relaunch] stopped: ${result.stop}`, totals);
          return `Stopped: ${result.stop}. Fix it and run sendRelaunch again; it resumes where it left off.`;
        }
        if (result.throttled) {
          // Nothing got through: the account's daily quota is used up, so check back
          // every 30 minutes. Some got through: a short-term rate limit, retry soon.
          const waitMs = result.counts.sent ? 60_000 : 30 * 60_000;
          console.warn(`[relaunch] throttled, retrying this page in ${waitMs / 60_000} min`, totals);
          await ctx.scheduler.runAfter(waitMs, internal.emailCampaigns.sendRelaunch, {
            onlyEmails: args.onlyEmails,
            cursor,
            totals,
          });
          return totals;
        }
      }

      cursor = page.cursor;
      if (page.isDone) {
        console.log("[relaunch] done", totals);
        return totals;
      }
      if (!args.dryRun && !only) {
        console.log("[relaunch] page done", totals);
        await ctx.scheduler.runAfter(500, internal.emailCampaigns.sendRelaunch, { cursor, totals });
        return totals;
      }
    }
  },
});

async function sendBatch(
  ctx: ActionCtx,
  campaign: string,
  recipients: Recipient[],
): Promise<{ counts: Record<string, number>; throttled: boolean; stop?: string }> {
  const counts: Record<string, number> = {};
  const add = (key: string) => (counts[key] = (counts[key] ?? 0) + 1);
  let throttled = false;
  let failuresInARow = 0;
  let stop: string | undefined;

  const queue = [...recipients];
  const worker = async () => {
    for (;;) {
      if (throttled || stop) return;
      const r = queue.shift();
      if (!r) return;
      const claim = await ctx.runMutation(internal.emailCampaigns.reserve, {
        campaign,
        userId: r.userId,
        email: r.email,
      });
      if (!claim) { add("skipped: duplicate email"); continue; }

      const url = unsubscribeUrl(claim.token);
      const email = relaunchEmail({ ...r, unsubscribeUrl: url });
      try {
        const messageId = await sendEmail({
          to: r.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
          headers: {
            "List-Unsubscribe": `<${url}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        await ctx.runMutation(internal.emailCampaigns.finish, {
          id: claim.id,
          outcome: { status: "sent", messageId },
        });
        add("sent");
        failuresInARow = 0;
        await new Promise((resolve) => setTimeout(resolve, GAP_MS));
      } catch (error) {
        if (error instanceof EmailSendError && error.throttled) {
          await ctx.runMutation(internal.emailCampaigns.finish, { id: claim.id, outcome: { status: "release" } });
          console.warn(`[relaunch] throttled after ${counts.sent ?? 0} sent: ${error.message}`);
          throttled = true;
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        await ctx.runMutation(internal.emailCampaigns.finish, {
          id: claim.id,
          outcome: { status: "failed", error: message },
        });
        add("failed");
        console.warn(`[relaunch] failed for ${r.email}: ${message}`);
        // Auth or quota problems fail every send; stop instead of burning the list.
        // Single bad addresses (bounces) just count as failed.
        failuresInARow++;
        if (error instanceof EmailSendError && (error.status === 401 || error.status === 403)) {
          stop = message;
        } else if (failuresInARow >= MAX_FAILURES_IN_A_ROW) {
          stop = `${MAX_FAILURES_IN_A_ROW} failures in a row, last: ${message}`;
        }
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { counts, throttled, stop };
}

export const campaignStats = internalQuery({
  args: { campaign: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const campaign = args.campaign ?? RELAUNCH_CAMPAIGN;
    const out: Record<string, number> = {};
    for (const status of ["pending", "sent", "failed"] as const) {
      const rows = await ctx.db
        .query("emailCampaignSends")
        .withIndex("by_campaign_status", (q) => q.eq("campaign", campaign).eq("status", status))
        .collect();
      out[status] = rows.length;
    }
    const optOuts = await ctx.db.query("emailOptOuts").collect();
    out.unsubscribed = optOuts.length;
    return out;
  },
});

// ---------------------------------------------------------------------------
// Unsubscribe

export const optOutByToken = internalMutation({
  args: { token: v.string(), source: v.string() },
  handler: async (ctx, { token, source }) => {
    const send = await ctx.db
      .query("emailCampaignSends")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!send) return false;
    const existing = await ctx.db
      .query("emailOptOuts")
      .withIndex("by_email", (q) => q.eq("email", send.email))
      .first();
    if (!existing) {
      await ctx.db.insert("emailOptOuts", {
        email: send.email,
        userId: send.userId,
        source,
        optedOutAt: Date.now(),
      });
    }
    return true;
  },
});

const page = (title: string, body: string) =>
  new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<style>body{margin:0;background:#0b0b0d;color:#f5f2ec;font-family:Poppins,system-ui,sans-serif}main{max-width:520px;margin:0 auto;padding:72px 24px}h1{font-size:28px;line-height:34px;margin:0 0 12px;letter-spacing:-0.5px}p{font-size:16px;line-height:26px;color:#dedbd5;margin:0 0 16px}a{color:#d9a441}</style>
</head><body><main><h1>${title}</h1>${body}</main></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

// GET: the link in the footer. POST: one-click unsubscribe from the inbox (RFC 8058).
export const unsubscribe = httpAction(async (ctx, request) => {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const ok = /^[a-f0-9]{32}$/.test(token)
    ? await ctx.runMutation(internal.emailCampaigns.optOutByToken, {
        token,
        source: request.method === "POST" ? "one-click" : "link",
      })
    : false;

  if (request.method === "POST") return new Response(ok ? "Unsubscribed" : "Unknown link", { status: ok ? 200 : 404 });
  return ok
    ? page(
        "You're unsubscribed",
        `<p>You won't get announcement emails from Games of the Generals any more. Emails you ask for, like password reset codes, still arrive.</p><p><a href="https://www.generalsonline.app">Back to the game</a></p>`,
      )
    : page("This link doesn't work", `<p>It may be incomplete. Copy the whole link from the email and try again.</p>`);
});
