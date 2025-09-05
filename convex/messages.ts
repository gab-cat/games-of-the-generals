import { mutation, query, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { profanity, CensorType } from "@2toad/profanity";
import { ActionRetrier } from "@convex-dev/action-retrier";
import { ShardedCounter } from "@convex-dev/sharded-counter";
import { components } from "./_generated/api";

// Create ActionRetrier instance
const retrier = new ActionRetrier(components.actionRetrier);

// Create ShardedCounter instance for unread message counts
// Using 32 shards for high throughput on unread count updates
const unreadMessageCounter = new ShardedCounter(components.shardedCounter, {
  defaultShards: 32,
});

// Performance monitoring for conflict resolution
const conflictStats = {
  totalRetries: 0,
  successfulRetries: 0,
  failedRetries: 0,
  operations: new Map<string, number>()
};

// Action to update conversation read status with retry logic using Action Retrier
export const updateConversationReadStatusWithRetry = internalAction({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
    readAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Use Action Retrier to handle the mutation with retry logic
    const runId = await retrier.run(
      ctx,
      internal.messages.updateConversationReadStatusAction,
      {
        userId: args.userId,
        otherUserId: args.otherUserId,
        readAt: args.readAt,
      }
    );
    
    // Wait for the retry to complete and return the result
    while (true) {
      const status = await retrier.status(ctx, runId);
      if (status.type === "inProgress") {
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      } else {
        // Clean up the run
        await retrier.cleanup(ctx, runId);
        return status.result;
      }
    }
  },
});

// Action to update conversation with retry logic using Action Retrier
export const updateConversationWithRetry = internalAction({
  args: {
    participant1Id: v.id("users"),
    participant1Username: v.string(),
    participant2Id: v.id("users"),
    participant2Username: v.string(),
    messageId: v.id("messages"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Use Action Retrier to handle the mutation with retry logic
    const runId = await retrier.run(
      ctx,
      internal.messages.updateConversationAction,
      {
        participant1Id: args.participant1Id,
        participant1Username: args.participant1Username,
        participant2Id: args.participant2Id,
        participant2Username: args.participant2Username,
        messageId: args.messageId,
        timestamp: args.timestamp,
      }
    );
    
    // Wait for the retry to complete and return the result
    while (true) {
      const status = await retrier.status(ctx, runId);
      if (status.type === "inProgress") {
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      } else {
        // Clean up the run
        await retrier.cleanup(ctx, runId);
        return status.result;
      }
    }
  },
});

// Action wrapper for updateConversationReadStatus mutation
export const updateConversationReadStatusAction = internalAction({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
    readAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.messages.updateConversationReadStatus, {
      userId: args.userId,
      otherUserId: args.otherUserId,
      readAt: args.readAt,
    });
  },
});

// Action wrapper for updateConversation mutation
export const updateConversationAction = internalAction({
  args: {
    participant1Id: v.id("users"),
    participant1Username: v.string(),
    participant2Id: v.id("users"),
    participant2Username: v.string(),
    messageId: v.id("messages"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.messages.updateConversation, {
      participant1Id: args.participant1Id,
      participant1Username: args.participant1Username,
      participant2Id: args.participant2Id,
      participant2Username: args.participant2Username,
      messageId: args.messageId,
      timestamp: args.timestamp,
    });
  },
});

// Enhanced rate limiter for typing updates to prevent excessive conflicts
const typingUpdateCache = new Map<string, { lastUpdate: number; consecutiveUpdates: number; lastTypingState: boolean }>();
const TYPING_RATE_LIMIT_MS = 1000; // Minimum 1000ms between typing updates per user
const MAX_CONSECUTIVE_UPDATES = 3; // Max consecutive updates before longer cooldown
const EXTENDED_COOLDOWN_MS = 3000; // Extended cooldown after too many updates

