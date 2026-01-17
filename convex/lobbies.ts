import { query, mutation, internalMutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { isSubscriptionActive } from "./featureGating";

// Helper function to check if user is admin
async function isUserAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">): Promise<boolean> {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  return profile?.adminRole === "admin" || profile?.adminRole === "moderator";
}

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
    gameMode: v.optional(v.union(
      v.literal("classic"),
      v.literal("blitz"),
      v.literal("reveal")
    )), // Defaults to "classic" if not provided
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

    // Check private lobby limits if creating a private lobby
    let usage = null;
    let todayCount = 0;
    let today = "";
    if (isPrivate) {
      // Get subscription info
      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();

      const tier = subscription?.tier || "free";
      const status = subscription?.status || "active";
      const expiresAt = subscription?.expiresAt || null;
      const gracePeriodEndsAt = subscription?.gracePeriodEndsAt || null;

      // Check if subscription is active using shared helper
      const isActive = isSubscriptionActive(status, expiresAt, gracePeriodEndsAt);

      // Get daily limits
      const limits: Record<string, number> = {
        free: 10,
        pro: 50,
        pro_plus: Infinity,
      };
      const limit = limits[tier] || 10;

      // Get today's usage (use UTC to avoid timezone issues)
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        .toISOString()
        .split("T")[0];
      usage = await ctx.db
        .query("subscriptionUsage")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", today))
        .unique();

      todayCount = usage?.privateLobbiesCreated || 0;

      if (!isActive && tier !== "free") {
        throw new Error("Your subscription has expired. Please renew to create private lobbies.");
      }

      if (limit !== Infinity && todayCount >= limit) {
        const tierName = tier === "free" ? "Free" : tier === "pro" ? "Pro" : "Pro+";
        throw new Error(`Daily limit of ${limit} private lobbies reached for ${tierName} tier. ${tier === "free" ? "Upgrade to Pro for 50 per day, or Pro+ for unlimited." : tier === "pro" ? "Upgrade to Pro+ for unlimited private lobbies." : ""}`);
      }
    }

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

    const gameMode = args.gameMode ?? "classic"; // Default to classic if not provided

    const lobbyId = await ctx.db.insert("lobbies", {
      name: args.name,
      hostId: userId,
      hostUsername: profile.username,
      status: "waiting",
      isPrivate,
      lobbyCode,
      allowSpectators,
      maxSpectators,
      gameMode,
      createdAt: Date.now(),
    });

    // Update usage counter after successful lobby creation
    if (isPrivate) {
      if (usage) {
        await ctx.db.patch(usage._id, {
          privateLobbiesCreated: todayCount + 1,
        });
      } else {
        await ctx.db.insert("subscriptionUsage", {
          userId,
          date: today,
          privateLobbiesCreated: 1,
          aiReplaysSaved: 0,
          lastResetAt: Date.now(),
        });
      }
    }

    // Update profile with lobbyId
    await ctx.db.patch(profile._id, {
      lobbyId,
    });

    // Remove user from matchmaking queue if they were in it
    const queueEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (queueEntry) {
      await ctx.db.delete(queueEntry._id);
    }

    return lobbyId;
  },
});

// Check if user has an active lobby
export const getUserActiveLobby = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // First check if user is a host - get most recent waiting lobby
    let lobby = await ctx.db
      .query("lobbies")
      .withIndex("by_host_status", (q) => q.eq("hostId", userId).eq("status", "waiting"))
      .order("desc")
      .first();

    if (!lobby) {
      // Check for most recent playing lobby where user is host
      lobby = await ctx.db
        .query("lobbies")
        .withIndex("by_host_status", (q) => q.eq("hostId", userId).eq("status", "playing"))
        .order("desc")
        .first();
    }

    // If not found as host, check if user is a player in any lobby - get most recent
    // OPTIMIZED: Use status index first, then filter by playerId in memory (better than full scan)
    if (!lobby) {
      const [waitingLobbies, playingLobbies] = await Promise.all([
        ctx.db
          .query("lobbies")
          .withIndex("by_status", (q) => q.eq("status", "waiting"))
          .order("desc")
          .take(100), // Reasonable limit
        ctx.db
          .query("lobbies")
          .withIndex("by_status", (q) => q.eq("status", "playing"))
          .order("desc")
          .take(100), // Reasonable limit
      ]);

      // Find the most recent lobby where user is a player
      const allActiveLobbies = [...waitingLobbies, ...playingLobbies]
        .filter((l) => l.playerId === userId)
        .sort((a, b) => b.createdAt - a.createdAt);
      
      lobby = allActiveLobbies[0] || null;
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

    // Remove user from matchmaking queue if they were in it
    const queueEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (queueEntry) {
      await ctx.db.delete(queueEntry._id);
    }

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

    // Remove user from matchmaking queue if they were in it
    const queueEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (queueEntry) {
      await ctx.db.delete(queueEntry._id);
    }

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

    const lobby = await ctx.db.get("lobbies", args.lobbyId);
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

    // Check if user is admin - admins can spectate any game
    const userIsAdmin = await isUserAdmin(ctx, userId);

    // If not admin, check spectator restrictions
    if (!userIsAdmin) {
      // Check if spectators are allowed
      if (lobby.allowSpectators === false) {
        throw new Error("Spectators are not allowed in this game");
      }

      // Check spectator limit
      if (lobby.maxSpectators && game.spectators.length >= lobby.maxSpectators) {
        throw new Error("Maximum number of spectators reached");
      }
    }

    // Check if user is already a player
    if (game.player1Id === userId || game.player2Id === userId) {
      throw new Error("Cannot spectate a game you are playing");
    }

    // Check if user is already spectating
    if (game.spectators.includes(userId)) {
      return game._id; // Already spectating
    }

    // Add user to spectators
    const updatedSpectators = [...game.spectators, userId];
    await ctx.db.patch(args.gameId, {
      spectators: updatedSpectators,
    });

    return game._id;
  },
});

