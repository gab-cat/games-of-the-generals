import { internalMutation } from "./_generated/server";

// Internal: Delete all anonymous users and clean up dependent data that could break UIs
// - Does NOT touch games or moves to keep replays safe
// - Deletes profiles, presets, achievements, push subscriptions, email verifications
// - Deletes waiting lobbies hosted by the anonymous user (avoids ghost lobbies)
// - Leaves playing/finished lobbies and all games intact
export const deleteAnonymousUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find all anonymous users
    const anonymousUsers = await ctx.db
      .query("users")
      .withIndex("by_isAnonymous", (q) => q.eq("isAnonymous", true))
      .collect();

    for (const user of anonymousUsers) {
      const userId = user._id;

      // Delete profile (if any)
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      if (profile) {
        await ctx.db.delete(profile._id);
      }

      // Delete user-specific data that is safe to remove
      const [presets, achievements, pushes, verifications, aiSessions] = await Promise.all([
        ctx.db.query("setupPresets").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("achievements").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("pushSubscriptions").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("emailChangeVerifications").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("aiGameSessions").withIndex("by_player", (q) => q.eq("playerId", userId)).collect(),
      ]);

      // Find conversations where user is participant1 or participant2
      const [conversationsAsParticipant1, conversationsAsParticipant2] = await Promise.all([
        ctx.db.query("conversations").withIndex("by_participant1", (q) => q.eq("participant1Id", userId)).collect(),
        ctx.db.query("conversations").withIndex("by_participant2", (q) => q.eq("participant2Id", userId)).collect(),
      ]);

      const conversations = [...conversationsAsParticipant1, ...conversationsAsParticipant2];

      // Delete messages from conversations this user is part of
      for (const conversation of conversations) {
        const otherParticipantId = conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id;

        // Get all messages between these two users (in both directions)
        const [messagesFromUser, messagesToUser] = await Promise.all([
          ctx.db.query("messages").withIndex("by_sender", (q) => q.eq("senderId", userId))
            .filter((q) => q.eq(q.field("recipientId"), otherParticipantId)).collect(),
          ctx.db.query("messages").withIndex("by_recipient", (q) => q.eq("recipientId", userId))
            .filter((q) => q.eq(q.field("senderId"), otherParticipantId)).collect(),
        ]);

        const conversationMessages = [...messagesFromUser, ...messagesToUser];
        for (const message of conversationMessages) {
          await ctx.db.delete(message._id);
        }
      }

      // Delete the conversations themselves
      for (const conversation of conversations) {
        await ctx.db.delete(conversation._id);
      }

      for (const doc of [...presets, ...achievements, ...pushes, ...verifications, ...aiSessions]) {
        await ctx.db.delete(doc._id);
      }

      // Delete waiting lobbies hosted by this user (avoid ghost lobbies)
      const hostedLobbies = await ctx.db
        .query("lobbies")
        .withIndex("by_host", (q) => q.eq("hostId", userId))
        .collect();

      for (const lobby of hostedLobbies) {
        if (lobby.status === "waiting") {
          await ctx.db.delete(lobby._id);
        }
      }

      // Finally, delete the auth user itself
      await ctx.db.delete(userId);
    }

    return { deletedUsers: anonymousUsers.length };
  },
});

// Internal: Cleanup finished lobbies. Games and replays remain intact.
export const cleanupFinishedLobbies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const finishedLobbies = await ctx.db
      .query("lobbies")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .collect();

    for (const lobby of finishedLobbies) {
      await ctx.db.delete(lobby._id);
    }

    return { deletedLobbies: finishedLobbies.length };
  },
});

// Internal: Delete messages older than 7 days to enforce retention policy
export const deleteOldMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - SEVEN_DAYS_MS;

    let totalDeleted = 0;
    let unreadCountAdjustments = 0;

    // First pass: Handle unread count adjustments for old unread messages
    // Process in batches to avoid timeouts
    while (true) {
      const oldUnreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
        .filter((q) => q.eq(q.field("readAt"), undefined))
        .take(100); // Smaller batch for unread processing

      if (oldUnreadMessages.length === 0) break;

      // Group messages by conversation to batch unread count updates
      const conversationUpdates = new Map();

      for (const message of oldUnreadMessages) {
        // Find the conversation for this message
        let conversation = await ctx.db
          .query("conversations")
          .withIndex("by_participants", (q) =>
            q.eq("participant1Id", message.senderId).eq("participant2Id", message.recipientId)
          )
          .unique();

        if (!conversation) {
          conversation = await ctx.db
            .query("conversations")
            .withIndex("by_participants", (q) =>
              q.eq("participant1Id", message.recipientId).eq("participant2Id", message.senderId)
            )
            .unique();
        }

        if (conversation) {
          const conversationId = conversation._id;
          const isParticipant1Recipient = conversation.participant1Id === message.recipientId;

          if (!conversationUpdates.has(conversationId)) {
            conversationUpdates.set(conversationId, {
              conversation,
              unreadDecrement: 0,
            });
          }

          const update = conversationUpdates.get(conversationId)!;
          update.unreadDecrement += 1;

          // Store which participant needs the decrement
          if (!update.participantToUpdate) {
            update.participantToUpdate = isParticipant1Recipient ? 'participant1' : 'participant2';
          }
        }
      }

      // Apply unread count adjustments in batches
      for (const [conversationId, update] of conversationUpdates) {
        const { conversation, unreadDecrement, participantToUpdate } = update;

        if (participantToUpdate === 'participant1') {
          const newCount = Math.max(0, conversation.participant1UnreadCount - unreadDecrement);
          await ctx.db.patch(conversationId, {
            participant1UnreadCount: newCount
          });
        } else {
          const newCount = Math.max(0, conversation.participant2UnreadCount - unreadDecrement);
          await ctx.db.patch(conversationId, {
            participant2UnreadCount: newCount
          });
        }

        unreadCountAdjustments += unreadDecrement;
      }
    }

    // Second pass: Delete all old messages (both read and unread)
    // Delete in batches to avoid timeouts
    while (true) {
      const oldMessages = await ctx.db
        .query("messages")
        .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
        .take(200);

      if (oldMessages.length === 0) break;

      await Promise.all(oldMessages.map((m) => ctx.db.delete(m._id)));
      totalDeleted += oldMessages.length;
    }

    return {
      deletedMessages: totalDeleted,
      unreadCountAdjustments,
      cutoff
    };
  },
});

