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

// Subscription migration removed - subscriptions are now created dynamically
// If a user doesn't have a subscription record, they are treated as a free tier user

/**
 * Migration function to backfill donor status and total donations
 * from existing successful donations
 */
export const backfillDonorStatus = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all successful donations
    const successfulDonations = await ctx.db
      .query("donations")
      .withIndex("by_status", (q) => q.eq("status", "succeeded"))
      .collect();
    
    console.log(`[Migration] Found ${successfulDonations.length} successful donations`);
    
    // Group donations by userId and sum amounts
    const donorTotals = new Map<string, number>();
    const donorUsers = new Set<string>();
    
    for (const donation of successfulDonations) {
      const userId = donation.userId;
      donorUsers.add(userId);
      const currentTotal = donorTotals.get(userId) || 0;
      donorTotals.set(userId, currentTotal + donation.amount);
    }
    
    console.log(`[Migration] Found ${donorUsers.size} unique donors`);
    
    // Update profiles for users with successful donations
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const userId of donorUsers) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId as any))
        .unique();
      
      if (!profile) {
        console.warn(`[Migration] Profile not found for user ${userId}`);
        skippedCount++;
        continue;
      }
      
      // Only update if not already set (to avoid overwriting newer data)
      // or if the calculated total is different
      const calculatedTotal = donorTotals.get(userId) || 0;
      const currentTotal = profile.totalDonated || 0;
      
      // Update if not set or if calculated total is higher (more accurate)
      if (!profile.isDonor || calculatedTotal > currentTotal) {
        await ctx.db.patch(profile._id, {
          isDonor: true,
          totalDonated: calculatedTotal,
        });
        updatedCount++;
        console.log(`[Migration] Updated profile ${profile._id}: isDonor=true, totalDonated=${calculatedTotal}`);
      } else {
        skippedCount++;
      }
    }
    
    console.log(`[Migration] Completed: Updated ${updatedCount} profiles, skipped ${skippedCount}`);
    return { success: true, updatedCount, skippedCount };
  },
});