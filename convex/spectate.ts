import { v } from "convex/values";
import { mutation, internalMutation, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { getLiveGame, setLiveGameSpectators } from "./liveGames";

// Helper function to check if user is admin
async function isUserAdmin(ctx: QueryCtx, userId: Id<"users">): Promise<boolean> {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
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

    const game = await ctx.db.get("games", args.gameId);
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
      const lobby = await ctx.db.get("lobbies", game.lobbyId);
      if (!lobby?.allowSpectators || lobby?.isPrivate) {
        throw new Error("Spectators are not allowed in this game");
      }
    }

    // Optimized: Only update if user is not already a spectator
    if (!game.spectators.includes(userId)) {
      const spectators = [...game.spectators, userId];
      await ctx.db.patch(args.gameId, { spectators });
      await setLiveGameSpectators(ctx, args.gameId, spectators);
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

    const game = await ctx.db.get("games", args.gameId);

    // Optimized: Only update if user is actually a spectator
    if (userId && game && game.spectators.includes(userId)) {
      const spectators = game.spectators.filter((id) => id !== userId);
      await ctx.db.patch(args.gameId, { spectators });
      await setLiveGameSpectators(ctx, args.gameId, spectators);
    }
  },
});

// Games open to watch, newest first. Reads the small liveGames rows, which
// change only when a game starts, begins play, gains or loses a spectator, or
// ends. It used to read every live game row (about 5 KB each) plus its lobby
// and re-ran on every move of every live game for everyone on this tab.
export const getSpectatableGames = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args;

    // Admins and moderators also see private games and ones closed to spectators.
    const userId = await getAuthUserId(ctx);
    const userIsAdmin = userId ? await isUserAdmin(ctx, userId) : false;

    const queryBuilder = userIsAdmin
      ? ctx.db.query("liveGames").order("desc")
      : ctx.db
          .query("liveGames")
          .withIndex("by_public", (q) => q.eq("isPublic", true))
          .order("desc");

    const result = await queryBuilder.paginate({
      numItems: Math.min(paginationOpts?.numItems ?? 20, 50),
      cursor: paginationOpts?.cursor ?? null,
    });

    return {
      ...result,
      page: result.page.map((live) => ({
        _id: live.gameId,
        gameId: live.gameId,
        _creationTime: live._creationTime,
        lobbyName: live.lobbyName,
        status: live.status,
        player1Username: live.player1Username,
        player2Username: live.player2Username,
        gameMode: live.gameMode,
        playingSince: live.playingSince,
        maxSpectators: live.maxSpectators,
        spectatorCount: live.spectatorIds.length,
        isPublic: live.isPublic,
      })),
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

    const game = await ctx.db.get("games", args.gameId);
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
    // The liveGames row, not the game row: it doesn't change on moves, so
    // this list re-runs only when someone joins or leaves.
    const live = await getLiveGame(ctx, args.gameId);
    if (!live || live.spectatorIds.length === 0) return [];

    const spectatorProfiles = await Promise.all(
      live.spectatorIds.map(async (userId) => {
        try {
          const profile = await ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .unique();
          if (!profile) return null;

          const customization = await ctx.db
            .query("userCustomizations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

          return { ...profile, avatarFrame: customization?.avatarFrame, usernameColor: customization?.usernameColor };
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
        avatarFrame: profile.avatarFrame,
        usernameColor: profile.usernameColor,
      }));
  },
});

// Clean up spectator chat for finished games - New optimized function
export const cleanupSpectatorChat = internalMutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    // Optimized: Batch delete chat messages when game ends
    // OPTIMIZED: Added limit to prevent excessive document scanning
    // OPTIMIZED: Reduced limit to prevent excessive document scanning
    const chatMessages = await ctx.db
      .query("spectatorChat")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .take(500); // Reasonable limit - games rarely have more than 500 spectator messages
    
    // Use Promise.all for parallel deletion
    await Promise.all(
      chatMessages.map(message => ctx.db.delete(message._id))
    );
    
    return { deletedCount: chatMessages.length };
  },
});

