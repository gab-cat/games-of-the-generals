import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { profanity, CensorType } from "@2toad/profanity";
import { internal, api } from "./_generated/api";
// Simple hash function to replace crypto for spam detection
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Helper function to adjust color for readability on dark backgrounds
function adjustColorForReadability(color: string): string {
  // Remove # if present
  const hex = color.replace("#", "");

  // Ensure we have a valid 6-digit hex
  if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return "#ffffff"; // Return white for invalid colors
  }

  // Convert hex to RGB
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);

  // Calculate current luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If luminance is already good enough, return original color
  if (luminance > 0.6) {
    return "#" + hex;
  }

  // Calculate how much we need to brighten
  const targetLuminance = 0.7; // Slightly above threshold
  const brightnessMultiplier = targetLuminance / Math.max(luminance, 0.01);

  // Apply brightness multiplier
  r = Math.min(255, Math.round(r * brightnessMultiplier));
  g = Math.min(255, Math.round(g * brightnessMultiplier));
  b = Math.min(255, Math.round(b * brightnessMultiplier));

  // Convert back to hex
  const newHex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');

  return "#" + newHex;
}

// Helper function to format remaining time in a human-readable way
function formatRemainingTime(remainingMs: number): string {
  const seconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
}

// Helper function to get online users count and details
async function getOnlineUsersInfo(ctx: any): Promise<any[]> {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000; // 5 minutes ago

  const onlineProfiles = await ctx.db
    .query("profiles")
    .withIndex("by_online_last_seen", (q: any) =>
      q.eq("isOnline", true).gte("lastSeenAt", fiveMinutesAgo)
    )
    .take(100);

  return onlineProfiles;
}

// Handle chat commands
async function handleChatCommand(ctx: any, args: { message: string }, userId: Id<"users">, profile: any): Promise<any> {
  const message = args.message.trim();

  // Check if message is a command (starts with /)
  if (!message.startsWith('/')) {
    return null; // Not a command, handle as regular message
  }

  const commandParts = message.split(' ');
  const command = commandParts[0].toLowerCase();
  const commandArgs = commandParts.slice(1);

  let responseMessage = '';
  let isSystemMessage = false;

  switch (command) {
    case '/help':
      responseMessage = `# Available Commands

- \`/help\` - Show this help message
- \`/rules\` - Display chat rules
- \`/online\` - Show online users
- \`/me [action]\` - Roleplaying action (e.g., \`/me waves hello\`)
- \`/clear\` - Clear chat history (client-side only)`;
      isSystemMessage = true;
      break;

    case '/rules': {
      const activeRules = await ctx.db
        .query("chatRules")
        .withIndex("by_active", (q: any) => q.eq("isActive", true))
        .unique();

      if (activeRules) {
        responseMessage = activeRules.rulesText;
      } else {
        responseMessage = '*Chat rules are not available at this time.*';
      }
      isSystemMessage = true;
      break;
    }

    case '/online': {
      const onlineUsers = await getOnlineUsersInfo(ctx);
      const onlineCount = onlineUsers.length;

      if (onlineCount === 0) {
        responseMessage = 'No users are currently online.';
      } else {
        const userList = onlineUsers
          .slice(0, 10) // Limit to first 10 users
          .map((user: any) => `- ${user.username} (${user.rank})`)
          .join('\n');

        responseMessage = `**${onlineCount} users online:**\n\n${userList}${onlineCount > 10 ? `\n\n*...and ${onlineCount - 10} more...*` : ''}`;
      }
      isSystemMessage = true;
      break;
    }

    case '/me':
      if (commandArgs.length === 0) {
        responseMessage = 'Usage: `/me [action]` - Example: `/me waves hello`';
        isSystemMessage = true;
      } else {
        const action = commandArgs.join(' ');
        responseMessage = `* ${profile.username} ${action} *`;
        isSystemMessage = false; // This should be sent as a regular message but formatted
      }
      break;

    case '/clear':
      // Client-side only command - handled in frontend
      // This won't be reached since /clear is handled client-side, but keeping for consistency
      responseMessage = '*Chat history cleared (client-side only)*';
      isSystemMessage = true;
      break;

    default:
      responseMessage = `Unknown command: \`${command}\`. Type \`/help\` for available commands.`;
      isSystemMessage = true;
      break;
  }

  // For system messages, return the response directly
  if (isSystemMessage) {
    return {
      success: true,
      commandResponse: responseMessage,
      isSystemMessage: true
    };
  }

  // For /me command, return the formatted message to be sent as regular message
  return {
    success: true,
    formattedMessage: responseMessage,
    isRoleplay: true
  };
}



