import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Available frames organized by access tier
const FRAME_ACCESS = {
  pro: ["gold", "silver", "bronze"],
  pro_plus: ["diamond", "fire", "rainbow", "platinum", "cosmic"],
  donor: ["donor", "heart", "supporter"],
} as const;

// Predefined color palette for Pro users
const PRO_COLOR_PALETTE = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#A855F7", // Violet
];

/**
 * Get customization settings for the current authenticated user
 */
export const getCurrentUserCustomization = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const customization = await ctx.db
      .query("userCustomizations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return customization;
  },
});

/**
 * Get customization settings for a specific user (public, read-only)
 */
export const getCustomization = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const customization = await ctx.db
      .query("userCustomizations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return customization;
  },
});

/**
 * Get customization by username (for display purposes)
 */
export const getCustomizationByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (!profile) return null;

    const customization = await ctx.db
      .query("userCustomizations")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .first();

    return customization;
  },
});

/**
 * Get available frames based on user's current tier and donor status
 */
export const getAvailableFrames = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { frames: [], tier: "free" as const, isDonor: false };
    }

    // Get subscription tier
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const tier = subscription?.status === "active" || subscription?.status === "grace_period"
      ? subscription.tier
      : "free";

    // Get donor status
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const isDonor = profile?.isDonor ?? false;

    // Build available frames list
    const availableFrames: string[] = ["none"]; // Everyone can remove frames

    if (tier === "pro" || tier === "pro_plus") {
      availableFrames.push(...FRAME_ACCESS.pro);
    }

    if (tier === "pro_plus") {
      availableFrames.push(...FRAME_ACCESS.pro_plus);
    }

    if (isDonor) {
      availableFrames.push(...FRAME_ACCESS.donor);
    }

    return { frames: availableFrames, tier, isDonor };
  },
});

/**
 * Get available colors based on user's current tier
 */
export const getAvailableColors = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { colors: [], allowCustom: false, tier: "free" as const, isDonor: false };
    }

    // Get subscription tier
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const tier = subscription?.status === "active" || subscription?.status === "grace_period"
      ? subscription.tier
      : "free";

    // Get donor status
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const isDonor = profile?.isDonor ?? false;

    // Free tier: no colors
    if (tier === "free" && !isDonor) {
      return { colors: [], allowCustom: false, tier, isDonor };
    }

    // Pro tier: predefined palette only
    // Pro+ or Donor: predefined palette + custom hex
    return {
      colors: PRO_COLOR_PALETTE,
      allowCustom: tier === "pro_plus" || isDonor,
      tier,
      isDonor,
    };
  },
});

/**
 * Update user's customization settings (with tier validation)
 */
export const updateCustomization = mutation({
  args: {
    usernameColor: v.optional(v.union(v.string(), v.null())),
    avatarFrame: v.optional(v.union(v.string(), v.null())),
    showBadges: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get subscription tier
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const tier = subscription?.status === "active" || subscription?.status === "grace_period"
      ? subscription.tier
      : "free";

    // Get donor status
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const isDonor = profile?.isDonor ?? false;

    // Validate access for cosmetic features (not showBadges which is a preference)
    if ((args.usernameColor !== undefined || args.avatarFrame !== undefined) && tier === "free" && !isDonor) {
      throw new Error("Customization requires a Pro subscription or donor status");
    }

    // Validate frame access
    if (args.avatarFrame && args.avatarFrame !== "none") {
      const allowedFrames: string[] = [];
      
      if (tier === "pro" || tier === "pro_plus") {
        allowedFrames.push(...FRAME_ACCESS.pro);
      }
      if (tier === "pro_plus") {
        allowedFrames.push(...FRAME_ACCESS.pro_plus);
      }
      if (isDonor) {
        allowedFrames.push(...FRAME_ACCESS.donor);
      }

      if (!allowedFrames.includes(args.avatarFrame)) {
        throw new Error(`Frame "${args.avatarFrame}" is not available for your tier`);
      }
    }

    // Validate color access
    if (args.usernameColor) {
      const allowCustomColor = tier === "pro_plus" || isDonor;
      
      if (!allowCustomColor && !PRO_COLOR_PALETTE.includes(args.usernameColor)) {
        throw new Error("Custom colors require Pro+ subscription or donor status. Choose from the predefined palette.");
      }

      // Basic hex color validation
      if (!/^#[0-9A-Fa-f]{6}$/.test(args.usernameColor)) {
        throw new Error("Invalid color format. Use hex format: #RRGGBB");
      }
    }

    // Get existing customization
    const existing = await ctx.db
      .query("userCustomizations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const updates = {
      usernameColor: args.usernameColor === null ? undefined : (args.usernameColor ?? existing?.usernameColor),
      avatarFrame: args.avatarFrame === null ? undefined : (args.avatarFrame ?? existing?.avatarFrame),
      showBadges: args.showBadges ?? existing?.showBadges,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      const id = await ctx.db.insert("userCustomizations", {
        userId,
        ...updates,
      });
      return id;
    }
  },
});

/**
 * Reset all customizations to default
 */
export const resetCustomization = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("userCustomizations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        usernameColor: undefined,
        avatarFrame: undefined,
        showBadges: undefined,
        profileBackground: undefined,
        chatBubbleStyle: undefined,
        nameEffect: undefined,
        updatedAt: Date.now(),
      });
    }

    return true;
  },
});
