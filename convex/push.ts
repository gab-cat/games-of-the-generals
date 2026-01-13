import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const subscriptionSchema = v.object({
  endpoint: v.string(),
  keys: v.object({
    p256dh: v.string(),
    auth: v.string(),
  }),
  expirationTime: v.optional(v.number()),
  userAgent: v.optional(v.string()),
});

export const saveSubscription = mutation({
  args: { subscription: subscriptionSchema },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Deduplicate by endpoint
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.subscription.endpoint))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId,
        keys: args.subscription.keys,
        expirationTime: args.subscription.expirationTime,
        userAgent: args.subscription.userAgent,
        failureReason: undefined,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId,
      endpoint: args.subscription.endpoint,
      keys: args.subscription.keys,
      expirationTime: args.subscription.expirationTime,
      userAgent: args.subscription.userAgent,
      createdAt: Date.now(),
    });
  },
});

export const removeSubscriptionByEndpoint = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (!existing) return { removed: false };
    if (existing.userId !== userId) return { removed: false };
    await ctx.db.delete(existing._id);
    return { removed: true };
  },
});

export const getSubscriptionsForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    // OPTIMIZED: Added limit to prevent excessive document scanning
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(10); // Reasonable limit - users rarely have >10 devices
  },
});

// Internal helper: get a user's push subscriptions
export const getSubscriptionsForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // OPTIMIZED: Added limit to prevent excessive document scanning
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(10); // Reasonable limit - users rarely have >10 devices
  },
});

// Internal helper: get message by id
export const getMessageById = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.get("messages", args.messageId);
  },
});

// Internal helper: get global chat message by id
export const getGlobalChatMessageById = internalQuery({
  args: { messageId: v.id("globalChat") },
  handler: async (ctx, args) => {
    return await ctx.db.get("globalChat", args.messageId);
  },
});

// Internal helper: get mentions by message id
export const getMentionsByMessage = internalQuery({
  args: { messageId: v.id("globalChat") },
  handler: async (ctx, args) => {
    // OPTIMIZED: Added limit to prevent excessive document scanning
    return await ctx.db
      .query("chatMentions")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .take(50); // Reasonable limit - messages rarely have >50 mentions
  },
});

// Internal mutations to mark push results
export const markPushSuccess = internalMutation({
  args: { subscriptionId: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, { lastSuccessAt: Date.now(), failureReason: undefined });
  },
});

export const markPushFailure = internalMutation({
  args: { subscriptionId: v.id("pushSubscriptions"), reason: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, { lastFailureAt: Date.now(), failureReason: args.reason });
  },
});

export const deleteSubscriptionById = internalMutation({
  args: { subscriptionId: v.id("pushSubscriptions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.subscriptionId);
  },
});