// Send a global chat message
export const sendMessage = mutation({
  args: {
    message: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        return { success: false, message: "You must be logged in to send messages" };
      }

      // Get user profile
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      if (!profile) {
        return { success: false, message: "Your profile could not be found" };
      }

      // Check if user has agreed to rules
      const chatSettings = await ctx.db
        .query("userChatSettings")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();

      if (!chatSettings?.rulesAgreedAt) {
        return { success: false, message: "You must agree to the chat rules before sending messages" };
      }

      // Check if user is banned
      const activeBan = await ctx.db
        .query("userModeration")
        .withIndex("by_target_active", (q) =>
          q.eq("targetUserId", userId).eq("isActive", true)
        )
        .filter((q) => q.eq(q.field("action"), "ban"))
        .first();

      if (activeBan) {
        // Check if ban has expired
        if (activeBan.expiresAt && activeBan.expiresAt < Date.now()) {
          // Ban has expired, mark as inactive
          await ctx.db.patch(activeBan._id, { isActive: false });
        } else {
          // Ban is still active
          const remainingMs = activeBan.expiresAt ? activeBan.expiresAt - Date.now() : null;
          const remainingTime = remainingMs ? formatRemainingTime(remainingMs) : "permanently";
          return { success: false, message: `You are banned from the chat${remainingMs ? ` for ${remainingTime}` : ` ${remainingTime}`}` };
        }
      }

      // Check if user is muted
      if (chatSettings?.isMuted && chatSettings.mutedUntil && chatSettings.mutedUntil > Date.now()) {
        const remainingMs = chatSettings.mutedUntil - Date.now();
        const remainingTime = formatRemainingTime(remainingMs);
        return { success: false, message: `You are muted for ${remainingTime}` };
      }

      const timestamp = Date.now();
      const trimmedMessage = args.message.trim();

      if (!trimmedMessage) {
        return { success: false, message: "Message cannot be empty" };
      }

      if (trimmedMessage.length > 500) {
        return { success: false, message: "Message must be 500 characters or less" };
      }

      // Handle commands first
      const commandResult = await handleChatCommand(ctx, args, userId, profile);
      if (commandResult) {
        // If it's a system command response, return it only to the sender
        if (commandResult.isSystemMessage) {
          return {
            success: true,
            commandResponse: commandResult.commandResponse,
            isSystemMessage: true
          };
        }
        // If it's a /me command, replace the original message with the formatted one
        if (commandResult.isRoleplay) {
          args.message = commandResult.formattedMessage;
        }
      }

      // Basic spam detection - check for repeated messages
      const messageHash = simpleHash(trimmedMessage.toLowerCase());
      const recentMessages = await ctx.db
        .query("globalChat")
        .withIndex("by_message_hash", (q) => q.eq("messageHash", messageHash))
        .filter((q) => q.gte(q.field("timestamp"), timestamp - 30000)) // Last 30 seconds
        .take(1);

      if (recentMessages.length > 0) {
        return { success: false, message: "Please don't send the same message repeatedly" };
      }

      // Rate limiting - check messages in last minute (more generous limits)
      const recentUserMessages = await ctx.db
        .query("globalChat")
        .withIndex("by_user_timestamp", (q) =>
          q.eq("userId", userId).gte("timestamp", timestamp - 60000)
        )
        .take(15);

      if (recentUserMessages.length >= 12) {
        return { success: false, message: "You're sending messages too quickly. Please wait a moment." };
      }

      // Parse mentions (@username) - allow dashes in usernames
      const mentionRegex = /@([\w-]+)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(trimmedMessage)) !== null) {
        mentions.push(match[1].toLowerCase());
      }

      // Find mentioned users
      const mentionedUserIds: Id<"users">[] = [];
      if (mentions.length > 0) {
        const uniqueMentions = Array.from(new Set(mentions));
        for (const username of uniqueMentions) {
          const mentionedProfile = await ctx.db
            .query("profiles")
            .withIndex("by_username", (q) => q.eq("username", username))
            .unique();
          if (mentionedProfile && mentionedProfile.userId !== userId) {
            mentionedUserIds.push(mentionedProfile.userId as Id<"users">);
          }
        }
      }

      // Apply profanity filtering
      const filteredMessage = profanity.censor(trimmedMessage, CensorType.Word);

      // Create the message
      const messageId = await ctx.db.insert("globalChat", {
        userId,
        username: profile.username,
        message: trimmedMessage,
        filteredMessage,
        timestamp,
        mentions: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
        messageHash,
        ipAddress: args.ipAddress,
      });

      // Update user's online status
      await ctx.runMutation(internal.globalChat.updateOnlineStatus, {
        userId,
        username: profile.username,
        currentPage: "chat",
      });

      // Send mention notifications (creates mentions and sends push notifications)
      if (mentionedUserIds.length > 0) {
        await ctx.runMutation(internal.globalChat.sendMentionNotifications, {
          messageId,
          mentionedUserIds,
          mentionerId: userId,
          mentionerUsername: profile.username,
          timestamp,
        });
      }

      return { success: true, messageId };
    } catch (error) {
      console.error("Error sending message:", error);
      return { success: false, message: "An unexpected error occurred while sending your message" };
    }
  },
});

