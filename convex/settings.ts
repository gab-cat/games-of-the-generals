import { mutation, query, action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId, retrieveAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Change password - proper implementation using Convex Auth
export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate new password
    if (args.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(args.newPassword)) {
      throw new Error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
    }

    // Get the user record to get their email via an internal query
    const user = await ctx.runQuery(internal.settings.getUserForPasswordChange, { userId });
    if (!user) throw new Error("User not found");

    if (!user.email) {
      throw new Error("No email address associated with this account");
    }

    try {
      // First, verify the current password by attempting to retrieve the account with current credentials
      const accountVerification = await retrieveAccount(ctx, {
        provider: "password",
        account: { 
          id: user.email, 
          secret: args.currentPassword 
        },
      });

      if (!accountVerification) {
        throw new Error("Current password is incorrect");
      }

      // If verification succeeds, update the password
      await modifyAccountCredentials(ctx, {
        provider: "password",
        account: {
          id: user.email,
          secret: args.newPassword,
        },
      });

      return { 
        success: true, 
        message: "Password changed successfully" 
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Invalid credentials") || error.message.includes("Current password is incorrect")) {
          throw new Error("Current password is incorrect");
        }
        throw error;
      }
      throw new Error("Failed to change password");
    }
  },
});

// Helper internal query to get user data for password change
export const getUserForPasswordChange = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user settings
export const getUserSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    return {
      email: user.email,
      hasPassword: !!user.email, // Has password if has email
      isAnonymous: user.isAnonymous ?? false,
    };
  },
});

// Request email change verification
export const requestEmailChange = action({
  args: {
    newEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.newEmail)) {
      throw new Error("Please enter a valid email address");
    }

    // Get current user
    const user = await ctx.runQuery(internal.settings.getUserForPasswordChange, { userId });
    if (!user) throw new Error("User not found");

    // Check if new email is same as current
    if (user.email === args.newEmail) {
      throw new Error("New email must be different from current email");
    }

    // Check if new email is already in use by another user
    const existingUser = await ctx.runQuery(internal.settings.checkEmailExists, { email: args.newEmail });
    if (existingUser) {
      throw new Error("This email is already associated with another account");
    }

    // Generate verification code and send email
    let verificationCode: string;
    if (!user.email) {
      throw new Error("No email address associated with this account");
    }
    
    try {
      verificationCode = await ctx.runAction(internal.ResendEmailChangeVerification.sendEmailChangeVerification, {
        currentEmail: user.email,
        newEmail: args.newEmail,
      });
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new Error("Failed to send verification email. Please try again.");
    }

    // Set expiration to 10 minutes from now
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Delete any existing verification requests for this user and create new one
    await ctx.runMutation(internal.settings.createEmailChangeVerification, {
      userId,
      currentEmail: user.email,
      newEmail: args.newEmail,
      verificationCode,
      expiresAt,
    });

    return { 
      success: true, 
      message: "Verification code sent to your current email address. Please check your inbox." 
    };
  },
});

// Verify email change
export const verifyEmailChange = mutation({
  args: {
    verificationCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the verification record
    const verification = await ctx.db
      .query("emailChangeVerifications")
      .withIndex("by_code", (q) => q.eq("verificationCode", args.verificationCode))
      .unique();

    if (!verification) {
      throw new Error("Invalid verification code");
    }

    if (verification.userId !== userId) {
      throw new Error("Verification code does not belong to current user");
    }

    if (verification.verified) {
      throw new Error("This verification code has already been used");
    }

    if (Date.now() > verification.expiresAt) {
      throw new Error("Verification code has expired. Please request a new one.");
    }

    // Check if new email is still available
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", verification.newEmail))
      .unique();

    if (existingUser) {
      throw new Error("This email is now associated with another account");
    }

    // Mark verification as used
    await ctx.db.patch(verification._id, {
      verified: true,
    });

    // Update user email
    await ctx.db.patch(userId, {
      email: verification.newEmail,
      emailVerificationTime: Date.now(), // Mark email as verified
    });

    // Clean up old verification records for this user
    const oldVerifications = await ctx.db
      .query("emailChangeVerifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const oldVerification of oldVerifications) {
      await ctx.db.delete(oldVerification._id);
    }

    return { 
      success: true, 
      message: "Email address updated successfully!" 
    };
  },
});

// Get pending email change request
export const getPendingEmailChange = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const verification = await ctx.db
      .query("emailChangeVerifications")
      .withIndex("by_user_verified", (q) => q.eq("userId", userId).eq("verified", false))
      .order("desc")
      .first();

    if (!verification) return null;

    // Check if expired
    if (Date.now() > verification.expiresAt) {
      return null; // Just return null, don't delete in a query
    }

    return {
      newEmail: verification.newEmail,
      expiresAt: verification.expiresAt,
      createdAt: verification.createdAt,
    };
  },
});

// Cancel pending email change request
export const cancelEmailChange = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Delete all pending verification records for this user
    const verifications = await ctx.db
      .query("emailChangeVerifications")
      .withIndex("by_user_verified", (q) => q.eq("userId", userId).eq("verified", false))
      .collect();

    for (const verification of verifications) {
      await ctx.db.delete(verification._id);
    }

    return { success: true };
  },
});

// Convert anonymous account to regular account
export const convertAnonymousAccount = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get current user
    const user = await ctx.runQuery(internal.settings.getUserForPasswordChange, { userId });
    if (!user) throw new Error("User not found");

    // Check if user is actually anonymous
    if (!user.isAnonymous) {
      throw new Error("Account is already converted");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Please enter a valid email address");
    }

    // Validate password
    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(args.password)) {
      throw new Error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
    }

    // Check if email is already in use
    const existingUser = await ctx.runQuery(internal.settings.checkEmailExists, { email: args.email });
    if (existingUser) {
      throw new Error("This email is already associated with another account");
    }

    try {
      // Add password credentials to the user
      await modifyAccountCredentials(ctx, {
        provider: "password",
        account: {
          id: args.email,
          secret: args.password,
        },
      });

      // Update user record to remove anonymous status and add email
      await ctx.runMutation(internal.settings.updateUserAfterConversion, {
        userId,
        email: args.email,
      });

      return { 
        success: true, 
        message: "Account converted successfully! You can now sign in with your email and password." 
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to convert account");
    }
  },
});

// Helper internal mutation to update user after conversion
export const updateUserAfterConversion = internalMutation({
  args: { 
    userId: v.id("users"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      email: args.email,
      isAnonymous: false,
      emailVerificationTime: Date.now(),
    });
  },
});

// Helper internal query to check if email exists
export const checkEmailExists = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
    return !!user;
  },
});

// Helper internal mutation to create email change verification
export const createEmailChangeVerification = internalMutation({
  args: {
    userId: v.id("users"),
    currentEmail: v.string(),
    newEmail: v.string(),
    verificationCode: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Delete any existing verification requests for this user
    const existingVerifications = await ctx.db
      .query("emailChangeVerifications")
      .withIndex("by_user_verified", (q) => q.eq("userId", args.userId).eq("verified", false))
      .collect();

    for (const verification of existingVerifications) {
      await ctx.db.delete(verification._id);
    }

    // Create new verification record
    await ctx.db.insert("emailChangeVerifications", {
      userId: args.userId,
      currentEmail: args.currentEmail,
      newEmail: args.newEmail,
      verificationCode: args.verificationCode,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
      verified: false,
    });
  },
});
