import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ELO Rating System Functions

/**
 * Calculate expected score for a player based on ELO ratings
 * Formula: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
function calculateExpectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

/**
 * Calculate new ELO rating after a game
 * Formula: R'_A = R_A + K * (S_A - E_A)
 * @param playerElo Current ELO rating
 * @param opponentElo Opponent's ELO rating
 * @param actualScore 1 for win, 0.5 for draw, 0 for loss
 * @param kFactor K-factor (32 for new players < 30 games, 16 for established)
 * @returns New ELO rating (clamped between 800-2500)
 */
function calculateNewElo(playerElo: number, opponentElo: number, actualScore: number, kFactor: number): number {
  const expectedScore = calculateExpectedScore(playerElo, opponentElo);
  const newElo = playerElo + kFactor * (actualScore - expectedScore);
  // Clamp between 800-2500
  return Math.max(800, Math.min(2500, Math.round(newElo)));
}

/**
 * Update ELO ratings for both players after a game
 * @param ctx Database context
 * @param winnerId Winner's user ID
 * @param loserId Loser's user ID
 * @param winnerElo Winner's current ELO
 * @param loserElo Loser's current ELO
 * @param winnerGamesPlayed Winner's total games played (for K-factor)
 * @param loserGamesPlayed Loser's total games played (for K-factor)
 */
export async function updateEloRatings(
  ctx: any,
  winnerId: Id<"users">,
  loserId: Id<"users">,
  winnerElo: number,
  loserElo: number,
  winnerGamesPlayed: number,
  loserGamesPlayed: number
): Promise<void> {
  // Determine K-factor: 32 for players with < 30 games, 16 for established
  const winnerKFactor = winnerGamesPlayed < 30 ? 32 : 16;
  const loserKFactor = loserGamesPlayed < 30 ? 32 : 16;

  // Calculate new ELO ratings
  const newWinnerElo = calculateNewElo(winnerElo, loserElo, 1, winnerKFactor); // Win = 1
  const newLoserElo = calculateNewElo(loserElo, winnerElo, 0, loserKFactor); // Loss = 0

  // Update profiles
  const [winnerProfile, loserProfile] = await Promise.all([
    ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", winnerId))
      .unique(),
    ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", loserId))
      .unique(),
  ]);

  if (winnerProfile) {
    await ctx.db.patch(winnerProfile._id, { elo: newWinnerElo });
  }

  if (loserProfile) {
    await ctx.db.patch(loserProfile._id, { elo: newLoserElo });
  }
}

/**
 * Check if a game is a quick match by checking the lobby name pattern
 * Quick match lobbies have name pattern: "Quick Match ${timestamp}"
 */
export async function isQuickMatchGame(ctx: any, lobbyId: Id<"lobbies">): Promise<boolean> {
  const lobby = await ctx.db.get(lobbyId);
  if (!lobby) return false;
  return lobby.name?.startsWith("Quick Match") ?? false;
}

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

// Search usernames (case-insensitive), returns up to configurable limit - OPTIMIZED
export const searchUsernames = query({
  args: {
    q: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const queryText = args.q.trim();
    if (!queryText) return [];
    const limit = Math.min(args.limit ?? 10, 20);

    // Use the new optimized by_username_games index for better performance
    // First, get exact prefix matches (most relevant)
    const lower = queryText.toLowerCase();
    const upper = queryText.toUpperCase();

    // Get all profiles and filter in memory for case-insensitive search
    // This is more efficient than scanning active players only
    const allProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_username_games", (q) => q.gte("username", lower).lte("username", upper + '\uffff'))
      .take(100); // Reasonable limit to avoid excessive data transfer

    const matches = allProfiles
      .filter((p) => p.username.toLowerCase().startsWith(lower))
      .slice(0, limit)
      .map((p) => ({ username: p.username, avatarUrl: p.avatarUrl, rank: p.rank }));

    // If not enough prefix matches, include contains matches
    if (matches.length < limit) {
      const extra = allProfiles
        .filter((p) => !p.username.toLowerCase().startsWith(lower) && p.username.toLowerCase().includes(lower))
        .slice(0, limit - matches.length)
        .map((p) => ({ username: p.username, avatarUrl: p.avatarUrl, rank: p.rank }));
      return [...matches, ...extra];
    }
    return matches;
  },
});

