import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";
import { getAuthUserId } from "@convex-dev/auth/server";

export const presence = new Presence(components.presence);

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
    if (!authUserId) {
      console.warn('📍 Heartbeat called for user:', userId, 'but user is not authenticated');
      return { roomToken: '', sessionToken: '' };
    }
    // For security, we could verify that authUserId matches userId if needed
    // For now, we'll trust the client but this could be enhanced
    
    // Retry with exponential backoff to handle write conflicts
    return await retryWithBackoff(
      () => presence.heartbeat(ctx, roomId, userId, sessionId, interval),
      3,
      100
    );
  },
});

// List users in a room
export const list = query({
  args: { roomToken: v.string() },
  returns: v.array(v.object({
    userId: v.string(),
    online: v.boolean(),
    lastDisconnected: v.number(),
    image: v.optional(v.string()),
  })),
  handler: async (ctx, { roomToken }) => {
    // Avoid adding per-user reads so all subscriptions can share same cache.
    return await presence.list(ctx, roomToken);
  },
});

// Disconnect user from presence
export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    // if all users in a room are offline, the room is automatically removed
    // Retry with exponential backoff to handle write conflicts
    return await retryWithBackoff(
      () => presence.disconnect(ctx, sessionToken),
      3,
      100
    );
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

// List users in a room
export const listRoom = query({
  args: { roomId: v.string() },
  returns: v.array(v.union(
    v.object({
      userId: v.string(),
      online: v.boolean(),
      lastDisconnected: v.number(),
      image: v.optional(v.string()),
    }),
    v.null()
  )),
  handler: async (ctx, { roomId }) => {
    // Use the provided roomId instead of hardcoded 'global'
    const list = await presence.listRoom(ctx, roomId, true);
    console.log('📍 List room:', list);
    // Remove if userId is "Anonymous"
    const listWithImage = await Promise.all(list.map(async (user) => {
      const profile = await ctx.db.query("profiles").withIndex("by_username", (q) => q.eq("username", user.userId)).unique();
      return user.userId !== "Anonymous" ? { ...user, image: profile?.avatarUrl } : null;
    }));
    
    return listWithImage;
  },
});