// Get global chat messages with pagination
export const getMessages = query({
  args: {
    limit: v.optional(v.number()),
    beforeTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 20, 50);
    const beforeTimestamp = args.beforeTimestamp || Date.now();

    const messages = await ctx.db
      .query("globalChat")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), beforeTimestamp))
      .order("desc")
      .take(limit);

    // Get user settings and profiles for each message to include username colors and admin roles
    // Filter out system messages (which don't have userId) and undefined userIds
    const userIds = Array.from(new Set(messages.filter(m => m.userId).map(m => m.userId!)));
    const userSettings = await Promise.all(
      userIds.map(id =>
        ctx.db
          .query("userChatSettings")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .unique()
      )
    );

    const userProfiles = await Promise.all(
      userIds.map(id =>
        ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .unique()
      )
    );

    const settingsMap = new Map();
    userSettings.forEach(setting => {
      if (setting) {
        settingsMap.set(setting.userId, setting);
      }
    });

    const profilesMap = new Map();
    userProfiles.forEach(profile => {
      if (profile) {
        profilesMap.set(profile.userId, profile);
      }
    });

    // Enhance messages with user settings and admin roles
    const enhancedMessages = messages.map(message => ({
      ...message,
      usernameColor: message.userId ? settingsMap.get(message.userId)?.usernameColor : undefined,
      adminRole: message.userId ? profilesMap.get(message.userId)?.adminRole : undefined,
    }));

    return {
      messages: enhancedMessages,
      hasMore: messages.length === limit,
      oldestTimestamp: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
    };
  },
});

// Get online users
export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000; // 5 minutes ago

    const onlineProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_online_last_seen", (q) =>
        q.eq("isOnline", true).gte("lastSeenAt", fiveMinutesAgo)
      )
      .order("desc")
      .take(100);

    // Return the online users directly from profiles
    return onlineProfiles.map(profile => ({
      userId: profile.userId,
      username: profile.username,
      rank: profile.rank,
      avatarUrl: profile.avatarUrl,
      lastSeenAt: profile.lastSeenAt!,
      currentPage: profile.currentPage,
      gameId: profile.gameId,
      lobbyId: profile.lobbyId,
    }));
  },
});

// Get user's chat settings
export const getUserChatSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db
      .query("userChatSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return settings;
  },
});

// Update user chat settings
export const updateChatSettings = mutation({
  args: {
    usernameColor: v.optional(v.string()),
    showTimestamps: v.optional(v.boolean()),
    enableSounds: v.optional(v.boolean()),
    enableMentions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Process username color - adjust for readability if provided
    let processedColor = args.usernameColor;
    if (processedColor) {
      processedColor = adjustColorForReadability(processedColor);
    }

    const existingSettings = await ctx.db
      .query("userChatSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        usernameColor: processedColor ?? existingSettings.usernameColor,
        showTimestamps: args.showTimestamps ?? existingSettings.showTimestamps,
        enableSounds: args.enableSounds ?? existingSettings.enableSounds,
        enableMentions: args.enableMentions ?? existingSettings.enableMentions,
      });
    } else {
      await ctx.db.insert("userChatSettings", {
        userId,
        usernameColor: processedColor,
        showTimestamps: args.showTimestamps ?? true,
        enableSounds: args.enableSounds ?? true,
        enableMentions: args.enableMentions ?? true,
      });
    }

    return {
      success: true,
      adjustedColor: processedColor !== args.usernameColor ? processedColor : undefined
    };
  },
});

// Agree to chat rules
export const agreeToChatRules = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const timestamp = Date.now();

    // Get current active rules version
    const activeRules = await ctx.db
      .query("chatRules")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .unique();

    const rulesVersion = activeRules?.version || "1.0";

    const existingSettings = await ctx.db
      .query("userChatSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        rulesAgreedAt: timestamp,
        rulesVersion,
      });
    } else {
      await ctx.db.insert("userChatSettings", {
        userId,
        rulesAgreedAt: timestamp,
        rulesVersion,
        showTimestamps: true,
        enableSounds: true,
        enableMentions: true,
      });
    }

    return { success: true };
  },
});