// Update profile bio
export const updateBio = mutation({
  args: {
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!currentProfile) throw new Error("Profile not found");

    await ctx.db.patch(currentProfile._id, {
      bio: args.bio?.trim() || undefined,
      lastSeenAt: Date.now(),
    });
    return { success: true };
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

    const authUser = await ctx.db.get(userId);
    const oauthImageUrl = authUser?.image;

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
      const patchData: any = { username: args.username };
      if (!currentProfile.avatarUrl && oauthImageUrl) {
        patchData.avatarUrl = oauthImageUrl;
      }
      await ctx.db.patch(currentProfile._id, patchData);
      return currentProfile._id;
    } else {
      // Create new profile
      const profileId = await ctx.db.insert("profiles", {
        userId,
        username: args.username,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        rank: "Private",
        elo: 1500, // Default ELO rating
        createdAt: Date.now(),
        avatarUrl: oauthImageUrl || undefined,
        totalPlayTime: 0,
        winStreak: 0,
        bestWinStreak: 0,
        capturedFlags: 0,
        piecesEliminated: 0,
        spiesRevealed: 0,
      });

      // Initialize notification conversation for the user
      await ctx.runMutation(internal.notifications.ensureNotificationConversation, {
        userId,
        username: args.username,
      });

      return profileId;
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

    // Fallback compute for fastestWin if not yet stored (backfill-on-read)
    // OPTIMIZED: Added limits to prevent excessive document scanning
    let computedFastestWin = profile.fastestWin;
    if (!computedFastestWin) {
      const [allFinishedAsP1, allFinishedAsP2] = await Promise.all([
        ctx.db
          .query("games")
          .withIndex("by_player1_finished", (q) =>
            q.eq("player1Id", userId).eq("status", "finished")
          )
          .take(500), // Reasonable limit - enough to find fastest win, prevents excessive scanning
        ctx.db
          .query("games")
          .withIndex("by_player2_finished", (q) =>
            q.eq("player2Id", userId).eq("status", "finished")
          )
          .take(500), // Reasonable limit - enough to find fastest win, prevents excessive scanning
      ]);

      const wins = [
        ...allFinishedAsP1.filter((g) => g.winner === "player1"),
        ...allFinishedAsP2.filter((g) => g.winner === "player2"),
      ];

      let minDurationMs: number | undefined = undefined;
      for (const g of wins) {
        if (!g.finishedAt) continue;
        const start = g.gameTimeStarted || g.createdAt;
        const duration = g.finishedAt - start;
        if (duration > 0 && (minDurationMs === undefined || duration < minDurationMs)) {
          minDurationMs = duration;
        }
      }

      computedFastestWin = minDurationMs;
    }

    return {
      ...profile,
      winRate,
      avgGameTime,
      recentGames,
      fastestWin: computedFastestWin ?? profile.fastestWin,
    };
  },
});

