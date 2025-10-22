import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Helper function to check if user is admin
async function isUserAdmin(ctx: QueryCtx, userId: Id<"users">): Promise<boolean> {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();

  return profile?.adminRole === "admin" || profile?.adminRole === "moderator";
}

// Join as spectator
export const joinAsSpectator = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // Only allow spectating active games (setup or playing)
    if (game.status !== "setup" && game.status !== "playing") {
      throw new Error("Cannot spectate finished games");
    }

    if (game.player1Id === userId || game.player2Id === userId) {
      throw new Error("You are already a player in this game");
    }

    // Check if user is admin - admins can spectate any game
    const userIsAdmin = await isUserAdmin(ctx, userId);

    // If not admin, check lobby settings for spectator restrictions
    if (!userIsAdmin) {
      const lobby = await ctx.db.get(game.lobbyId);
      if (!lobby?.allowSpectators || lobby?.isPrivate) {
        throw new Error("Spectators are not allowed in this game");
      }
    }

    // Optimized: Only update if user is not already a spectator
    if (!game.spectators.includes(userId)) {
      await ctx.db.patch(args.gameId, {
        spectators: [...game.spectators, userId],
      });
    }
  },
});

// Leave as spectator
export const leaveAsSpectator = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const game = await ctx.db.get(args.gameId);

    // Optimized: Only update if user is actually a spectator
    if (userId && game && game.spectators.includes(userId)) {
      await ctx.db.patch(args.gameId, {
        spectators: game.spectators.filter(id => id !== userId),
      });
    }
  },
});

// Get spectatable games (setup and playing only) - Optimized with better filtering
export const getSpectatableGames = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args;

    // Check if current user is admin (if authenticated)
    let userIsAdmin = false;
    try {
      const userId = await getAuthUserId(ctx);
      if (userId) {
        userIsAdmin = await isUserAdmin(ctx, userId);
      }
    } catch {
      // If we can't determine admin status, assume not admin
      userIsAdmin = false;
    }

    // Optimized: Use status index for better performance
    const queryBuilder = ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.gte("status", "playing"))
      .filter((q) => q.or(
        q.eq(q.field("status"), "setup"),
        q.eq(q.field("status"), "playing")
      ))
      .order("desc");

    let games;
    let result;

    if (paginationOpts) {
      const paginationOptions = {
        numItems: Math.min(paginationOpts.numItems, 50), // Limit max items per page
        cursor: paginationOpts.cursor ?? null,
      };
      result = await queryBuilder.paginate(paginationOptions);
      games = result.page;
    } else {
      // Limit collection size to prevent performance issues
      games = await queryBuilder.take(20);
      result = {
        page: games,
        isDone: games.length < 20,
        continueCursor: "",
      };
    }

    // Get associated lobby information to check spectator settings
    const gamesWithLobbyInfo = await Promise.all(
      games.map(async (game) => {
        const lobby = await ctx.db.get(game.lobbyId);
        return {
          ...game,
          gameId: game._id, // Explicitly include gameId for easy access
          allowSpectators: lobby?.allowSpectators ?? true,
          maxSpectators: lobby?.maxSpectators,
          spectatorCount: game.spectators.length,
          isPrivate: lobby?.isPrivate ?? false,
        };
      })
    );

    let spectatableGames;

    if (userIsAdmin) {
      // Admins can see all active games
      spectatableGames = gamesWithLobbyInfo;
    } else {
      // Regular users can only see games that allow spectators and are not private
      spectatableGames = gamesWithLobbyInfo.filter(game =>
        game.allowSpectators && !game.isPrivate
      );
    }

    return {
      ...result,
      page: spectatableGames,
    };
  },
});

// Send spectator chat message - Optimized with better validation
export const sendSpectatorChatMessage = mutation({
  args: {
    gameId: v.id("games"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate message early to avoid unnecessary queries
    const trimmedMessage = args.message.trim();
    if (!trimmedMessage || trimmedMessage.length > 500) {
      throw new Error("Message must be between 1 and 500 characters");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // Only allow chat in active games
    if (game.status !== "setup" && game.status !== "playing") {
      throw new Error("Cannot chat in finished games");
    }

    // Check if user is a spectator or player
    const isSpectator = game.spectators.includes(userId);
    const isPlayer = game.player1Id === userId || game.player2Id === userId;
    
    if (!isSpectator && !isPlayer) {
      throw new Error("You must be spectating or playing this game to chat");
    }

    // Optimized: Get profile with indexed query
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.insert("spectatorChat", {
      gameId: args.gameId,
      userId,
      username: profile.username,
      message: trimmedMessage,
      timestamp: Date.now(),
    });
  },
});

// Get spectator chat messages - Optimized with better pagination
export const getSpectatorChatMessages = query({
  args: {
    gameId: v.id("games"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 50, 100); // Cap at 100 messages max
    
    const messages = await ctx.db
      .query("spectatorChat")
      .withIndex("by_game_timestamp", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(limit);

    // Return in chronological order (oldest first) - same format as original
    return messages.reverse();
  },
});

// Get game spectators with their profiles - Optimized to reduce queries
export const getGameSpectators = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.spectators.length === 0) return [];

    // Optimized: Batch query spectator profiles more efficiently
    const spectatorProfiles = await Promise.all(
      game.spectators.map(async (userId) => {
        try {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .unique();
          return profile;
        } catch (error) {
          // Handle potential errors gracefully
          console.warn(`Failed to get profile for user ${userId}:`, error);
          return null;
        }
      })
    );

    // Filter out any null profiles and return with consistent structure
    return spectatorProfiles
      .filter((profile): profile is NonNullable<typeof profile> => profile !== null)
      .map(profile => ({
        _id: profile._id,
        userId: profile.userId,
        username: profile.username,
        rank: profile.rank,
        avatarUrl: profile.avatarUrl,
      }));
  },
});

// Clean up spectator chat for finished games - New optimized function
export const cleanupSpectatorChat = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    // Optimized: Batch delete chat messages when game ends
    const chatMessages = await ctx.db
      .query("spectatorChat")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
    
    // Use Promise.all for parallel deletion
    await Promise.all(
      chatMessages.map(message => ctx.db.delete(message._id))
    );
    
    return { deletedCount: chatMessages.length };
  },
});

// Get spectator count for a game - Optimized lightweight query
export const getSpectatorCount = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    return game ? game.spectators.length : 0;
  },
});
