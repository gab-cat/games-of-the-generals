import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { Presence } from "@convex-dev/presence";
import { Doc } from "./_generated/dataModel";
import { deleteUserAndData, hasRealLogin, isInLiveGame } from "./lib/userCleanup";

// Guest accounts are deleted every day at 00:00 UTC (the sign-in page and the
// "save your guest account" popup say so), with their data and login rows.
// Skipped: guests mid-game (deleted the next day) and guests that have since
// attached a real login. Walks every guest with a cursor, a page at a time.
export const deleteAnonymousUsers = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("users")
      .withIndex("by_isAnonymous", (q) => q.eq("isAnonymous", true))
      .paginate({ numItems: 40, cursor: args.cursor ?? null });

    let deletedUsers = 0;
    for (const user of page.page) {
      if ((await hasRealLogin(ctx, user._id)) || (await isInLiveGame(ctx, user._id))) continue;
      await deleteUserAndData(ctx, user._id);
      deletedUsers++;
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(500, internal.maintenance.deleteAnonymousUsers, {
        cursor: page.continueCursor,
      });
    }
    return { deletedUsers, scanned: page.page.length };
  },
});

// Internal: Cleanup finished lobbies. Games and replays remain intact.
// OPTIMIZED: Added limit to prevent excessive document scanning
export const cleanupFinishedLobbies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const finishedLobbies = await ctx.db
      .query("lobbies")
      .withIndex("by_status", (q) => q.eq("status", "finished"))
      .take(100); // Process in batches to avoid timeout

    for (const lobby of finishedLobbies) {
      await ctx.db.delete(lobby._id);
    }

    return { deletedLobbies: finishedLobbies.length };
  },
});

// Internal: Delete messages older than 7 days to enforce retention policy
// Optimized to avoid 32K document read limit by using smaller batches and simpler logic
// 
// Key optimizations:
// 1. Reduced batch size from 200 to 50 messages to stay well under document read limits
// 2. Removed complex unread count adjustment logic that was reading too many documents
// 3. Let the existing fixUnreadCounts function handle any unread count discrepancies
// 4. Uses efficient timestamp index for finding old messages
export const deleteOldMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - SEVEN_DAYS_MS;

    let totalDeleted = 0;
    const BATCH_SIZE = 50; // Smaller batch size to avoid document read limits

    // Delete old messages in small batches to avoid hitting document read limits
    // We don't try to adjust unread counts here - let the fixUnreadCounts function handle any discrepancies
    while (true) {
      // Use the timestamp index to efficiently find old messages
      const oldMessages = await ctx.db
        .query("messages")
        .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
        .take(BATCH_SIZE);

      if (oldMessages.length === 0) break;

      // Delete messages in parallel for better performance
      await Promise.all(oldMessages.map((message) => ctx.db.delete(message._id)));
      totalDeleted += oldMessages.length;

      // If we got fewer messages than the batch size, we're done
      if (oldMessages.length < BATCH_SIZE) break;
    }

    return {
      deletedMessages: totalDeleted,
      cutoff,
      batchSize: BATCH_SIZE
    };
  },
});

