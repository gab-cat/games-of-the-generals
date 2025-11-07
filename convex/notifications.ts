import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Notification action types
export type NotificationAction = "replied" | "opened" | "closed" | "status_changed" | "messaged";

/**
 * Ensure a user has a "Notifications" conversation (system conversation)
 * Creates it if it doesn't exist
 */
export const ensureNotificationConversation = internalMutation({
  args: {
    userId: v.id("users"),
    username: v.string(),
  },
  returns: v.id("conversations"),
  handler: async (ctx, args) => {
    // Check if user already has a notification conversation
    const existingConversation = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.and(
          q.eq(q.field("participant1Id"), args.userId),
          q.eq(q.field("participant2Id"), args.userId), // Same user ID for system conversation
          q.eq(q.field("isSystemNotification"), true)
        )
      )
      .first();

    if (existingConversation) {
      return existingConversation._id;
    }

    // Create system notification conversation
    const conversationId = await ctx.db.insert("conversations", {
      participant1Id: args.userId,
      participant1Username: args.username,
      participant2Id: args.userId, // Same user for system conversation
      participant2Username: "Notifications", // System name
      lastMessageAt: Date.now(),
      participant1UnreadCount: 0,
      participant2UnreadCount: 0,
      createdAt: Date.now(),
      isSystemNotification: true,
    });

    // Create initial welcome message
    await ctx.db.insert("messages", {
      senderId: args.userId,
      senderUsername: "System",
      recipientId: args.userId,
      recipientUsername: args.username,
      content: "Welcome to your notifications! You'll receive updates about your support tickets here.",
      messageType: "text",
      timestamp: Date.now(),
      readAt: Date.now(), // Mark as read since it's a welcome message
    });

    return conversationId;
  },
});

/**
 * Send a notification to a user
 * Creates a notification record and message in their notification conversation
 */
export const sendNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("ticket_update")),
    ticketId: v.optional(v.id("supportTickets")),
    action: v.union(
      v.literal("replied"),
      v.literal("opened"),
      v.literal("closed"),
      v.literal("status_changed"),
      v.literal("messaged")
    ),
    message: v.string(),
    ticketLink: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Create notification record
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      ticketId: args.ticketId,
      action: args.action,
      message: args.message,
      ticketLink: args.ticketLink,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    // Ensure user has notification conversation
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const conversationId = await ctx.runMutation(internal.notifications.ensureNotificationConversation, {
      userId: args.userId,
      username: user.name || "Anonymous",
    });

    // Create notification message in conversation
    const notificationMessage = args.ticketLink
      ? `${args.message}\n\nTicket: ${args.ticketLink}`
      : args.message;

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      senderId: args.userId,
      senderUsername: "Notifications",
      recipientId: args.userId,
      recipientUsername: user.name || "Anonymous",
      content: notificationMessage,
      messageType: "text",
      timestamp: now,
      // Leave unread for user to see
    });

    // Update conversation metadata with last message reference
    const conversation = await ctx.db.get(conversationId);
    if (conversation) {
      // For notification conversations, both participants are the same user,
      // so only increment one unread count to avoid double counting
      const isNotificationConversation = conversation.participant1Id === conversation.participant2Id;

      await ctx.db.patch(conversationId, {
        lastMessageId: messageId,
        lastMessageAt: now,
        participant1UnreadCount: conversation.participant1UnreadCount + 1,
        participant2UnreadCount: isNotificationConversation
          ? conversation.participant2UnreadCount // Don't increment for notification conversations
          : conversation.participant2UnreadCount + 1,
      });
    }
  },
});

/**
 * Get a user's notification conversation
 */
export const getNotificationConversation = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("conversations"),
      participant1Id: v.id("users"),
      participant1Username: v.string(),
      participant2Id: v.id("users"),
      participant2Username: v.string(),
      lastMessageId: v.optional(v.id("messages")),
      lastMessageAt: v.number(),
      participant1LastRead: v.optional(v.number()),
      participant2LastRead: v.optional(v.number()),
      participant1TypingAt: v.optional(v.number()),
      participant2TypingAt: v.optional(v.number()),
      participant1UnreadCount: v.number(),
      participant2UnreadCount: v.number(),
      createdAt: v.number(),
      isSystemNotification: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .filter((q) =>
        q.and(
          q.eq(q.field("participant1Id"), args.userId),
          q.eq(q.field("participant2Id"), args.userId),
          q.eq(q.field("isSystemNotification"), true)
        )
      )
      .first();
  },
});

/**
 * Get recent notifications for a user (for potential future use)
 */
export const getRecentNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("notifications"),
    type: v.string(),
    ticketId: v.optional(v.id("supportTickets")),
    action: v.string(),
    message: v.string(),
    ticketLink: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Delete expired notifications (internal cleanup function)
 */
export const deleteExpiredNotifications = internalMutation({
  args: {},
  returns: v.number(), // Number of notifications deleted
  handler: async (ctx, _args) => {
    const now = Date.now();
    // OPTIMIZED: Added limit and batch processing to prevent excessive document scanning
    const BATCH_SIZE = 100;
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const expiredNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_expires_at")
        .filter((q) => q.lt(q.field("expiresAt"), now))
        .take(BATCH_SIZE);

      if (expiredNotifications.length === 0) {
        hasMore = false;
        break;
      }

      // Delete batch
      await Promise.all(
        expiredNotifications.map(notification => ctx.db.delete(notification._id))
      );

      totalDeleted += expiredNotifications.length;

      // If we got less than batch size, we're done
      if (expiredNotifications.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    return totalDeleted;
  },
});

/**
 * Reset notification counter for a specific user
 * Sets unread count to 0 for the user's notification conversation
 */
export const resetNotificationCounter = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Find the notification conversation for this user
    const notificationConversation = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.and(
          q.eq(q.field("participant1Id"), args.userId),
          q.eq(q.field("participant2Id"), args.userId), // Same user ID for system conversation
          q.eq(q.field("isSystemNotification"), true)
        )
      )
      .first();

    if (!notificationConversation) {
      // No notification conversation found for this user
      return false;
    }

    // Reset the unread count for the notification conversation
    await ctx.db.patch(notificationConversation._id, {
      participant1UnreadCount: 0,
      participant2UnreadCount: 0, // Also reset this for consistency
    });

    return true;
  },
});
