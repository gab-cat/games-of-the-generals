import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

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

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      senderId: userId,
      senderUsername: senderProfile.username,
      senderAvatarUrl: senderProfile.avatarUrl,
      recipientId: recipientProfile.userId,
      recipientUsername: args.recipientUsername,
      content: args.content,
      messageType: args.messageType,
      lobbyId: args.lobbyId,
      lobbyCode: args.lobbyCode,
      lobbyName: args.lobbyName,
      gameId: args.gameId,
      timestamp,
      deliveredAt: timestamp,
    });

    // Update or create conversation
    await ctx.runMutation(internal.messages.updateConversation, {
      participant1Id: userId,
      participant1Username: senderProfile.username,
      participant2Id: recipientProfile.userId,
      participant2Username: args.recipientUsername,
      messageId,
      timestamp,
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

    // Enhance conversations with batched data
    const enhanced = allConversations.map(conv => {
      const isParticipant1 = conv.participant1Id === userId;
      const otherParticipantId = isParticipant1 ? conv.participant2Id : conv.participant1Id;
      const otherUsername = isParticipant1 ? conv.participant2Username : conv.participant1Username;
      
      const otherParticipantProfile = profilesMap.get(otherParticipantId);
      const lastMessage = conv.lastMessageId ? messagesMap.get(conv.lastMessageId) : null;
      
      return {
        ...conv,
        lastMessage,
        otherParticipant: {
          id: otherParticipantId,
          username: otherUsername,
          avatarUrl: otherParticipantProfile?.avatarUrl,
          rank: otherParticipantProfile?.rank,
        },
        unreadCount: isParticipant1 ? conv.participant1UnreadCount : conv.participant2UnreadCount,
        lastReadAt: isParticipant1 ? conv.participant1LastRead : conv.participant2LastRead,
      };
    });

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
    beforeTimestamp: v.optional(v.number()),
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: "" };

    const { paginationOpts, beforeTimestamp } = args;
    const limit = paginationOpts ? Math.min(paginationOpts.numItems, 50) : 20;

    // FIXED: More efficient query strategy using the conversation timestamp indexes
    // Query both directions and combine results more efficiently
    let allMessages: any[] = [];

    if (paginationOpts && paginationOpts.cursor) {
      // For cursor-based pagination, use a more efficient approach
      const [sentMessages, receivedMessages] = await Promise.all([
        ctx.db
          .query("messages")
          .withIndex("by_conversation_timestamp", (q) => 
            q.eq("senderId", userId).eq("recipientId", args.otherUserId)
          )
          .order("desc")
          .paginate({
            numItems: Math.ceil(limit / 2),
            cursor: paginationOpts.cursor,
          }),
        
        ctx.db
          .query("messages")
          .withIndex("by_conversation_timestamp", (q) => 
            q.eq("senderId", args.otherUserId).eq("recipientId", userId)
          )
          .order("desc")
          .paginate({
            numItems: Math.ceil(limit / 2),
            cursor: paginationOpts.cursor,
          })
      ]);

      // Combine paginated results
      allMessages = [...sentMessages.page, ...receivedMessages.page]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      return {
        page: allMessages,
        isDone: sentMessages.isDone && receivedMessages.isDone,
        continueCursor: allMessages.length > 0 ? allMessages[allMessages.length - 1]._id : "",
      };
    } else {
      // Initial load or timestamp-based pagination
      let sentQuery = ctx.db
        .query("messages")
        .withIndex("by_conversation_timestamp", (q) => 
          q.eq("senderId", userId).eq("recipientId", args.otherUserId)
        )
        .order("desc");

      let receivedQuery = ctx.db
        .query("messages")
        .withIndex("by_conversation_timestamp", (q) => 
          q.eq("senderId", args.otherUserId).eq("recipientId", userId)
        )
        .order("desc");

      // Apply timestamp filter if provided
      if (beforeTimestamp) {
        sentQuery = sentQuery.filter((q) => q.lt(q.field("timestamp"), beforeTimestamp));
        receivedQuery = receivedQuery.filter((q) => q.lt(q.field("timestamp"), beforeTimestamp));
      }

      const [sentMessages, receivedMessages] = await Promise.all([
        sentQuery.take(limit),
        receivedQuery.take(limit)
      ]);

      // Combine and sort by timestamp
      allMessages = [...sentMessages, ...receivedMessages]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      // Check if there are more messages
      const hasMoreMessages = sentMessages.length >= limit || receivedMessages.length >= limit;

      return {
        page: allMessages,
        isDone: !hasMoreMessages,
        continueCursor: allMessages.length > 0 ? allMessages[allMessages.length - 1]._id : "",
        hasMore: hasMoreMessages,
      };
    }
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

    // Update conversation read status
    await ctx.runMutation(internal.messages.updateConversationReadStatus, {
      userId,
      otherUserId: args.otherUserId,
      readAt: timestamp,
    });

    return unreadMessages.length;
  },
});

// Get total unread count for current user - Highly optimized with caching
export const getUnreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    // FIXED: More efficient approach using the optimized unread indexes
    // Query both participant indexes in parallel for better performance
    const [unreadConversations1, unreadConversations2] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_participant1_unread", (q) => 
          q.eq("participant1Id", userId).gt("participant1UnreadCount", 0)
        )
        .take(50), // Limit to prevent excessive data transfer
      ctx.db
        .query("conversations")
        .withIndex("by_participant2_unread", (q) => 
          q.eq("participant2Id", userId).gt("participant2UnreadCount", 0)
        )
        .take(50) // Limit to prevent excessive data transfer
    ]);

    let totalUnread = 0;
    
    // Sum unread counts efficiently with early termination for large counts
    for (const conv of unreadConversations1) {
      totalUnread += conv.participant1UnreadCount;
      if (totalUnread > 999) break; // Cap at 999+ for UI purposes
    }
    
    for (const conv of unreadConversations2) {
      totalUnread += conv.participant2UnreadCount;
      if (totalUnread > 999) break; // Cap at 999+ for UI purposes
    }

    return Math.min(totalUnread, 999); // Cap at 999 for UI display
  },
});

