import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

// Subscription tier pricing (in centavos)
const TIER_PRICING = {
  pro: 9900, // ₱99.00
  pro_plus: 19900, // ₱199.00
} as const;

// Helper function to calculate expiry date
function calculateExpiryDate(currentExpiresAt: number | null, months: number): number {
  const now = Date.now();
  const baseDate = currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
  const expiryDate = new Date(baseDate);
  expiryDate.setMonth(expiryDate.getMonth() + months);
  return expiryDate.getTime();
}

// Helper function to get days until expiry
function getDaysUntilExpiry(expiresAt: number): number {
  const now = Date.now();
  const diff = expiresAt - now;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Helper function to calculate discounted price
// Progressive discounts: 3 months = 15%, 6 months = 20%, 12 months = 25%
// 3 months: pay 2.55 months, 6 months: pay 4.8 months, 12 months: pay 9 months
function calculateDiscountedPrice(
  tier: "pro" | "pro_plus",
  months: number
): {
  originalPrice: number; // in centavos
  discountedPrice: number; // in centavos
  savings: number; // in centavos
  discountPercent: number;
  monthsToPay: number;
} {
  const basePrice = TIER_PRICING[tier]; // in centavos
  const originalPrice = basePrice * months;

  let monthsToPay = months;
  if (months === 12) monthsToPay = 9;      // 25% discount
  else if (months === 6) monthsToPay = 4.8; // 20% discount
  else if (months === 3) monthsToPay = 2.55; // 15% discount

  const discountedPrice = Math.round(basePrice * monthsToPay);
  const savings = originalPrice - discountedPrice;
  const discountPercent = months > 1 && (months === 12 || months === 6 || months === 3)
    ? (savings / originalPrice) * 100
    : 0;

  return { originalPrice, discountedPrice, savings, discountPercent, monthsToPay };
}

// Get current user's subscription
export const getCurrentSubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!subscription) {
      // Return default free subscription
      return {
        userId,
        tier: "free" as const,
        status: "active" as const,
        expiresAt: null,
        gracePeriodEndsAt: null,
        createdAt: Date.now(),
        lastPaymentAt: null,
        totalMonthsPaid: 0,
        daysUntilExpiry: null,
      };
    }

    const daysUntilExpiry = subscription.expiresAt ? getDaysUntilExpiry(subscription.expiresAt) : null;

    return {
      ...subscription,
      daysUntilExpiry,
    };
  },
});

// Get subscription usage for today
export const getSubscriptionUsage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const usage = await ctx.db
      .query("subscriptionUsage")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", today))
      .unique();

    if (!usage) {
      return {
        userId,
        date: today,
        privateLobbiesCreated: 0,
        aiReplaysSaved: 0,
        lastResetAt: Date.now(),
      };
    }

    return usage;
  },
});

// Check if user has access to a specific feature
export const checkFeatureAccess = query({
  args: {
    feature: v.string(),
  },
  handler: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { hasAccess: false, reason: "not_authenticated" };

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const tier = subscription?.tier || "free";
    const status = subscription?.status || "active";
    const expiresAt = subscription?.expiresAt;

    // Check if subscription is expired (beyond grace period)
    const now = Date.now();
    if (expiresAt && status !== "canceled") {
      if (status === "expired" || (expiresAt < now && subscription.gracePeriodEndsAt && subscription.gracePeriodEndsAt < now)) {
        return { hasAccess: false, reason: "subscription_expired", tier, status };
      }
    }

    // Feature-specific checks would go here
    // For now, just return based on tier
    return { hasAccess: true, tier, status, expiresAt };
  },
});

// Get expiry notifications for user
export const getExpiryNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notifications = await ctx.db
      .query("subscriptionNotifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("dismissed"), false))
      .order("desc")
      .take(10);

    return notifications;
  },
});