function shouldAllowTypingUpdate(userId: string, otherUserId: string, isTyping: boolean): boolean {
  // Ensure cache doesn't grow too large
  ensureCacheSize();
  
  const key = `${userId}-${otherUserId}`;
  const now = Date.now();
  const cached = typingUpdateCache.get(key);
  
  if (!cached) {
    typingUpdateCache.set(key, { lastUpdate: now, consecutiveUpdates: 1, lastTypingState: isTyping });
    return true;
  }
  
  const timeSinceLastUpdate = now - cached.lastUpdate;
  const isStateChange = cached.lastTypingState !== isTyping;
  
  // Always allow state changes (typing -> not typing or vice versa)
  if (isStateChange) {
    typingUpdateCache.set(key, { lastUpdate: now, consecutiveUpdates: 1, lastTypingState: isTyping });
    return true;
  }
  
  // For same state updates, apply rate limiting
  const requiredCooldown = cached.consecutiveUpdates >= MAX_CONSECUTIVE_UPDATES 
    ? EXTENDED_COOLDOWN_MS 
    : TYPING_RATE_LIMIT_MS;
  
  if (timeSinceLastUpdate >= requiredCooldown) {
    const newConsecutiveUpdates = cached.consecutiveUpdates >= MAX_CONSECUTIVE_UPDATES ? 1 : cached.consecutiveUpdates + 1;
    typingUpdateCache.set(key, { lastUpdate: now, consecutiveUpdates: newConsecutiveUpdates, lastTypingState: isTyping });
    return true;
  }
  
  return false;
}

// Clean up old cache entries to prevent memory leaks
function cleanupTypingCache(): void {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // Remove entries older than 10 minutes
  
  for (const [key, cached] of typingUpdateCache.entries()) {
    if (now - cached.lastUpdate > maxAge) {
      typingUpdateCache.delete(key);
    }
  }
}

// Clean up cache when it gets too large (prevent memory leaks)
function ensureCacheSize(): void {
  if (typingUpdateCache.size > 1000) {
    cleanupTypingCache();
  }
}

// Function to get conflict resolution statistics
export const getConflictStats = query({
  args: {},
  returns: v.object({
    totalRetries: v.number(),
    successfulRetries: v.number(),
    failedRetries: v.number(),
    successRate: v.number(),
    operations: v.record(v.string(), v.number()),
  }),
  handler: async () => {
    const successRate = conflictStats.totalRetries > 0 
      ? (conflictStats.successfulRetries / conflictStats.totalRetries) * 100 
      : 100;
    
    return {
      totalRetries: conflictStats.totalRetries,
      successfulRetries: conflictStats.successfulRetries,
      failedRetries: conflictStats.failedRetries,
      successRate: Math.round(successRate * 100) / 100,
      operations: Object.fromEntries(conflictStats.operations),
    };
  },
});

// Helper function for batch profile fetching to eliminate N+1 queries
export const batchGetProfiles = internalQuery({
  args: { 
    userIds: v.array(v.id("users")) 
  },
  returns: v.array(v.union(
    v.object({
      _id: v.id("profiles"),
      _creationTime: v.number(),
      userId: v.id("users"),
      username: v.string(),
      wins: v.number(),
      losses: v.number(),
      gamesPlayed: v.number(),
      rank: v.string(),
      createdAt: v.number(),
      avatarUrl: v.optional(v.string()),
      avatarStorageId: v.optional(v.id("_storage")),
      totalPlayTime: v.optional(v.number()),
      fastestWin: v.optional(v.number()),
      fastestGame: v.optional(v.number()),
      longestGame: v.optional(v.number()),
      winStreak: v.optional(v.number()),
      bestWinStreak: v.optional(v.number()),
      capturedFlags: v.optional(v.number()),
      piecesEliminated: v.optional(v.number()),
      spiesRevealed: v.optional(v.number()),
      hasSeenTutorial: v.optional(v.boolean()),
      tutorialCompletedAt: v.optional(v.number()),
    }),
    v.null()
  )),
  handler: async (ctx, args) => {
    if (args.userIds.length === 0) return [];
    
    const profiles = await Promise.all(
      args.userIds.map(id => 
        ctx.db.query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .unique()
      )
    );
    
    return profiles;
  },
});