// Internal: Migration to fix incorrect unread counts caused by old deletion process
// This fixes conversations where unread counts don't match actual unread messages
// OPTIMIZED: Added limit to prevent excessive document scanning
export const fixUnreadCounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    let conversationsProcessed = 0;
    let conversationsFixed = 0;
    let totalAdjustments = 0;

    // Get all conversations in batches to avoid timeouts
    // OPTIMIZED: Added limit to prevent excessive scanning
    const allConversations = await ctx.db.query("conversations").take(500);

    for (const conversation of allConversations) {
      conversationsProcessed++;

      // Count actual unread messages for participant1 (messages sent to them that they haven't read)
      // OPTIMIZED: Reduced limit to prevent excessive document scanning
      const participant1UnreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_recipient_read", (q) =>
          q.eq("recipientId", conversation.participant1Id)
            .eq("readAt", undefined)
        )
        .filter((q) => q.eq(q.field("senderId"), conversation.participant2Id))
        .take(500);

      // Count actual unread messages for participant2 (messages sent to them that they haven't read)
      // OPTIMIZED: Reduced limit to prevent excessive document scanning
      const participant2UnreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_recipient_read", (q) =>
          q.eq("recipientId", conversation.participant2Id)
            .eq("readAt", undefined)
        )
        .filter((q) => q.eq(q.field("senderId"), conversation.participant1Id))
        .take(500);

      const actualParticipant1UnreadCount = participant1UnreadMessages.length;
      const actualParticipant2UnreadCount = participant2UnreadMessages.length;

      // Check if counts need to be fixed
      const participant1NeedsFix = conversation.participant1UnreadCount !== actualParticipant1UnreadCount;
      const participant2NeedsFix = conversation.participant2UnreadCount !== actualParticipant2UnreadCount;

      if (participant1NeedsFix || participant2NeedsFix) {
        conversationsFixed++;

        const updateData: Partial<Doc<"conversations">> = {};

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
// OPTIMIZED: Added limit to prevent excessive document scanning
export const cleanupOrphanedConversations = internalMutation({
  args: {},
  handler: async (ctx) => {
    let deletedConversations = 0;
    let deletedMessages = 0;

    // Get all conversations - OPTIMIZED: Added limit
    const allConversations = await ctx.db.query("conversations").take(500);

    for (const conversation of allConversations) {
      // Check if both participants still exist
      const [participant1Exists, participant2Exists] = await Promise.all([
        ctx.db.get("users", conversation.participant1Id).then(user => !!user),
        ctx.db.get("users", conversation.participant2Id).then(user => !!user),
      ]);

      // If either participant doesn't exist, delete the conversation and its messages
      if (!participant1Exists || !participant2Exists) {
        // Delete all messages in this conversation - OPTIMIZED: Reduced limits
        const [messagesFromParticipant1, messagesFromParticipant2] = await Promise.all([
          ctx.db.query("messages").withIndex("by_sender", (q) => q.eq("senderId", conversation.participant1Id))
            .filter((q) => q.eq(q.field("recipientId"), conversation.participant2Id)).take(500),
          ctx.db.query("messages").withIndex("by_sender", (q) => q.eq("senderId", conversation.participant2Id))
            .filter((q) => q.eq(q.field("recipientId"), conversation.participant1Id)).take(500),
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

// Internal: Delete all presence rooms daily to clean up stale presence data
export const deleteAllPresenceRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const presence = new Presence(components.presence);
    let deletedRooms = 0;

    // Since we can't directly query the presence component's tables from the main database,
    // we'll use a different approach. We'll call the presence component's removeRoom
    // function for known room types in the system.

    // Get all active games from the last 24 hours (these have presence rooms)
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    // OPTIMIZED: Added limit to prevent excessive scanning
    // Index range on finishedAt: the old createdAt filter scanned every finished game daily.
    const activeGames = await ctx.db
      .query("games")
      .withIndex("by_status_finished", (q) =>
        q.eq("status", "finished").gte("finishedAt", twentyFourHoursAgo),
      )
      .take(500);

    // Collect all room IDs that should have presence data
    const roomIds = new Set<string>();

    // Add game IDs as rooms
    activeGames.forEach(game => roomIds.add(game._id));
    console.log(`Found ${activeGames.length} active games`);

    // For each room, attempt to remove it from presence
    // Note: This will only remove rooms that actually exist in the presence system
    for (const roomId of roomIds) {
      try {
        // Use the presence component's removeRoom function
        await presence.removeRoom(ctx, roomId);
        deletedRooms++;
        console.log(`Removed room ${roomId}`);
      } catch {
        // Room might not exist in presence system, which is fine
        console.log(`Room ${roomId} not found in presence system or already removed`);
      }
    }

    return {
      deletedRooms,
      totalRoomsChecked: roomIds.size
    };
  },
});

// Internal: Cleanup presence table by deleting records in small batches
// Optimized to reduce write conflicts by:
// 1. Processing smaller batches (50 records instead of 100)
// 2. Adding delays between operations to avoid conflicts
// 3. Skipping active sessions to prevent conflicts with heartbeat operations
// 4. Rescheduling with longer delays to reduce contention
export const cleanupPresenceTable = internalMutation({
  args: {},
  handler: async (ctx) => {
    const presence = new Presence(components.presence);
    let deletedRecords = 0;
    let skippedRecords = 0;
    let remainingRecords = 0;
    let rescheduled = false;
    const BATCH_SIZE = 50; // Reduced from 100 to minimize write conflicts
    const RESCHEDULE_DELAY = 10000; // Increased from 5s to 10s to reduce contention

    try {
      // Since we can't directly query the presence component's internal tables,
      // we'll use the presence component's methods to clean up stale presence data

      // Get all active rooms that might have presence data
      // We'll focus on rooms that correspond to active games and global chat
      const activeRooms = new Set<string>();

      // Add global room
      activeRooms.add('global');

      // Get active games (playing or setup status) - reduced batch size
      const playingGames = await ctx.db
        .query("games")
        .withIndex("by_status", (q) => q.eq("status", "playing"))
        .take(25); // Reduced to avoid conflicts

      const setupGames = await ctx.db
        .query("games")
        .withIndex("by_status", (q) => q.eq("status", "setup"))
        .take(25); // Reduced to avoid conflicts

      const activeGames = [...playingGames, ...setupGames];

      activeGames.forEach(game => activeRooms.add(game._id));

      let totalPresenceRecords = 0;
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000); // Skip recently active sessions

      // For each active room, get the presence data and clean up if needed
      for (const roomId of activeRooms) {
        try {
          // Get presence data for this room
          const roomPresence = await presence.listRoom(ctx, roomId, false); // false = include offline users

          // Process records in smaller batches with conflict detection
          for (const userPresence of roomPresence) {
            // Skip if we've reached batch limit
            if (deletedRecords >= BATCH_SIZE) {
              break;
            }

            // Skip online users - they're actively using presence
            if (userPresence.online) {
              totalPresenceRecords++;
              continue;
            }

            // Skip users who disconnected recently (within 5 minutes) to avoid conflicts
            // with disconnect operations
            if (userPresence.lastDisconnected > fiveMinutesAgo) {
              skippedRecords++;
              totalPresenceRecords++;
              continue;
            }

            // Clean up offline users who have been disconnected for more than 1 hour
            if (userPresence.lastDisconnected < oneHourAgo) {
              try {
                // Remove this stale presence record with error handling
                await presence.removeRoomUser(ctx, roomId, userPresence.userId);
                deletedRecords++;
              } catch (error) {
                // If we get a write conflict, skip this record and continue
                // It will be cleaned up in the next run
                const isWriteConflict = error instanceof Error && 
                  (error.message.includes("write conflict") || 
                   error.message.includes("retried") ||
                   error.message.includes("concurrent modification"));
                
                if (isWriteConflict) {
                  skippedRecords++;
                  console.log(`Skipping ${userPresence.userId} due to write conflict, will retry later`);
                } else {
                  // Re-throw non-conflict errors
                  throw error;
                }
              }
            } else {
              totalPresenceRecords++;
            }
          }
        } catch (error) {
          // Room might not exist or other error, continue with next room
          const isWriteConflict = error instanceof Error && 
            (error.message.includes("write conflict") || 
             error.message.includes("retried") ||
             error.message.includes("concurrent modification"));
          
          if (isWriteConflict) {
            console.log(`Write conflict processing room ${roomId}, will retry later`);
            skippedRecords++;
          } else {
            console.log(`Error processing room ${roomId}:`, error);
          }
        }

        // If we've processed enough records, break and check for rescheduling
        if (deletedRecords >= BATCH_SIZE) {
          break;
        }
      }

      // Estimate remaining records (heuristic based on total found)
      remainingRecords = totalPresenceRecords > BATCH_SIZE ? totalPresenceRecords - deletedRecords : 0;

      // If we deleted records and there might be more, reschedule with longer delay
      if (deletedRecords > 0 && remainingRecords > 0) {
        await ctx.scheduler.runAfter(RESCHEDULE_DELAY, internal.maintenance.cleanupPresenceTable, {});
        rescheduled = true;
      }

    } catch (error) {
      console.error("Error cleaning up presence table:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        deletedRecords: 0,
        skippedRecords: 0,
        remainingRecords: 0,
        rescheduled: false
      };
    }

    return {
      success: true,
      deletedRecords,
      skippedRecords,
      remainingRecords,
      rescheduled
    };
  },
});

// Internal: Delete expired Convex Auth sessions and refresh tokens.
// Sessions last at most 30 days (DEFAULT_SESSION_TOTAL_DURATION_MS in
// @convex-dev/auth), so rows created before that are always expired. Refresh
// tokens rotate on every refresh and the old ones were never removed: prod had
// 55k token rows for 12k sessions.
const AUTH_MAX_SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const AUTH_BATCH = 1000;

export const cleanupExpiredAuth = internalMutation({
  args: { table: v.optional(v.union(v.literal("authRefreshTokens"), v.literal("authSessions"))) },
  handler: async (ctx, args) => {
    const table = args.table ?? "authRefreshTokens";
    const now = Date.now();
    const rows = await ctx.db
      .query(table)
      .withIndex("by_creation_time", (q) =>
        q.lt("_creationTime", now - AUTH_MAX_SESSION_MS),
      )
      .take(AUTH_BATCH);

    let deleted = 0;
    for (const row of rows) {
      if (row.expirationTime < now) {
        await ctx.db.delete(row._id);
        deleted++;
      }
    }

    if (rows.length === AUTH_BATCH && deleted > 0) {
      await ctx.scheduler.runAfter(1000, internal.maintenance.cleanupExpiredAuth, { table });
    } else if (table === "authRefreshTokens") {
      // Tokens first, then the sessions they point to.
      await ctx.scheduler.runAfter(1000, internal.maintenance.cleanupExpiredAuth, { table: "authSessions" });
    }
    console.log(`[auth cleanup] ${table}: deleted ${deleted} of ${rows.length} scanned`);
    return { table, deleted, scanned: rows.length };
  },
});