// Get payment history
export const getPaymentHistory = query({
  args: {
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: null };

    const limit = args.paginationOpts ? Math.min(args.paginationOpts.numItems, 50) : 20;

    const queryBuilder = ctx.db
      .query("subscriptionPayments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc");

    return await queryBuilder.paginate({
      numItems: limit,
      cursor: args.paginationOpts?.cursor ?? null,
    });
  },
});

// Get donation history for current user
export const getDonationHistory = query({
  args: {
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: null };

    const limit = args.paginationOpts ? Math.min(args.paginationOpts.numItems, 50) : 20;

    const queryBuilder = ctx.db
      .query("donations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc");

    return await queryBuilder.paginate({
      numItems: limit,
      cursor: args.paginationOpts?.cursor ?? null,
    });
  },
});

// Create or update subscription
export const createOrUpdateSubscription = mutation({
  args: {
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("pro_plus")),
    expiresAt: v.number(),
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const months = args.months || 1;

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        tier: args.tier,
        expiresAt: args.expiresAt,
        status: args.expiresAt > Date.now() ? "active" : "expired",
        lastPaymentAt: Date.now(),
        totalMonthsPaid: existing.totalMonthsPaid + months,
      });
      return existing._id;
    } else {
      // Create new subscription
      const subscriptionId = await ctx.db.insert("subscriptions", {
        userId,
        tier: args.tier,
        status: args.expiresAt > Date.now() ? "active" : "expired",
        expiresAt: args.expiresAt,
        gracePeriodEndsAt: args.expiresAt > Date.now() ? args.expiresAt + 2 * 24 * 60 * 60 * 1000 : undefined,
        createdAt: Date.now(),
        lastPaymentAt: Date.now(),
        totalMonthsPaid: months,
      });
      return subscriptionId;
    }
  },
});

// Extend subscription when payment succeeds (public mutation)
export const extendSubscription = mutation({
  args: {
    paymongoPaymentId: v.string(),
    months: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    newExpiresAt: v.number(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; newExpiresAt: number }> => {
    const result = await ctx.runMutation(internal.subscriptions.extendSubscriptionInternal, args) as { success: boolean; newExpiresAt: number };
    return result;
  },
});

// Internal mutation to extend subscription (used by webhook)
export const extendSubscriptionInternal = internalMutation({
  args: {
    paymongoPaymentId: v.string(),
    months: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    newExpiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    // Find payment record by payment ID
    let payment = await ctx.db
      .query("subscriptionPayments")
      .withIndex("by_paymongo_payment_id", (q) => q.eq("paymongoPaymentId", args.paymongoPaymentId))
      .unique();

    // If not found, try finding by payment intent ID (fallback)
    if (!payment) {
      payment = await ctx.db
        .query("subscriptionPayments")
        .filter((q) => q.eq(q.field("paymongoPaymentIntentId"), args.paymongoPaymentId))
        .first();
    }

    if (!payment) {
      throw new Error(`Payment record not found for PayMongo ID: ${args.paymongoPaymentId}`);
    }

    if (payment.status !== "pending") {
      throw new Error("Payment already processed");
    }

    // Get user's subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", payment.userId))
      .unique();

    const currentExpiresAt = subscription?.expiresAt || null;
    const newExpiresAt = calculateExpiryDate(currentExpiresAt, args.months);

    // Update subscription
    if (subscription) {
      await ctx.db.patch(subscription._id, {
        tier: payment.tier,
        expiresAt: newExpiresAt,
        status: "active",
        lastPaymentAt: Date.now(),
        totalMonthsPaid: subscription.totalMonthsPaid + args.months,
        gracePeriodEndsAt: newExpiresAt + 2 * 24 * 60 * 60 * 1000,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: payment.userId,
        tier: payment.tier,
        status: "active",
        expiresAt: newExpiresAt,
        gracePeriodEndsAt: newExpiresAt + 2 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        lastPaymentAt: Date.now(),
        totalMonthsPaid: args.months,
      });
    }

    // Update payment record
    await ctx.db.patch(payment._id, {
      status: "succeeded",
      expiresAtAfter: newExpiresAt,
    });

    return { success: true, newExpiresAt };
  },
});

// Update subscription status based on expiry
export const updateSubscriptionStatus = internalMutation({
  args: {
    subscriptionId: v.id("subscriptions"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get("subscriptions", args.subscriptionId);
    if (!subscription) return;

    const now = Date.now();
    const { expiresAt, gracePeriodEndsAt, status } = subscription;

    if (status === "canceled") return;

    if (expiresAt && expiresAt < now) {
      if (gracePeriodEndsAt && gracePeriodEndsAt > now) {
        // In grace period
        if (status !== "grace_period") {
          await ctx.db.patch(args.subscriptionId, { status: "grace_period" });
        }
      } else {
        // Expired
        if (status !== "expired") {
          await ctx.db.patch(args.subscriptionId, { status: "expired" });
        }
      }
    } else if (expiresAt && expiresAt > now && status !== "active") {
      // Active
      await ctx.db.patch(args.subscriptionId, { status: "active" });
    }
  },
});

// Cancel subscription
export const cancelSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(subscription._id, {
      status: "canceled",
    });

    return { success: true };
  },
});