// Send a direct message
export const sendMessage = mutation({
  args: {
    recipientUsername: v.string(),
    content: v.string(),
    messageType: v.union(v.literal("text"), v.literal("lobby_invite"), v.literal("game_invite")),
    lobbyId: v.optional(v.id("lobbies")),
    lobbyCode: v.optional(v.string()),
    lobbyName: v.optional(v.string()),
    gameId: v.optional(v.id("games")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get sender profile
    const senderProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!senderProfile) throw new Error("Sender profile not found");

    // Get recipient profile
    const recipientProfile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.recipientUsername))
      .unique();
    if (!recipientProfile) throw new Error("Recipient not found");

    // Can't send message to yourself
    if (userId === recipientProfile.userId) {
      throw new Error("Cannot send message to yourself");
    }

    // Validate invites
    if (args.messageType === "lobby_invite" && args.lobbyId) {
      const lobby = await ctx.db.get(args.lobbyId);
      if (!lobby) throw new Error("Lobby not found");
      if (lobby.status !== "waiting") throw new Error("Lobby is not available");
    }

    if (args.messageType === "game_invite" && args.gameId) {
      const game = await ctx.db.get(args.gameId);
      if (!game) throw new Error("Game not found");
      if (game.status !== "playing") throw new Error("Game is not active");
    }

    const timestamp = Date.now();

    // Profanity: fully censor any profanity
    const fullyCensoredContent = profanity.censor(args.content, CensorType.Word);

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      senderId: userId,
      senderUsername: senderProfile.username,
      recipientId: recipientProfile.userId,
      recipientUsername: args.recipientUsername,
      content: fullyCensoredContent,
      messageType: args.messageType,
      lobbyId: args.lobbyId,
      lobbyCode: args.lobbyCode,
      lobbyName: args.lobbyName,
      gameId: args.gameId,
      timestamp,
      deliveredAt: timestamp,
    });

    // Increment unread count for recipient using sharded counter
    await unreadMessageCounter.inc(ctx, recipientProfile.userId);

    // Update or create conversation with retry logic
    // Schedule the retry action to run asynchronously
    await ctx.scheduler.runAfter(0, internal.messages.updateConversationWithRetry, {
      participant1Id: userId,
      participant1Username: senderProfile.username,
      participant2Id: recipientProfile.userId,
      participant2Username: args.recipientUsername,
      messageId,
      timestamp,
    });

    // Attempt to send a push notification to the recipient (async)
    await ctx.scheduler.runAfter(0, internal.pushNode.sendPushForMessage, { messageId });

    // Update user's last seen time (they performed a significant action)
    await ctx.db.patch(senderProfile._id, {
      lastSeenAt: timestamp,
      isOnline: true,
    });

    return messageId;
  },
});

// Get conversations for current user with optimized pagination
export const getConversations = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: "" };

    const { paginationOpts } = args;
    const limit = paginationOpts ? Math.min(paginationOpts.numItems, 20) : 10;

    // Use optimized indexes with proper ordering
    const conversations1Query = ctx.db
      .query("conversations")
      .withIndex("by_participant1_last_message", (q) => q.eq("participant1Id", userId))
      .order("desc");

    const conversations2Query = ctx.db
      .query("conversations")
      .withIndex("by_participant2_last_message", (q) => q.eq("participant2Id", userId))
      .order("desc");

    // Execute both queries and combine results
    const [conversations1, conversations2] = await Promise.all([
      conversations1Query.take(limit),
      conversations2Query.take(limit),
    ]);

    // Combine and sort by lastMessageAt, then take the top results
    const allConversations = [...conversations1, ...conversations2]
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
      .slice(0, limit);

    // FIXED: Batch fetch all profiles to eliminate N+1 queries
    const participantIds = allConversations.map(conv => {
      const isParticipant1 = conv.participant1Id === userId;
      return isParticipant1 ? conv.participant2Id : conv.participant1Id;
    });

    // Batch fetch all participant profiles at once
    const uniqueParticipantIds = [...new Set(participantIds)];
    const profiles = await Promise.all(
      uniqueParticipantIds.map(id =>
        ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .unique()
      )
    );

    // Create a map for O(1) profile lookups
    const profilesMap = new Map();
    profiles.forEach(profile => {
      if (profile) {
        profilesMap.set(profile.userId, profile);
      }
    });

    // Batch fetch last messages if needed
    const validMessageIds = allConversations
      .map(conv => conv.lastMessageId)
      .filter((id): id is NonNullable<typeof id> => id != null);
    
    const lastMessages = await Promise.all(
      validMessageIds.map(id => ctx.db.get(id))
    );
    
    const messagesMap = new Map();
    lastMessages.forEach(msg => {
      if (msg) {
        messagesMap.set(msg._id, msg);
      }
    });

    // Enhance conversations with batched data and calculate unread counts
    const enhanced = await Promise.all(
      allConversations.map(async (conv) => {
        const isParticipant1 = conv.participant1Id === userId;
        const otherParticipantId = isParticipant1 ? conv.participant2Id : conv.participant1Id;
        const otherUsername = isParticipant1 ? conv.participant2Username : conv.participant1Username;
        
        const otherParticipantProfile = profilesMap.get(otherParticipantId);
        const lastMessage = conv.lastMessageId ? messagesMap.get(conv.lastMessageId) : null;
        
        // Count unread messages from this specific user
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_unread_messages", (q) => 
            q.eq("recipientId", userId).eq("readAt", undefined)
          )
          .filter((q) => q.eq(q.field("senderId"), otherParticipantId))
          .collect();
        
        return {
          ...conv,
          lastMessage,
          otherParticipant: {
            id: otherParticipantId,
            username: otherUsername,
            avatarUrl: otherParticipantProfile?.avatarUrl,
            rank: otherParticipantProfile?.rank,
          },
          unreadCount: unreadMessages.length,
          lastReadAt: isParticipant1 ? conv.participant1LastRead : conv.participant2LastRead,
        };
      })
    );

    return {
      page: enhanced,
      isDone: enhanced.length < limit,
      continueCursor: enhanced.length > 0 ? enhanced[enhanced.length - 1]._id : "",
    };
  },
});

