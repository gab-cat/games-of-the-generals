import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all available lobbies with optimized cursor-based pagination using new indexes
export const getLobbies = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args;
    const limit = paginationOpts ? Math.min(paginationOpts.numItems, 20) : 15;
    
    // Use the new optimized waiting_public index for better performance
    const queryBuilder = ctx.db
      .query("lobbies")
      .withIndex("by_waiting_public", (q) => 
        q.eq("status", "waiting").eq("isPrivate", false)
      )
      .order("desc"); // Order by creation time descending

    if (paginationOpts && paginationOpts.cursor) {
      return await queryBuilder.paginate({
        numItems: limit,
        cursor: paginationOpts.cursor,
      });
    } else {
      // Initial load
      const lobbies = await queryBuilder.take(limit);
      return {
        page: lobbies,
        isDone: lobbies.length < limit,
        continueCursor: lobbies.length > 0 ? lobbies[lobbies.length - 1]._id : "",
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

    // Check if user already has an active lobby - optimized query
    const existingLobby = await ctx.db
      .query("lobbies")
      .withIndex("by_host_status", (q) => q.eq("hostId", userId).eq("status", "waiting"))
      .unique();

    // Also check for playing status if waiting doesn't exist
    if (!existingLobby) {
      const playingLobby = await ctx.db
        .query("lobbies")
        .withIndex("by_host_status", (q) => q.eq("hostId", userId).eq("status", "playing"))
        .unique();
      
      if (playingLobby) {
        throw new Error("You already have an active lobby");
      }
    } else {
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

    const lobbyId = await ctx.db.insert("lobbies", {
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

    // Update profile with lobbyId
    await ctx.db.patch(profile._id, {
      lobbyId,
    });

    return lobbyId;
  },
});

// Check if user has an active lobby
export const getUserActiveLobby = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // First check if user is a host
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

    // If not found as host, check if user is a player in any lobby
    if (!lobby) {
      lobby = await ctx.db
        .query("lobbies")
        .filter((q) => q.eq(q.field("playerId"), userId))
        .filter((q) => q.or(q.eq(q.field("status"), "waiting"), q.eq(q.field("status"), "playing")))
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
      // Keep status as "waiting" until game actually starts
    });

    // Update profile with lobbyId
    await ctx.db.patch(profile._id, {
      lobbyId: args.lobbyId,
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
      // Keep status as "waiting" until game actually starts
    });

    // Update profile with lobbyId
    await ctx.db.patch(profile._id, {
      lobbyId: lobby._id,
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

    // Get user profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) throw new Error("Lobby not found");

    if (lobby.hostId === userId) {
      // Host is leaving, delete the lobby and clear lobbyId from both players' profiles
      await ctx.db.delete(args.lobbyId);

      // Clear lobbyId from host's profile
      await ctx.db.patch(profile._id, {
        lobbyId: undefined,
      });

      // Clear lobbyId from player's profile if they exist
      if (lobby.playerId) {
        const playerProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", lobby.playerId!))
          .unique();

        if (playerProfile) {
          await ctx.db.patch(playerProfile._id, {
            lobbyId: undefined,
          });
        }
      }
    } else if (lobby.playerId === userId) {
      // Player is leaving, reset lobby to waiting and clear lobbyId from player's profile
      await ctx.db.patch(args.lobbyId, {
        playerId: undefined,
        playerUsername: undefined,
        status: "waiting",
      });

      // Clear lobbyId from player's profile
      await ctx.db.patch(profile._id, {
        lobbyId: undefined,
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

// Internal function to delete inactive waiting lobbies (waiting for more than 30 minutes)
export const deleteInactiveLobbies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000); // 30 minutes in milliseconds
    
    // Find waiting lobbies created more than 30 minutes ago using index
    const inactiveLobbies = await ctx.db
      .query("lobbies")
      .withIndex("by_status_created", (q) => 
        q.eq("status", "waiting").lt("createdAt", thirtyMinutesAgo)
      )
      .collect();

    let deletedCount = 0;
    
    // Delete each inactive lobby and clear lobbyId from associated profiles
    for (const lobby of inactiveLobbies) {
      // Clear lobbyId from host's profile
      const hostProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", lobby.hostId))
        .unique();

      if (hostProfile) {
        await ctx.db.patch(hostProfile._id, {
          lobbyId: undefined,
        });
      }

      // Clear lobbyId from player's profile if they exist
      if (lobby.playerId) {
        const playerProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", lobby.playerId!))
          .unique();

        if (playerProfile) {
          await ctx.db.patch(playerProfile._id, {
            lobbyId: undefined,
          });
        }
      }

      await ctx.db.delete(lobby._id);
      deletedCount++;
    }

    console.log(`Deleted ${deletedCount} inactive waiting lobbies`);
    return { deletedCount };
  },
});
