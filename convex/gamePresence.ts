import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { presence } from "./presence";
import { Id } from "./_generated/dataModel";

// Game-specific presence functions
// Note: Convex's built-in OCC (Optimistic Concurrency Control) handles retries automatically
export const heartbeat = mutation({
  args: { 
    roomId: v.string(), 
    userId: v.string(), 
    sessionId: v.string(), 
    interval: v.number() 
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    // Verify the user is authenticated and matches the userId
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    
    // Verify the user is actually a player in this game or spectator
    const game = await ctx.db.get(roomId as Id<"games">);
    if (!game) throw new Error("Game not found");
    
    const isPlayer = game.player1Id === authUserId || game.player2Id === authUserId;
    const isSpectator = game.spectators.includes(authUserId);
    
    if (!isPlayer && !isSpectator) {
      throw new Error("Not authorized to join this game room");
    }
    
    // Let Convex OCC handle retries natively - no custom retry wrapper needed
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

// Check if a specific user is online in a game
export const isPlayerOnline = query({
  args: { roomToken: v.string(), userId: v.string() },
  handler: async (ctx, { roomToken, userId }) => {
    const presenceData = await presence.list(ctx, roomToken);
    return presenceData?.some(user => user.userId === userId) || false;
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    // Use the presence component's internal room token system
    // The presence component handles room tokens internally
    return await presence.list(ctx, roomToken);
  },
});

// Note: Convex's built-in OCC handles retries automatically
export const disconnect = mutation({
  args: { 
    sessionToken: v.string(),
    roomId: v.optional(v.string()),
    userId: v.optional(v.string())
  },
  handler: async (ctx, { sessionToken }) => {
    // Disconnect from presence
    // Let Convex OCC handle retries natively - no custom retry wrapper needed
    return await presence.disconnect(ctx, sessionToken);
  },
});

