import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { isSubscriptionActive } from "./featureGating";

// List comments for an announcement
export const list = query({
  args: {
    announcementId: v.id("announcements"),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_announcement_created", (q) => 
        q.eq("announcementId", args.announcementId)
      )
      .order("asc")
      .collect();

    // Enrich comments with user profile data
    const commentsWithProfiles = await Promise.all(
      comments.map(async (comment) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", comment.userId))
          .unique();

        if (!profile) return { ...comment, author: null };

        const [subscription, customization] = await Promise.all([
          ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", comment.userId))
            .first(),
          ctx.db
            .query("userCustomizations")
            .withIndex("by_user", (q) => q.eq("userId", comment.userId))
            .first(),
        ]);

        const isActive = subscription
          ? isSubscriptionActive(subscription.status, subscription.expiresAt, subscription.gracePeriodEndsAt || null)
          : true;

        return {
          ...comment,
          author: {
            username: profile.username,
            avatarUrl: profile.avatarUrl,
            rank: profile.rank,
            tier: isActive ? (subscription?.tier || "free") : "free",
            usernameColor: customization?.usernameColor,
            avatarFrame: customization?.avatarFrame,
            showBadges: customization?.showBadges ?? true,
            isDonor: profile.isDonor ?? false,
          },
        };
      })
    );

    return commentsWithProfiles;
  },
});

// Create a new comment
export const create = mutation({
  args: {
    announcementId: v.id("announcements"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) {
      throw new Error("Announcement not found");
    }

    const now = Date.now();

    // Create comment
    const commentId = await ctx.db.insert("comments", {
      announcementId: args.announcementId,
      userId,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });

    // Increment comment count
    const currentCount = announcement.commentCount || 0;
    await ctx.db.patch(args.announcementId, {
      commentCount: currentCount + 1,
    });

    return commentId;
  },
});

// Update a comment
export const update = mutation({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
    });

    return args.commentId;
  },
});

// Delete a comment
export const remove = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if user is author OR admin
    let isAuthorized = comment.userId === userId;

    if (!isAuthorized) {
      // Check admin status
      const isAdmin = await ctx.runQuery(internal.announcements.checkAdminAccess, {});
      if (isAdmin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new Error("Unauthorized");
    }

    // Delete comment
    await ctx.db.delete(args.commentId);

    // Decrement comment count
    const announcement = await ctx.db.get(comment.announcementId);
    if (announcement) {
      const currentCount = announcement.commentCount || 0;
      await ctx.db.patch(comment.announcementId, {
        commentCount: Math.max(0, currentCount - 1),
      });
    }

    return args.commentId;
  },
});