// Get messages in a conversation with optimized pagination using new indexes
export const getConversationMessages = query({
  args: {
    otherUserId: v.id("users"),
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
    // New: support timestamp-based pagination for infinite scroll
    beforeTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: "", continueTimestamp: undefined } as any;

    const { paginationOpts, beforeTimestamp } = args;
    const limit = paginationOpts ? Math.min(paginationOpts.numItems, 50) : 20;

    // Build queries for both directions
    const [sentMessages, receivedMessages] = await Promise.all([
      (async () => {
        if (beforeTimestamp != null) {
          return await ctx.db
            .query("messages")
            .withIndex("by_conversation_timestamp", (q) =>
              q
                .eq("senderId", userId)
                .eq("recipientId", args.otherUserId)
                .lt("timestamp", beforeTimestamp)
            )
            .order("desc")
            .take(limit);
        }
        return await ctx.db
          .query("messages")
          .withIndex("by_conversation_timestamp", (q) =>
            q.eq("senderId", userId).eq("recipientId", args.otherUserId)
          )
          .order("desc")
          .take(limit);
      })(),
      (async () => {
        if (beforeTimestamp != null) {
          return await ctx.db
            .query("messages")
            .withIndex("by_conversation_timestamp", (q) =>
              q
                .eq("senderId", args.otherUserId)
                .eq("recipientId", userId)
                .lt("timestamp", beforeTimestamp)
            )
            .order("desc")
            .take(limit);
        }
        return await ctx.db
          .query("messages")
          .withIndex("by_conversation_timestamp", (q) =>
            q.eq("senderId", args.otherUserId).eq("recipientId", userId)
          )
          .order("desc")
          .take(limit);
      })(),
    ]);

    // Combine, sort by newest first, then trim to limit
    const combined = [...sentMessages, ...receivedMessages]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    const continueTs = combined.length > 0 ? combined[combined.length - 1].timestamp : undefined;

    // More robust hasMore detection: if we returned a full page, we certainly have more.
    // Otherwise, probe for any message older than the last timestamp in either direction.
    let hasMore = combined.length >= limit;
    if (!hasMore && continueTs != null) {
      const [olderSent, olderReceived] = await Promise.all([
        ctx.db
          .query("messages")
          .withIndex("by_conversation_timestamp", (q) =>
            q
              .eq("senderId", userId)
              .eq("recipientId", args.otherUserId)
              .lt("timestamp", continueTs)
          )
          .order("desc")
          .take(1),
        ctx.db
          .query("messages")
          .withIndex("by_conversation_timestamp", (q) =>
            q
              .eq("senderId", args.otherUserId)
              .eq("recipientId", userId)
              .lt("timestamp", continueTs)
          )
          .order("desc")
          .take(1),
      ]);
      hasMore = olderSent.length > 0 || olderReceived.length > 0;
    }

    return {
      page: combined,
      // Keep isDone for backward compatibility; reflect the more accurate hasMore
      isDone: !hasMore,
      hasMore,
      continueCursor: continueTs != null ? String(continueTs) : "",
      continueTimestamp: continueTs,
    } as any;
  },
});

