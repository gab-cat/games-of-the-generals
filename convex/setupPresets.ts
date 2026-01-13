import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Initial piece setup for each player (21 pieces total)
const INITIAL_PIECES = [
  "Flag",
  "Spy", "Spy",
  "Private", "Private", "Private", "Private", "Private", "Private",
  "Sergeant",
  "2nd Lieutenant",
  "1st Lieutenant",
  "Captain",
  "Major",
  "Lieutenant Colonel",
  "Colonel",
  "1 Star General",
  "2 Star General",
  "3 Star General",
  "4 Star General",
  "5 Star General"
];

// Default preset formations - these are standard presets available to all users
const DEFAULT_PRESETS = [
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

// Get default presets (standard presets available to all users)
export const getDefaultPresets = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.string(), // Use string ID for default presets since they're not in DB
      name: v.string(),
      description: v.string(),
      isDefault: v.boolean(),
      isBuiltIn: v.boolean(),
      pieces: v.array(
        v.object({
          piece: v.string(),
          row: v.number(),
          col: v.number(),
        })
      ),
      createdAt: v.number(),
      upvotes: v.optional(v.number()),
    })
  ),
  handler: async (_ctx) => {
    // Return the hardcoded default presets
    return DEFAULT_PRESETS.map((preset, index) => ({
      _id: `default_${index}`, // Use a predictable ID for default presets
      name: preset.name,
      description: preset.description,
      isDefault: false,
      isBuiltIn: true,
      pieces: preset.pieces,
      createdAt: 0, // Default presets don't have a creation time
      upvotes: 0,
    }));
  },
});

// Get user's custom setup presets
export const getUserSetupPresets = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("setupPresets"),
      _creationTime: v.number(),
      userId: v.id("users"),
      name: v.string(),
      isDefault: v.boolean(),
      isBuiltIn: v.boolean(),
      pieces: v.array(
        v.object({
          piece: v.string(),
          row: v.number(),
          col: v.number(),
        })
      ),
      createdAt: v.number(),
      upvotes: v.optional(v.number()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user's custom presets only (no built-in presets from DB)
    // OPTIMIZED: Added limit to prevent excessive document scanning
    const userPresets = await ctx.db
      .query("setupPresets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10); // Reasonable limit - users limited to 5 presets, but add buffer

    return userPresets;
  },
});