// Increment usage counter
export const incrementUsage = mutation({
  args: {
    usageType: v.union(v.literal("privateLobbiesCreated"), v.literal("aiReplaysSaved")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const today = new Date().toISOString().split("T")[0];

    const usage = await ctx.db
      .query("subscriptionUsage")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", today))
      .unique();

    if (usage) {
      const newValue = usage[args.usageType] + 1;
      await ctx.db.patch(usage._id, {
        [args.usageType]: newValue,
      });
      return newValue;
    } else {
      const newUsage = {
        userId,
        date: today,
        privateLobbiesCreated: args.usageType === "privateLobbiesCreated" ? 1 : 0,
        aiReplaysSaved: args.usageType === "aiReplaysSaved" ? 1 : 0,
        lastResetAt: Date.now(),
      };
      await ctx.db.insert("subscriptionUsage", newUsage);
      return newUsage[args.usageType];
    }
  },
});

// Reset daily usage (called by cron)
export const resetDailyUsage = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete old usage records (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const oldUsage = await ctx.db
      .query("subscriptionUsage")
      .withIndex("by_date", (q) => q.lt("date", sevenDaysAgoStr))
      .collect();

    for (const usage of oldUsage) {
      await ctx.db.delete(usage._id);
    }
  },
});

// Mark notification as read
export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("subscriptionNotifications"),
    dismissed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get("subscriptionNotifications", args.notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, {
      readAt: Date.now(),
      dismissed: args.dismissed ?? false,
    });

    return { success: true };
  },
});

