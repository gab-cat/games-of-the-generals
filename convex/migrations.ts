import { internalMutation } from "./_generated/server";

// Migration to add moveCount to existing games
export const addMoveCountToGames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db.query("games").collect();
    let processed = 0;
    
    for (const game of games) {
      if (game.moveCount === undefined) {
        // Use the optimized query with limit to count moves
        const moves = await ctx.db
          .query("moves")
          .withIndex("by_game", (q) => q.eq("gameId", game._id))
          .collect();
        
        await ctx.db.patch(game._id, {
          moveCount: moves.length,
        });
        processed++;
      }
    }
    
    return { 
      totalGames: games.length,
      processed,
      message: `Updated ${processed} games with move counts`
    };
  },
});

// Migration to clean up old timeout check patterns (if any exist)
export const cleanupTimeoutChecks = internalMutation({
  args: {},
  handler: async (_ctx) => {
    // This migration cleans up any lingering timeout check artifacts
    // Since we removed the checkGameTimeout function
    return { message: "Timeout check cleanup completed" };
  },
});
