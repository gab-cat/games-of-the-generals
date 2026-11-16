import { v } from "convex/values";
import { internalMutation, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import {
  BoardCell,
  decodeMoves,
  decodeSetup,
  encodeMoves,
  encodeSetup,
} from "./lib/replayCodec";

// Finished games keep their move rows for an hour so spectators, the result
// screen and achievement checks can still read them. After that the archive
// job packs them into `games.replay` and deletes the rows.
export const ARCHIVE_AFTER_MS = 60 * 60 * 1000;

// Keep each run well under Convex's per-mutation limits (16k writes, 32k reads).
const GAMES_PER_RUN = 25;
const MOVE_ROWS_PER_RUN = 4000;
const MAX_MOVES_PER_GAME = 2000;

type ArchiveStats = {
  gamesArchived: number;
  gamesSkipped: number;
  moveRowsDeleted: number;
  bytesBefore: number;
  bytesAfter: number;
  hasMore: boolean;
};

// Replays always start hidden, so `revealed` is not compared.
function sameSetup(original: BoardCell[][], decoded: BoardCell[][]): boolean {
  return original.every((row, r) =>
    row.every((cell, c) => {
      const d = decoded[r][c];
      if (!cell || !d) return cell === d;
      return cell.piece === d.piece && cell.player === d.player;
    }),
  );
}

function sameMoves(
  original: Doc<"moves">[],
  decoded: ReturnType<typeof decodeMoves>,
): boolean {
  if (original.length !== decoded.length) return false;
  return original.every((move, i) => {
    const d = decoded[i];
    return (
      move.moveType === d.moveType &&
      move.fromRow === d.fromRow &&
      move.fromCol === d.fromCol &&
      move.toRow === d.toRow &&
      move.toCol === d.toCol &&
      move.piece === d.piece &&
      move.challengeResult?.attacker === d.challengeResult?.attacker &&
      move.challengeResult?.defender === d.challengeResult?.defender &&
      move.challengeResult?.winner === d.challengeResult?.winner
    );
  });
}

// Packs one game. Returns null when the game can't be packed safely; its move
// rows are then left in place and replays keep reading them.
function packGame(game: Doc<"games">, moves: Doc<"moves">[]) {
  const playable = moves.filter((m) => m.moveType !== "setup");
  try {
    // New games carry the packed `setupCode`; older ones the full board.
    const original = game.initialSetupBoard as BoardCell[][] | undefined;
    const setup = game.setupCode ?? (original ? encodeSetup(original) : undefined);
    const decodedSetup = setup ? decodeSetup(setup) : undefined;
    if (original && decodedSetup && !sameSetup(original, decodedSetup)) return null;
    const encoded = encodeMoves(playable);
    if (!sameMoves(playable, decodeMoves(encoded, decodedSetup))) return null;
    return { v: 1 as const, setup, moves: encoded };
  } catch {
    return null;
  }
}

export const archiveFinishedGames = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    // Lets the backfill keep going in the same scheduled chain.
    continueUntilDone: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<ArchiveStats> => {
    const now = Date.now();
    const games = await ctx.db
      .query("games")
      .withIndex("by_status_archived", (q) =>
        q
          .eq("status", "finished")
          .eq("movesArchivedAt", undefined)
          .lt("finishedAt", now - ARCHIVE_AFTER_MS),
      )
      .take(GAMES_PER_RUN);

    const stats: ArchiveStats = {
      gamesArchived: 0,
      gamesSkipped: 0,
      moveRowsDeleted: 0,
      bytesBefore: 0,
      bytesAfter: 0,
      hasMore: false,
    };

    for (const game of games) {
      if (stats.moveRowsDeleted >= MOVE_ROWS_PER_RUN) {
        stats.hasMore = true;
        break;
      }
      const moves = await ctx.db
        .query("moves")
        .withIndex("by_game_timestamp", (q) => q.eq("gameId", game._id))
        .take(MAX_MOVES_PER_GAME + 1);

      const replay =
        moves.length > MAX_MOVES_PER_GAME ? null : packGame(game, moves);

      if (!replay) {
        stats.gamesSkipped++;
        console.warn(`[archive] kept move rows for game ${game._id}`);
        if (!args.dryRun) {
          // Mark it so the job moves on; replays keep reading the rows.
          await ctx.db.patch(game._id, { movesArchivedAt: now });
        }
        continue;
      }

      stats.gamesArchived++;
      stats.moveRowsDeleted += moves.length;
      stats.bytesBefore +=
        JSON.stringify(moves).length +
        JSON.stringify(game.initialSetupBoard ?? null).length +
        (game.setupCode?.length ?? 0) +
        JSON.stringify(game.eliminatedPieces ?? null).length;
      stats.bytesAfter += JSON.stringify(replay).length;

      if (!args.dryRun) {
        await ctx.db.patch(game._id, {
          replay,
          movesArchivedAt: now,
          initialSetupBoard: undefined,
          setupCode: undefined,
          // Only the live game screen shows it; the replay rebuilds captures.
          eliminatedPieces: undefined,
        });
        for (const move of moves) {
          await ctx.db.delete(move._id);
        }
      }
    }

    if (games.length === GAMES_PER_RUN) stats.hasMore = true;

    if (stats.hasMore && args.continueUntilDone && !args.dryRun) {
      await ctx.scheduler.runAfter(
        1000,
        internal.gameArchive.archiveFinishedGames,
        { continueUntilDone: true },
      );
    }

    console.log(`[archive] ${JSON.stringify(stats)}`);
    return stats;
  },
});