// Get recent unread messages for notifications - Optimized for better performance
export const getRecentUnreadMessages = query({
  args: {
    sinceTimestamp: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = Math.min(args.limit || 10, 15); // Reduced max limit for better performance

    // OPTIMIZED: Use the most efficient index and add early filtering
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_unread_messages", (q) => 
        q.eq("recipientId", userId).eq("readAt", undefined)
      )
      .filter((q) => q.gte(q.field("timestamp"), args.sinceTimestamp))
      .order("desc")
      .take(limit);

    // Return early if no messages to avoid unnecessary processing
    if (messages.length === 0) return [];

    // OPTIMIZED: Only return essential fields for notifications to reduce data transfer
    return messages.map(msg => ({
      _id: msg._id,
      senderId: msg.senderId,
      senderUsername: msg.senderUsername,
      senderAvatarUrl: msg.senderAvatarUrl,
      content: msg.content,
      messageType: msg.messageType,
      timestamp: msg.timestamp,
      lobbyId: msg.lobbyId,
      lobbyName: msg.lobbyName,
      gameId: msg.gameId,
    }));
  },
});

// Set typing status for a conversation
export const setTyping = mutation({
  args: {
    otherUserId: v.id("users"),
    isTyping: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const timestamp = args.isTyping ? Date.now() : undefined;

    // Find the conversation
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

    if (conversation) {
      const isParticipant1 = conversation.participant1Id === userId;
      
      await ctx.db.patch(conversation._id, {
        ...(isParticipant1 
          ? { participant1TypingAt: timestamp }
          : { participant2TypingAt: timestamp }
        ),
      });
    } else if (args.isTyping) {
      // Create conversation if it doesn't exist and user is starting to type
      const userProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      
      const otherUserProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", args.otherUserId))
        .unique();

      if (userProfile && otherUserProfile) {
        await ctx.db.insert("conversations", {
          participant1Id: userId,
          participant1Username: userProfile.username,
          participant2Id: args.otherUserId,
          participant2Username: otherUserProfile.username,
          lastMessageAt: Date.now(),
          participant1UnreadCount: 0,
          participant2UnreadCount: 0,
          participant1TypingAt: timestamp,
          createdAt: Date.now(),
        });
      }
    }

    return null;
  },
});

// Get typing status of other user in conversation
export const getTypingStatus = query({
  args: {
    otherUserId: v.id("users"),
  },
  returns: v.object({
    isTyping: v.boolean(),
    typingAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { isTyping: false };

    // Find the conversation
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
      return { isTyping: false };
    }

    const isParticipant1 = conversation.participant1Id === userId;
    const otherUserTypingAt = isParticipant1 
      ? conversation.participant2TypingAt 
      : conversation.participant1TypingAt;

    // Consider typing indicator expired after 5 seconds
    const now = Date.now();
    const isTyping = otherUserTypingAt ? (now - otherUserTypingAt < 5000) : false;

    return { 
      isTyping,
      typingAt: otherUserTypingAt,
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

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      senderId: args.senderId,
      senderUsername: senderProfile.username,
      senderAvatarUrl: senderProfile.avatarUrl,
      recipientId: recipientProfile.userId,
      recipientUsername: args.recipientUsername,
      content: args.content,
      messageType: args.messageType,
      lobbyId: args.lobbyId,
      lobbyCode: args.lobbyCode,
      lobbyName: args.lobbyName,
      gameId: args.gameId,
      timestamp,
      deliveredAt: timestamp,
    });

    // Update or create conversation
    await ctx.runMutation(internal.messages.updateConversation, {
      participant1Id: args.senderId,
      participant1Username: senderProfile.username,
      participant2Id: recipientProfile.userId,
      participant2Username: args.recipientUsername,
      messageId,
      timestamp,
    });

    return messageId;
  },
});

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
      // Update existing conversation
      const isParticipant1Sender = conversation.participant1Id === args.participant1Id;
      
      await ctx.db.patch(conversation._id, {
        lastMessageId: args.messageId,
        lastMessageAt: args.timestamp,
        // Increment unread count for recipient
        ...(isParticipant1Sender 
          ? { participant2UnreadCount: conversation.participant2UnreadCount + 1 }
          : { participant1UnreadCount: conversation.participant1UnreadCount + 1 }
        ),
      });
    } else {
      // Create new conversation
      await ctx.db.insert("conversations", {
        participant1Id: args.participant1Id,
        participant1Username: args.participant1Username,
        participant2Id: args.participant2Id,
        participant2Username: args.participant2Username,
        lastMessageId: args.messageId,
        lastMessageAt: args.timestamp,
        participant1UnreadCount: 0,
        participant2UnreadCount: 1, // New message for participant2
        createdAt: args.timestamp,
      });
    }
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

    if (conversation) {
      const isParticipant1 = conversation.participant1Id === args.userId;
      
      await ctx.db.patch(conversation._id, {
        ...(isParticipant1 
          ? { 
              participant1LastRead: args.readAt,
              participant1UnreadCount: 0,
            }
          : { 
              participant2LastRead: args.readAt,
              participant2UnreadCount: 0,
            }
        ),
      });
    }
  },
});