// Get chat rules
export const getChatRules = query({
  args: {},
  handler: async (ctx) => {
    const activeRules = await ctx.db
      .query("chatRules")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .unique();

    return activeRules;
  },
});

// Get all usernames for mention validation
export const getAllUsernames = query({
  args: {},
  handler: async (ctx) => {
    // Get all profiles with their usernames
    const profiles = await ctx.db
      .query("profiles")
      .take(10000); // Get all users (reasonable limit)

    return profiles.map(profile => ({
      userId: profile.userId,
      username: profile.username,
    }));
  },
});

// Get unread mention count
export const getUnreadMentionCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unreadMentions = await ctx.db
      .query("chatMentions")
      .withIndex("by_mentioned_user_read", (q) =>
        q.eq("mentionedUserId", userId).eq("isRead", false)
      )
      .take(100); // Cap at 100 for performance

    return unreadMentions.length;
  },
});

// Mark mentions as read
export const markMentionsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get unread mentions
    const unreadMentions = await ctx.db
      .query("chatMentions")
      .withIndex("by_mentioned_user_read", (q) =>
        q.eq("mentionedUserId", userId).eq("isRead", false)
      )
      .take(50); // Limit batch size

    // Mark as read
    await Promise.all(
      unreadMentions.map(mention =>
        ctx.db.patch(mention._id, { isRead: true })
      )
    );

    return unreadMentions.length;
  },
});

// Get recent mentions for the current user
export const getRecentMentions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = Math.min(args.limit || 10, 50);

    const mentions = await ctx.db
      .query("chatMentions")
      .withIndex("by_mentioned_user_timestamp", (q) =>
        q.eq("mentionedUserId", userId)
      )
      .order("desc")
      .take(limit);

    return mentions;
  },
});

// Internal: Update online status
export const updateOnlineStatus = internalMutation({
  args: {
    userId: v.id("users"),
    username: v.string(),
    currentPage: v.optional(v.string()),
    gameId: v.optional(v.id("games")),
    lobbyId: v.optional(v.id("lobbies")),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        lastSeenAt: timestamp,
        isOnline: true,
        currentPage: args.currentPage,
        gameId: args.gameId,
        lobbyId: args.lobbyId,
      });
    }
  },
});

// Internal: Send mention notifications
export const sendMentionNotifications = internalMutation({
  args: {
    messageId: v.id("globalChat"),
    mentionedUserIds: v.array(v.id("users")),
    mentionerId: v.id("users"),
    mentionerUsername: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    // Create mention notifications for each mentioned user
    const mentionPromises = args.mentionedUserIds.map(async (mentionedUserId) => {
      const mentionedProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", mentionedUserId))
        .unique();

      if (mentionedProfile) {
        await ctx.db.insert("chatMentions", {
          messageId: args.messageId,
          mentionerId: args.mentionerId,
          mentionerUsername: args.mentionerUsername,
          mentionedUserId,
          mentionedUsername: mentionedProfile.username,
          timestamp: args.timestamp,
          isRead: false,
          mentionText: message.filteredMessage || message.message,
        });

        // Get the mentioned user's chat settings to check if they want mention notifications
        const mentionedUserSettings = await ctx.db
          .query("userChatSettings")
          .withIndex("by_user", (q) => q.eq("userId", mentionedUserId))
          .unique();

        // Send push notifications if user has mentions enabled (default true)
        if (mentionedUserSettings?.enableMentions !== false) {
          // Check if user has push subscriptions
          const subscriptions = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_user", (q) => q.eq("userId", mentionedUserId))
            .collect();

          if (subscriptions.length > 0) {
            // Schedule push notification
            try {
              await ctx.scheduler.runAfter(0, internal.pushNode.sendMentionPushNotifications, {
                messageId: args.messageId,
              });
            } catch (error) {
              console.error("Failed to schedule mention push notification:", error);
            }
          }
        }

        // Mention record created successfully
      }
    });

    await Promise.all(mentionPromises);
  },
});

// Internal: Clean up old messages (3+ days old)
export const cleanupOldMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

    // Get old messages
    const oldMessages = await ctx.db
      .query("globalChat")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), threeDaysAgo))
      .take(100); // Process in batches

    if (oldMessages.length === 0) return 0;

    // Delete old messages and their mentions
    const deletePromises = oldMessages.map(async (message) => {
      // Delete mentions first
      const mentions = await ctx.db
        .query("chatMentions")
        .withIndex("by_message", (q) => q.eq("messageId", message._id))
        .take(100);

      await Promise.all(
        mentions.map(mention => ctx.db.delete(mention._id))
      );

      // Delete the message
      await ctx.db.delete(message._id);
    });

    await Promise.all(deletePromises);
    return oldMessages.length;
  },
});

