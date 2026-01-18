import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to verify admin access
async function verifyAdminAccess(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();

  if (!profile?.adminRole) {
    throw new Error("Access denied: Admin role required");
  }

  return { userId, profile };
}

// Get dashboard statistics overview
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await verifyAdminAccess(ctx);

    // Total users count
    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;

    // Active subscriptions by tier
    const allSubscriptions = await ctx.db.query("subscriptions").collect();
    const activeSubscriptions = allSubscriptions.filter(
      (s) => s.status === "active",
    );
    const proCount = activeSubscriptions.filter((s) => s.tier === "pro").length;
    const proPlusCount = activeSubscriptions.filter(
      (s) => s.tier === "pro_plus",
    ).length;

    // Total donations (succeeded)
    const allDonations = await ctx.db.query("donations").collect();
    const successfulDonations = allDonations.filter(
      (d) => d.status === "succeeded",
    );
    const totalDonationsAmount = successfulDonations.reduce(
      (sum, d) => sum + d.amount,
      0,
    );
    const totalDonationsCount = successfulDonations.length;

    // This month's donations
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonthDonations = successfulDonations.filter(
      (d) => d.createdAt >= startOfMonth.getTime(),
    );
    const thisMonthDonationsAmount = thisMonthDonations.reduce(
      (sum, d) => sum + d.amount,
      0,
    );

    // Open support tickets
    const openTickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_status", (q: any) => q.eq("status", "open"))
      .collect();
    const inProgressTickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_status", (q: any) => q.eq("status", "in_progress"))
      .collect();

    return {
      users: {
        total: totalUsers,
      },
      subscriptions: {
        activeTotal: activeSubscriptions.length,
        pro: proCount,
        proPlus: proPlusCount,
      },
      donations: {
        allTimeTotal: totalDonationsAmount,
        allTimeCount: totalDonationsCount,
        thisMonthTotal: thisMonthDonationsAmount,
        thisMonthCount: thisMonthDonations.length,
      },
      tickets: {
        open: openTickets.length,
        inProgress: inProgressTickets.length,
      },
    };
  },
});

// Get games played in the last 24 hours
export const getGamesToday = query({
  args: {},
  handler: async (ctx) => {
    await verifyAdminAccess(ctx);

    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    // Get finished games from last 24 hours
    const recentGames = await ctx.db
      .query("games")
      .withIndex("by_status_finished")
      .filter((q: any) =>
        q.and(
          q.eq(q.field("status"), "finished"),
          q.gte(q.field("finishedAt"), twentyFourHoursAgo),
        ),
      )
      .collect();

    // Also count currently playing games
    const playingGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q: any) => q.eq("status", "playing"))
      .collect();

    const setupGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q: any) => q.eq("status", "setup"))
      .collect();

    return {
      finishedLast24h: recentGames.length,
      currentlyPlaying: playingGames.length,
      inSetup: setupGames.length,
    };
  },
});

// Get all users with pagination (admin only)
export const getAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyAdminAccess(ctx);

    const limit = args.limit ?? 50;

    // Get all profiles with their subscription status
    let profilesQuery = ctx.db.query("profiles");

    // If searching, use the search index
    if (args.search && args.search.trim()) {
      const searchResults = await ctx.db
        .query("profiles")
        .withSearchIndex("search_username", (q: any) =>
          q.search("username", args.search!),
        )
        .take(limit);

      // Enrich with subscription data
      const enrichedUsers = await Promise.all(
        searchResults.map(async (profile) => {
          const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q: any) => q.eq("userId", profile.userId))
            .unique();

          const user = await ctx.db.get(profile.userId);

          return {
            ...profile,
            email: user?.email,
            subscription: subscription
              ? {
                  tier: subscription.tier,
                  status: subscription.status,
                  expiresAt: subscription.expiresAt,
                }
              : null,
          };
        }),
      );

      return {
        users: enrichedUsers,
        hasMore: false,
        continueCursor: undefined,
      };
    }

    // Regular paginated query
    const profiles = await profilesQuery.order("desc").take(limit + 1);

    const hasMore = profiles.length > limit;
    const pageProfiles = hasMore ? profiles.slice(0, limit) : profiles;

    // Enrich with subscription data
    const enrichedUsers = await Promise.all(
      pageProfiles.map(async (profile) => {
        const subscription = await ctx.db
          .query("subscriptions")
          .withIndex("by_user", (q: any) => q.eq("userId", profile.userId))
          .unique();

        const user = await ctx.db.get(profile.userId);

        return {
          ...profile,
          email: user?.email,
          subscription: subscription
            ? {
                tier: subscription.tier,
                status: subscription.status,
                expiresAt: subscription.expiresAt,
              }
            : null,
        };
      }),
    );

    return {
      users: enrichedUsers,
      hasMore,
      continueCursor: hasMore
        ? pageProfiles[pageProfiles.length - 1]._id
        : undefined,
    };
  },
});

