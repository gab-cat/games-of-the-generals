import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Subscription tier limits
const TIER_LIMITS = {
  free: {
    customPresets: 2,
    privateLobbiesPerDay: 10,
    aiReplays: 1,
    aiDifficulties: ["easy", "medium"],
    customAvatar: false,
    premiumFrames: false,
    gameAnalysis: false,
    priorityMatchmaking: false,
    extendedChat: false,
    customLobbySettings: false,
  },
  pro: {
    customPresets: Infinity,
    privateLobbiesPerDay: 50,
    aiReplays: 50,
    aiDifficulties: ["easy", "medium", "hard"],
    customAvatar: true,
    premiumFrames: true,
    gameAnalysis: true,
    priorityMatchmaking: true,
    extendedChat: true,
    customLobbySettings: true,
  },
  pro_plus: {
    customPresets: Infinity,
    privateLobbiesPerDay: Infinity,
    aiReplays: 100,
    aiDifficulties: ["easy", "medium", "hard"],
    customAvatar: true,
    premiumFrames: true,
    gameAnalysis: true,
    priorityMatchmaking: true,
    extendedChat: true,
    customLobbySettings: true,
  },
} as const;

// Helper function to check if subscription is active (not expired beyond grace period)
export function isSubscriptionActive(
  status: string,
  expiresAt: number | null,
  gracePeriodEndsAt: number | null
): boolean {
  // Free tier or no expiry - always active
  if (!expiresAt) return true;
  
  // Explicitly canceled or expired
  if (status === "canceled") return false;
  if (status === "expired") return false;
  
  const now = Date.now();
  
  // Grace period status - check if still within grace period
  if (status === "grace_period") {
    return gracePeriodEndsAt ? gracePeriodEndsAt > now : false;
  }
  
  // Active status - check expiry, but also allow grace period if expiry passed
  if (expiresAt > now) return true;
  
  // Expiry passed but may still be in grace period (before cron updates status)
  return gracePeriodEndsAt ? gracePeriodEndsAt > now : false;
}

// Check if subscription is active
export const checkSubscriptionActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { isActive: false, reason: "not_authenticated" };

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const tier = subscription?.tier || "free";
    const status = subscription?.status || "active";
    const expiresAt = subscription?.expiresAt || null;
    const gracePeriodEndsAt = subscription?.gracePeriodEndsAt || null;

    const isActive = isSubscriptionActive(status, expiresAt, gracePeriodEndsAt);

    return {
      isActive,
      tier,
      status,
      expiresAt,
      gracePeriodEndsAt,
      reason: isActive ? null : "subscription_expired",
    };
  },
});

// Check setup preset limit
export const checkSetupPresetLimit = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { canCreate: false, reason: "not_authenticated", limit: 0, current: 0 };

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const tier = subscription?.tier || "free";
    const status = subscription?.status || "active";
    const expiresAt = subscription?.expiresAt || null;
    const gracePeriodEndsAt = subscription?.gracePeriodEndsAt || null;

    const isActive = isSubscriptionActive(status, expiresAt, gracePeriodEndsAt);
    const limit = TIER_LIMITS[tier].customPresets;

    // Count current custom presets
    const currentPresets = await ctx.db
      .query("setupPresets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const currentCount = currentPresets.length;
    const canCreate = isActive && (limit === Infinity || currentCount < limit);

    return {
      canCreate,
      limit,
      current: currentCount,
      reason: !isActive ? "subscription_expired" : canCreate ? null : "limit_reached",
      tier,
      status,
    };
  },
});

// Check private lobby limit
export const checkPrivateLobbyLimit = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { canCreate: false, reason: "not_authenticated", limit: 0, today: 0 };

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const tier = subscription?.tier || "free";
    const status = subscription?.status || "active";
    const expiresAt = subscription?.expiresAt || null;
    const gracePeriodEndsAt = subscription?.gracePeriodEndsAt || null;

    const isActive = isSubscriptionActive(status, expiresAt, gracePeriodEndsAt);
    const limit = TIER_LIMITS[tier].privateLobbiesPerDay;

    // Get today's usage
    const today = new Date().toISOString().split("T")[0];
    const usage = await ctx.db
      .query("subscriptionUsage")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", today))
      .unique();

    const todayCount = usage?.privateLobbiesCreated || 0;
    const canCreate = isActive && (limit === Infinity || todayCount < limit);

    return {
      canCreate,
      limit,
      today: todayCount,
      reason: !isActive ? "subscription_expired" : canCreate ? null : "daily_limit_reached",
      tier,
      status,
    };
  },
});

