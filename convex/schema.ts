import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Override auth `users` to add an index on `isAnonymous`
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })
    .index("email", ["email"]) // keep default indexes
    .index("phone", ["phone"]) // keep default indexes
    .index("by_isAnonymous", ["isAnonymous"]),
  // User profiles extending auth users
  profiles: defineTable({
    userId: v.id("users"),
    username: v.string(),
    wins: v.number(),
    losses: v.number(),
    gamesPlayed: v.number(),
    rank: v.string(),
    createdAt: v.number(),
    avatarUrl: v.optional(v.string()), // URL to compressed avatar image
    avatarStorageId: v.optional(v.id("_storage")), // Storage ID for deleting old avatars
    bio: v.optional(v.string()),
    // Additional stats for achievements
    totalPlayTime: v.optional(v.number()), // in milliseconds
    fastestWin: v.optional(v.number()), // in milliseconds (wins only)
    fastestGame: v.optional(v.number()), // in milliseconds (win or loss)
    longestGame: v.optional(v.number()), // in milliseconds
    winStreak: v.optional(v.number()),
    bestWinStreak: v.optional(v.number()),
    capturedFlags: v.optional(v.number()),
    piecesEliminated: v.optional(v.number()),
    spiesRevealed: v.optional(v.number()),
    // Tutorial state
    hasSeenTutorial: v.optional(v.boolean()),
    tutorialCompletedAt: v.optional(v.number()),
    // Online status tracking (merged from onlineUsers table)
    isOnline: v.optional(v.boolean()),
    lastSeenAt: v.optional(v.number()),
    currentPage: v.optional(v.string()),
    gameId: v.optional(v.id("games")),
    lobbyId: v.optional(v.id("lobbies")),
    // Admin/Moderator role
    adminRole: v.optional(v.union(v.literal("moderator"), v.literal("admin"))),
  })
    .index("by_user", ["userId"])
    .index("by_wins", ["wins"])
    .index("by_username", ["username"])
    .index("by_games_wins", ["gamesPlayed", "wins"]) // Compound index for better leaderboard queries
    .index("by_rank_wins", ["rank", "wins"]) // Index for ranking within same rank
    .index("by_active_players", ["gamesPlayed", "username"]) // For finding active players
    .index("by_online", ["isOnline"]) // For finding online users
    .index("by_online_last_seen", ["isOnline", "lastSeenAt"]) // For finding recently active users
    .index("by_admin_role", ["adminRole"]) // For finding admin/moderator users
    .index("by_username_games", ["username", "gamesPlayed"]) // For efficient username search
    .index("by_rank_games", ["rank", "gamesPlayed"]) // For rank-based queries
    .index("by_created_at", ["createdAt"]) // For new user queries
    .index("by_last_seen", ["lastSeenAt"]), // For online status queries

  // User achievements
  achievements: defineTable({
    userId: v.id("users"),
    achievementId: v.string(),
    unlockedAt: v.number(),
    progress: v.optional(v.number()), // For progressive achievements
    seenAt: v.optional(v.number()), // For marking notifications as seen
  })
    .index("by_user", ["userId"])
    .index("by_achievement", ["achievementId"])
    .index("by_user_achievement", ["userId", "achievementId"])
    .index("by_achievement_user", ["achievementId", "userId"]) // For achievement progress queries
    .index("by_user_unlocked", ["userId", "unlockedAt"]) // For recent achievements
    .index("by_unlocked_at", ["unlockedAt"]), // For global achievement stats

  // Game lobbies/rooms
  lobbies: defineTable({
    name: v.string(),
    hostId: v.id("users"),
    hostUsername: v.string(),
    playerId: v.optional(v.id("users")),
    playerUsername: v.optional(v.string()),
    status: v.union(v.literal("waiting"), v.literal("playing"), v.literal("finished")),
    isPrivate: v.optional(v.boolean()),
    lobbyCode: v.optional(v.string()),
    createdAt: v.number(),
    gameId: v.optional(v.id("games")),
    allowSpectators: v.optional(v.boolean()), // Default true
    maxSpectators: v.optional(v.number()), // Default unlimited (null)
  })
    .index("by_status", ["status"])
    .index("by_host", ["hostId"])
    .index("by_code", ["lobbyCode"])
    .index("by_status_private", ["status", "isPrivate"])
    .index("by_host_status", ["hostId", "status"])
    .index("by_status_created", ["status", "createdAt"]) // For sorting waiting lobbies by creation time
    .index("by_waiting_public", ["status", "isPrivate", "createdAt"]), // Optimized for public lobby list

    // Active games
  games: defineTable({
    lobbyId: v.id("lobbies"),
    lobbyName: v.optional(v.string()),
    player1Id: v.id("users"),
    player1Username: v.string(),
    player2Id: v.id("users"),
    player2Username: v.string(),
    currentTurn: v.union(v.literal("player1"), v.literal("player2")),
    status: v.union(
      v.literal("setup"),
      v.literal("playing"),
      v.literal("finished")
    ),
    winner: v.optional(v.union(v.literal("player1"), v.literal("player2"))),
    gameEndReason: v.optional(v.union(
      v.literal("flag_captured"),
      v.literal("flag_reached_base"),
      v.literal("timeout"),
      v.literal("surrender"),
      v.literal("elimination")
    )),
    board: v.array(v.array(v.union(v.null(), v.object({
      piece: v.string(),
      player: v.union(v.literal("player1"), v.literal("player2")),
      revealed: v.boolean(),
    })))),
    initialSetupBoard: v.optional(v.array(v.array(v.union(v.null(), v.object({
      piece: v.string(),
      player: v.union(v.literal("player1"), v.literal("player2")),
      revealed: v.boolean(),
    }))))),
    player1Setup: v.boolean(),
    player2Setup: v.boolean(),
    spectators: v.array(v.id("users")),
    createdAt: v.number(),
    finishedAt: v.optional(v.number()),
    setupTimeStarted: v.optional(v.number()),
    gameTimeStarted: v.optional(v.number()),
    lastMoveTime: v.optional(v.number()),
    lastMoveFrom: v.optional(v.object({
      row: v.number(),
      col: v.number(),
    })),
    lastMoveTo: v.optional(v.object({
      row: v.number(),
      col: v.number(),
    })),
    player1TimeUsed: v.optional(v.number()),
    player2TimeUsed: v.optional(v.number()),
    player1ResultAcknowledged: v.optional(v.boolean()),
    player2ResultAcknowledged: v.optional(v.boolean()),
    moveCount: v.optional(v.number()), // Cache move count to avoid querying moves table
  })
    .index("by_lobby", ["lobbyId"])
    .index("by_status", ["status"])
    .index("by_players", ["player1Id", "player2Id"])
    .index("by_player1", ["player1Id"])
    .index("by_player2", ["player2Id"])
    .index("by_status_finished", ["status", "finishedAt"])
    .index("by_player1_status", ["player1Id", "status"])
    .index("by_player2_status", ["player2Id", "status"])// For recent finished games
    .index("by_player1_finished", ["player1Id", "status", "finishedAt"]) // Player history optimization
    .index("by_player2_finished", ["player2Id", "status", "finishedAt"]), // Player history optimization

  // Game moves history
  moves: defineTable({
    gameId: v.id("games"),
    playerId: v.id("users"),
    moveType: v.union(
      v.literal("move"),
      v.literal("challenge"),
      v.literal("setup")
    ),
    fromRow: v.optional(v.number()),
    fromCol: v.optional(v.number()),
    toRow: v.number(),
    toCol: v.number(),
    piece: v.optional(v.string()),
    challengeResult: v.optional(v.object({
      attacker: v.string(),
      defender: v.string(),
      winner: v.union(v.literal("attacker"), v.literal("defender"), v.literal("tie")),
    })),
    timestamp: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_game_timestamp", ["gameId", "timestamp"]) // Compound index for ordered game moves
    .index("by_game_type", ["gameId", "moveType"]), // Index for filtering by move type

  // Spectator chat messages
  spectatorChat: defineTable({
    gameId: v.id("games"),
    userId: v.id("users"),
    username: v.string(),
    message: v.string(),
    timestamp: v.number(),
  })
    .index("by_game", ["gameId"])
    .index("by_game_timestamp", ["gameId", "timestamp"]), // For ordered chat messages

  // Email change verification
  emailChangeVerifications: defineTable({
    userId: v.id("users"),
    currentEmail: v.string(),
    newEmail: v.string(),
    verificationCode: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    verified: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_code", ["verificationCode"])
    .index("by_user_verified", ["userId", "verified"]),

  // Setup presets for game piece arrangements
  setupPresets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    isDefault: v.boolean(),
    isBuiltIn: v.boolean(), // For popular/built-in presets
    pieces: v.array(v.object({
      piece: v.string(),
      row: v.number(),
      col: v.number(),
    })),
    createdAt: v.number(),
    upvotes: v.optional(v.number()), // Track upvotes for future features
  })
    .index("by_user", ["userId"])
    .index("by_user_default", ["userId", "isDefault"])
    .index("by_user_builtin", ["userId", "isBuiltIn"])
    .index("by_builtin", ["isBuiltIn"])
    .index("by_upvotes", ["upvotes"]), // For popular presets

  // Direct messages between users
  messages: defineTable({
    senderId: v.id("users"),
    senderUsername: v.string(),
    recipientId: v.id("users"),
    recipientUsername: v.string(),
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("lobby_invite"),
      v.literal("game_invite")
    ),
    // For lobby invites
    lobbyId: v.optional(v.id("lobbies")),
    lobbyCode: v.optional(v.string()),
    lobbyName: v.optional(v.string()),
    // For game invites (spectate)
    gameId: v.optional(v.id("games")),
    // Metadata
    timestamp: v.number(),
    readAt: v.optional(v.number()),
    editedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_sender", ["senderId"])
    .index("by_conversation", ["senderId", "recipientId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_recipient_read", ["recipientId", "readAt"])
    .index("by_conversation_timestamp", ["senderId", "recipientId", "timestamp"]) // For efficient conversation queries
    .index("by_recipient_timestamp", ["recipientId", "timestamp"]) // For recipient message history
    .index("by_sender_timestamp", ["senderId", "timestamp"]) // For sender message history
    .index("by_message_type", ["messageType", "timestamp"]) // For filtering by message type
    .index("by_unread_messages", ["recipientId", "readAt", "timestamp"]), // For efficient unread queries

  // Chat conversations metadata
  conversations: defineTable({
    participant1Id: v.id("users"),
    participant1Username: v.string(),
    participant2Id: v.id("users"),
    participant2Username: v.string(),
    lastMessageId: v.optional(v.id("messages")),
    lastMessageAt: v.number(),
    participant1LastRead: v.optional(v.number()),
    participant2LastRead: v.optional(v.number()),
    // Typing indicators (timestamps of last typing activity)
    participant1TypingAt: v.optional(v.number()),
    participant2TypingAt: v.optional(v.number()),
    participant1UnreadCount: v.number(),
    participant2UnreadCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_participant1", ["participant1Id"])
    .index("by_participant2", ["participant2Id"])
    .index("by_last_message", ["lastMessageAt"])
    .index("by_participants", ["participant1Id", "participant2Id"])
    .index("by_participant1_last_message", ["participant1Id", "lastMessageAt"]) // For efficient sorting
    .index("by_participant2_last_message", ["participant2Id", "lastMessageAt"]) // For efficient sorting
    .index("by_participant1_unread", ["participant1Id", "participant1UnreadCount"]) // For unread optimization
    .index("by_participant2_unread", ["participant2Id", "participant2UnreadCount"]), // For unread optimization

  // Web Push Subscriptions per user
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    expirationTime: v.optional(v.number()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    lastSuccessAt: v.optional(v.number()),
    lastFailureAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  })
    .index("by_user", ["userId"]) 
    .index("by_endpoint", ["endpoint"]),

  // AI Game Sessions (ephemeral, not for replays/achievements)
  aiGameSessions: defineTable({
    sessionId: v.string(),
    playerId: v.id("users"),
    playerUsername: v.string(),
    behavior: v.union(
      v.literal("aggressive"),
      v.literal("defensive"),
      v.literal("passive"),
      v.literal("balanced"),
    ),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    status: v.union(v.literal("setup"), v.literal("playing"), v.literal("finished")),
    currentTurn: v.union(v.literal("player1"), v.literal("player2")),
    board: v.array(v.array(v.union(v.null(), v.object({
      piece: v.string(),
      player: v.union(v.literal("player1"), v.literal("player2")),
      revealed: v.boolean(),
    })))),
    playerSetup: v.boolean(),
    aiSetup: v.boolean(),
    winner: v.optional(v.union(v.literal("player1"), v.literal("player2"))),
    gameEndReason: v.optional(v.union(
      v.literal("flag_captured"),
      v.literal("flag_reached_base"),
      v.literal("timeout"),
      v.literal("surrender"),
      v.literal("elimination")
    )),
    createdAt: v.number(),
    setupTimeStarted: v.optional(v.number()),
    gameTimeStarted: v.optional(v.number()),
    lastMoveTime: v.optional(v.number()),
    lastMoveFrom: v.optional(v.object({
      row: v.number(),
      col: v.number(),
    })),
    lastMoveTo: v.optional(v.object({
      row: v.number(),
      col: v.number(),
    })),
    moveCount: v.number(),
  })
    .index("by_session_id", ["sessionId"])
    .index("by_player", ["playerId"])
    .index("by_player_status", ["playerId", "status"]),

  // Global Chat Messages
  globalChat: defineTable({
    userId: v.optional(v.id("users")), // Optional for system messages
    username: v.string(),
    message: v.string(),
    timestamp: v.number(),
    // For mentions - array of userIds mentioned in this message
    mentions: v.optional(v.array(v.id("users"))),
    // Filtered/cleaned message (after profanity filtering)
    filteredMessage: v.string(),
    // Message metadata for spam detection
    messageHash: v.optional(v.string()), // For duplicate detection
    ipAddress: v.optional(v.string()), // For spam detection
    // System messages (commands, notifications, etc.)
    isSystemMessage: v.optional(v.boolean()), // For system-generated messages
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_user", ["userId"])
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_message_hash", ["messageHash"])
    .index("by_timestamp_user", ["timestamp", "userId"]) // For efficient pagination with user context
    .index("by_system_message", ["isSystemMessage", "timestamp"]) // For system message queries
    .index("by_ip_address", ["ipAddress"]), // For spam detection


  // User Chat Settings and Preferences
  userChatSettings: defineTable({
    userId: v.id("users"),
    // Username color (hex code)
    usernameColor: v.optional(v.string()),
    // Rules agreement
    rulesAgreedAt: v.optional(v.number()),
    rulesVersion: v.optional(v.string()),
    // Chat preferences
    showTimestamps: v.optional(v.boolean()),
    enableSounds: v.optional(v.boolean()),
    enableMentions: v.optional(v.boolean()),
    // Spam/moderation settings
    isMuted: v.optional(v.boolean()),
    mutedUntil: v.optional(v.number()),
    muteReason: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_muted_until", ["mutedUntil"]),



  // Chat Mentions for Notifications
  chatMentions: defineTable({
    messageId: v.id("globalChat"),
    mentionerId: v.id("users"),
    mentionerUsername: v.string(),
    mentionedUserId: v.id("users"),
    mentionedUsername: v.string(),
    timestamp: v.number(),
    isRead: v.boolean(),
    // The actual mention text (e.g. "@username")
    mentionText: v.string(),
  })
    .index("by_mentioned_user", ["mentionedUserId"])
    .index("by_mentioned_user_read", ["mentionedUserId", "isRead"])
    .index("by_mentioned_user_timestamp", ["mentionedUserId", "timestamp"])
    .index("by_message", ["messageId"])
    .index("by_timestamp_read", ["timestamp", "isRead"]) // For bulk mark as read operations
    .index("by_mentioner_timestamp", ["mentionerId", "timestamp"]), // For mentioner activity tracking

  // Chat Rules and Agreements
  chatRules: defineTable({
    version: v.string(),
    rulesText: v.string(),
    createdAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_version", ["version"])
    .index("by_active", ["isActive"]),

  // Admin Users - for identifying moderators and administrators
  adminUsers: defineTable({
    userId: v.id("users"),
    username: v.string(),
    role: v.union(v.literal("moderator"), v.literal("admin")),
    assignedBy: v.id("users"), // Who assigned this admin role
    assignedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_active", ["isActive"]),

  // User Moderation Actions (mutes, bans, etc.)
  userModeration: defineTable({
    targetUserId: v.id("users"),
    targetUsername: v.string(),
    moderatorId: v.id("users"),
    moderatorUsername: v.string(),
    action: v.union(v.literal("mute"), v.literal("ban"), v.literal("unmute"), v.literal("unban")),
    reason: v.optional(v.string()),
    duration: v.optional(v.number()), // Duration in milliseconds for temporary actions
    expiresAt: v.optional(v.number()), // When temporary moderation expires
    createdAt: v.number(),
    isActive: v.boolean(), // Whether this moderation is still in effect
  })
    .index("by_target_user", ["targetUserId"])
    .index("by_moderator", ["moderatorId"])
    .index("by_action", ["action"])
    .index("by_active", ["isActive"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_target_active", ["targetUserId", "isActive"]),

  // Ban Appeals
  banAppeals: defineTable({
    userId: v.id("users"),
    username: v.string(),
    appealMessage: v.string(),
    timestamp: v.number(),
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("approved"), v.literal("denied")),
    moderatorResponse: v.optional(v.string()),
    respondedAt: v.optional(v.number()),
    moderatorId: v.optional(v.id("users")),
    moderatorUsername: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_timestamp", ["timestamp"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  // Message Moderation Actions (deletions, warnings, etc.)
  messageModeration: defineTable({
    messageId: v.id("globalChat"),
    moderatorId: v.id("users"),
    moderatorUsername: v.string(),
    action: v.union(v.literal("delete"), v.literal("warn")),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_moderator", ["moderatorId"])
    .index("by_action", ["action"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
