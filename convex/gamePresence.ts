import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOwnUsername, presence } from "./presence";

// Presence for a single game room (roomId is the game id). Players and
// spectators heartbeat while the game is in setup or play; the room is
// removed on every game-ending path in convex/games.ts.
export const heartbeat = mutation({
  args: {
    roomId: v.id("games"),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    const game = await ctx.db.get(roomId);
    if (!game) throw new Error("Game not found");

    const isPlayer = game.player1Id === authUserId || game.player2Id === authUserId;
    if (!isPlayer && !game.spectators.includes(authUserId)) {
      throw new Error("Not authorized to join this game room");
    }

    // A finished game's room was already removed. Writing here would recreate
    // it and leave a presence row behind for good.
    if (game.status === "finished") {
      return { roomToken: "", sessionToken: "" };
    }

    // Presence is keyed by username; take it from the caller's profile, not
    // from the client, so nobody can mark another player online.
    const username = await getOwnUsername(ctx);
    if (!username || username !== userId) {
      return { roomToken: "", sessionToken: "" };
    }

    return await presence.heartbeat(ctx, roomId, username, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken);
  },
});

// No auth check: the hook calls this through sendBeacon on page unload, which
// can't carry auth. The session token is the secret.
export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});
