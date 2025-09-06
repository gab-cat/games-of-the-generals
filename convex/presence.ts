import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";
import { getAuthUserId } from "@convex-dev/auth/server";

export const presence = new Presence(components.presence);

// Heartbeat mutation for presence tracking
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
    
    // For security, we could verify that authUserId matches userId if needed
    // For now, we'll trust the client but this could be enhanced
    
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

// List users in a room
export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    // Avoid adding per-user reads so all subscriptions can share same cache.
    return await presence.list(ctx, roomToken);
  },
});

// Disconnect user from presence
export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    // Can't check auth here because it's called over http from sendBeacon.
    return await presence.disconnect(ctx, sessionToken);
  },
});

// Note: The presence component handles room and session tokens internally
// No need for separate getRoomToken and getSessionToken functions

// List users for a specific user (check if user is online in any room)
export const listUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await presence.listUser(ctx, userId);
  },
});

// Game-specific presence functions
export const heartbeatGame = mutation({
  args: { 
    gameId: v.id("games"), 
    userId: v.string(), 
    sessionId: v.string(), 
    interval: v.number() 
  },
  handler: async (ctx, { gameId, userId, sessionId, interval }) => {
    // Verify the user is authenticated and matches the userId
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    
    // Verify the user is actually a player in this game or spectator
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    
    const isPlayer = game.player1Id === authUserId || game.player2Id === authUserId;
    const isSpectator = game.spectators.includes(authUserId);
    
    if (!isPlayer && !isSpectator) {
      throw new Error("Not authorized to join this game room");
    }
    
    // Use gameId as roomId for game-specific presence
    const result = await presence.heartbeat(ctx, gameId, userId, sessionId, interval);
    
    // Immediately clear disconnection timestamp if user is back online and is a player
    // This ensures rapid clearing when players reconnect
    if (isPlayer && game.status === "playing") {
      const updates: any = {};
      
      if (game.player1Id === authUserId && game.player1DisconnectedAt) {
        updates.player1DisconnectedAt = undefined;
        console.log(`Heartbeat: Player 1 (${authUserId}) reconnected, immediately clearing disconnection timestamp`);
      }
      if (game.player2Id === authUserId && game.player2DisconnectedAt) {
        updates.player2DisconnectedAt = undefined;
        console.log(`Heartbeat: Player 2 (${authUserId}) reconnected, immediately clearing disconnection timestamp`);
      }
      
      // Apply updates immediately if any
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(gameId, updates);
        console.log(`Heartbeat: Applied immediate reconnection updates to game ${gameId}:`, updates);
      }
    }
    
    return result;
  },
});

// Check if a specific user is online in a game
export const isPlayerOnline = query({
  args: { gameId: v.id("games"), userId: v.string() },
  handler: async (ctx, { gameId, userId }) => {
    const presenceData = await presence.list(ctx, gameId);
    return presenceData?.some(user => user.userId === userId) || false;
  },
});

export const listGameUsers = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    // Use the presence component's internal room token system
    // The presence component handles room tokens internally
    return await presence.list(ctx, gameId);
  },
});

export const disconnectGame = mutation({
  args: { 
    sessionToken: v.string(),
    gameId: v.optional(v.id("games")),
    userId: v.optional(v.string())
  },
  handler: async (ctx, { sessionToken, gameId, userId }) => {
    // Disconnect from presence first
    const result = await presence.disconnect(ctx, sessionToken);
    
    // If we have game and user info, immediately set disconnection timestamp
    if (gameId && userId) {
      const game = await ctx.db.get(gameId);
      if (game && game.status === "playing") {
        const now = Date.now();
        const updates: any = {};
        
        // Set disconnection timestamp for the disconnecting player
        if (game.player1Id === userId && !game.player1DisconnectedAt) {
          updates.player1DisconnectedAt = now;
          console.log(`Player 1 (${userId}) disconnected from game ${gameId} at ${now}`);
        } else if (game.player2Id === userId && !game.player2DisconnectedAt) {
          updates.player2DisconnectedAt = now;
          console.log(`Player 2 (${userId}) disconnected from game ${gameId} at ${now}`);
        }
        
        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await ctx.db.patch(gameId, updates);
          console.log(`Updated game ${gameId} with disconnection timestamp:`, updates);
        }
      }
    }
    
    return result;
  },
});