// Create PayMongo payment intent for subscription extension
export const createPayMongoPayment = action({
  args: {
    tier: v.union(v.literal("pro"), v.literal("pro_plus")),
    months: v.optional(v.number()), // Default 1 month
  },
  returns: v.object({
    paymentId: v.id("subscriptionPayments"),
    checkoutUrl: v.string(),
    sessionId: v.string(),
    amount: v.number(),
    tier: v.union(v.literal("pro"), v.literal("pro_plus")),
    months: v.number(),
    currentExpiresAt: v.union(v.number(), v.null()),
    newExpiresAt: v.number(),
  }),
  handler: async (ctx, args): Promise<{
    paymentId: Id<"subscriptionPayments">;
    checkoutUrl: string;
    sessionId: string;
    amount: number;
    tier: "pro" | "pro_plus";
    months: number;
    currentExpiresAt: number | null;
    newExpiresAt: number;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const months = args.months || 1;
    const { discountedPrice: amount } = calculateDiscountedPrice(args.tier, months); // Amount in centavos (with discount applied)

    // Get current subscription to calculate new expiry
    const subscription = await ctx.runQuery(internal.subscriptions.getCurrentSubscriptionForAction, { userId });

    const currentExpiresAt = subscription?.expiresAt || null;
    const newExpiresAt = calculateExpiryDate(currentExpiresAt, months);

    // Get user information for billing details
    const user = await ctx.runQuery(internal.subscriptions.getUserForDonation, { userId });
    if (!user) throw new Error("User not found");

    // Create payment record
    const paymentId = await ctx.runMutation(internal.subscriptions.createPaymentRecord, {
      userId,
      tier: args.tier,
      amount,
      months,
      expiresAtBefore: currentExpiresAt || Date.now(),
      expiresAtAfter: newExpiresAt,
    });

    // Get the current origin for success/cancel URLs
    const origin = (ctx as any).request?.headers?.get("origin") || process.env.VITE_APP_URL || "http://localhost:5173";
    const successUrl = `${origin}/subscription?subscription=success`;
    const cancelUrl = `${origin}/subscription?subscription=cancelled`;

    // Create PayMongo checkout session
    const description = `${args.tier === "pro" ? "Pro" : "Pro+"} (${months} month${months > 1 ? "s" : ""})`;
    const customerName = user.username || user.name || "Customer";
    const customerEmail = user.email;

    const checkoutResult = await ctx.runAction(api.paymongo.createSubscriptionCheckout, {
      amount,
      description,
      successUrl,
      cancelUrl,
      metadata: {
        userId: userId.toString(),
        tier: args.tier,
        months,
        paymentId: paymentId.toString(),
        currentExpiresAt: currentExpiresAt || 0,
        newExpiresAt,
      },
      customerName: customerEmail ? customerName : undefined,
      customerEmail: customerEmail || undefined,
    });

    if (!checkoutResult.success) {
      throw new Error(checkoutResult.error || "Failed to create checkout session");
    }

    // Update payment record with PayMongo session ID
    await ctx.runMutation(internal.subscriptions.updatePaymentRecordWithPayMongoIds, {
      paymentId,
      paymongoPaymentId: checkoutResult.sessionId,
      paymongoPaymentIntentId: checkoutResult.sessionId,
    });

    return {
      paymentId,
      checkoutUrl: checkoutResult.checkoutUrl,
      sessionId: checkoutResult.sessionId,
      amount,
      tier: args.tier,
      months,
      currentExpiresAt,
      newExpiresAt,
    };
  },
});

// Create PayMongo payment intent for donation
export const createPayMongoDonation = action({
  args: {
    amount: v.number(), // Amount in PHP (will be converted to centavos)
  },
  returns: v.object({
    donationId: v.id("donations"),
    checkoutUrl: v.string(),
    sessionId: v.string(),
    amount: v.number(),
  }),
  handler: async (ctx, args): Promise<{
    donationId: Id<"donations">;
    checkoutUrl: string;
    sessionId: string;
    amount: number;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const amountInCentavos = args.amount * 100;

    // Get user information for billing details
    const user = await ctx.runQuery(internal.subscriptions.getUserForDonation, { userId });
    if (!user) throw new Error("User not found");

    // Create donation record
    const donationId = await ctx.runMutation(internal.subscriptions.createDonationRecord, {
      userId,
      amount: amountInCentavos,
    });

    // Get the current origin for success/cancel URLs
    const origin = (ctx as any).request?.headers?.get("origin") || process.env.VITE_APP_URL || "http://localhost:5173";
    const successUrl = `${origin}/pricing?donation=success`;
    const cancelUrl = `${origin}/pricing?donation=cancelled`;

    // Create PayMongo checkout session with customer information
    const description = `Donation - ₱${args.amount}`;
    const customerName = user.username || user.name || "Customer";
    const customerEmail = user.email;

    const checkoutResult = await ctx.runAction(api.paymongo.createDonationCheckout, {
      amount: amountInCentavos,
      description,
      successUrl,
      cancelUrl,
      metadata: {
        userId: userId.toString(),
        donationId: donationId.toString(),
        amount: args.amount,
      },
      customerName: customerEmail ? customerName : undefined,
      customerEmail: customerEmail || undefined,
    });

    if (!checkoutResult.success) {
      throw new Error(checkoutResult.error || "Failed to create checkout session");
    }

    // Update donation record with PayMongo session ID
    await ctx.runMutation(internal.subscriptions.updateDonationRecordWithPayMongoId, {
      donationId,
      paymongoPaymentId: checkoutResult.sessionId,
    });

    return {
      donationId,
      checkoutUrl: checkoutResult.checkoutUrl,
      sessionId: checkoutResult.sessionId,
      amount: amountInCentavos,
    };
  },
});