// Internal: Migration to fix incorrect unread counts caused by old deletion process
// This fixes conversations where unread counts don't match actual unread messages
export const fixUnreadCounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    let conversationsProcessed = 0;
    let conversationsFixed = 0;
    let totalAdjustments = 0;

    // Get all conversations in batches to avoid timeouts
    const allConversations = await ctx.db.query("conversations").collect();

    for (const conversation of allConversations) {
      conversationsProcessed++;

      // Count actual unread messages for participant1 (messages sent to them that they haven't read)
      const participant1UnreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_recipient_read", (q) =>
          q.eq("recipientId", conversation.participant1Id)
            .eq("readAt", undefined)
        )
        .filter((q) => q.eq(q.field("senderId"), conversation.participant2Id))
        .collect();

      // Count actual unread messages for participant2 (messages sent to them that they haven't read)
      const participant2UnreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_recipient_read", (q) =>
          q.eq("recipientId", conversation.participant2Id)
            .eq("readAt", undefined)
        )
        .filter((q) => q.eq(q.field("senderId"), conversation.participant1Id))
        .collect();

      const actualParticipant1UnreadCount = participant1UnreadMessages.length;
      const actualParticipant2UnreadCount = participant2UnreadMessages.length;

      // Check if counts need to be fixed
      const participant1NeedsFix = conversation.participant1UnreadCount !== actualParticipant1UnreadCount;
      const participant2NeedsFix = conversation.participant2UnreadCount !== actualParticipant2UnreadCount;

      if (participant1NeedsFix || participant2NeedsFix) {
        conversationsFixed++;

        const updateData: any = {};

        if (participant1NeedsFix) {
          updateData.participant1UnreadCount = actualParticipant1UnreadCount;
          totalAdjustments += Math.abs(conversation.participant1UnreadCount - actualParticipant1UnreadCount);
        }

        if (participant2NeedsFix) {
          updateData.participant2UnreadCount = actualParticipant2UnreadCount;
          totalAdjustments += Math.abs(conversation.participant2UnreadCount - actualParticipant2UnreadCount);
        }

        await ctx.db.patch(conversation._id, updateData);
      }
    }

    return {
      conversationsProcessed,
      conversationsFixed,
      totalAdjustments
    };
  },
});

// Internal: Cleanup orphaned conversations where one or both participants no longer exist
export const cleanupOrphanedConversations = internalMutation({
  args: {},
  handler: async (ctx) => {
    let deletedConversations = 0;
    let deletedMessages = 0;

    // Get all conversations
    const allConversations = await ctx.db.query("conversations").collect();

    for (const conversation of allConversations) {
      // Check if both participants still exist
      const [participant1Exists, participant2Exists] = await Promise.all([
        ctx.db.get(conversation.participant1Id).then(user => !!user),
        ctx.db.get(conversation.participant2Id).then(user => !!user),
      ]);

      // If either participant doesn't exist, delete the conversation and its messages
      if (!participant1Exists || !participant2Exists) {
        // Delete all messages in this conversation
        const [messagesFromParticipant1, messagesFromParticipant2] = await Promise.all([
          ctx.db.query("messages").withIndex("by_sender", (q) => q.eq("senderId", conversation.participant1Id))
            .filter((q) => q.eq(q.field("recipientId"), conversation.participant2Id)).collect(),
          ctx.db.query("messages").withIndex("by_sender", (q) => q.eq("senderId", conversation.participant2Id))
            .filter((q) => q.eq(q.field("recipientId"), conversation.participant1Id)).collect(),
        ]);

        const conversationMessages = [...messagesFromParticipant1, ...messagesFromParticipant2];
        for (const message of conversationMessages) {
          await ctx.db.delete(message._id);
          deletedMessages++;
        }

        // Delete the conversation itself
        await ctx.db.delete(conversation._id);
        deletedConversations++;
      }
    }

    return { deletedConversations, deletedMessages };
  },
});
