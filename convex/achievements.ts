import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Achievement definitions
export const ACHIEVEMENTS = {
  FIRST_WIN: {
    id: "first_win",
    name: "First Victory",
    description: "Win your first game",
    icon: "🏆",
    category: "milestone",
  },
  WIN_STREAK_3: {
    id: "win_streak_3",
    name: "Hat Trick",
    description: "Win 3 games in a row",
    icon: "🔥",
    category: "streak",
  },
  WIN_STREAK_5: {
    id: "win_streak_5",
    name: "Unstoppable",
    description: "Win 5 games in a row",
    icon: "⚡",
    category: "streak",
  },
  WIN_STREAK_10: {
    id: "win_streak_10",
    name: "Legendary",
    description: "Win 10 games in a row",
    icon: "👑",
    category: "streak",
  },
  RANK_SERGEANT: {
    id: "rank_sergeant",
    name: "Sergeant",
    description: "Reach the rank of Sergeant",
    icon: "🎖️",
    category: "rank",
  },
  RANK_LIEUTENANT: {
    id: "rank_lieutenant",
    name: "Lieutenant",
    description: "Reach the rank of Lieutenant",
    icon: "🥉",
    category: "rank",
  },
  RANK_CAPTAIN: {
    id: "rank_captain",
    name: "Captain",
    description: "Reach the rank of Captain",
    icon: "🥈",
    category: "rank",
  },
  RANK_MAJOR: {
    id: "rank_major",
    name: "Major",
    description: "Reach the rank of Major",
    icon: "🥇",
    category: "rank",
  },
  RANK_COLONEL: {
    id: "rank_colonel",
    name: "Colonel",
    description: "Reach the rank of Colonel",
    icon: "🎗️",
    category: "rank",
  },
  RANK_GENERAL: {
    id: "rank_general",
    name: "General",
    description: "Reach the rank of General",
    icon: "⭐",
    category: "rank",
  },
  GAMES_PLAYED_10: {
    id: "games_played_10",
    name: "Veteran",
    description: "Play 10 games",
    icon: "🎮",
    category: "milestone",
  },
  GAMES_PLAYED_50: {
    id: "games_played_50",
    name: "Dedicated",
    description: "Play 50 games",
    icon: "🎯",
    category: "milestone",
  },
  GAMES_PLAYED_100: {
    id: "games_played_100",
    name: "Master",
    description: "Play 100 games",
    icon: "💎",
    category: "milestone",
  },
  FAST_WIN_5MIN: {
    id: "fast_win_5min",
    name: "Speed Demon",
    description: "Win a game in under 5 minutes",
    icon: "💨",
    category: "special",
  },
  FAST_WIN_3MIN: {
    id: "fast_win_3min",
    name: "Lightning Strike",
    description: "Win a game in under 3 minutes",
    icon: "⚡",
    category: "special",
  },
  LONG_GAME_30MIN: {
    id: "long_game_30min",
    name: "Marathon Warrior",
    description: "Play a game longer than 30 minutes",
    icon: "🏃",
    category: "special",
  },
  FLAG_HUNTER: {
    id: "flag_hunter",
    name: "Flag Hunter",
    description: "Capture 10 enemy flags",
    icon: "🚩",
    category: "special",
  },
  FLAG_MASTER: {
    id: "flag_master",
    name: "Flag Master",
    description: "Capture 25 enemy flags",
    icon: "🏴",
    category: "special",
  },
  SPY_MASTER: {
    id: "spy_master",
    name: "Spy Master",
    description: "Reveal 25 enemy pieces with your spies",
    icon: "🕵️",
    category: "special",
  },
  SPY_LEGEND: {
    id: "spy_legend",
    name: "Spy Legend",
    description: "Reveal 50 enemy pieces with your spies",
    icon: "🔍",
    category: "special",
  },
  ELIMINATOR: {
    id: "eliminator",
    name: "Eliminator",
    description: "Eliminate 50 enemy pieces",
    icon: "⚔️",
    category: "combat",
  },
  DESTROYER: {
    id: "destroyer",
    name: "Destroyer",
    description: "Eliminate 100 enemy pieces",
    icon: "💀",
    category: "combat",
  },
  PERFECTIONIST: {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Win a game without losing any pieces",
    icon: "✨",
    category: "special",
  },
  COMEBACK_KING: {
    id: "comeback_king",
    name: "Comeback King",
    description: "Win after being down to your last 5 pieces",
    icon: "🔄",
    category: "special",
  },
  WINS_10: {
    id: "wins_10",
    name: "Warrior",
    description: "Win 10 games",
    icon: "🛡️",
    category: "milestone",
  },
  WINS_25: {
    id: "wins_25",
    name: "Champion",
    description: "Win 25 games",
    icon: "🏅",
    category: "milestone",
  },
  WINS_50: {
    id: "wins_50",
    name: "Hero",
    description: "Win 50 games",
    icon: "🦸",
    category: "milestone",
  },
  WINS_100: {
    id: "wins_100",
    name: "Legend",
    description: "Win 100 games",
    icon: "⭐",
    category: "milestone",
  },
} as const;

