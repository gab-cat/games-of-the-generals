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
    .index("by_rank_wins", ["rank", "wins"]), // Index for ranking within same rank

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
    .index("by_host_status", ["hostId", "status"]),

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
    .index("by_player2_status", ["player2Id", "status"]),

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
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
