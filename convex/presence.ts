import { mutation, query, type QueryCtx } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isSubscriptionActive } from "./featureGating";

export const presence = new Presence(components.presence);

// Presence identity is the player's username, read from their own profile.
// The client also sends it, but only so the hook can key its session; a value
// that doesn't match the signed-in player is ignored.
export async function getOwnUsername(ctx: QueryCtx): Promise<string | null> {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) return null;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", authUserId))
    .unique();
  return profile?.username ?? null;
}

// Keeps a tab marked online in the global room. Sessions that stop sending
// heartbeats are disconnected by the presence component's worker after 2.5
// intervals (see GLOBAL_PRESENCE_INTERVAL in src/lib/useOnlineUsers.tsx).
export const heartbeat = mutation({
  args: {
    roomId: v.literal("global"),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    const username = await getOwnUsername(ctx);
    // Signed out, no profile yet, or a stale username after a rename: send
    // empty tokens so the client stays quiet until it re-keys.
    if (!username || username !== userId) {
      return { roomToken: "", sessionToken: "" };
    }
    return await presence.heartbeat(ctx, roomId, username, sessionId, interval);
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

// Ends one session. No auth check: the hook calls this through sendBeacon on
// page unload, which can't carry auth. The session token is the secret.
export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});

// List users in a room with full profile data
export const listRoom = query({
  args: { roomId: v.literal("global") },
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
      tier: v.union(v.literal("free"), v.literal("pro"), v.literal("pro_plus")),
      isDonor: v.boolean(),
      avatarFrame: v.optional(v.string()),
      usernameColor: v.optional(v.string()),
    }),
    v.null()
  )),
  handler: async (ctx, { roomId }) => {
    const list = await presence.listRoom(ctx, roomId, true);
    // Remove if userId is "Anonymous"
    const listWithProfileData = await Promise.all(list.map(async (user) => {
      if (user.userId === "Anonymous") return null;
      
      const profile = await ctx.db.query("profiles").withIndex("by_username", (q) => q.eq("username", user.userId)).unique();
      const sub = profile ? await ctx.db.query("subscriptions").withIndex("by_user", (q) => q.eq("userId", profile.userId)).unique() : null;
      const customization = profile ? await ctx.db.query("userCustomizations").withIndex("by_user", (q) => q.eq("userId", profile.userId)).first() : null;
      const isActive = sub ? isSubscriptionActive(sub.status, sub.expiresAt, sub.gracePeriodEndsAt || null) : true;

      return {
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
        tier: isActive ? (sub?.tier || "free") : "free",
        isDonor: profile?.isDonor || false,
        avatarFrame: customization?.avatarFrame,
        usernameColor: customization?.usernameColor,
      };
    }));
    
    return listWithProfileData;
  },
});
