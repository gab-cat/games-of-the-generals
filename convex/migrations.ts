import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

// Popular preset formations - these will be auto-created for new users
const POPULAR_PRESETS = [
  {
    name: "Aggressive Front",
    description: "Strong offensive formation with flag protected by spies",
    pieces: [
      // Row 5 (front line) - Strong offensive pieces
      { piece: "5 Star General", row: 5, col: 4 },
      { piece: "4 Star General", row: 5, col: 3 },
      { piece: "3 Star General", row: 5, col: 5 },
      { piece: "2 Star General", row: 5, col: 2 },
      { piece: "1 Star General", row: 5, col: 6 },
      { piece: "Colonel", row: 5, col: 1 },
      { piece: "Lieutenant Colonel", row: 5, col: 7 },
      { piece: "Major", row: 5, col: 0 },
      { piece: "Captain", row: 5, col: 8 },
      // Row 6 (middle line) - Support and spies
      { piece: "Spy", row: 6, col: 3 },
      { piece: "Spy", row: 6, col: 5 },
      { piece: "1st Lieutenant", row: 6, col: 4 },
      { piece: "2nd Lieutenant", row: 6, col: 2 },
      { piece: "Sergeant", row: 6, col: 6 },
      { piece: "Private", row: 6, col: 1 },
      { piece: "Private", row: 6, col: 7 },
      { piece: "Private", row: 6, col: 0 },
      { piece: "Private", row: 6, col: 8 },
      // Row 7 (back line) - Flag protection
      { piece: "Flag", row: 7, col: 4 },
      { piece: "Private", row: 7, col: 3 },
      { piece: "Private", row: 7, col: 5 },
    ]
  },
  {
    name: "Fortress Defense",
    description: "Defensive formation with flag heavily protected in the back",
    pieces: [
      // Row 5 (front line) - Sacrifice pieces and scouts
      { piece: "Private", row: 5, col: 0 },
      { piece: "Private", row: 5, col: 1 },
      { piece: "Private", row: 5, col: 2 },
      { piece: "Sergeant", row: 5, col: 3 },
      { piece: "2nd Lieutenant", row: 5, col: 4 },
      { piece: "1st Lieutenant", row: 5, col: 5 },
      { piece: "Captain", row: 5, col: 6 },
      { piece: "Private", row: 5, col: 7 },
      { piece: "Private", row: 5, col: 8 },
      // Row 6 (middle line) - Mid-tier officers
      { piece: "Major", row: 6, col: 1 },
      { piece: "Lieutenant Colonel", row: 6, col: 2 },
      { piece: "Colonel", row: 6, col: 3 },
      { piece: "1 Star General", row: 6, col: 4 },
      { piece: "2 Star General", row: 6, col: 5 },
      { piece: "3 Star General", row: 6, col: 6 },
      { piece: "4 Star General", row: 6, col: 7 },
      { piece: "Private", row: 6, col: 0 },
      { piece: "Private", row: 6, col: 8 },
      // Row 7 (back line) - Flag with top protection
      { piece: "Spy", row: 7, col: 3 },
      { piece: "Flag", row: 7, col: 4 },
      { piece: "Spy", row: 7, col: 5 },
      { piece: "5 Star General", row: 7, col: 2 },
    ]
  },
  {
    name: "Balanced Formation",
    description: "Well-rounded setup with good offense and defense",
    pieces: [
      // Row 5 (front line) - Mixed approach
      { piece: "Private", row: 5, col: 0 },
      { piece: "Sergeant", row: 5, col: 1 },
      { piece: "2nd Lieutenant", row: 5, col: 2 },
      { piece: "Captain", row: 5, col: 3 },
      { piece: "Major", row: 5, col: 4 },
      { piece: "Lieutenant Colonel", row: 5, col: 5 },
      { piece: "Colonel", row: 5, col: 6 },
      { piece: "1 Star General", row: 5, col: 7 },
      { piece: "Private", row: 5, col: 8 },
      // Row 6 (middle line) - Strong center
      { piece: "Private", row: 6, col: 0 },
      { piece: "1st Lieutenant", row: 6, col: 1 },
      { piece: "2 Star General", row: 6, col: 2 },
      { piece: "3 Star General", row: 6, col: 3 },
      { piece: "4 Star General", row: 6, col: 4 },
      { piece: "5 Star General", row: 6, col: 5 },
      { piece: "Spy", row: 6, col: 6 },
      { piece: "Private", row: 6, col: 7 },
      { piece: "Private", row: 6, col: 8 },
      // Row 7 (back line) - Flag protection
      { piece: "Spy", row: 7, col: 3 },
      { piece: "Flag", row: 7, col: 4 },
      { piece: "Private", row: 7, col: 5 },
    ]
  },
  {
    name: "Spy Gambit",
    description: "Aggressive formation focusing on spy tactics",
    pieces: [
      // Row 5 (front line) - Spies up front for surprise attacks
      { piece: "Private", row: 5, col: 0 },
      { piece: "Private", row: 5, col: 1 },
      { piece: "Spy", row: 5, col: 2 },
      { piece: "Sergeant", row: 5, col: 3 },
      { piece: "2nd Lieutenant", row: 5, col: 4 },
      { piece: "1st Lieutenant", row: 5, col: 5 },
      { piece: "Spy", row: 5, col: 6 },
      { piece: "Private", row: 5, col: 7 },
      { piece: "Private", row: 5, col: 8 },
      // Row 6 (middle line) - Officers for backup
      { piece: "Captain", row: 6, col: 0 },
      { piece: "Major", row: 6, col: 1 },
      { piece: "Lieutenant Colonel", row: 6, col: 2 },
      { piece: "Colonel", row: 6, col: 3 },
      { piece: "1 Star General", row: 6, col: 4 },
      { piece: "2 Star General", row: 6, col: 5 },
      { piece: "3 Star General", row: 6, col: 6 },
      { piece: "4 Star General", row: 6, col: 7 },
      { piece: "5 Star General", row: 6, col: 8 },
      // Row 7 (back line) - Flag with privates
      { piece: "Private", row: 7, col: 3 },
      { piece: "Flag", row: 7, col: 4 },
      { piece: "Private", row: 7, col: 5 },
    ]
  }
];

