import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";
import { getAuthUserId } from "@convex-dev/auth/server";

export const presence = new Presence(components.presence);

// Heartbeat mutation for presence tracking
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
    if (!authUserId) {
      console.warn('📍 Heartbeat called for user:', userId, 'but user is not authenticated');
      return { roomToken: '', sessionToken: '' };
    }
    // For security, we could verify that authUserId matches userId if needed
    // For now, we'll trust the client but this could be enhanced
    
    // Let Convex OCC handle retries natively - no custom retry wrapper needed
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
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
// Note: Convex's built-in OCC handles retries automatically
export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    // if all users in a room are offline, the room is automatically removed
    // Let Convex OCC handle retries natively - no custom retry wrapper needed
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

// List users in a room with full profile data
export const listRoom = query({
  args: { roomId: v.string() },
  returns: v.array(v.union(
    v.object({
      userId: v.string(),
      username: v.string(),
      rank: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      lastSeenAt: v.optional(v.number()),
      currentPage: v.optional(v.string()),
      gameId: v.optional(v.id("games")),
      lobbyId: v.optional(v.id("lobbies")),
      aiGameId: v.optional(v.id("aiGameSessions")),
      online: v.boolean(),
      lastDisconnected: v.number(),
    }),
    v.null()
  )),
  handler: async (ctx, { roomId }) => {
    // Use the provided roomId instead of hardcoded 'global'
    const list = await presence.listRoom(ctx, roomId, true);
    // Remove if userId is "Anonymous"
    const listWithProfileData = await Promise.all(list.map(async (user) => {
      const profile = await ctx.db.query("profiles").withIndex("by_username", (q) => q.eq("username", user.userId)).unique();
      return user.userId !== "Anonymous" ? {
        userId: user.userId,
        username: profile?.username || user.userId,
        rank: profile?.rank,
        avatarUrl: profile?.avatarUrl,
        lastSeenAt: profile?.lastSeenAt,
        currentPage: profile?.currentPage,
        gameId: profile?.gameId,
        lobbyId: profile?.lobbyId,
        aiGameId: profile?.aiSessionId,
        online: user.online,
        lastDisconnected: user.lastDisconnected,
      } : null;
    }));
    
    return listWithProfileData;
  },
});
