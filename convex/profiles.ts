import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current user's profile
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

// Get profile by username (for getting avatar URLs in lobbies, etc.)
export const getProfileByUsername = query({
  args: {
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.username) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username as string))
      .unique();

    return profile;
  },
});

// Get profile by user ID
export const getProfileByUserId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    return profile;
  },
});

// Create or update user profile
export const createOrUpdateProfile = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if username is already taken
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existingProfile && existingProfile.userId !== userId) {
      throw new Error("Username already taken");
    }

    // Check if profile exists
    const currentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (currentProfile) {
      // Update existing profile
      await ctx.db.patch(currentProfile._id, {
        username: args.username,
      });
      return currentProfile._id;
    } else {
      // Create new profile
      return await ctx.db.insert("profiles", {
        userId,
        username: args.username,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        rank: "Private",
        createdAt: Date.now(),
        totalPlayTime: 0,
        winStreak: 0,
        bestWinStreak: 0,
        capturedFlags: 0,
        piecesEliminated: 0,
        spiesRevealed: 0,
      });
    }
  },
});

// Update username only
export const updateUsername = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate username
    if (args.username.length < 3 || args.username.length > 20) {
      throw new Error("Username must be between 3 and 20 characters");
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(args.username)) {
      throw new Error("Username can only contain letters, numbers, underscores, and hyphens");
    }

    // Check if username is already taken
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existingProfile && existingProfile.userId !== userId) {
      throw new Error("Username already taken");
    }

    // Get current profile
    const currentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile) {
      throw new Error("Profile not found");
    }

    // Update username
    await ctx.db.patch(currentProfile._id, {
      username: args.username,
    });

    return { success: true };
  },
});

// Update avatar
export const updateAvatar = mutation({
  args: {
    avatarUrl: v.string(),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get current profile
    const currentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile) {
      throw new Error("Profile not found");
    }

    // Delete old avatar file if it exists and either:
    // 1. Avatar URL is empty (removal)
    // 2. A new avatar is being set with a different storage ID
    if (currentProfile.avatarStorageId && 
        (!args.avatarUrl || (args.avatarUrl && args.avatarStorageId !== currentProfile.avatarStorageId))) {
      try {
        await ctx.storage.delete(currentProfile.avatarStorageId);
      } catch (error) {
        // If deletion fails, log but don't throw - the update should still proceed
        console.warn("Failed to delete old avatar file:", error);
      }
    }

    // Update avatar URL and storage ID
    await ctx.db.patch(currentProfile._id, {
      avatarUrl: args.avatarUrl,
      avatarStorageId: args.avatarUrl ? args.avatarStorageId : undefined,
    });

    return { success: true };
  },
});

// Get profile stats for profile page with highly optimized queries using new indexes
export const getProfileStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return null;

    // Calculate additional stats
    const winRate = profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0;
    const avgGameTime = profile.totalPlayTime && profile.gamesPlayed > 0 
      ? Math.round(profile.totalPlayTime / profile.gamesPlayed) 
      : 0;

    // Get recent games using the new optimized indexes for better performance
    const [recentGamesAsPlayer1, recentGamesAsPlayer2] = await Promise.all([
      ctx.db
        .query("games")
        .withIndex("by_player1_finished", (q) => 
          q.eq("player1Id", userId).eq("status", "finished")
        )
        .order("desc")
        .take(3),
      
      ctx.db
        .query("games")
        .withIndex("by_player2_finished", (q) => 
          q.eq("player2Id", userId).eq("status", "finished")
        )
        .order("desc")
        .take(3)
    ]);

    // Combine and sort by finished time, take most recent 5
    const recentGames = [...recentGamesAsPlayer1, ...recentGamesAsPlayer2]
      .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
      .slice(0, 5);

    return {
      ...profile,
      winRate,
      avgGameTime,
      recentGames,
    };
  },
});

// Get leaderboard with optimized cursor-based pagination using new indexes
export const getLeaderboard = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args;
    const limit = paginationOpts ? Math.min(paginationOpts.numItems, 25) : 20;

    // Use the optimized wins_desc index for better descending order performance
    const queryBuilder = ctx.db
      .query("profiles")
      .withIndex("by_wins", (q) => q.gte("wins", 0))
      .order("desc");

    if (paginationOpts && paginationOpts.cursor) {
      const result = await queryBuilder.paginate({
        numItems: limit,
        cursor: paginationOpts.cursor,
      });

      return {
        ...result,
        page: result.page.map((profile) => ({
          ...profile,
          winRate: profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0,
        })),
      };
    } else {
      // Initial load with position calculation
      const profiles = await queryBuilder.take(limit);
      
      return {
        page: profiles.map((profile, index) => ({
          ...profile,
          position: index + 1,
          winRate: profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0,
        })),
        isDone: profiles.length < limit,
        continueCursor: profiles.length > 0 ? profiles[profiles.length - 1]._id : "",
      };
    }
  },
});

// Update profile stats after game
export const updateProfileStats = mutation({
  args: {
    userId: v.id("users"),
    won: v.boolean(),
    gameTime: v.optional(v.number()),
    flagCaptured: v.optional(v.boolean()),
    piecesEliminated: v.optional(v.number()),
    spiesRevealed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) return;

    const newWins = args.won ? profile.wins + 1 : profile.wins;
    const newLosses = args.won ? profile.losses : profile.losses + 1;
    const newGamesPlayed = profile.gamesPlayed + 1;

    // Update win streak
    let newWinStreak = profile.winStreak || 0;
    let newBestWinStreak = profile.bestWinStreak || 0;
    
    if (args.won) {
      newWinStreak += 1;
      newBestWinStreak = Math.max(newBestWinStreak, newWinStreak);
    } else {
      newWinStreak = 0;
    }

    // Update other stats
    const newTotalPlayTime = (profile.totalPlayTime || 0) + (args.gameTime || 0);
    const newFastestWin = args.won && args.gameTime 
      ? Math.min(profile.fastestWin || Infinity, args.gameTime)
      : profile.fastestWin;
    const newLongestGame = args.gameTime
      ? Math.max(profile.longestGame || 0, args.gameTime)
      : profile.longestGame;
    const newCapturedFlags = (profile.capturedFlags || 0) + (args.flagCaptured ? 1 : 0);
    const newPiecesEliminated = (profile.piecesEliminated || 0) + (args.piecesEliminated || 0);
    const newSpiesRevealed = (profile.spiesRevealed || 0) + (args.spiesRevealed || 0);

    // Calculate new rank based on wins
    let newRank = "Private";
    if (newWins >= 50) newRank = "General";
    else if (newWins >= 30) newRank = "Colonel";
    else if (newWins >= 20) newRank = "Major";
    else if (newWins >= 10) newRank = "Captain";
    else if (newWins >= 5) newRank = "Lieutenant";
    else if (newWins >= 3) newRank = "Sergeant";

    await ctx.db.patch(profile._id, {
      wins: newWins,
      losses: newLosses,
      gamesPlayed: newGamesPlayed,
      rank: newRank,
      winStreak: newWinStreak,
      bestWinStreak: newBestWinStreak,
      totalPlayTime: newTotalPlayTime,
      fastestWin: newFastestWin === Infinity ? undefined : newFastestWin,
      longestGame: newLongestGame,
      capturedFlags: newCapturedFlags,
      piecesEliminated: newPiecesEliminated,
      spiesRevealed: newSpiesRevealed,
    });

    // Note: Achievement checking will be done separately to avoid circular imports
    // The caller should call checkAchievements after this mutation

    return profile._id;
  },
});
