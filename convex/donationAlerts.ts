import { internalAction, internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { sendEmail } from "./cloudflareEmail";
import { donationReportsEmail } from "./emails/templates";
import { QR_METHOD_LABEL } from "./lib/qrDonation";
import {
  type WaitingReport,
  digestPending,
  nextDigestAt,
  planDigest,
} from "./lib/donationAlerts";

/*
 * Batched admin emails about QR Ph donation reports. Timing rules and what
 * goes in each email live in lib/donationAlerts.ts.
 *
 * reportQrDonation calls scheduleDonationDigest, which schedules one send
 * unless one is already on its way. The 9 AM cron sends a reminder only
 * when a report has waited over a day.
 */

const KIND = "donation_reports" as const;
const modeValidator = v.union(v.literal("new"), v.literal("reminder"));

async function alertState(ctx: MutationCtx) {
  return await ctx.db
    .query("adminAlerts")
    .withIndex("by_kind", (q) => q.eq("kind", KIND))
    .unique();
}

/** Called in the same transaction as a new report. */
export async function scheduleDonationDigest(ctx: MutationCtx): Promise<void> {
  const now = Date.now();
  const state = await alertState(ctx);
  if (digestPending(state?.scheduledFor, now)) return; // this report joins that email

  const sendAt = nextDigestAt(now, state?.lastSentAt);
  await ctx.scheduler.runAt(sendAt, internal.donationAlerts.sendDonationDigest, { mode: "new" });
  if (state) {
    await ctx.db.patch(state._id, { scheduledFor: sendAt });
  } else {
    await ctx.db.insert("adminAlerts", { kind: KIND, scheduledFor: sendAt });
  }
}

/** Reports still waiting for an admin, and who to email. */
export const getDigestData = internalQuery({
  args: {},
  handler: async (ctx) => {
    const waiting: WaitingReport[] = [];
    for (const status of ["open", "in_progress"] as const) {
      const tickets = await ctx.db
        .query("supportTickets")
        .withIndex("by_category_status", (q) =>
          q.eq("category", "donation").eq("status", status),
        )
        .take(100);
      for (const t of tickets) {
        const r = t.donationReport;
        if (!r || r.confirmedAt) continue;
        waiting.push({
          ticketId: t._id,
          username: t.username,
          amountCentavos: r.amountCentavos,
          method: r.method,
          reference: r.reference,
          createdAt: t.createdAt,
          alertedAt: r.alertedAt,
        });
      }
    }

    // Crediting money is for admins, so only they get these.
    const admins = await ctx.db
      .query("profiles")
      .withIndex("by_admin_role", (q) => q.eq("adminRole", "admin"))
      .take(20);
    const recipients: string[] = [];
    for (const admin of admins) {
      const user = await ctx.db.get(admin.userId);
      if (user?.email) recipients.push(user.email);
    }

    return { waiting, recipients };
  },
});

/** After a send (or a skipped one): mark the reports it introduced and free the schedule. */
export const finishDigest = internalMutation({
  args: {
    mode: modeValidator,
    sentAt: v.optional(v.number()),
    newTicketIds: v.array(v.id("supportTickets")),
  },
  handler: async (ctx, { mode, sentAt, newTicketIds }) => {
    for (const id of newTicketIds) {
      const ticket = await ctx.db.get(id);
      if (ticket?.donationReport && ticket.donationReport.alertedAt === undefined) {
        await ctx.db.patch(id, {
          donationReport: { ...ticket.donationReport, alertedAt: sentAt },
        });
      }
    }
    const state = await alertState(ctx);
    const patch: { scheduledFor?: undefined; lastSentAt?: number } = {};
    if (mode === "new") patch.scheduledFor = undefined;
    if (sentAt !== undefined) patch.lastSentAt = sentAt;
    if (state) {
      await ctx.db.patch(state._id, patch);
    } else if (sentAt !== undefined) {
      await ctx.db.insert("adminAlerts", { kind: KIND, lastSentAt: sentAt });
    }
  },
});

/** Sends one email listing every waiting report, if there is something worth sending. */
export const sendDonationDigest = internalAction({
  args: { mode: modeValidator },
  handler: async (ctx, { mode }) => {
    const { waiting, recipients } = await ctx.runQuery(internal.donationAlerts.getDigestData, {});
    const now = Date.now();
    const plan = planDigest(mode, waiting, now);

    if (!plan || recipients.length === 0) {
      if (plan) console.warn("[Donation alerts] No admin has an email address; nothing sent.");
      await ctx.runMutation(internal.donationAlerts.finishDigest, { mode, newTicketIds: [] });
      return { sent: false };
    }

    const email = donationReportsEmail({
      mode,
      now,
      overdueCount: plan.overdueCount,
      reports: plan.reports.map((r) => ({
        ticketId: r.ticketId,
        username: r.username,
        amountCentavos: r.amountCentavos,
        methodLabel: QR_METHOD_LABEL[r.method],
        reference: r.reference,
        createdAt: r.createdAt,
        isNew: r.isNew,
      })),
    });

    try {
      await sendEmail({ to: recipients, ...email });
    } catch (error) {
      // Free the schedule so the next report tries again; the 9 AM reminder is the backstop.
      console.error("[Donation alerts] Send failed:", error);
      await ctx.runMutation(internal.donationAlerts.finishDigest, { mode, newTicketIds: [] });
      return { sent: false };
    }

    await ctx.runMutation(internal.donationAlerts.finishDigest, {
      mode,
      sentAt: now,
      newTicketIds: plan.newIds as Id<"supportTickets">[],
    });
    return { sent: true, reports: plan.reports.length };
  },
});
