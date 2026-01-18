import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import { isSubscriptionActive } from "./featureGating";
import { Doc } from "./_generated/dataModel";

// Rank weights for skill calculation
const RANK_WEIGHTS = {
  "Recruit": 0,
  "Private": 1,
  "Sergeant": 2,
  "2nd Lieutenant": 3,
  "1st Lieutenant": 4,
  "Captain": 5,
  "Major": 6,
  "Lieutenant Colonel": 7,
  "Colonel": 8,
  "1 Star General": 9,
  "2 Star General": 10,
  "3 Star General": 11,
  "4 Star General": 12,
  "5 Star General": 13,
};

// Calculate skill rating from player profile
function calculateSkillRating(profile: Doc<"profiles">): number {
  const winRate = profile.gamesPlayed > 0 ? profile.wins / profile.gamesPlayed : 0;
  const rankWeight = RANK_WEIGHTS[profile.rank as keyof typeof RANK_WEIGHTS] || 0;
  const gamesPlayed = profile.gamesPlayed;

  // Formula: (winRate * 1000) + (rankWeight * 500) + (gamesPlayed * 0.1)
  return (winRate * 1000) + (rankWeight * 500) + (gamesPlayed * 0.1);
}

// Join the matchmaking queue
export const joinQueue = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get user profile for skill calculation
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    // Check if user already has an active lobby or game (comprehensive check)
    // First check if user is a host of waiting lobby
    let activeLobby = await ctx.db
      .query("lobbies")
      .withIndex("by_host_status", (q) => q.eq("hostId", userId).eq("status", "waiting"))
      .order("desc")
      .first();

    if (!activeLobby) {
      // Check if user is a host of playing lobby
      activeLobby = await ctx.db
        .query("lobbies")
        .withIndex("by_host_status", (q) => q.eq("hostId", userId).eq("status", "playing"))
        .order("desc")
        .first();
    }

    if (!activeLobby) {
      // Check if user is a player in any active lobby
      activeLobby = await ctx.db
        .query("lobbies")
        .filter((q) => q.eq(q.field("playerId"), userId))
        .filter((q) => q.or(q.eq(q.field("status"), "waiting"), q.eq(q.field("status"), "playing")))
        .order("desc")
        .first();
    }

    if (activeLobby) {
      throw new Error("You already have an active lobby or game");
    }

    // Check if user is already in queue
    const existingQueueEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingQueueEntry) {
      return {
        success: false,
        message: "Already in queue",
      };
    }

    const now = Date.now();
    const timeoutAt = now + (10 * 60 * 1000); // 10 minutes
    const skillRating = calculateSkillRating(profile);

    // Add to queue
    await ctx.db.insert("matchmakingQueue", {
      userId,
      username: profile.username,
      skillRating,
      joinedAt: now,
      timeoutAt,
      status: "waiting",
    });

    // Schedule attemptMatch to run after 1-2 seconds to allow batching
    await ctx.scheduler.runAfter(2000, internal.matchmaking.attemptMatch, {});

    // Schedule timeout check for this user after 10 minutes
    await ctx.scheduler.runAfter(10 * 60 * 1000, internal.matchmaking.checkTimeout, {
      userId,
    });

    return {
      success: true,
      message: "Joined matchmaking queue",
    };
  },
});

// Leave the matchmaking queue
export const leaveQueue = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Remove from queue
    const queueEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (queueEntry) {
      await ctx.db.delete(queueEntry._id);
    }

    return {
      success: true,
      message: "Left matchmaking queue",
    };
  },
});

// Get current user's queue status
export const getQueueStatus = query({
  args: {},
  returns: v.object({
    inQueue: v.boolean(),
    joinedAt: v.optional(v.number()),
    timeoutAt: v.optional(v.number()),
    timeRemaining: v.optional(v.number()),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { inQueue: false };
    }

    const queueEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!queueEntry) {
      return { inQueue: false };
    }

    const now = Date.now();
    const timeRemaining = Math.max(0, queueEntry.timeoutAt - now);

    return {
      inQueue: true,
      joinedAt: queueEntry.joinedAt,
      timeoutAt: queueEntry.timeoutAt,
      timeRemaining,
    };
  },
});

