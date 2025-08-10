import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

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

    // Use a more efficient approach with a single query
    // Get conversations where user is participant1
    const conversations1Query = ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1Id", userId))
      .order("desc");

    // Get conversations where user is participant2  
    const conversations2Query = ctx.db
      .query("conversations")
      .withIndex("by_participant2", (q) => q.eq("participant2Id", userId))
      .order("desc");

    // Execute both queries and combine results
    const [conversations1, conversations2] = await Promise.all([
      conversations1Query.take(limit * 2), // Take more to ensure we have enough after sorting
      conversations2Query.take(limit * 2),
    ]);

    // Combine and sort by lastMessageAt
    const allConversations = [...conversations1, ...conversations2]
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
      .slice(0, limit);

    // Enhance with minimal data needed - avoid fetching full profiles
    const enhanced = await Promise.all(
      allConversations.map(async (conv) => {
        const isParticipant1 = conv.participant1Id === userId;
        const otherParticipantId = isParticipant1 ? conv.participant2Id : conv.participant1Id;
        const otherUsername = isParticipant1 ? conv.participant2Username : conv.participant1Username;
        
        // Only fetch profile for avatar and rank if needed
        const otherParticipantProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", otherParticipantId))
          .unique();
        
        // Get last message only if we need it for display
        const lastMessage = conv.lastMessageId ? await ctx.db.get(conv.lastMessageId) : null;
        
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: "" };

    const { paginationOpts } = args;
    const limit = paginationOpts ? Math.min(paginationOpts.numItems, 50) : 20;

    // Use optimized approach with the new conversation timestamp indexes
    // This will be more efficient than the previous filter-based approach
    const [sentMessages, receivedMessages] = await Promise.all([
      // Messages sent from current user to other user
      ctx.db
        .query("messages")
        .withIndex("by_sender_timestamp", (q) => q.eq("senderId", userId))
        .filter((q) => q.eq(q.field("recipientId"), args.otherUserId))
        .order("desc")
        .take(limit),
      
      // Messages received from other user
      ctx.db
        .query("messages")
        .withIndex("by_recipient_timestamp", (q) => q.eq("recipientId", userId))
        .filter((q) => q.eq(q.field("senderId"), args.otherUserId))
        .order("desc")
        .take(limit)
    ]);

    // Combine and sort by timestamp
    const allMessages = [...sentMessages, ...receivedMessages]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    if (paginationOpts && paginationOpts.cursor) {
      // For cursor-based pagination, filter messages before the cursor
      const cursorIndex = allMessages.findIndex(msg => msg._id === paginationOpts.cursor);
      const paginatedMessages = cursorIndex > 0 ? allMessages.slice(0, cursorIndex) : allMessages;
      
      return {
        page: paginatedMessages.slice(0, limit),
        isDone: paginatedMessages.length < limit,
        continueCursor: paginatedMessages.length > 0 ? paginatedMessages[paginatedMessages.length - 1]._id : "",
      };
    } else {
      return {
        page: allMessages,
        isDone: allMessages.length < limit,
        continueCursor: allMessages.length > 0 ? allMessages[allMessages.length - 1]._id : "",
      };
    }
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const timestamp = Date.now();

    // Mark all unread messages from the other user as read
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_recipient_read", (q) => 
        q.eq("recipientId", userId).eq("readAt", undefined)
      )
      .filter((q) => q.eq(q.field("senderId"), args.otherUserId))
      .collect();

    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, { readAt: timestamp });
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

// Get total unread count for current user - Highly optimized with new indexes
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    // Use the new optimized unread indexes for much better performance
    const [unreadConversations1, unreadConversations2] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_participant1_unread", (q) => 
          q.eq("participant1Id", userId).gt("participant1UnreadCount", 0)
        )
        .collect(),
      ctx.db
        .query("conversations")
        .withIndex("by_participant2_unread", (q) => 
          q.eq("participant2Id", userId).gt("participant2UnreadCount", 0)
        )
        .collect()
    ]);

    let totalUnread = 0;
    
    // Sum unread counts efficiently
    for (const conv of unreadConversations1) {
      totalUnread += conv.participant1UnreadCount;
    }
    
    for (const conv of unreadConversations2) {
      totalUnread += conv.participant2UnreadCount;
    }

    return totalUnread;
  },
});

// Search users for messaging with highly optimized query using new indexes
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
    const searchTerm = args.searchTerm.toLowerCase();

    // Use the new optimized username prefix index for better performance
    const prefixMatches = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.gte("username", searchTerm))
      .filter((q) => 
        q.and(
          q.neq(q.field("userId"), userId),
          q.lt(q.field("username"), searchTerm + "\uffff") // Prefix search optimization
        )
      )
      .order("asc") // Order by username for consistent results
      .take(limit);

    // If we need more results and didn't get enough prefix matches, search for contains
    let containsMatches: any[] = [];
    if (prefixMatches.length < limit) {
      containsMatches = await ctx.db
        .query("profiles")
        .withIndex("by_active_players") // Use active players index for better performance
        .filter((q) => 
          q.and(
            q.neq(q.field("userId"), userId),
            q.gt(q.field("gamesPlayed"), 0) // Prioritize active players
          )
        )
        .take(limit * 2) // Take more for filtering
        .then(profiles => 
          profiles
            .filter(p => 
              p.username.toLowerCase().includes(searchTerm) &&
              !prefixMatches.some(pm => pm._id === p._id)
            )
            .slice(0, limit - prefixMatches.length)
        );
    }

    const allResults = [...prefixMatches, ...containsMatches];

    return allResults.map(p => ({
      userId: p.userId,
      username: p.username,
      avatarUrl: p.avatarUrl,
      rank: p.rank,
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
