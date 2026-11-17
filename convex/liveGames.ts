import { v } from "convex/values";
import { internalMutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Summary rows for games in setup or play (see `liveGames` in schema.ts).
// Writers: startGame (create), the setup -> playing transition, spectator
// join and leave, and every game-ending path (remove). Never on a move.

export async function getLiveGame(
  ctx: QueryCtx,
  gameId: Id<"games">,
): Promise<Doc<"liveGames"> | null> {
  return await ctx.db
    .query("liveGames")
    .withIndex("by_game", (q) => q.eq("gameId", gameId))
    .unique();
}

export async function createLiveGame(
  ctx: MutationCtx,
  game: Doc<"games">,
  lobby: Doc<"lobbies"> | null,
): Promise<void> {
  if (game.status === "finished") return;
  if (await getLiveGame(ctx, game._id)) return;
  await ctx.db.insert("liveGames", {
    gameId: game._id,
    lobbyName: game.lobbyName,
    status: game.status,
    player1Username: game.player1Username,
    player2Username: game.player2Username,
    gameMode: game.gameMode,
    playingSince: game.status === "playing" ? game.gameTimeStarted : undefined,
    isPublic: (lobby?.allowSpectators ?? true) && !(lobby?.isPrivate ?? false),
    maxSpectators: lobby?.maxSpectators,
    spectatorIds: game.spectators,
  });
}

export async function markLiveGamePlaying(
  ctx: MutationCtx,
  gameId: Id<"games">,
  playingSince: number,
): Promise<void> {
  const live = await getLiveGame(ctx, gameId);
  if (live) await ctx.db.patch(live._id, { status: "playing", playingSince });
}

export async function setLiveGameSpectators(
  ctx: MutationCtx,
  gameId: Id<"games">,
  spectatorIds: Id<"users">[],
): Promise<void> {
  const live = await getLiveGame(ctx, gameId);
  if (live) await ctx.db.patch(live._id, { spectatorIds });
}

export async function removeLiveGame(
  ctx: MutationCtx,
  gameId: Id<"games">,
): Promise<void> {
  const live = await getLiveGame(ctx, gameId);
  if (live) await ctx.db.delete(live._id);
}

// Setup lasts at most 5 minutes and cleanupStaleGames forfeits games playing
// for more than 20, so a row this old is almost surely left over.
const STALE_AFTER_MS = 45 * 60 * 1000;

// Safety net, run with cleanupStaleGames: drops rows whose game ended or was
// deleted by a path that didn't remove them. Only rows older than any real
// game are checked, so a normal run reads no game rows at all.
export const sweepLiveGames = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("liveGames")
      .withIndex("by_creation_time", (q) =>
        q.lt("_creationTime", Date.now() - STALE_AFTER_MS),
      )
      .take(25);
    let removed = 0;
    for (const row of rows) {
      const game = await ctx.db.get(row.gameId);
      if (!game || game.status === "finished") {
        await ctx.db.delete(row._id);
        removed++;
      }
    }
    return removed;
  },
});

// One-off after deploying the liveGames table: creates rows for games that
// were already in setup or play. Insert-only and idempotent.
// npx convex run liveGames:backfillLiveGames '{"dryRun": true}'
export const backfillLiveGames = internalMutation({
  args: { dryRun: v.boolean() },
  returns: v.object({ live: v.number(), created: v.number() }),
  handler: async (ctx, { dryRun }) => {
    const [setup, playing] = await Promise.all([
      ctx.db
        .query("games")
        .withIndex("by_status", (q) => q.eq("status", "setup"))
        .take(200),
      ctx.db
        .query("games")
        .withIndex("by_status", (q) => q.eq("status", "playing"))
        .take(200),
    ]);
    let created = 0;
    for (const game of [...setup, ...playing]) {
      if (await getLiveGame(ctx, game._id)) continue;
      created++;
      if (!dryRun) {
        await createLiveGame(ctx, game, await ctx.db.get(game.lobbyId));
      }
    }
    return { live: setup.length + playing.length, created };
  },
});