// Get all subscriptions with pagination (admin only)
export const getAllSubscriptions = query({
  args: {
    limit: v.optional(v.number()),
    tierFilter: v.optional(
      v.union(v.literal("free"), v.literal("pro"), v.literal("pro_plus")),
    ),
    statusFilter: v.optional(
      v.union(
        v.literal("active"),
        v.literal("expired"),
        v.literal("grace_period"),
        v.literal("canceled"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await verifyAdminAccess(ctx);

    const limit = args.limit ?? 50;

    // Get subscriptions with optional status filter
    let subscriptions;
    if (args.statusFilter) {
      subscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("by_status", (q: any) => q.eq("status", args.statusFilter))
        .take(limit + 1);
    } else {
      subscriptions = await ctx.db.query("subscriptions").take(limit + 1);
    }

    // Filter by tier if needed (done in-memory since we don't have a tier index)
    let filteredSubs = subscriptions;
    if (args.tierFilter) {
      filteredSubs = subscriptions.filter((s) => s.tier === args.tierFilter);
    }

    const hasMore = filteredSubs.length > limit;
    const pageSubs = hasMore ? filteredSubs.slice(0, limit) : filteredSubs;

    // Enrich with user data
    const enrichedSubs = await Promise.all(
      pageSubs.map(async (sub) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q: any) => q.eq("userId", sub.userId))
          .unique();

        const user = await ctx.db.get(sub.userId);

        return {
          ...sub,
          username: profile?.username,
          email: user?.email,
          avatarUrl: profile?.avatarUrl,
        };
      }),
    );

    return {
      subscriptions: enrichedSubs,
      hasMore,
    };
  },
});

// Get ticket counts by status (for dashboard overview)
export const getTicketOverview = query({
  args: {},
  handler: async (ctx) => {
    await verifyAdminAccess(ctx);

    const allTickets = await ctx.db.query("supportTickets").collect();

    const statusCounts = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    allTickets.forEach((ticket) => {
      statusCounts[ticket.status as keyof typeof statusCounts]++;
      priorityCounts[ticket.priority as keyof typeof priorityCounts]++;
    });

    return {
      total: allTickets.length,
      byStatus: statusCounts,
      byPriority: priorityCounts,
    };
  },
});

export const adminCreateSubscription = mutation({
  args: {
    userId: v.id("users"),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("pro_plus")),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("grace_period"),
      v.literal("canceled"),
    ),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await verifyAdminAccess(ctx);

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      throw new Error("User already has a subscription record");
    }

    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: args.userId,
      tier: args.tier,
      status: args.status,
      expiresAt: args.expiresAt,
      gracePeriodEndsAt: args.expiresAt + 2 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
      totalMonthsPaid: 0,
    });

    return subscriptionId;
  },
});

export const adminUpdateSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("pro_plus")),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("grace_period"),
      v.literal("canceled"),
    ),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await verifyAdminAccess(ctx);

    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(args.subscriptionId, {
      tier: args.tier,
      status: args.status,
      expiresAt: args.expiresAt,
      gracePeriodEndsAt: args.expiresAt + 2 * 24 * 60 * 60 * 1000,
    });

    return args.subscriptionId;
  },
});

export const adminDeleteSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
  },
  handler: async (ctx, args) => {
    await verifyAdminAccess(ctx);

    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.delete(args.subscriptionId);
    return args.subscriptionId;
  },
});

export const searchUsersForSubscription = query({
  args: {
    search: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAdminAccess(ctx);

    if (!args.search.trim()) return [];

    const profiles = await ctx.db
      .query("profiles")
      .withSearchIndex("search_username", (q) =>
        q.search("username", args.search),
      )
      .take(10);

    return await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          userId: profile.userId,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
          email: user?.email,
        };
      }),
    );
  },
});