// Check AI difficulty access
export const checkAIDifficultyAccess = query({
  args: {
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { hasAccess: false, reason: "not_authenticated" };

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const tier = subscription?.tier || "free";
    const status = subscription?.status || "active";
    const expiresAt = subscription?.expiresAt || null;
    const gracePeriodEndsAt = subscription?.gracePeriodEndsAt || null;

    const isActive = isSubscriptionActive(status, expiresAt, gracePeriodEndsAt);
    const allowedDifficulties = TIER_LIMITS[tier].aiDifficulties;
    const hasAccess = isActive && (allowedDifficulties as readonly string[]).includes(args.difficulty);

    return {
      hasAccess,
      reason: !isActive ? "subscription_expired" : hasAccess ? null : "tier_insufficient",
      tier,
      status,
      allowedDifficulties,
    };
  },
});

// Check replay limit
export const checkReplayLimit = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { canSave: false, reason: "not_authenticated", limit: 0, current: 0 };

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const tier = subscription?.tier || "free";
    const status = subscription?.status || "active";
    const expiresAt = subscription?.expiresAt || null;
    const gracePeriodEndsAt = subscription?.gracePeriodEndsAt || null;

    const isActive = isSubscriptionActive(status, expiresAt, gracePeriodEndsAt);
    const limit = TIER_LIMITS[tier].aiReplays;

    // Count current saved replays (this would need to be implemented based on your replay storage)
    // For now, using a placeholder
    const currentCount = 0; // TODO: Implement replay counting

    const canSave = isActive && (limit === Infinity || currentCount < limit);

    return {
      canSave,
      limit,
      current: currentCount,
      reason: !isActive ? "subscription_expired" : canSave ? null : "limit_reached",
      tier,
      status,
    };
  },
});

// Generic feature access checker
export const checkFeatureAccess = query({
  args: {
    feature: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { hasAccess: false, reason: "not_authenticated" };

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const tier = subscription?.tier || "free";
    const status = subscription?.status || "active";
    const expiresAt = subscription?.expiresAt || null;
    const gracePeriodEndsAt = subscription?.gracePeriodEndsAt || null;

    const isActive = isSubscriptionActive(status, expiresAt, gracePeriodEndsAt);

    // Feature-specific checks
    const featureMap: Record<string, keyof typeof TIER_LIMITS.free> = {
      customAvatar: "customAvatar",
      premiumFrames: "premiumFrames",
      gameAnalysis: "gameAnalysis",
      priorityMatchmaking: "priorityMatchmaking",
      extendedChat: "extendedChat",
      customLobbySettings: "customLobbySettings",
    };

    const featureKey = featureMap[args.feature];
    if (!featureKey) {
      return { hasAccess: false, reason: "unknown_feature" };
    }

    const hasAccess = isActive && TIER_LIMITS[tier][featureKey] === true;

    return {
      hasAccess,
      reason: !isActive ? "subscription_expired" : hasAccess ? null : "tier_insufficient",
      tier,
      status,
    };
  },
});

// Get all limits for current user tier
export const getUserLimits = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { tier: "free", limits: TIER_LIMITS.free };

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const tier = subscription?.tier || "free";
    const status = subscription?.status || "active";
    const expiresAt = subscription?.expiresAt || null;
    const gracePeriodEndsAt = subscription?.gracePeriodEndsAt || null;

    const isActive = isSubscriptionActive(status, expiresAt, gracePeriodEndsAt);

    return {
      tier,
      status,
      isActive,
      expiresAt,
      gracePeriodEndsAt,
      limits: TIER_LIMITS[tier],
    };
  },
});

// Get days until expiry
export const getDaysUntilExpiry = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { daysUntilExpiry: null };

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!subscription || !subscription.expiresAt) {
      return { daysUntilExpiry: null };
    }

    const now = Date.now();
    const diff = subscription.expiresAt - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return {
      daysUntilExpiry: days > 0 ? days : 0,
      expiresAt: subscription.expiresAt,
      status: subscription.status,
    };
  },
});
