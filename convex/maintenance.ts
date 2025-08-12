import { internalMutation } from "./_generated/server";

// Internal: Delete all anonymous users and clean up dependent data that could break UIs
// - Does NOT touch games or moves to keep replays safe
// - Deletes profiles, presets, achievements, push subscriptions, email verifications
// - Deletes waiting lobbies hosted by the anonymous user (avoids ghost lobbies)
// - Leaves playing/finished lobbies and all games intact
export const deleteAnonymousUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find all anonymous users
    const anonymousUsers = await ctx.db
      .query("users")
      .withIndex("by_isAnonymous", (q) => q.eq("isAnonymous", true))
      .collect();

    for (const user of anonymousUsers) {
      const userId = user._id;

      // Delete profile (if any)
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      if (profile) {
        await ctx.db.delete(profile._id);
      }

      // Delete user-specific data that is safe to remove
      const [presets, achievements, pushes, verifications, aiSessions] = await Promise.all([
        ctx.db.query("setupPresets").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("achievements").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("pushSubscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("emailChangeVerifications").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("aiGameSessions").withIndex("by_player", (q) => q.eq("playerId", userId)).collect(),
      ]);

      for (const doc of [...presets, ...achievements, ...pushes, ...verifications, ...aiSessions]) {
        await ctx.db.delete(doc._id);
      }

      // Delete waiting lobbies hosted by this user (avoid ghost lobbies)
      const hostedLobbies = await ctx.db
        .query("lobbies")
        .withIndex("by_host", (q) => q.eq("hostId", userId))
        .collect();

      for (const lobby of hostedLobbies) {
        if (lobby.status === "waiting") {
          await ctx.db.delete(lobby._id);
        }
      }

      // Finally, delete the auth user itself
      await ctx.db.delete(userId);
    }

    return { deletedUsers: anonymousUsers.length };
  },
});

// Internal: Cleanup finished lobbies. Games and replays remain intact.
export const cleanupFinishedLobbies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const finishedLobbies = await ctx.db
      .query("lobbies")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .collect();

    for (const lobby of finishedLobbies) {
      await ctx.db.delete(lobby._id);
    }

    return { deletedLobbies: finishedLobbies.length };
  },
});

// Internal: Delete messages older than 7 days to enforce retention policy
export const deleteOldMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - SEVEN_DAYS_MS;

    let totalDeleted = 0;
    // Delete in batches to avoid timeouts
    // We use the by_timestamp index for efficient range scans
    // Loop until no more old messages remain (bounded by Convex function time limits)
    // If extremely large volumes, this will chip away daily via cron
    // Batch size kept modest to stay under compute budget
    while (true) {
      const oldMessages = await ctx.db
        .query("messages")
        .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
        .take(200);

      if (oldMessages.length === 0) break;

      await Promise.all(oldMessages.map((m) => ctx.db.delete(m._id)));
      totalDeleted += oldMessages.length;
    }

    return { deletedMessages: totalDeleted, cutoff };
  },
});