// Internal: Update user online status (heartbeat)
export const heartbeat = mutation({
  args: {
    userId: v.id("users"),
    username: v.string(),
    currentPage: v.optional(v.string()),
    gameId: v.optional(v.id("games")),
    lobbyId: v.optional(v.id("lobbies")),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.globalChat.updateOnlineStatus, {
      userId: args.userId,
      username: args.username,
      currentPage: args.currentPage,
      gameId: args.gameId,
      lobbyId: args.lobbyId,
    });
  },
});

// Mark user as online (called when user logs in or becomes active)
export const markUserOnline = mutation({
  args: {
    currentPage: v.optional(v.string()),
    gameId: v.optional(v.id("games")),
    lobbyId: v.optional(v.id("lobbies")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.runMutation(internal.globalChat.updateOnlineStatus, {
      userId,
      username: profile.username,
      currentPage: args.currentPage,
      gameId: args.gameId,
      lobbyId: args.lobbyId,
    });

    return { success: true };
  },
});

// Mark user as offline (called when user logs out or closes tab)
export const markUserOffline = mutation({
  args: {},
  handler: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        isOnline: false,
        lastSeenAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Internal: Mark users as offline (cleanup inactive users)
export const cleanupOfflineUsers = internalMutation({
  args: {},
  handler: async (ctx, _args) => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000; // 10 minutes

    const inactiveProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_online_last_seen", (q) =>
        q.eq("isOnline", true).lt("lastSeenAt", tenMinutesAgo)
      )
      .take(100);

    await Promise.all(
      inactiveProfiles.map(profile =>
        ctx.db.patch(profile._id, { isOnline: false })
      )
    );

    return inactiveProfiles.length;
  },
});

// Check if current user is an admin or moderator
export const isUserAdmin = query({
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

// Get user admin role
export const getUserAdminRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile?.adminRole || null;
  },
});

// Mute a user
export const muteUser = mutation({
  args: {
    targetUserId: v.id("users"),
    duration: v.optional(v.number()), // Duration in milliseconds
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if current user is admin/moderator
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.adminRole) throw new Error("Insufficient permissions");

    // Get target user info
    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!targetProfile) throw new Error("Target user not found");

    const timestamp = Date.now();
    const expiresAt = args.duration ? timestamp + args.duration : undefined;

    // Create mute action
    await ctx.db.insert("userModeration", {
      targetUserId: args.targetUserId,
      targetUsername: targetProfile.username,
      moderatorId: userId,
      moderatorUsername: profile.username,
      action: "mute",
      reason: args.reason,
      duration: args.duration,
      expiresAt,
      createdAt: timestamp,
      isActive: true,
    });

    // Update user's chat settings to mark as muted
    const existingSettings = await ctx.db
      .query("userChatSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .unique();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        isMuted: true,
        mutedUntil: expiresAt,
        muteReason: args.reason,
      });
    } else {
      await ctx.db.insert("userChatSettings", {
        userId: args.targetUserId,
        isMuted: true,
        mutedUntil: expiresAt,
        muteReason: args.reason,
        showTimestamps: true,
        enableSounds: true,
        enableMentions: true,
      });
    }

    // Send email notification (don't fail the moderation if email fails)
    try {
      const targetUser = await ctx.db.get(args.targetUserId);
      if (targetUser?.email) {
        await ctx.scheduler.runAfter(0, internal.sendEmails.sendMuteEmail, {
          targetEmail: targetUser.email,
          targetUsername: targetProfile.username,
          moderatorUsername: profile.username,
          reason: args.reason,
          duration: args.duration,
        });
      }
    } catch (error) {
      console.error("Failed to send mute email notification:", error);
      // Don't fail the moderation action if email fails
    }

    return { success: true };
  },
});

// Unmute a user
export const unmuteUser = mutation({
  args: {
    targetUserId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if current user is admin/moderator
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.adminRole) throw new Error("Insufficient permissions");

    // Get target user info
    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!targetProfile) throw new Error("Target user not found");

    const timestamp = Date.now();

    // Create unmute action
    await ctx.db.insert("userModeration", {
      targetUserId: args.targetUserId,
      targetUsername: targetProfile.username,
      moderatorId: userId,
      moderatorUsername: profile.username,
      action: "unmute",
      reason: args.reason,
      createdAt: timestamp,
      isActive: true,
    });

    // Update user's chat settings to remove mute
    const existingSettings = await ctx.db
      .query("userChatSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .unique();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        isMuted: false,
        mutedUntil: undefined,
        muteReason: undefined,
      });
    }

    // Send email notification (don't fail the moderation if email fails)
    try {
      const targetUser = await ctx.db.get(args.targetUserId);
      if (targetUser?.email) {
        await ctx.scheduler.runAfter(0, internal.sendEmails.sendUnmuteEmail, {
          targetEmail: targetUser.email,
          targetUsername: targetProfile.username,
          moderatorUsername: profile.username,
          reason: args.reason,
        });
      }
    } catch (error) {
      console.error("Failed to send unmute email notification:", error);
      // Don't fail the moderation action if email fails
    }

    return { success: true };
  },
});

