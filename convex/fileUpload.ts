import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getSubscriptionContext } from "./helpers/subscriptionHelpers";

// Generate upload URL for avatar images (Generic/Legacy)
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

// Gated upload URL specifically for avatars - checks Pro/Donor status early
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Proactively check entitlement before generating URL
    const [profile, subCtx] = await Promise.all([
      ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique(),
      getSubscriptionContext(ctx, userId),
    ]);

    if (!profile) throw new Error("Profile not found");

    const isDonor = profile.isDonor ?? false;
    const isAdmin = profile.adminRole === "admin" || profile.adminRole === "moderator";
    const canUpload = subCtx.tier !== "free" || isDonor || isAdmin;

    if (!canUpload) {
      throw new Error(
        "Custom avatar upload is only available for Pro subscribers and Donors. Upgrade or contribute to unlock this feature.",
      );
    }

    if (subCtx.tier !== "free" && !subCtx.isActive && !isDonor && !isAdmin) {
      throw new Error(
        "Your Pro subscription has expired. Please renew to upload custom avatars.",
      );
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Get file URL from storage ID
export const getFileUrl = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.storage.getUrl(args.storageId);
  },
});

// Delete old avatar file from storage
export const deleteFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.storage.delete(args.storageId);
  },
});

// Process uploaded avatar and return URL
export const processAvatarUpload = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the file URL from storage
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    
    return {
      storageId: args.storageId,
      fileUrl,
    };
  },
});