// Deletes move rows whose game no longer exists or is already packed. Walks the
// table oldest first with a cursor, so rows it keeps never block progress.
export const sweepOrphanMoves = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - ARCHIVE_AFTER_MS;
    const page = await ctx.db
      .query("moves")
      .withIndex("by_creation_time", (q) => q.lt("_creationTime", cutoff))
      .paginate({ numItems: 1000, cursor: args.cursor ?? null });

    const games = new Map<Id<"games">, Doc<"games"> | null>();
    let deleted = 0;
    for (const move of page.page) {
      if (!games.has(move.gameId)) {
        games.set(move.gameId, await ctx.db.get(move.gameId));
      }
      const game = games.get(move.gameId);
      if (!game || game.replay) {
        deleted++;
        if (!args.dryRun) await ctx.db.delete(move._id);
      }
    }

    if (!page.isDone && !args.dryRun) {
      await ctx.scheduler.runAfter(1000, internal.gameArchive.sweepOrphanMoves, {
        cursor: page.continueCursor,
      });
    }
    console.log(
      `[archive] orphan sweep scanned ${page.page.length}, deleted ${deleted}, done ${page.isDone}`,
    );
    return { scanned: page.page.length, deleted, isDone: page.isDone };
  },
});

// Replay data for a game, from the packed form when it exists, otherwise from
// the move rows. Shared by every reader so both forms keep working.
export async function loadReplay(ctx: QueryCtx, game: Doc<"games">) {
  if (game.replay) {
    const setup = game.replay.setup ? decodeSetup(game.replay.setup) : undefined;
    const decoded = decodeMoves(game.replay.moves, setup);
    return {
      initialBoard: setup ?? null,
      moves: decoded.map((m) => ({
        moveType: m.moveType,
        fromRow: m.fromRow,
        fromCol: m.fromCol,
        toRow: m.toRow,
        toCol: m.toCol,
        piece: m.piece,
        playerId: m.player === "player1" ? game.player1Id : game.player2Id,
        challengeResult: m.challengeResult,
      })),
      isTruncated: false,
    };
  }

  const limit = 1000;
  const rows = await ctx.db
    .query("moves")
    .withIndex("by_game_timestamp", (q) => q.eq("gameId", game._id))
    .take(limit);
  return {
    initialBoard:
      (game.initialSetupBoard as BoardCell[][] | undefined) ??
      (game.setupCode ? decodeSetup(game.setupCode) : null),
    moves: rows
      .filter((m) => m.moveType === "move" || m.moveType === "challenge")
      .map((m) => ({
        moveType: m.moveType as "move" | "challenge",
        fromRow: m.fromRow,
        fromCol: m.fromCol,
        toRow: m.toRow,
        toCol: m.toCol,
        piece: m.piece,
        playerId: m.playerId,
        challengeResult: m.challengeResult,
      })),
    isTruncated: rows.length >= limit,
  };
}