// Ban a user from chat
export const banUser = mutation({
  args: {
    targetUserId: v.id("users"),
    duration: v.optional(v.number()), // Duration in milliseconds, undefined for permanent
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if current user is admin/moderator
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.adminRole) throw new Error("Insufficient permissions");

    // Get target user info
    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!targetProfile) throw new Error("Target user not found");

    const timestamp = Date.now();
    const expiresAt = args.duration ? timestamp + args.duration : undefined;

    // Create ban action
    await ctx.db.insert("userModeration", {
      targetUserId: args.targetUserId,
      targetUsername: targetProfile.username,
      moderatorId: userId,
      moderatorUsername: profile.username,
      action: "ban",
      reason: args.reason,
      duration: args.duration,
      expiresAt,
      createdAt: timestamp,
      isActive: true,
    });

    // Send email notification (don't fail the moderation if email fails)
    try {
      const targetUser = await ctx.db.get(args.targetUserId);
      if (targetUser?.email) {
        await ctx.scheduler.runAfter(0, internal.sendEmails.sendBanEmail, {
          targetEmail: targetUser.email,
          targetUsername: targetProfile.username,
          moderatorUsername: profile.username,
          reason: args.reason,
          duration: args.duration,
        });
      }
    } catch (error) {
      console.error("Failed to send game ban email notification:", error);
      // Don't fail the moderation action if email fails
    }

    return { success: true };
  },
});

// Unban a user
export const unbanUser = mutation({
  args: {
    targetUserId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if current user is admin/moderator
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.adminRole) throw new Error("Insufficient permissions");

    // Get target user info
    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .unique();
    if (!targetProfile) throw new Error("Target user not found");

    const timestamp = Date.now();

    // Create unban action
    await ctx.db.insert("userModeration", {
      targetUserId: args.targetUserId,
      targetUsername: targetProfile.username,
      moderatorId: userId,
      moderatorUsername: profile.username,
      action: "unban",
      reason: args.reason,
      createdAt: timestamp,
      isActive: true,
    });

    // Mark previous ban as inactive
    const activeBan = await ctx.db
      .query("userModeration")
      .withIndex("by_target_active", (q) =>
        q.eq("targetUserId", args.targetUserId).eq("isActive", true)
      )
      .filter((q) => q.eq(q.field("action"), "ban"))
      .first();

    if (activeBan) {
      await ctx.db.patch(activeBan._id, { isActive: false });
    }

    // Send email notification (don't fail the moderation if email fails)
    try {
      const targetUser = await ctx.db.get(args.targetUserId);
      if (targetUser?.email) {
        await ctx.scheduler.runAfter(0, internal.sendEmails.sendUnbanEmail, {
          targetEmail: targetUser.email,
          targetUsername: targetProfile.username,
          moderatorUsername: profile.username,
          reason: args.reason,
        });
      }
    } catch (error) {
      console.error("Failed to send game unban email notification:", error);
      // Don't fail the moderation action if email fails
    }

    return { success: true };
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: {
    messageId: v.id("globalChat"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if current user is admin/moderator
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.adminRole) throw new Error("Insufficient permissions");

    // Get the message to ensure it exists
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const timestamp = Date.now();

    // Create moderation action record
    await ctx.db.insert("messageModeration", {
      messageId: args.messageId,
      moderatorId: userId,
      moderatorUsername: profile.username,
      action: "delete",
      reason: args.reason,
      createdAt: timestamp,
    });

    // Delete the message
    await ctx.db.delete(args.messageId);

    // Delete associated mentions
    const mentions = await ctx.db
      .query("chatMentions")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .take(100);

    await Promise.all(
      mentions.map(mention => ctx.db.delete(mention._id))
    );

    return { success: true };
  },
});

// Get user moderation history
export const getUserModerationHistory = query({
  args: {
    targetUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if current user is admin/moderator
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.adminRole) throw new Error("Insufficient permissions");

    const limit = Math.min(args.limit || 50, 100);

    return await ctx.db
      .query("userModeration")
      .withIndex("by_target_user", (q) => q.eq("targetUserId", args.targetUserId))
      .order("desc")
      .take(limit);
  },
});