// Mark messages as read with optimized batch processing
export const markMessagesAsRead = mutation({
  args: {
    otherUserId: v.id("users"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const timestamp = Date.now();

    // FIXED: More efficient approach using the optimized unread index
    // Get only unread messages to minimize unnecessary updates
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_unread_messages", (q) => 
        q.eq("recipientId", userId).eq("readAt", undefined)
      )
      .filter((q) => q.eq(q.field("senderId"), args.otherUserId))
      .take(100); // Limit batch size for performance

    // Early exit if no unread messages
    if (unreadMessages.length === 0) {
      return 0;
    }

    // Batch update messages - process in smaller chunks for better performance
    const batchSize = 20;
    for (let i = 0; i < unreadMessages.length; i += batchSize) {
      const batch = unreadMessages.slice(i, i + batchSize);
      await Promise.all(
        batch.map(message => 
          ctx.db.patch(message._id, { readAt: timestamp })
        )
      );
    }

    // Decrement unread count using sharded counter
    await unreadMessageCounter.subtract(ctx, userId, unreadMessages.length);

    // Update conversation read status using Action Retrier for proper retry logic
    // Schedule the retry action to run asynchronously
    await ctx.scheduler.runAfter(0, internal.messages.updateConversationReadStatusWithRetry, {
      userId,
      otherUserId: args.otherUserId,
      readAt: timestamp,
    });

    return unreadMessages.length;
  },
});

// Get total unread count for current user using sharded counter
export const getUnreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    // Use sharded counter for efficient unread count retrieval
    const unreadCount = await unreadMessageCounter.count(ctx, userId);
    
    // Cap at 999 for UI display consistency
    return Math.min(Math.round(unreadCount), 999);
  },
});

// Get unread count for a specific conversation using sharded counter
export const getConversationUnreadCount = query({
  args: {
    otherUserId: v.id("users"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    // Count unread messages from this specific user
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_unread_messages", (q) => 
        q.eq("recipientId", userId).eq("readAt", undefined)
      )
      .filter((q) => q.eq(q.field("senderId"), args.otherUserId))
      .collect();

    return unreadMessages.length;
  },
});

// Migration function to backfill existing unread counts into sharded counter
export const backfillUnreadCounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting unread counts backfill migration...");
    
    let usersProcessed = 0;
    let totalUnreadCounts = 0;
    
    // Get all users
    const users = await ctx.db.query("users").collect();
    
    for (const user of users) {
      usersProcessed++;
      
      // Count actual unread messages for this user
      const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_unread_messages", (q) =>
          q.eq("recipientId", user._id).eq("readAt", undefined)
        )
        .collect();
      
      const actualUnreadCount = unreadMessages.length;
      
      if (actualUnreadCount > 0) {
        // Set the sharded counter to the actual unread count
        // First reset to 0, then add the actual count
        await unreadMessageCounter.reset(ctx, user._id);
        await unreadMessageCounter.add(ctx, user._id, actualUnreadCount);
        totalUnreadCounts += actualUnreadCount;
        
        console.log(`User ${user._id}: backfilled ${actualUnreadCount} unread messages`);
      }
      
      // Log progress every 100 users
      if (usersProcessed % 100 === 0) {
        console.log(`Processed ${usersProcessed}/${users.length} users...`);
      }
    }
    
    console.log(`Migration completed! Processed ${usersProcessed} users, backfilled ${totalUnreadCounts} total unread messages.`);
    
    return {
      usersProcessed,
      totalUnreadCounts,
    };
  },
});


