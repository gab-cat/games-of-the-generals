import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
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
    // Additional stats for achievements
    totalPlayTime: v.optional(v.number()), // in milliseconds
    fastestWin: v.optional(v.number()), // in milliseconds
    longestGame: v.optional(v.number()), // in milliseconds
    winStreak: v.optional(v.number()),
    bestWinStreak: v.optional(v.number()),
    capturedFlags: v.optional(v.number()),
    piecesEliminated: v.optional(v.number()),
    spiesRevealed: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_wins", ["wins"])
    .index("by_username", ["username"])
    .index("by_games_wins", ["gamesPlayed", "wins"]) // Compound index for better leaderboard queries
    .index("by_rank_wins", ["rank", "wins"]) // Index for ranking within same rank
    .index("by_active_players", ["gamesPlayed", "username"]), // For finding active players

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
    .index("by_user_achievement", ["userId", "achievementId"]),

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

  // AI Game Sessions (ephemeral, not for replays/achievements)
  aiGameSessions: defineTable({
    sessionId: v.string(),
    playerId: v.id("users"),
    playerUsername: v.string(),
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
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
