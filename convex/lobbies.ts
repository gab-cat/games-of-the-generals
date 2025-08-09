import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all available lobbies with pagination
export const getLobbies = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args;
    
    // Use compound index for better performance
    const queryBuilder = ctx.db
      .query("lobbies")
      .withIndex("by_status_private", (q) => q.eq("status", "waiting").eq("isPrivate", false))
      .order("desc");

    if (paginationOpts) {
      const paginationOptions = {
        numItems: paginationOpts.numItems,
        cursor: paginationOpts.cursor ?? null,
      };
      return await queryBuilder.paginate(paginationOptions);
    } else {
      const lobbies = await queryBuilder.collect();
      return {
        page: lobbies,
        isDone: true,
        continueCursor: "",
      };
    }
  },
});

// Generate a random 6-character lobby code
function generateLobbyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new lobby
export const createLobby = mutation({
  args: {
    name: v.string(),
    isPrivate: v.optional(v.boolean()),
    allowSpectators: v.optional(v.boolean()),
    maxSpectators: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get user profile for username
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    // Check if user already has an active lobby
    const existingLobby = await ctx.db
      .query("lobbies")
      .withIndex("by_host", (q) => q.eq("hostId", userId))
      .filter((q) => q.neq(q.field("status"), "finished"))
      .unique();

    if (existingLobby) {
      throw new Error("You already have an active lobby");
    }

    const isPrivate = args.isPrivate ?? false;
    const allowSpectators = args.allowSpectators ?? true;
    const maxSpectators = args.maxSpectators ?? undefined; // undefined means unlimited
    let lobbyCode: string | undefined;

    // Generate unique lobby code for private lobbies
    if (isPrivate) {
      let codeExists = true;
      while (codeExists) {
        lobbyCode = generateLobbyCode();
        const existingCodeLobby = await ctx.db
          .query("lobbies")
          .withIndex("by_code", (q) => q.eq("lobbyCode", lobbyCode))
          .unique();
        codeExists = !!existingCodeLobby;
      }
    }

    return await ctx.db.insert("lobbies", {
      name: args.name,
      hostId: userId,
      hostUsername: profile.username,
      status: "waiting",
      isPrivate,
      lobbyCode,
      allowSpectators,
      maxSpectators,
      createdAt: Date.now(),
    });
  },
});

// Check if user has an active lobby
export const getUserActiveLobby = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Use compound index for better performance
    let lobby = await ctx.db
      .query("lobbies")
      .withIndex("by_host_status", (q) => q.eq("hostId", userId).eq("status", "waiting"))
      .unique();

    if (!lobby) {
      lobby = await ctx.db
        .query("lobbies")
        .withIndex("by_host_status", (q) => q.eq("hostId", userId).eq("status", "playing"))
        .unique();
    }

    return lobby;
  },
});

// Join a lobby by ID
export const joinLobby = mutation({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get user profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) throw new Error("Lobby not found");

    if (lobby.status !== "waiting") {
      throw new Error("Lobby is not available");
    }

    if (lobby.hostId === userId) {
      throw new Error("Cannot join your own lobby");
    }

    if (lobby.playerId) {
      throw new Error("Lobby is full");
    }

    // Update lobby with player
    await ctx.db.patch(args.lobbyId, {
      playerId: userId,
      playerUsername: profile.username,
      status: "playing",
    });

    return args.lobbyId;
  },
});

// Join a private lobby by code
export const joinLobbyByCode = mutation({
  args: {
    lobbyCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get user profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const lobby = await ctx.db
      .query("lobbies")
      .withIndex("by_code", (q) => q.eq("lobbyCode", args.lobbyCode))
      .unique();

    if (!lobby) throw new Error("Invalid lobby code");

    if (lobby.status !== "waiting") {
      throw new Error("Lobby is not available");
    }

    if (lobby.hostId === userId) {
      throw new Error("Cannot join your own lobby");
    }

    if (lobby.playerId) {
      throw new Error("Lobby is full");
    }

    // Update lobby with player
    await ctx.db.patch(lobby._id, {
      playerId: userId,
      playerUsername: profile.username,
      status: "playing",
    });

    return lobby._id;
  },
});

// Leave a lobby
export const leaveLobby = mutation({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) throw new Error("Lobby not found");

    if (lobby.hostId === userId) {
      // Host is leaving, delete the lobby
      await ctx.db.delete(args.lobbyId);
    } else if (lobby.playerId === userId) {
      // Player is leaving, reset lobby to waiting
      await ctx.db.patch(args.lobbyId, {
        playerId: undefined,
        playerUsername: undefined,
        status: "waiting",
      });
    }
  },
});

// Get specific lobby
export const getLobby = query({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.lobbyId);
  },
});

// Join a game as spectator by game ID
export const spectateGameById = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // Get the associated lobby to check spectator settings
    const lobby = await ctx.db.get(game.lobbyId);
    if (!lobby) throw new Error("Associated lobby not found");

    // Check if spectators are allowed
    if (lobby.allowSpectators === false) {
      throw new Error("Spectators are not allowed in this game");
    }

    // Check if user is already a player
    if (game.player1Id === userId || game.player2Id === userId) {
      throw new Error("Cannot spectate a game you are playing");
    }

    // Check if user is already spectating
    if (game.spectators.includes(userId)) {
      return game._id; // Already spectating
    }

    // Check spectator limit
    if (lobby.maxSpectators && game.spectators.length >= lobby.maxSpectators) {
      throw new Error("Maximum number of spectators reached");
    }

    // Add user to spectators
    const updatedSpectators = [...game.spectators, userId];
    await ctx.db.patch(args.gameId, {
      spectators: updatedSpectators,
    });

    return game._id;
  },
});