// Search users for messaging with optimized case-insensitive search
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.searchTerm.length < 2) return [];

    const limit = Math.min(args.limit || 10, 15);
    const searchTerm = args.searchTerm.toLowerCase().trim();

    // FIXED: Optimized case-insensitive search with better database-level filtering
    // Use the active players index and filter efficiently
    const allProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_active_players", (q) => 
        q.gte("gamesPlayed", 0)
      )
      .filter((q) => q.neq(q.field("userId"), userId))
      .take(150); // Take a reasonable batch for filtering

    // FIXED: Case-insensitive filtering with better performance and prioritization
    const filteredProfiles = allProfiles
      .filter(p => {
        const username = p.username.toLowerCase();
        return username.includes(searchTerm);
      })
      .sort((a, b) => {
        const aUsername = a.username.toLowerCase();
        const bUsername = b.username.toLowerCase();
        
        // Prioritize exact matches first
        const aStartsWith = aUsername.startsWith(searchTerm);
        const bStartsWith = bUsername.startsWith(searchTerm);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Then prioritize by games played (more active users first)
        if (a.gamesPlayed !== b.gamesPlayed) {
          return b.gamesPlayed - a.gamesPlayed;
        }
        
        // Finally sort alphabetically
        return aUsername.localeCompare(bUsername);
      })
      .slice(0, limit);

    return filteredProfiles.map(p => ({
      userId: p.userId,
      username: p.username,
      avatarUrl: p.avatarUrl,
      rank: p.rank,
      gamesPlayed: p.gamesPlayed,
    }));
  },
});

// Create lobby invite message
export const sendLobbyInvite: any = mutation({
  args: {
    recipientUsername: v.string(),
    lobbyId: v.id("lobbies"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get lobby details
    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) throw new Error("Lobby not found");
    if (lobby.hostId !== userId) throw new Error("Only lobby host can send invites");
    if (lobby.status !== "waiting") throw new Error("Lobby is not available");

    const content = args.message || `Join my lobby: ${lobby.name}`;

    return await ctx.runMutation(internal.messages.sendMessageInternal, {
      senderId: userId,
      recipientUsername: args.recipientUsername,
      content,
      messageType: "lobby_invite" as const,
      lobbyId: args.lobbyId,
      lobbyCode: lobby.lobbyCode,
      lobbyName: lobby.name,
    });
  },
});

// Create game spectate invite message
export const sendGameInvite: any = mutation({
  args: {
    recipientUsername: v.string(),
    gameId: v.id("games"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get game details
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    
    // Check if user is a player in the game
    if (game.player1Id !== userId && game.player2Id !== userId) {
      throw new Error("Only players can send game invites");
    }
    
    if (game.status !== "playing") throw new Error("Game is not active");

    const content = args.message || `Watch my game! ${game.player1Username} vs ${game.player2Username}`;

    return await ctx.runMutation(internal.messages.sendMessageInternal, {
      senderId: userId,
      recipientUsername: args.recipientUsername,
      content,
      messageType: "game_invite" as const,
      gameId: args.gameId,
    });
  },
});

// Internal mutation to send a message (used by invite functions)
export const sendMessageInternal = internalMutation({
  args: {
    senderId: v.id("users"),
    recipientUsername: v.string(),
    content: v.string(),
    messageType: v.union(v.literal("text"), v.literal("lobby_invite"), v.literal("game_invite")),
    lobbyId: v.optional(v.id("lobbies")),
    lobbyCode: v.optional(v.string()),
    lobbyName: v.optional(v.string()),
    gameId: v.optional(v.id("games")),
  },
  handler: async (ctx, args) => {
    // Get sender profile
    const senderProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.senderId))
      .unique();
    if (!senderProfile) throw new Error("Sender profile not found");

    // Get recipient profile
    const recipientProfile = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.recipientUsername))
      .unique();
    if (!recipientProfile) throw new Error("Recipient not found");

    const timestamp = Date.now();

    // Profanity: fully censor any profanity
    const fullyCensoredContent = profanity.censor(args.content, CensorType.Word);

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      senderId: args.senderId,
      senderUsername: senderProfile.username,
      recipientId: recipientProfile.userId,
      recipientUsername: args.recipientUsername,
      content: fullyCensoredContent,
      messageType: args.messageType,
      lobbyId: args.lobbyId,
      lobbyCode: args.lobbyCode,
      lobbyName: args.lobbyName,
      gameId: args.gameId,
      timestamp,
      deliveredAt: timestamp,
    });

    // Increment unread count for recipient using sharded counter
    await unreadMessageCounter.inc(ctx, recipientProfile.userId);

    // Update or create conversation with retry logic
    // Schedule the retry action to run asynchronously
    await ctx.scheduler.runAfter(0, internal.messages.updateConversationWithRetry, {
      participant1Id: args.senderId,
      participant1Username: senderProfile.username,
      participant2Id: recipientProfile.userId,
      participant2Username: args.recipientUsername,
      messageId,
      timestamp,
    });

    // Attempt to send a push notification to the recipient (async)
    await ctx.scheduler.runAfter(0, internal.pushNode.sendPushForMessage, { messageId });

    return messageId;
  },
});

