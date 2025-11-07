// Migration functionality has been removed - online status is now handled by presence system

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Migration function to assign initial ELO ratings to existing users
 * Based on their historical stats and game performance
 * 
 * Formula:
 * - Base ELO: 1500
 * - Win rate adjustment: (winRate - 0.5) * 1000 (50% win rate = 1500, 60% = 1600, 40% = 1400)
 * - Games played bonus: Math.min(gamesPlayed * 2, 200) (up to +200 for active players)
 * - Final: 1500 + winRateAdjustment + gamesBonus
 * - Clamp between 800-2500
 */
export const assignInitialEloRatings = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all profiles
    const profiles = await ctx.db.query("profiles").collect();
    
    let updatedCount = 0;
    
    for (const profile of profiles) {
      // Skip if ELO already exists (migration already run)
      if (profile.elo !== undefined && profile.elo !== null) {
        continue;
      }
      
      // Calculate initial ELO based on stats
      const winRate = profile.gamesPlayed > 0 ? profile.wins / profile.gamesPlayed : 0.5;
      const winRateAdjustment = (winRate - 0.5) * 1000; // 50% = 0, 60% = 100, 40% = -100
      const gamesBonus = Math.min(profile.gamesPlayed * 2, 200); // Up to +200 for active players
      
      const initialElo = Math.max(800, Math.min(2500, Math.round(1500 + winRateAdjustment + gamesBonus)));
      
      // Update profile with initial ELO
      await ctx.db.patch(profile._id, {
        elo: initialElo,
      });
      
      updatedCount++;
    }
    
    console.log(`Migration completed: Assigned initial ELO ratings to ${updatedCount} profiles`);
    return { success: true, updatedCount };
  },
});