// Internal query to get subscription for action
export const getCurrentSubscriptionForAction = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

// Internal mutation to create payment record
export const createPaymentRecord = internalMutation({
  args: {
    userId: v.id("users"),
    tier: v.union(v.literal("pro"), v.literal("pro_plus")),
    amount: v.number(),
    months: v.number(),
    expiresAtBefore: v.number(),
    expiresAtAfter: v.number(),
  },
  handler: async (ctx, args) => {
    const paymentId = await ctx.db.insert("subscriptionPayments", {
      userId: args.userId,
      tier: args.tier,
      amount: args.amount,
      months: args.months,
      paymongoPaymentId: "", // Will be set when payment intent is created
      paymongoPaymentIntentId: "", // Will be set when payment intent is created
      status: "pending",
      expiresAtBefore: args.expiresAtBefore,
      expiresAtAfter: args.expiresAtAfter,
      createdAt: Date.now(),
    });
    return paymentId;
  },
});

// Internal mutation to create donation record
export const createDonationRecord = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const donationId = await ctx.db.insert("donations", {
      userId: args.userId,
      amount: args.amount,
      paymongoPaymentId: "", // Will be set when payment intent is created
      status: "pending",
      createdAt: Date.now(),
    });
    return donationId;
  },
});

// Internal mutation to update payment record with PayMongo IDs
export const updatePaymentRecordWithPayMongoIds = internalMutation({
  args: {
    paymentId: v.id("subscriptionPayments"),
    paymongoPaymentId: v.string(),
    paymongoPaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      paymongoPaymentId: args.paymongoPaymentId,
      paymongoPaymentIntentId: args.paymongoPaymentIntentId,
    });
  },
});

// Internal mutation to update donation record with PayMongo ID
export const updateDonationRecordWithPayMongoId = internalMutation({
  args: {
    donationId: v.id("donations"),
    paymongoPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.donationId, {
      paymongoPaymentId: args.paymongoPaymentId,
    });
  },
});

// Check and update expired subscriptions (called by cron)
export const checkAndUpdateExpiredSubscriptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_expires_at", (q) => q.lte("expiresAt", now))
      .filter((q) => q.neq(q.field("status"), "canceled"))
      .take(100);

    for (const subscription of expiredSubscriptions) {
      await ctx.runMutation(internal.subscriptions.updateSubscriptionStatus, {
        subscriptionId: subscription._id,
      });
    }
  },
});

// Send expiry notifications (called by cron)
export const sendExpiryNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_expires_at")
      .filter((q) => q.neq(q.field("status"), "canceled"))
      .take(1000);

    for (const subscription of subscriptions) {
      if (!subscription.expiresAt) continue;

      const daysUntilExpiry = getDaysUntilExpiry(subscription.expiresAt);
      let notificationType: string | null = null;

      if (daysUntilExpiry === 7) {
        notificationType = "expiry_warning_7d";
      } else if (daysUntilExpiry === 3) {
        notificationType = "expiry_warning_3d";
      } else if (daysUntilExpiry === 1) {
        notificationType = "expiry_warning_1d";
      } else if (daysUntilExpiry === 0) {
        notificationType = "expiry_today";
      } else if (daysUntilExpiry < 0 && subscription.status === "expired") {
        notificationType = "expired";
      }

      type SubscriptionNotificationType = Doc<"subscriptionNotifications">["type"];

      if (notificationType) {
        // Check if notification already sent
        const existing = await ctx.db
          .query("subscriptionNotifications")
          .withIndex("by_user_type", (q) => q.eq("userId", subscription.userId).eq("type", notificationType as SubscriptionNotificationType))
          .filter((q) => q.eq(q.field("expiresAt"), subscription.expiresAt))
          .first();

        if (!existing) {
          await ctx.db.insert("subscriptionNotifications", {
            userId: subscription.userId,
            type: notificationType as SubscriptionNotificationType,
            expiresAt: subscription.expiresAt,
            sentAt: Date.now(),
            dismissed: false,
          });
        }
      }
    }
  },
});