// Get queue count for display
export const getQueueCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    // OPTIMIZED: Reduced limit to prevent excessive document scanning
    const waitingPlayers = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .take(500); // Sufficient for accurate count, prevents excessive scanning

    return waitingPlayers.length;
  },
});

// Internal mutation to attempt matching players
export const attemptMatch = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    matchesCreated: v.number(),
    playersMatched: v.number(),
  }),
  handler: async (ctx) => {
    let matchesCreated = 0;
    let playersMatched = 0;

    // Get all waiting players ordered by skill rating
    // OPTIMIZED: Added limit to prevent excessive document scanning
    let waitingPlayers = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_status_skill", (q) => q.eq("status", "waiting"))
      .order("asc") // Order by skill rating ascending
      .take(100); // Process in batches to avoid timeout

    // Filter out players who already have active lobbies
    // OPTIMIZED: Use indexes where possible to avoid full table scans
    const filteredPlayers = [];
    for (const player of waitingPlayers) {
      // Check if player has an active lobby as host (uses by_host_status index)
      const hostLobbyWaiting = await ctx.db
        .query("lobbies")
        .withIndex("by_host_status", (q) => q.eq("hostId", player.userId).eq("status", "waiting"))
        .first();
      
      const hostLobbyPlaying = await ctx.db
        .query("lobbies")
        .withIndex("by_host_status", (q) => q.eq("hostId", player.userId).eq("status", "playing"))
        .first();

      // Check if player has an active lobby as player (query by status, filter by playerId)
      // OPTIMIZED: Query by status index first, then filter in memory (better than full scan)
      const [waitingLobbies, playingLobbies] = await Promise.all([
        ctx.db
          .query("lobbies")
          .withIndex("by_status", (q) => q.eq("status", "waiting"))
          .take(100), // Reasonable limit
        ctx.db
          .query("lobbies")
          .withIndex("by_status", (q) => q.eq("status", "playing"))
          .take(100), // Reasonable limit
      ]);

      const playerLobby = [...waitingLobbies, ...playingLobbies].find(
        (lobby) => lobby.playerId === player.userId
      );

      const existingLobby = hostLobbyWaiting || hostLobbyPlaying || playerLobby;

      if (!existingLobby) {
        filteredPlayers.push(player);
      } else {
        // Remove from queue if they already have a lobby
        await ctx.db.delete(player._id);
      }
    }

    waitingPlayers = filteredPlayers;

    if (waitingPlayers.length < 2) {
      // Not enough players, reschedule for later
      if (waitingPlayers.length > 0) {
        await ctx.scheduler.runAfter(8000, internal.matchmaking.attemptMatch, {});
      }
      return { success: false, matchesCreated: 0, playersMatched: 0 };
    }

    // Get subscription status for all players to determine priority (parallelized)
    const playerSubscriptions = new Map<string, { tier: string; isActive: boolean }>();
    
    // Fetch all subscriptions in parallel
    const subscriptionResults = await Promise.all(
      waitingPlayers.map(async (player) => {
        const subscription = await ctx.db
          .query("subscriptions")
          .withIndex("by_user", (q) => q.eq("userId", player.userId))
          .unique();
        return { userId: player.userId, subscription };
      })
    );
    
    // Process subscription results
    for (const { userId, subscription } of subscriptionResults) {
      const tier = subscription?.tier || "free";
      const status = subscription?.status || "active";
      const expiresAt = subscription?.expiresAt || null;
      const gracePeriodEndsAt = subscription?.gracePeriodEndsAt || null;

      // Check if subscription is active using shared helper
      const isActive = isSubscriptionActive(status, expiresAt, gracePeriodEndsAt);

      playerSubscriptions.set(userId, { tier, isActive });
    }

    // Sort players: Pro/Pro+ with active subscriptions first
    waitingPlayers.sort((a, b) => {
      const subA = playerSubscriptions.get(a.userId);
      const subB = playerSubscriptions.get(b.userId);
      
      const priorityA = (subA?.tier === "pro" || subA?.tier === "pro_plus") && subA?.isActive ? 1 : 0;
      const priorityB = (subB?.tier === "pro" || subB?.tier === "pro_plus") && subB?.isActive ? 1 : 0;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Pro/Pro+ users first
      }
      
      // Then by skill rating
      return a.skillRating - b.skillRating;
    });

    // Skill-based matching algorithm
    const matchedUsers = new Set<string>();
    const matches: Array<{ player1: Doc<"matchmakingQueue">; player2: Doc<"matchmakingQueue"> }> = [];

    for (let i = 0; i < waitingPlayers.length; i++) {
      if (matchedUsers.has(waitingPlayers[i].userId)) continue;

      let bestMatch = null;
      let bestMatchScore = Infinity;

      // Look for best match within skill range
      for (let j = i + 1; j < waitingPlayers.length; j++) {
        if (matchedUsers.has(waitingPlayers[j].userId)) continue;

        const skillDiff = Math.abs(waitingPlayers[i].skillRating - waitingPlayers[j].skillRating);
        const waitTimeBonus = (Date.now() - waitingPlayers[j].joinedAt) / 60000; // Minutes waited

        // Priority bonus for Pro/Pro+ users
        const subI = playerSubscriptions.get(waitingPlayers[i].userId);
        const subJ = playerSubscriptions.get(waitingPlayers[j].userId);
        const priorityBonusI = (subI?.tier === "pro" || subI?.tier === "pro_plus") && subI?.isActive ? 50 : 0;
        const priorityBonusJ = (subJ?.tier === "pro" || subJ?.tier === "pro_plus") && subJ?.isActive ? 50 : 0;
        const priorityBonus = Math.max(priorityBonusI, priorityBonusJ);

        // Score = skill difference - wait time bonus - priority bonus (lower is better)
        const matchScore = skillDiff - (waitTimeBonus * 10) - priorityBonus;

        if (matchScore < bestMatchScore) {
          bestMatchScore = matchScore;
          bestMatch = waitingPlayers[j];
        }
      }

      if (bestMatch) {
        matchedUsers.add(waitingPlayers[i].userId);
        matchedUsers.add(bestMatch.userId);
        matches.push({
          player1: waitingPlayers[i],
          player2: bestMatch,
        });
      }
    }

    // Create lobbies and games for matches
    for (const match of matches) {
      try {
        // Update queue status to matched
        await ctx.db.patch(match.player1._id, { status: "matched" });
        await ctx.db.patch(match.player2._id, { status: "matched" });

        // Create lobby
        const lobbyId = await ctx.db.insert("lobbies", {
          name: `Quick Match ${Date.now()}`,
          hostId: match.player1.userId,
          hostUsername: match.player1.username,
          playerId: match.player2.userId,
          playerUsername: match.player2.username,
          status: "waiting",
          isPrivate: false,
          createdAt: Date.now(),
          allowSpectators: true,
        });

        // Start game automatically
        const gameId = await ctx.runMutation(api.games.startGame, { lobbyId });

        // Update profiles with gameId and clear lobbyId
        const profiles = await Promise.all([
          ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", match.player1.userId))
            .unique(),
          ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", match.player2.userId))
            .unique(),
        ]);

        if (profiles[0]) {
          await ctx.db.patch(profiles[0]._id, { gameId, lobbyId: undefined });
        }
        if (profiles[1]) {
          await ctx.db.patch(profiles[1]._id, { gameId, lobbyId: undefined });
        }

        // Remove from queue
        await ctx.db.delete(match.player1._id);
        await ctx.db.delete(match.player2._id);

        matchesCreated++;
        playersMatched += 2;
      } catch (error) {
        console.error("Failed to create match:", error);
        // Revert status if creation failed
        await ctx.db.patch(match.player1._id, { status: "waiting" });
        await ctx.db.patch(match.player2._id, { status: "waiting" });
      }
    }

    // If there are still players waiting, reschedule
    const remainingPlayers = waitingPlayers.length - playersMatched;
    if (remainingPlayers >= 2) {
      await ctx.scheduler.runAfter(8000, internal.matchmaking.attemptMatch, {});
    }

    return {
      success: matchesCreated > 0,
      matchesCreated,
      playersMatched,
    };
  },
});

// Internal mutation to check and remove timed out queue entries
export const checkTimeout = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    removed: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const queueEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!queueEntry) {
      return { success: true, removed: false };
    }

    const now = Date.now();
    if (now >= queueEntry.timeoutAt) {
      await ctx.db.delete(queueEntry._id);
      return { success: true, removed: true };
    }

    return { success: true, removed: false };
  },
});
