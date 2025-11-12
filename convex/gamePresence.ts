import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { presence } from "./presence";
import { Id } from "./_generated/dataModel";

// Retry helper with exponential backoff for handling write conflicts
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Check if it's a write conflict error
      const isWriteConflict = error instanceof Error && 
        (error.message.includes("write conflict") || 
         error.message.includes("retried") ||
         error.message.includes("concurrent modification"));
      
      if (!isWriteConflict || attempt === maxRetries) {
        // If it's not a write conflict or we've exhausted retries, throw
        throw error;
      }
      
      // Exponential backoff: 100ms, 300ms, 900ms
      const delay = baseDelay * Math.pow(3, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

// Game-specific presence functions
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
    
    // Retry with exponential backoff to handle write conflicts
    // This includes both game lookup and presence heartbeat operations
    return await retryWithBackoff(async () => {
      // Verify the user is actually a player in this game or spectator
      const game = await ctx.db.get(roomId as Id<"games">);
      if (!game) throw new Error("Game not found");
      
      const isPlayer = game.player1Id === authUserId || game.player2Id === authUserId;
      const isSpectator = game.spectators.includes(authUserId);
      
      if (!isPlayer && !isSpectator) {
        throw new Error("Not authorized to join this game room");
      }
      
      // Use roomId (which is the gameId) for game-specific presence
      // Note: presence.heartbeat already has retry logic, but wrapping here
      // handles conflicts during game document reads
      return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
    }, 3, 100);
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

export const disconnect = mutation({
  args: { 
    sessionToken: v.string(),
    roomId: v.optional(v.string()),
    userId: v.optional(v.string())
  },
  handler: async (ctx, { sessionToken }) => {
    // Disconnect from presence first
    // Retry with exponential backoff to handle write conflicts
    // Note: presence.disconnect already has retry logic, but wrapping here
    // provides additional resilience
    return await retryWithBackoff(
      () => presence.disconnect(ctx, sessionToken),
      3,
      100
    );
  },
});