// Get message moderation history
export const getMessageModerationHistory = query({
  args: {
    messageId: v.id("globalChat"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if current user is admin/moderator
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.adminRole) throw new Error("Insufficient permissions");

    return await ctx.db
      .query("messageModeration")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .take(10);
  },
});

// Check if user is banned from chat
export const isUserBanned = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const activeBan = await ctx.db
      .query("userModeration")
      .withIndex("by_target_active", (q) =>
        q.eq("targetUserId", userId).eq("isActive", true)
      )
      .filter((q) => q.eq(q.field("action"), "ban"))
      .first();

    if (!activeBan) return false;

    // Check if ban has expired (note: we don't update here since queries can't write)
    if (activeBan.expiresAt && activeBan.expiresAt < Date.now()) {
      return false;
    }

    return true;
  },
});

// Get user's active ban details
export const getUserBanDetails = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const activeBan = await ctx.db
      .query("userModeration")
      .withIndex("by_target_active", (q) =>
        q.eq("targetUserId", userId).eq("isActive", true)
      )
      .filter((q) => q.eq(q.field("action"), "ban"))
      .first();

    if (!activeBan) return null;

    // Check if ban has expired
    if (activeBan.expiresAt && activeBan.expiresAt < Date.now()) {
      return null;
    }

    return {
      reason: activeBan.reason,
      duration: activeBan.duration,
      expiresAt: activeBan.expiresAt,
      moderatorUsername: activeBan.moderatorUsername,
      createdAt: activeBan.createdAt,
    };
  },
});

// Get user's moderation status (ban and mute) by userId
export const getUserModerationStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check for active ban
    const activeBan = await ctx.db
      .query("userModeration")
      .withIndex("by_target_active", (q) =>
        q.eq("targetUserId", args.userId).eq("isActive", true)
      )
      .filter((q) => q.eq(q.field("action"), "ban"))
      .first();

    let banStatus = null;
    if (activeBan) {
      // Check if ban has expired
      if (activeBan.expiresAt && activeBan.expiresAt < Date.now()) {
        // Ban has expired - don't return it as active
        banStatus = null;
      } else {
        // Ban is still active
        banStatus = {
          reason: activeBan.reason,
          duration: activeBan.duration,
          expiresAt: activeBan.expiresAt,
          moderatorUsername: activeBan.moderatorUsername,
          createdAt: activeBan.createdAt,
        };
      }
    }

    // Check for mute status
    const chatSettings = await ctx.db
      .query("userChatSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    let muteStatus = null;
    if (chatSettings?.isMuted && chatSettings.mutedUntil && chatSettings.mutedUntil > Date.now()) {
      muteStatus = {
        mutedUntil: chatSettings.mutedUntil,
        reason: chatSettings.muteReason || "No reason provided",
      };
    }

    return {
      banStatus,
      muteStatus,
    };
  },
});

// Get all active admin/moderator users
export const getActiveAdmins = query({
  args: {},
  handler: async (ctx) => {
    // Use index to efficiently find admin/moderator users
    // Query for moderators
    const moderators = await ctx.db
      .query("profiles")
      .withIndex("by_admin_role", (q) => q.eq("adminRole", "moderator"))
      .take(25);

    // Query for admins
    const admins = await ctx.db
      .query("profiles")
      .withIndex("by_admin_role", (q) => q.eq("adminRole", "admin"))
      .take(25);

    // Combine and map the results
    const allAdmins = [...moderators, ...admins];

    return allAdmins.map(admin => ({
      userId: admin.userId,
      username: admin.username,
      role: admin.adminRole!,
    }));
  },
});

// Check if user has already sent an appeal message
export const hasUserSentAppeal = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000); // 24 hours ago

    // Look for appeals sent in the last 24 hours
    const recentAppeals = await ctx.db
      .query("banAppeals")
      .withIndex("by_user_timestamp", (q) =>
        q.eq("userId", userId).gte("timestamp", oneDayAgo)
      )
      .take(1);

    return recentAppeals.length > 0;
  },
});

// Get the timestamp of the user's last appeal
export const getLastAppealTimestamp = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get the most recent appeal from this user
    const lastAppeal = await ctx.db
      .query("banAppeals")
      .withIndex("by_user_timestamp", (q) =>
        q.eq("userId", userId)
      )
      .order("desc")
      .first();

    return lastAppeal ? lastAppeal.timestamp : null;
  },
});