// (push notification logic moved to convex/push.ts)

// Internal mutation to update conversation
export const updateConversation = internalMutation({
  args: {
    participant1Id: v.id("users"),
    participant1Username: v.string(),
    participant2Id: v.id("users"),
    participant2Username: v.string(),
    messageId: v.id("messages"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Find existing conversation (either direction)
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) => 
        q.eq("participant1Id", args.participant1Id).eq("participant2Id", args.participant2Id)
      )
      .unique();

    if (!conversation) {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) => 
          q.eq("participant1Id", args.participant2Id).eq("participant2Id", args.participant1Id)
        )
        .unique();
    }

    if (conversation) {
      // Update existing conversation with retry logic for write conflicts
      const isParticipant1Sender = conversation.participant1Id === args.participant1Id;
      
      try {
        // Re-fetch conversation to get latest state
        const latestConversation = await ctx.db.get(conversation._id);
        if (!latestConversation) return;

        // Check if update is still needed (avoid redundant updates)
        const needsUpdate = 
          latestConversation.lastMessageId !== args.messageId ||
          latestConversation.lastMessageAt !== args.timestamp;

        if (!needsUpdate) {
          return; // No update needed
        }

        // Prepare update object
        const updateData: any = {
          lastMessageId: args.messageId,
          lastMessageAt: args.timestamp,
        };

        // Note: Unread count is now handled by sharded counter in sendMessage
        // No need to increment unread count here anymore

        // Clear typing indicator for sender upon sending (only if they were typing)
        if (isParticipant1Sender && latestConversation.participant1TypingAt) {
          updateData.participant1TypingAt = undefined;
        } else if (!isParticipant1Sender && latestConversation.participant2TypingAt) {
          updateData.participant2TypingAt = undefined;
        }

        await ctx.db.patch(conversation._id, updateData);
      } catch (error) {
        console.warn("Failed to update conversation:", error);
        // Continue execution - the message was already sent successfully
      }
    } else {
      // Create new conversation
      await ctx.db.insert("conversations", {
        participant1Id: args.participant1Id,
        participant1Username: args.participant1Username,
        participant2Id: args.participant2Id,
        participant2Username: args.participant2Username,
        lastMessageId: args.messageId,
        lastMessageAt: args.timestamp,
        participant1UnreadCount: 0, // Legacy field - not used anymore
        participant2UnreadCount: 0, // Legacy field - not used anymore
        createdAt: args.timestamp,
        participant1TypingAt: undefined,
        participant2TypingAt: undefined,
      });
    }
  },
});

// Mutation: update typing status for the current user in a conversation
export const setTyping = mutation({
  args: {
    otherUserId: v.id("users"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the conversation in either direction
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.eq("participant1Id", userId).eq("participant2Id", args.otherUserId)
      )
      .unique();

    if (!conversation) {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) =>
          q.eq("participant1Id", args.otherUserId).eq("participant2Id", userId)
        )
        .unique();
    }

    if (!conversation) {
      return null; // No conversation exists yet, nothing to update
    }

    const now = Date.now();
    const isParticipant1 = conversation.participant1Id === userId;
    const currentTypingAt = isParticipant1 
      ? conversation.participant1TypingAt 
      : conversation.participant2TypingAt;

    // Rate limit typing updates to prevent excessive conflicts
    if (!shouldAllowTypingUpdate(userId, args.otherUserId, args.isTyping)) {
      return null; // Skip update due to rate limiting
    }

    // Enhanced debouncing logic to reduce conflicts
    const TYPING_DEBOUNCE_MS = 1500; // Only update if more than 1.5 seconds has passed
    const TYPING_STOP_DEBOUNCE_MS = 500; // Shorter debounce for stopping typing
    
    if (args.isTyping && currentTypingAt && (now - currentTypingAt) < TYPING_DEBOUNCE_MS) {
      return null; // Skip update if recently updated and still typing
    }
    
    if (!args.isTyping && currentTypingAt && (now - currentTypingAt) < TYPING_STOP_DEBOUNCE_MS) {
      return null; // Skip update if recently stopped typing
    }

    // Update typing status with conflict resolution
    try {
      // Re-fetch conversation to get latest state
      const latestConversation = await ctx.db.get(conversation._id);
      if (!latestConversation) return null;

      const latestTypingAt = isParticipant1 
        ? latestConversation.participant1TypingAt 
        : latestConversation.participant2TypingAt;

      // Enhanced conflict detection - check if update is still needed
      const needsUpdate = args.isTyping 
        ? !latestTypingAt || (now - latestTypingAt) >= TYPING_DEBOUNCE_MS
        : latestTypingAt !== undefined;

      if (!needsUpdate) {
        return null; // No update needed
      }
      
      // Additional check: if someone else is updating this conversation, skip to avoid conflicts
      const timeSinceLastMessage = latestConversation.lastMessageAt ? (now - latestConversation.lastMessageAt) : Infinity;
      if (timeSinceLastMessage < 2000) { // If message was sent within last 2 seconds, skip typing update
        return null; // Skip to avoid conflicts with message updates
      }

      // Perform the update
      await ctx.db.patch(conversation._id, {
        ...(isParticipant1
          ? { participant1TypingAt: args.isTyping ? now : undefined }
          : { participant2TypingAt: args.isTyping ? now : undefined })
      });
    } catch (error) {
      console.warn("Failed to update typing status:", error);
      // Continue execution - typing status is not critical
    }

    return null;
  },
});