// Internal function to delete inactive waiting lobbies (waiting for more than 5 minutes without activity)
// This serves as a failsafe - primary cleanup happens via heartbeat-based abandonment detection
export const deleteInactiveLobbies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000); // 5 minutes in milliseconds
    
    // Find waiting lobbies created more than 5 minutes ago using index
    // OPTIMIZED: Added limit to prevent excessive document scanning
    const inactiveLobbies = await ctx.db
      .query("lobbies")
      .withIndex("by_status_created", (q) => 
        q.eq("status", "waiting").lt("createdAt", fiveMinutesAgo)
      )
      .take(100); // Process in batches to avoid timeout


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

// Constants for abandonment detection
const LOBBY_INACTIVITY_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes - player considered inactive
const LOBBY_HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds between heartbeats

// Heartbeat mutation - called by clients every 30 seconds while in lobby
export const heartbeatLobby = mutation({
  args: { 
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, { lobbyId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { success: false };
    
    const lobby = await ctx.db.get(lobbyId);
    if (!lobby || lobby.status !== "waiting") return { success: false };
    
    const now = Date.now();
    
    if (lobby.hostId === userId) {
      await ctx.db.patch(lobbyId, { hostLastActiveAt: now });
    } else if (lobby.playerId === userId) {
      await ctx.db.patch(lobbyId, { playerLastActiveAt: now });
    }
    
    return { success: true };
  }
});

// Check if a specific lobby has been abandoned - called by clients or scheduled
export const checkLobbyAbandonment = mutation({
  args: { 
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, { lobbyId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { abandoned: false, reason: null };
    
    const lobby = await ctx.db.get(lobbyId);
    if (!lobby) return { abandoned: true, reason: "lobby_deleted" };
    if (lobby.status !== "waiting") return { abandoned: false, reason: null };
    
    const now = Date.now();
    const hostLastActive = lobby.hostLastActiveAt || lobby.createdAt;
    const playerLastActive = lobby.playerLastActiveAt || (lobby.playerId ? lobby.createdAt : null);
    
    const hostInactive = (now - hostLastActive) > LOBBY_INACTIVITY_THRESHOLD_MS;
    const playerInactive = lobby.playerId && playerLastActive 
      ? (now - playerLastActive) > LOBBY_INACTIVITY_THRESHOLD_MS 
      : false;
    
    // Determine abandonment state
    if (hostInactive && lobby.hostId !== userId) {
      // Host has abandoned - clean up the lobby
      // Clear lobbyId from both profiles
      const hostProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", lobby.hostId))
        .unique();
      
      if (hostProfile) {
        await ctx.db.patch(hostProfile._id, { lobbyId: undefined });
      }
      
      if (lobby.playerId) {
        const playerProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", lobby.playerId!))
          .unique();
        
        if (playerProfile) {
          await ctx.db.patch(playerProfile._id, { lobbyId: undefined });
        }
      }
      
      await ctx.db.delete(lobbyId);
      return { abandoned: true, reason: "host_abandoned" };
    }
    
    if (playerInactive && lobby.playerId && lobby.playerId !== userId) {
      // Player has abandoned - remove them from lobby
      const playerProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", lobby.playerId!))
        .unique();
      
      if (playerProfile) {
        await ctx.db.patch(playerProfile._id, { lobbyId: undefined });
      }
      
      await ctx.db.patch(lobbyId, { 
        playerId: undefined, 
        playerUsername: undefined,
        playerLastActiveAt: undefined,
      });
      
      return { abandoned: true, reason: "player_abandoned" };
    }
    
    return { abandoned: false, reason: null };
  }
});

// Query to get lobby activity status (for UI indicators)
export const getLobbyActivityStatus = query({
  args: { 
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, { lobbyId }) => {
    const lobby = await ctx.db.get(lobbyId);
    if (!lobby) return null;
    
    const now = Date.now();
    const hostLastActive = lobby.hostLastActiveAt || lobby.createdAt;
    const playerLastActive = lobby.playerLastActiveAt;
    
    return {
      hostOnline: (now - hostLastActive) < LOBBY_INACTIVITY_THRESHOLD_MS,
      playerOnline: lobby.playerId && playerLastActive 
        ? (now - playerLastActive) < LOBBY_INACTIVITY_THRESHOLD_MS 
        : null,
      hostLastActiveAt: hostLastActive,
      playerLastActiveAt: playerLastActive,
    };
  }
});