// Internal query to find payment by PayMongo ID
export const findPaymentByPayMongoId = internalQuery({
  args: {
    paymongoPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptionPayments")
      .withIndex("by_paymongo_payment_id", (q) => q.eq("paymongoPaymentId", args.paymongoPaymentId))
      .unique();
  },
});

// Internal query to find payment by PayMongo payment intent ID
export const findPaymentByPayMongoIntentId = internalQuery({
  args: {
    paymongoPaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Note: No index for payment intent ID, so we use filter
    // This should be optimized with an index if this becomes a common query pattern
    return await ctx.db
      .query("subscriptionPayments")
      .filter((q) => q.eq(q.field("paymongoPaymentIntentId"), args.paymongoPaymentIntentId))
      .first();
  },
});

// Internal query to find donation by PayMongo ID
export const findDonationByPayMongoId = internalQuery({
  args: {
    paymongoPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("donations")
      .withIndex("by_paymongo_payment_id", (q) => q.eq("paymongoPaymentId", args.paymongoPaymentId))
      .unique();
  },
});

// Internal query to get donation by ID
export const getDonationById = internalQuery({
  args: {
    donationId: v.id("donations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get("donations", args.donationId);
  },
});

// Internal query to get user information for donation checkout
export const getUserForDonation = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);
    if (!user) return null;

    // Get user profile for username
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    return {
      email: user.email,
      name: user.name,
      username: profile?.username,
    };
  },
});

// Internal query to get payment by ID
export const getPaymentById = internalQuery({
  args: {
    paymentId: v.id("subscriptionPayments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get("subscriptionPayments", args.paymentId);
  },
});

// Internal mutation to update payment status
export const updatePaymentStatus = internalMutation({
  args: {
    paymentId: v.id("subscriptionPayments"),
    status: v.union(v.literal("pending"), v.literal("succeeded"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.paymentId, {
      status: args.status,
    });
  },
});

// Internal mutation to update donation status
export const updateDonationStatus = internalMutation({
  args: {
    donationId: v.id("donations"),
    status: v.union(v.literal("pending"), v.literal("succeeded"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.donationId, {
      status: args.status,
    });
  },
});

// Internal mutation to update donor status on profile
export const updateDonorStatus = internalMutation({
  args: {
    userId: v.id("users"),
    donationAmount: v.number(), // Amount in centavos
  },
  handler: async (ctx, args) => {
    // Get user's profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      console.warn(`[Donor Status] Profile not found for user ${args.userId}`);
      return;
    }

    // Update donor status and total donated
    const currentTotal = profile.totalDonated || 0;
    const newTotal = currentTotal + args.donationAmount;

    await ctx.db.patch(profile._id, {
      isDonor: true,
      totalDonated: newTotal,
    });

    console.log(`[Donor Status] Updated profile ${profile._id}: isDonor=true, totalDonated=${newTotal} (added ${args.donationAmount})`);
  },
});

// Internal action query to check if webhook event was processed
export const checkWebhookEvent = internalQuery({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .unique();
    return !!existing;
  },
});

// Internal action mutation to record processed webhook event
export const recordWebhookEvent = internalMutation({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      eventId: args.eventId,
      processedAt: Date.now(),
    });
  },
});
