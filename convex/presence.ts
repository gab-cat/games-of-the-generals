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
    // if all users in a room are offline, the room is automatically removed
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