// Get profile stats by username (for viewing other users' profiles)
export const getProfileStatsByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.username) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!profile) return null;

    // Calculate additional stats
    const winRate = profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0;
    const avgGameTime = profile.totalPlayTime && profile.gamesPlayed > 0 
      ? Math.round(profile.totalPlayTime / profile.gamesPlayed) 
      : 0;

    // Get recent games using the optimized indexes
    const [recentGamesAsPlayer1, recentGamesAsPlayer2] = await Promise.all([
      ctx.db
        .query("games")
        .withIndex("by_player1_finished", (q) => 
          q.eq("player1Id", profile.userId).eq("status", "finished")
        )
        .order("desc")
        .take(3),
      
      ctx.db
        .query("games")
        .withIndex("by_player2_finished", (q) => 
          q.eq("player2Id", profile.userId).eq("status", "finished")
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

// Get leaderboard with optimized cursor-based pagination using new indexes - ENHANCED
export const getLeaderboard = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
    sortBy: v.optional(v.union(v.literal("wins"), v.literal("gamesPlayed"), v.literal("winRate"), v.literal("elo"))),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, sortBy = "wins" } = args; // Default to ELO sorting
    const limit = paginationOpts ? Math.min(paginationOpts.numItems, 25) : 20;

    // Use different indexes based on sort criteria for optimal performance
    let queryBuilder;
    if (sortBy === "elo") {
      // Default: sort by ELO using the optimized ELO index
      queryBuilder = ctx.db
        .query("profiles")
        .withIndex("by_elo", (q) => q.gte("elo", 0))
        .order("desc");
    } else if (sortBy === "gamesPlayed") {
      // Use compound index for gamesPlayed + wins (ties broken by wins)
      queryBuilder = ctx.db
        .query("profiles")
        .withIndex("by_games_wins", (q) => q.gte("gamesPlayed", 0))
        .order("desc");
    } else if (sortBy === "winRate") {
      // For win rate, we need to sort in memory after fetching
      queryBuilder = ctx.db
        .query("profiles")
        .withIndex("by_games_wins", (q) => q.gte("gamesPlayed", 1)) // Only include players with games
        .order("desc");
    } else {
      // Sort by wins using the optimized wins index
      queryBuilder = ctx.db
        .query("profiles")
        .withIndex("by_wins", (q) => q.gte("wins", 0))
        .order("desc");
    }

    let profiles;
    let result;

    if (paginationOpts && paginationOpts.cursor) {
      result = await queryBuilder.paginate({
        numItems: limit,
        cursor: paginationOpts.cursor,
      });
      profiles = result.page;
    } else {
      // Initial load with position calculation
      profiles = await queryBuilder.take(limit);
    }

    // Calculate win rates and handle winRate sorting
    const profilesWithStats = profiles.map((profile) => ({
      ...profile,
      winRate: profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0,
    }));

    // Sort by winRate if requested (requires in-memory sorting)
    if (sortBy === "winRate") {
      profilesWithStats.sort((a, b) => {
        const rateDiff = b.winRate - a.winRate;
        if (rateDiff !== 0) return rateDiff;
        // Tiebreaker: sort by games played
        return b.gamesPlayed - a.gamesPlayed;
      });
    }

    if (paginationOpts && paginationOpts.cursor) {
      return {
        ...result,
        page: profilesWithStats,
      };
    } else {
      // Initial load with position calculation
      return {
        page: profilesWithStats.map((profile, index) => ({
          ...profile,
          position: index + 1,
        })),
        isDone: profilesWithStats.length < limit,
        continueCursor: profilesWithStats.length > 0 ? profilesWithStats[profilesWithStats.length - 1]._id : "",
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
    const gameTimeMs = args.gameTime || 0;
    const newTotalPlayTime = (profile.totalPlayTime || 0) + gameTimeMs;
    const newFastestWin = args.won && gameTimeMs > 0
      ? Math.min(profile.fastestWin ?? Infinity, gameTimeMs)
      : profile.fastestWin;
    const newFastestGame = gameTimeMs > 0
      ? Math.min(profile.fastestGame ?? Infinity, gameTimeMs)
      : profile.fastestGame;
    const newLongestGame = gameTimeMs > 0
      ? Math.max(profile.longestGame || 0, gameTimeMs)
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
      fastestGame: newFastestGame === Infinity ? undefined : newFastestGame,
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

// Mark tutorial as completed
export const markTutorialCompleted = mutation({
  args: {},
  handler: async (ctx) => {
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

    // Mark tutorial as completed
    await ctx.db.patch(currentProfile._id, {
      hasSeenTutorial: true,
      tutorialCompletedAt: Date.now(),
    });

    return { success: true };
  },
});

// Check if user has seen tutorial
export const checkTutorialStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { hasSeenTutorial: false, isFirstLogin: false };

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      return { hasSeenTutorial: false, isFirstLogin: true };
    }

    // Consider it first login if profile was just created (within last 5 minutes) and no tutorial seen
    const isRecentProfile = profile.createdAt && (Date.now() - profile.createdAt) < 5 * 60 * 1000;
    const hasSeenTutorial = profile.hasSeenTutorial || false;
    const isFirstLogin = isRecentProfile && !hasSeenTutorial;

    return {
      hasSeenTutorial,
      isFirstLogin,
      tutorialCompletedAt: profile.tutorialCompletedAt,
    };
  },
});