// Save a new setup preset
export const saveSetupPreset = mutation({
  args: {
    name: v.string(),
    pieces: v.array(v.object({
      piece: v.string(),
      row: v.number(),
      col: v.number(),
    })),
  },
  returns: v.id("setupPresets"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate piece setup
    if (args.pieces.length !== INITIAL_PIECES.length) {
      throw new Error("Invalid number of pieces");
    }

    // Check subscription tier and limits
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const tier = subscription?.tier || "free";
    const status = subscription?.status || "active";
    const expiresAt = subscription?.expiresAt || null;
    const gracePeriodEndsAt = subscription?.gracePeriodEndsAt || null;

    // Check if subscription is active (not expired beyond grace period)
    const now = Date.now();
    let isActive = true;
    if (expiresAt && status !== "canceled") {
      if (status === "expired" || (expiresAt < now && gracePeriodEndsAt && gracePeriodEndsAt < now)) {
        isActive = false;
      } else if (status === "grace_period" && gracePeriodEndsAt && gracePeriodEndsAt > now) {
        isActive = true; // Still in grace period
      } else if (expiresAt > now) {
        isActive = true;
      }
    }

    // Get preset limits based on tier
    const limits: Record<string, number> = {
      free: 2,
      pro: Infinity,
      pro_plus: Infinity,
    };
    const limit = limits[tier] || 2;

    // Check if user can create more presets
    const userCustomPresets = await ctx.db
      .query("setupPresets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(limit === Infinity ? 1000 : limit + 1); // Reasonable limit for checking

    if (!isActive && tier !== "free") {
      throw new Error("Your subscription has expired. Please renew to create more custom presets.");
    }

    if (limit !== Infinity && userCustomPresets.length >= limit) {
      const tierName = tier === "free" ? "Free" : tier === "pro" ? "Pro" : "Pro+";
      throw new Error(`Maximum of ${limit} custom presets allowed for ${tierName} tier. ${tier === "free" ? "Upgrade to Pro for unlimited presets." : "Please delete one first."}`);
    }

    // Check if name already exists
    const existingPreset = await ctx.db
      .query("setupPresets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingPreset) {
      throw new Error("A preset with this name already exists");
    }

    // Create new preset
    const presetId = await ctx.db.insert("setupPresets", {
      userId,
      name: args.name,
      isDefault: false,
      isBuiltIn: false,
      pieces: args.pieces,
      createdAt: Date.now(),
      upvotes: 0,
    });

    return presetId;
  },
});

// Load a default preset by ID
export const loadDefaultPreset = query({
  args: {
    presetId: v.string(), // Default presets use string IDs
  },
  returns: v.union(
    v.null(),
    v.object({
      name: v.string(),
      pieces: v.array(v.object({
        piece: v.string(),
        row: v.number(),
        col: v.number(),
      })),
    })
  ),
  handler: async (_ctx, args) => {
    // Extract the index from the preset ID (format: "default_0", "default_1", etc.)
    const indexMatch = args.presetId.match(/^default_(\d+)$/);
    if (!indexMatch) {
      return null;
    }

    const index = parseInt(indexMatch[1], 10);
    if (index < 0 || index >= DEFAULT_PRESETS.length) {
      return null;
    }

    const preset = DEFAULT_PRESETS[index];
    return {
      name: preset.name,
      pieces: preset.pieces,
    };
  },
});

// Load a custom setup preset
export const loadSetupPreset = mutation({
  args: {
    presetId: v.id("setupPresets"),
  },
  returns: v.object({
    name: v.string(),
    pieces: v.array(v.object({
      piece: v.string(),
      row: v.number(),
      col: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const preset = await ctx.db.get("setupPresets", args.presetId);
    if (!preset) throw new Error("Preset not found");

    if (preset.userId !== userId) {
      throw new Error("Not authorized to access this preset");
    }

    return {
      name: preset.name,
      pieces: preset.pieces,
    };
  },
});

// Delete a setup preset
export const deleteSetupPreset = mutation({
  args: {
    presetId: v.id("setupPresets"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const preset = await ctx.db.get("setupPresets", args.presetId);
    if (!preset) throw new Error("Preset not found");

    if (preset.userId !== userId) {
      throw new Error("Not authorized to delete this preset");
    }

    // If this was the default preset, unset it
    if (preset.isDefault) {
      // No need to do anything special - just delete it
    }

    await ctx.db.delete(args.presetId);
    return null;
  },
});

// Set default preset
export const setDefaultPreset = mutation({
  args: {
    presetId: v.optional(v.id("setupPresets")), // null to clear default
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // First, clear any existing default
    const currentDefault = await ctx.db
      .query("setupPresets")
      .withIndex("by_user_default", (q) => q.eq("userId", userId).eq("isDefault", true))
      .first();

    if (currentDefault) {
      await ctx.db.patch(currentDefault._id, { isDefault: false });
    }

    // Set new default if provided
    if (args.presetId) {
      const preset = await ctx.db.get("setupPresets", args.presetId);
      if (!preset) throw new Error("Preset not found");

      if (preset.userId !== userId) {
        throw new Error("Not authorized to set this preset as default");
      }

      await ctx.db.patch(args.presetId, { isDefault: true });
    }

    return null;
  },
});

// Get default preset
export const getDefaultPreset = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("setupPresets"),
      name: v.string(),
      pieces: v.array(v.object({
        piece: v.string(),
        row: v.number(),
        col: v.number(),
      })),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const defaultPreset = await ctx.db
      .query("setupPresets")
      .withIndex("by_user_default", (q) => q.eq("userId", userId).eq("isDefault", true))
      .first();

    if (!defaultPreset) return null;

    return {
      _id: defaultPreset._id,
      name: defaultPreset.name,
      pieces: defaultPreset.pieces,
    };
  },
});

// Update a setup preset
export const updateSetupPreset = mutation({
  args: {
    presetId: v.id("setupPresets"),
    name: v.optional(v.string()),
    pieces: v.optional(v.array(v.object({
      piece: v.string(),
      row: v.number(),
      col: v.number(),
    }))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const preset = await ctx.db.get("setupPresets", args.presetId);
    if (!preset) throw new Error("Preset not found");

    if (preset.userId !== userId) {
      throw new Error("Not authorized to update this preset");
    }

    const updates: any = {};

    if (args.name && args.name !== preset.name) {
      // Check if new name already exists
      const existingPreset = await ctx.db
        .query("setupPresets")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("name"), args.name))
        .first();

      if (existingPreset) {
        throw new Error("A preset with this name already exists");
      }

      updates.name = args.name;
    }

    if (args.pieces) {
      if (args.pieces.length !== INITIAL_PIECES.length) {
        throw new Error("Invalid number of pieces");
      }
      updates.pieces = args.pieces;
    }

    await ctx.db.patch(args.presetId, updates);
    return null;
  },
});

// Migration function to convert usageCount to upvotes (for existing data)
export const migrateUsageCountToUpvotes = mutation({
  args: {},
  returns: v.object({
    migrated: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get all user presets that might have usageCount
    // OPTIMIZED: Added limit to prevent excessive document scanning
    const presets = await ctx.db
      .query("setupPresets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(10); // Reasonable limit - users limited to 5 presets, but add buffer

    let migrated = 0;
    for (const preset of presets) {
      // Check if preset has usageCount but no upvotes field
      const presetData = preset as any;
      if (presetData.usageCount !== undefined && presetData.upvotes === undefined) {
        await ctx.db.patch(preset._id, {
          upvotes: presetData.usageCount,
        });
        migrated++;
      }
    }

    return { migrated };
  },
});
