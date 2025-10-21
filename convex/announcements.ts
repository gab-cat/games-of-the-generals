import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// List announcements - pinned items first, then 5 most recent
export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    // Get all pinned announcements first (ordered by creation time, newest first)
    const pinnedAnnouncements = await ctx.db
      .query("announcements")
      .withIndex("by_pinned_created", (q) => q.eq("isPinned", true))
      .order("desc")
      .collect();

    // Get up to 5 most recent non-pinned announcements
    const recentAnnouncements = await ctx.db
      .query("announcements")
      .withIndex("by_pinned_created", (q) => q.eq("isPinned", false))
      .order("desc")
      .take(5);

    // Combine pinned and recent announcements
    return [...pinnedAnnouncements, ...recentAnnouncements];
  },
});

// Check if current user has admin/moderator access
export const checkAdminAccess = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile?.adminRole === "admin" || profile?.adminRole === "moderator";
  },
});

// Create a new announcement (admin/moderator only)
export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    isPinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check admin access
    const isAdmin = await ctx.runQuery(internal.announcements.checkAdminAccess, {});
    if (!isAdmin) {
      throw new Error("Insufficient permissions");
    }

    // Get user profile for username
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const now = Date.now();

    return await ctx.db.insert("announcements", {
      title: args.title,
      content: args.content,
      isPinned: args.isPinned,
      createdBy: userId,
      createdByUsername: profile.username,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an announcement (admin/moderator only)
export const updateAnnouncement = mutation({
  args: {
    id: v.id("announcements"),
    title: v.string(),
    content: v.string(),
    isPinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check admin access
    const isAdmin = await ctx.runQuery(internal.announcements.checkAdminAccess, {});
    if (!isAdmin) {
      throw new Error("Insufficient permissions");
    }

    // Verify announcement exists
    const existingAnnouncement = await ctx.db.get(args.id);
    if (!existingAnnouncement) {
      throw new Error("Announcement not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      title: args.title,
      content: args.content,
      isPinned: args.isPinned,
      updatedAt: now,
    });

    return args.id;
  },
});

// Delete an announcement (admin/moderator only)
export const deleteAnnouncement = mutation({
  args: {
    id: v.id("announcements"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check admin access
    const isAdmin = await ctx.runQuery(internal.announcements.checkAdminAccess, {});
    if (!isAdmin) {
      throw new Error("Insufficient permissions");
    }

    // Verify announcement exists
    const existingAnnouncement = await ctx.db.get(args.id);
    if (!existingAnnouncement) {
      throw new Error("Announcement not found");
    }

    await ctx.db.delete(args.id);

    return args.id;
  },
});

// Get all announcements for admin management (admin/moderator only)
export const listAllAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check admin access
    const isAdmin = await ctx.runQuery(internal.announcements.checkAdminAccess, {});
    if (!isAdmin) {
      throw new Error("Insufficient permissions");
    }

    // Get all announcements ordered by creation time (newest first)
    return await ctx.db
      .query("announcements")
      .withIndex("by_created_at")
      .order("desc")
      .collect();
  },
});