// Query: get typing status of the other user in a conversation
export const getTypingStatus = query({
  args: {
    otherUserId: v.id("users"),
  },
  returns: v.object({
    isTyping: v.boolean(),
    lastActiveAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { isTyping: false } as any;

    // Find conversation either direction
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.eq("participant1Id", userId).eq("participant2Id", args.otherUserId)
      )
      .unique();

    if (!conversation) {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) =>
          q.eq("participant1Id", args.otherUserId).eq("participant2Id", userId)
        )
        .unique();
    }

    if (!conversation) return { isTyping: false } as any;

    const isParticipant1 = conversation.participant1Id === userId;
    const otherTypingAt = isParticipant1
      ? conversation.participant2TypingAt
      : conversation.participant1TypingAt;

    if (!otherTypingAt) return { isTyping: false } as any;

    const TYPING_TIMEOUT_MS = 5000; // consider typing if within last 5s
    const isTyping = Date.now() - otherTypingAt < TYPING_TIMEOUT_MS;

    return { isTyping, lastActiveAt: otherTypingAt } as any;
  },
});

// Internal mutation to update conversation read status
export const updateConversationReadStatus = internalMutation({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
    readAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Find the conversation
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) => 
        q.eq("participant1Id", args.userId).eq("participant2Id", args.otherUserId)
      )
      .unique();

    if (!conversation) {
      conversation = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) => 
          q.eq("participant1Id", args.otherUserId).eq("participant2Id", args.userId)
        )
        .unique();
    }

    if (!conversation) {
      return; // No conversation exists
    }

    const isParticipant1 = conversation.participant1Id === args.userId;
    
    try {
      // Re-fetch conversation to get latest state
      const latestConversation = await ctx.db.get(conversation._id);
      if (!latestConversation) return;

      // Enhanced early exit logic to avoid unnecessary write conflicts
      // Note: Unread count is now handled by sharded counter
      const currentLastRead = isParticipant1 
        ? latestConversation.participant1LastRead 
        : latestConversation.participant2LastRead;

      // Skip if already up to date
      if ((currentLastRead || 0) >= args.readAt) {
        return; // No update needed
      }

      // Skip if there are recent typing updates to avoid conflicts
      const otherTypingAt = isParticipant1 
        ? latestConversation.participant2TypingAt 
        : latestConversation.participant1TypingAt;
      
      if (otherTypingAt && (Date.now() - otherTypingAt) < 3000) {
        // Skip update if other user is actively typing to avoid conflicts
        return;
      }

      // Prepare update object
      const updateData: any = {};
      if (isParticipant1) {
        updateData.participant1LastRead = args.readAt;
        // Note: Unread count is now handled by sharded counter
      } else {
        updateData.participant2LastRead = args.readAt;
        // Note: Unread count is now handled by sharded counter
      }

      await ctx.db.patch(conversation._id, updateData);
    } catch (error) {
      console.warn("Failed to update conversation read status:", error);
      // Continue execution - read status update is not critical
    }
  },
});