// Migration to add moveCount to existing games
export const addMoveCountToGames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db.query("games").collect();
    let processed = 0;
    
    for (const game of games) {
      if (game.moveCount === undefined) {
        // Use the optimized query with limit to count moves
        const moves = await ctx.db
          .query("moves")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .collect();
        
        await ctx.db.patch(game._id, {
          moveCount: moves.length,
        });
        processed++;
      }
    }
    
    return { 
      totalGames: games.length,
      processed,
      message: `Updated ${processed} games with move counts`
    };
  },
});

// Migration to clean up old timeout check patterns (if any exist)
export const cleanupTimeoutChecks = internalMutation({
  args: {},
  handler: async (_ctx) => {
    // This migration cleans up any lingering timeout check artifacts
    // Since we removed the checkGameTimeout function
    return { message: "Timeout check cleanup completed" };
  },
});

// Migration to create built-in presets for all existing users
export const createBuiltInPresetsForAllUsers = mutation({
  args: {},
  returns: v.object({
    usersProcessed: v.number(),
    presetsCreated: v.number(),
  }),
  handler: async (ctx) => {
    let usersProcessed = 0;
    let presetsCreated = 0;

    // Get all user profiles
    const profiles = await ctx.db.query("profiles").collect();

    for (const profile of profiles) {
      usersProcessed++;
      const userId = profile.userId;

      // Check if user already has built-in presets
      const existingBuiltInPresets = await ctx.db
        .query("setupPresets")
        .withIndex("by_user_builtin", (q) => q.eq("userId", userId).eq("isBuiltIn", true))
        .collect();

      // If user doesn't have built-in presets, create them
      if (existingBuiltInPresets.length === 0) {
        for (const preset of POPULAR_PRESETS) {
          await ctx.db.insert("setupPresets", {
            userId,
            name: preset.name,
            isDefault: false,
            isBuiltIn: true,
            pieces: preset.pieces,
            createdAt: Date.now(),
          });
          presetsCreated++;
        }
      }
    }

    return {
      usersProcessed,
      presetsCreated,
    };
  },
});

// Clean up any duplicate built-in presets (in case migration runs multiple times)
export const cleanupDuplicateBuiltInPresets = mutation({
  args: {},
  returns: v.object({
    duplicatesRemoved: v.number(),
  }),
  handler: async (ctx) => {
    let duplicatesRemoved = 0;

    // Group built-in presets by user and name
    const builtInPresets = await ctx.db
      .query("setupPresets")
      .withIndex("by_builtin", (q) => q.eq("isBuiltIn", true))
      .collect();

    const userPresetMap = new Map<string, Map<string, any[]>>();

    for (const preset of builtInPresets) {
      const userKey = preset.userId;
      const presetName = preset.name;

      if (!userPresetMap.has(userKey)) {
        userPresetMap.set(userKey, new Map());
      }

      const userPresets = userPresetMap.get(userKey)!;
      if (!userPresets.has(presetName)) {
        userPresets.set(presetName, []);
      }

      userPresets.get(presetName)!.push(preset);
    }

    // Remove duplicates (keep the first one, delete the rest)
    for (const [_userId, userPresets] of userPresetMap) {
      for (const [_presetName, presets] of userPresets) {
        if (presets.length > 1) {
          // Keep the first preset, delete the rest
          for (let i = 1; i < presets.length; i++) {
            await ctx.db.delete(presets[i]._id);
            duplicatesRemoved++;
          }
        }
      }
    }

    return {
      duplicatesRemoved,
    };
  },
});