// Get user's achievements
export const getUserAchievements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // OPTIMIZED: Added limit to prevent excessive document scanning
    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(100); // Reasonable limit - users rarely have >100 achievements

    return achievements.map(achievement => ({
      ...achievement,
      ...ACHIEVEMENTS[achievement.achievementId as keyof typeof ACHIEVEMENTS],
    }));
  },
});

// Get all achievements with unlock status
export const getAllAchievements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // OPTIMIZED: Added limit to prevent excessive document scanning
    const userAchievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(100); // Reasonable limit - users rarely have >100 achievements

    const unlockedIds = new Set(userAchievements.map(a => a.achievementId));

    return Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: unlockedIds.has(achievement.id),
      unlockedAt: userAchievements.find(a => a.achievementId === achievement.id)?.unlockedAt,
      progress: userAchievements.find(a => a.achievementId === achievement.id)?.progress,
    }));
  },
});

// Unlock an achievement
export const unlockAchievement = mutation({
  args: {
    achievementId: v.string(),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already unlocked
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_user_achievement", (q) => 
        q.eq("userId", userId).eq("achievementId", args.achievementId)
      )
      .unique();

    if (existing) return existing._id;

    // Unlock the achievement
    return await ctx.db.insert("achievements", {
      userId,
      achievementId: args.achievementId,
      unlockedAt: Date.now(),
      progress: args.progress,
    });
  },
});

// Check and unlock achievements based on profile stats
export const checkAchievements = mutation({
  args: {
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return;

    const newAchievements: string[] = [];

    // Helper function to check and unlock achievement
    const checkAndUnlock = async (achievementId: string) => {
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_user_achievement", (q) => 
          q.eq("userId", profile.userId).eq("achievementId", achievementId)
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("achievements", {
          userId: profile.userId,
          achievementId,
          unlockedAt: Date.now(),
        });
        newAchievements.push(achievementId);
      }
    };

    // Check milestone achievements - wins
    if (profile.wins >= 1) {
      await checkAndUnlock("first_win");
    }
    if (profile.wins >= 10) {
      await checkAndUnlock("wins_10");
    }
    if (profile.wins >= 25) {
      await checkAndUnlock("wins_25");
    }
    if (profile.wins >= 50) {
      await checkAndUnlock("wins_50");
    }
    if (profile.wins >= 100) {
      await checkAndUnlock("wins_100");
    }

    // Check milestone achievements - games played
    if (profile.gamesPlayed >= 10) {
      await checkAndUnlock("games_played_10");
    }
    if (profile.gamesPlayed >= 50) {
      await checkAndUnlock("games_played_50");
    }
    if (profile.gamesPlayed >= 100) {
      await checkAndUnlock("games_played_100");
    }

    // Check rank achievements
    const rankAchievements: Record<string, string> = {
      "Sergeant": "rank_sergeant",
      "Lieutenant": "rank_lieutenant",
      "Captain": "rank_captain",
      "Major": "rank_major",
      "Colonel": "rank_colonel",
      "General": "rank_general",
    };

    if (rankAchievements[profile.rank]) {
      await checkAndUnlock(rankAchievements[profile.rank]);
    }

    // Check win streak achievements
    if (profile.winStreak && profile.winStreak >= 3) {
      await checkAndUnlock("win_streak_3");
    }
    if (profile.winStreak && profile.winStreak >= 5) {
      await checkAndUnlock("win_streak_5");
    }
    if (profile.winStreak && profile.winStreak >= 10) {
      await checkAndUnlock("win_streak_10");
    }

    // Check time-based achievements
    if (profile.fastestWin) {
      const fastestWinMinutes = profile.fastestWin / (1000 * 60);
      if (fastestWinMinutes <= 5) {
        await checkAndUnlock("fast_win_5min");
      }
      if (fastestWinMinutes <= 3) {
        await checkAndUnlock("fast_win_3min");
      }
    }

    if (profile.longestGame) {
      const longestGameMinutes = profile.longestGame / (1000 * 60);
      if (longestGameMinutes >= 30) {
        await checkAndUnlock("long_game_30min");
      }
    }

    // Check special achievements
    if (profile.capturedFlags && profile.capturedFlags >= 10) {
      await checkAndUnlock("flag_hunter");
    }
    if (profile.capturedFlags && profile.capturedFlags >= 25) {
      await checkAndUnlock("flag_master");
    }

    if (profile.spiesRevealed && profile.spiesRevealed >= 25) {
      await checkAndUnlock("spy_master");
    }
    if (profile.spiesRevealed && profile.spiesRevealed >= 50) {
      await checkAndUnlock("spy_legend");
    }

    if (profile.piecesEliminated && profile.piecesEliminated >= 50) {
      await checkAndUnlock("eliminator");
    }
    if (profile.piecesEliminated && profile.piecesEliminated >= 100) {
      await checkAndUnlock("destroyer");
    }

    return newAchievements;
  },
});