// Send appeal message to all active admins
export const sendAppealToAdmins = mutation({
  args: {
    appealMessage: v.string(),
  },
  handler: async (ctx, args): Promise<{success: boolean, messageCount: number, message: string}> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get user profile
    const userProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!userProfile) throw new Error("User profile not found");

    // Check if user has already sent an appeal recently
    const hasSentAppeal = await ctx.runQuery(api.globalChat.hasUserSentAppeal);
    if (hasSentAppeal) {
      throw new Error("You have already sent an appeal message in the last 24 hours. Please wait before sending another.");
    }

    // Get all active admins
    const admins: Array<{userId: string, username: string, role: string}> = await ctx.runQuery(api.globalChat.getActiveAdmins);
    if (admins.length === 0) {
      throw new Error("No administrators are currently available. Please try again later.");
    }

    // Validate appeal message
    if (args.appealMessage.length < 50) {
      throw new Error("Appeal message must be at least 50 characters long.");
    }
    if (args.appealMessage.length > 1000) {
      throw new Error("Appeal message must be less than 1000 characters.");
    }

    const timestamp = Date.now();
    const appealContent = `BAN APPEAL: ${args.appealMessage}`;

    // Insert appeal into banAppeals table
    await ctx.db.insert("banAppeals", {
      userId,
      username: userProfile.username,
      appealMessage: args.appealMessage,
      timestamp,
      status: "pending",
    });

    // Send message to all admins
    const messagePromises: Array<Promise<string>> = admins.map((admin: {userId: string, username: string, role: string}) =>
      ctx.runMutation(internal.messages.sendMessageInternal, {
        senderId: userId,
        recipientUsername: admin.username,
        content: appealContent,
        messageType: "text",
      })
    );

    const messageIds: Array<string> = await Promise.all(messagePromises);

    // Update user's last seen time
    await ctx.db.patch(userProfile._id, {
      lastSeenAt: timestamp,
      isOnline: true,
    });

    return {
      success: true,
      messageCount: messageIds.length,
      message: "Your appeal has been sent to all administrators. You will receive a response via direct message.",
    };
  },
});

// Clean up expired bans and mutes
export const cleanupExpiredModeration = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find expired bans
    const expiredBans = await ctx.db
      .query("userModeration")
      .withIndex("by_expires_at")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .filter((q) => q.eq(q.field("isActive"), true))
      .filter((q) => q.eq(q.field("action"), "ban"))
      .take(50);

    // Find expired mutes
    const expiredMutes = await ctx.db
      .query("userModeration")
      .withIndex("by_expires_at")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .filter((q) => q.eq(q.field("isActive"), true))
      .filter((q) => q.eq(q.field("action"), "mute"))
      .take(50);

    // Mark expired bans as inactive
    await Promise.all(
      expiredBans.map(ban => ctx.db.patch(ban._id, { isActive: false }))
    );

    // Mark expired mutes as inactive and update user settings
    await Promise.all(
      expiredMutes.map(async (mute) => {
        await ctx.db.patch(mute._id, { isActive: false });

        // Update user's chat settings to remove mute
        const userSettings = await ctx.db
          .query("userChatSettings")
          .withIndex("by_user", (q) => q.eq("userId", mute.targetUserId))
          .unique();

        if (userSettings) {
          await ctx.db.patch(userSettings._id, {
            isMuted: false,
            mutedUntil: undefined,
            muteReason: undefined,
          });
        }
      })
    );

    return expiredBans.length + expiredMutes.length;
  },
});

// Setup initial chat rules (run once)
export const setupChatRules = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if rules already exist
    const existingRules = await ctx.db
      .query("chatRules")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .unique();

    if (existingRules) {
      return { message: "Chat rules already exist" };
    }

    const rulesText = `# Global Chat Rules

## 1. Respect and Courtesy
- Treat all players with respect and courtesy
- No harassment, bullying, or discriminatory language
- Respect different cultures, backgrounds, and playing styles

## 2. Appropriate Content
- Keep conversations appropriate for all ages
- No explicit, violent, or offensive content
- No spam or excessive self-promotion

## 3. Game-Related Discussion
- Discuss strategies, tactics, and game mechanics
- Share tips and help fellow players
- Respect game rules and fair play

## 4. Privacy and Safety
- Do not share personal information
- Report any suspicious or harmful behavior
- Use the @mention feature responsibly

## 5. Moderation
- Follow moderator instructions
- Users may be muted for rule violations
- Repeated violations may result in account restrictions

## 6. Technical Guidelines
- Keep messages under 500 characters
- Avoid excessive caps or special characters
- Use appropriate channels for different topics

**By using the global chat, you agree to follow these rules. Violations may result in temporary or permanent restrictions from the chat system.**`;

    await ctx.db.insert("chatRules", {
      version: "1.0",
      rulesText,
      createdAt: Date.now(),
      isActive: true,
    });

    return { message: "Chat rules initialized successfully" };
  },
});
