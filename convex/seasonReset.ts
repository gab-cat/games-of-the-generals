import { v } from "convex/values";
import { internalMutation, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { deleteUserAndData, isDeletableGuest, isInLiveGame } from "./lib/userCleanup";

// Season reset: saves every real player's record into `seasonRecords`, then
// clears what a fresh season doesn't need. Runs as one scheduled chain of small
// pages, so it never hits Convex's per-function limits and can resume.
//
//   npx convex run --prod seasonReset:run '{"season": 2, "dryRun": true}'
//
// Steps, in order:
//   record    save each real player's final record (skips guests and 0-game players)
//   guests    delete guest accounts that can no longer sign in, with their data
//             (never one with a real login attached or a live game)
//   games     delete finished games, their spectator chat and any move rows
//   lobbies   delete finished lobbies
//   profiles  zero every profile's stats (ELO 1500, Private)
//   conversations  delete empty "Notifications" conversations (recreated on demand)
//   accounts  delete guest auth accounts whose user is gone, and stale auth verifiers
// Kept: accounts, achievements, setup presets, subscriptions, payments,
// donations, moderation, support tickets, announcements, chat settings.

const STEPS = [
  "record",
  "guests",
  "games",
  "lobbies",
  "profiles",
  "conversations",
  "accounts",
] as const;
type Step = (typeof STEPS)[number];

const PAGE: Record<Step, number> = {
  record: 400,
  guests: 40,
  games: 150,
  lobbies: 500,
  profiles: 400,
  conversations: 500,
  accounts: 1000,
};

const DAY = 24 * 60 * 60 * 1000;

type PageResult = { counts: Record<string, number>; isDone: boolean; cursor: string; place?: number };

async function runPage(
  ctx: MutationCtx,
  step: Step,
  cursor: string | null,
  season: number,
  place: number,
  dryRun: boolean,
): Promise<PageResult> {
  const numItems = PAGE[step];
  const counts: Record<string, number> = {};
  const add = (key: string, n = 1) => (counts[key] = (counts[key] ?? 0) + n);
  const now = Date.now();

  switch (step) {
    case "record": {
      const page = await ctx.db
        .query("profiles")
        .withIndex("by_elo")
        .order("desc")
        .paginate({ numItems, cursor });
      for (const p of page.page) {
        if (p.gamesPlayed === 0) continue;
        const user = await ctx.db.get(p.userId);
        if (!user || user.isAnonymous) continue;
        place++;
        add("recorded");
        const existing = await ctx.db
          .query("seasonRecords")
          .withIndex("by_user_season", (q) => q.eq("userId", p.userId).eq("season", season))
          .unique();
        if (existing || dryRun) continue;
        await ctx.db.insert("seasonRecords", {
          userId: p.userId,
          season,
          username: p.username,
          elo: p.elo,
          rank: p.rank,
          wins: p.wins,
          losses: p.losses,
          gamesPlayed: p.gamesPlayed,
          bestWinStreak: p.bestWinStreak ?? 0,
          capturedFlags: p.capturedFlags ?? 0,
          totalPlayTime: p.totalPlayTime ?? 0,
          place,
          recordedAt: now,
        });
      }
      return { counts, isDone: page.isDone, cursor: page.continueCursor, place };
    }

    case "guests": {
      const page = await ctx.db
        .query("users")
        .withIndex("by_isAnonymous", (q) => q.eq("isAnonymous", true))
        .paginate({ numItems, cursor });
      for (const user of page.page) {
        if (!(await isDeletableGuest(ctx, user._id))) {
          add("guestsKept");
          continue;
        }
        add("guestsDeleted");
        if (!dryRun) add("guestRowsDeleted", await deleteUserAndData(ctx, user._id));
      }
      return { counts, isDone: page.isDone, cursor: page.continueCursor };
    }

    case "games": {
      const page = await ctx.db
        .query("games")
        .withIndex("by_status_finished", (q) => q.eq("status", "finished"))
        .paginate({ numItems, cursor });
      for (const game of page.page) {
        add("gamesDeleted");
        if (dryRun) continue;
        const chat = await ctx.db
          .query("spectatorChat")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .take(500);
        for (const row of chat) await ctx.db.delete(row._id);
        const moves = await ctx.db
          .query("moves")
          .withIndex("by_game_timestamp", (q) => q.eq("gameId", game._id))
          .take(2000);
        for (const row of moves) await ctx.db.delete(row._id);
        add("chatRowsDeleted", chat.length);
        add("moveRowsDeleted", moves.length);
        await ctx.db.delete(game._id);
      }
      return { counts, isDone: page.isDone, cursor: page.continueCursor };
    }

    case "lobbies": {
      const page = await ctx.db
        .query("lobbies")
        .withIndex("by_status", (q) => q.eq("status", "finished"))
        .paginate({ numItems, cursor });
      for (const lobby of page.page) {
        add("lobbiesDeleted");
        if (!dryRun) await ctx.db.delete(lobby._id);
      }
      return { counts, isDone: page.isDone, cursor: page.continueCursor };
    }

    case "profiles": {
      const page = await ctx.db.query("profiles").paginate({ numItems, cursor });
      for (const p of page.page) {
        if (p.gamesPlayed === 0 && p.elo === 1500 && !p.gameId && !p.lobbyId) continue;
        // A player mid-game keeps their stats; that game is still being scored.
        if (await isInLiveGame(ctx, p.userId)) {
          add("profilesInLiveGame");
          continue;
        }
        add("profilesReset");
        if (dryRun) continue;
        await ctx.db.patch(p._id, {
          wins: 0,
          losses: 0,
          gamesPlayed: 0,
          rank: "Private",
          elo: 1500,
          totalPlayTime: 0,
          fastestWin: undefined,
          fastestGame: undefined,
          longestGame: undefined,
          winStreak: 0,
          bestWinStreak: 0,
          capturedFlags: 0,
          piecesEliminated: 0,
          spiesRevealed: 0,
          gameId: undefined,
          lobbyId: undefined,
        });
      }
      return { counts, isDone: page.isDone, cursor: page.continueCursor };
    }

    case "conversations": {
      const page = await ctx.db.query("conversations").paginate({ numItems, cursor });
      for (const c of page.page) {
        if (!c.isSystemNotification) continue;
        if (c.lastMessageId && (await ctx.db.get(c.lastMessageId))) continue;
        add("emptyNotificationConversationsDeleted");
        if (!dryRun) await ctx.db.delete(c._id);
      }
      return { counts, isDone: page.isDone, cursor: page.continueCursor };
    }

    case "accounts": {
      const page = await ctx.db.query("authAccounts").paginate({ numItems, cursor });
      for (const account of page.page) {
        // Orphaned password/Google/GitHub logins belong to real players and are
        // relinked by authRepair.relinkOrphanPasswordAccounts, not deleted here.
        if (account.provider !== "anonymous") continue;
        if (await ctx.db.get(account.userId)) continue;
        add("orphanGuestAccountsDeleted");
        if (!dryRun) await ctx.db.delete(account._id);
      }
      if (page.isDone) {
        // PKCE verifiers only live for one sign-in attempt.
        const verifiers = await ctx.db
          .query("authVerifiers")
          .withIndex("by_creation_time", (q) => q.lt("_creationTime", now - DAY))
          .take(2000);
        add("staleVerifiersDeleted", verifiers.length);
        if (!dryRun) for (const row of verifiers) await ctx.db.delete(row._id);
      }
      return { counts, isDone: page.isDone, cursor: page.continueCursor };
    }
  }
}

export const run = internalMutation({
  args: {
    season: v.number(),
    dryRun: v.boolean(),
    step: v.optional(v.string()),
    cursor: v.optional(v.union(v.string(), v.null())),
    place: v.optional(v.number()),
    totals: v.optional(v.record(v.string(), v.number())),
    // Run only this one step (for re-running a step on its own).
    only: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const step = (args.step ?? STEPS[0]) as Step;
    if (!STEPS.includes(step)) throw new Error(`Unknown step ${step}`);

    const result = await runPage(
      ctx,
      step,
      args.cursor ?? null,
      args.season,
      args.place ?? 0,
      args.dryRun,
    );

    const totals: Record<string, number> = { ...args.totals };
    for (const [key, n] of Object.entries(result.counts)) totals[key] = (totals[key] ?? 0) + n;

    const label = args.dryRun ? "[season reset dry run]" : "[season reset]";
    let next: { step: Step; cursor: string | null } | null = null;
    if (!result.isDone) {
      next = { step, cursor: result.cursor };
    } else {
      console.log(`${label} step ${step} done ${JSON.stringify(totals)}`);
      const index = STEPS.indexOf(step);
      if (!args.only && index < STEPS.length - 1) next = { step: STEPS[index + 1], cursor: null };
    }

    if (next) {
      await ctx.scheduler.runAfter(200, internal.seasonReset.run, {
        season: args.season,
        dryRun: args.dryRun,
        step: next.step,
        cursor: next.cursor,
        place: result.place ?? args.place,
        totals,
        only: args.only,
      });
    } else {
      console.log(`${label} finished ${JSON.stringify(totals)}`);
    }
    return { step, page: result.counts, done: !next };
  },
});