// Check special game-specific achievements
export const checkGameSpecificAchievements = mutation({
  args: {
    gameId: v.id("games"),
    winnerId: v.id("users"),
    loserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "finished") return [];

    const newAchievements: string[] = [];

    // Helper function to check and unlock achievement
    const checkAndUnlock = async (userId: typeof args.winnerId, achievementId: string) => {
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_user_achievement", (q) => 
          q.eq("userId", userId).eq("achievementId", achievementId)
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("achievements", {
          userId,
          achievementId,
          unlockedAt: Date.now(),
        });
        newAchievements.push(achievementId);
        return true;
      }
      return false;
    };

    // Get all moves for this game to analyze patterns
    // OPTIMIZED: Added limit to prevent excessive document scanning
    const moves = await ctx.db
      .query("moves")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .take(500); // Reasonable limit - games rarely exceed 500 moves

    // Check for Perfectionist achievement (win without losing any pieces)
    let winnerLostPieces = false;
    
    for (const move of moves) {
      if (move.challengeResult) {
        const isMoveByWinner = move.playerId === args.winnerId;
        
        // If winner made a move and lost the challenge, they lost a piece
        if (isMoveByWinner && move.challengeResult.winner === "defender") {
          winnerLostPieces = true;
          break;
        }
        
        // If winner was defending and lost, they lost a piece
        if (!isMoveByWinner && move.challengeResult.winner === "attacker") {
          winnerLostPieces = true;
          break;
        }
        
        // If it was a tie, both lost pieces
        if (move.challengeResult.winner === "tie") {
          winnerLostPieces = true;
          break;
        }
      }
    }

    if (!winnerLostPieces) {
      await checkAndUnlock(args.winnerId, "perfectionist");
    }

    // Check for Comeback King achievement (win after being down to last 5 pieces)
    // Count remaining pieces at different points in the game
    let winnerPiecesRemaining = 21; // Starting pieces
    let minPiecesReached = 21;
    
    for (const move of moves) {
      if (move.challengeResult) {
        const isMoveByWinner = move.playerId === args.winnerId;
        
        if (isMoveByWinner && move.challengeResult.winner === "defender") {
          winnerPiecesRemaining--;
        } else if (!isMoveByWinner && move.challengeResult.winner === "attacker") {
          winnerPiecesRemaining--;
        } else if (move.challengeResult.winner === "tie") {
          winnerPiecesRemaining--;
        }
        
        minPiecesReached = Math.min(minPiecesReached, winnerPiecesRemaining);
      }
    }

    if (minPiecesReached <= 5) {
      await checkAndUnlock(args.winnerId, "comeback_king");
    }

    return newAchievements;
  },
});

// Get recent achievements for a user (within last hour)
export const getRecentAchievements = query({
  args: {
    userId: v.optional(v.id("users")),
    hoursBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId || await getAuthUserId(ctx);
    if (!userId) return [];

    const hoursBack = args.hoursBack || 1;
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);

    // OPTIMIZED: Added limit to prevent excessive document scanning
    const recentAchievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("unlockedAt"), cutoffTime))
      .order("desc")
      .take(50); // Reasonable limit - recent achievements only

    return recentAchievements.map(achievement => ({
      ...achievement,
      ...ACHIEVEMENTS[achievement.achievementId as keyof typeof ACHIEVEMENTS],
    }));
  },
});

// Mark achievements as seen (to avoid showing notifications again)
export const markAchievementsAsSeen = mutation({
  args: {
    achievementIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Update achievements to mark them as seen
    for (const achievementId of args.achievementIds) {
      const achievement = await ctx.db
        .query("achievements")
        .withIndex("by_user_achievement", (q) => 
          q.eq("userId", userId).eq("achievementId", achievementId)
        )
        .unique();

      if (achievement) {
        await ctx.db.patch(achievement._id, {
          seenAt: Date.now(),
        });
      }
    }
  },
});
