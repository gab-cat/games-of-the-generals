import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { presence } from "./presence";
import { updateEloRatings, isQuickMatchGame } from "./profiles";

// Game pieces and their ranks
const PIECES = {
  "Flag": 0,
  "Private": 1,
  "Sergeant": 2,
  "2nd Lieutenant": 3,
  "1st Lieutenant": 4,
  "Captain": 5,
  "Major": 6,
  "Lieutenant Colonel": 7,
  "Colonel": 8,
  "1 Star General": 9,
  "2 Star General": 10,
  "3 Star General": 11,
  "4 Star General": 12,
  "5 Star General": 13,
  "Spy": 14,
};

// Initial piece setup for each player (21 pieces total)
const INITIAL_PIECES = [
  "Flag",
  "Spy", "Spy",
  "Private", "Private", "Private", "Private", "Private", "Private",
  "Sergeant",
  "2nd Lieutenant",
  "1st Lieutenant",
  "Captain",
  "Major",
  "Lieutenant Colonel",
  "Colonel",
  "1 Star General",
  "2 Star General",
  "3 Star General",
  "4 Star General",
  "5 Star General"
];

// Create empty board
function createEmptyBoard() {
  return Array(8).fill(null).map(() => Array(9).fill(null));
}

// Start a new game
export const startGame = mutation({
  args: {
    lobbyId: v.id("lobbies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const lobby = await ctx.db.get(args.lobbyId);
    if (!lobby) throw new Error("Lobby not found");

    if (lobby.status !== "waiting" || !lobby.playerId) {
      throw new Error("Lobby is not ready for game");
    }

    if (lobby.hostId !== userId && lobby.playerId !== userId) {
      throw new Error("Not a player in this lobby");
    }

    // Check if game already exists
    const existingGame = await ctx.db
      .query("games")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", args.lobbyId))
      .unique();

    if (existingGame) {
      return existingGame._id;
    }

    // Create new game
    const gameId = await ctx.db.insert("games", {
      lobbyId: args.lobbyId,
      lobbyName: lobby.name,
      player1Id: lobby.hostId,
      player1Username: lobby.hostUsername,
      player2Id: lobby.playerId,
      player2Username: lobby.playerUsername!,
      currentTurn: "player1",
      status: "setup",
      board: createEmptyBoard(),
      player1Setup: false,
      player2Setup: false,
      spectators: [],
      createdAt: Date.now(),
      setupTimeStarted: Date.now(),
      player1TimeUsed: 0,
      player2TimeUsed: 0,
      moveCount: 0, // Initialize move count
      disconnectionGracePeriod: 120 * 1000, // 120 seconds in milliseconds
    });

    // Update lobby with game reference and change status to playing
    await ctx.db.patch(args.lobbyId, {
      gameId,
      status: "playing",
    });

    // Update profiles for both players: set gameId and clear lobbyId
    const hostProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", lobby.hostId))
      .unique();

    const playerProfile = lobby.playerId ? await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", lobby.playerId!))
      .unique() : null;

    if (hostProfile) {
      await ctx.db.patch(hostProfile._id, {
        gameId,
        lobbyId: undefined,
      });
    }

    if (playerProfile) {
      await ctx.db.patch(playerProfile._id, {
        gameId,
        lobbyId: undefined,
      });
    }

    return gameId;
  },
});

// Get game state
export const getGame = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const game = await ctx.db.get(args.gameId);
    
    if (!game) return null;

    // Should not allow if not part of the game - return null to hide game existence
    if (userId && ![game.player1Id, game.player2Id, ...game.spectators].includes(userId)) {
      return null;
    }

    // If game is finished, reveal all pieces
    if (game.status === "finished") {
      return game;
    }

    // Check if user is a spectator
    const isSpectator = userId && game.spectators.includes(userId);
    
    // Hide opponent's unrevealed pieces unless user is spectator or player
    if (userId && (userId === game.player1Id || userId === game.player2Id)) {
      const isPlayer1 = userId === game.player1Id;
      const boardCopy = game.board.map(row => 
        row.map(cell => {
          if (!cell) return null;
          
          // Show own pieces and revealed pieces
          if (cell.player === (isPlayer1 ? "player1" : "player2") || cell.revealed) {
            return cell;
          }
          
          // Hide opponent's unrevealed pieces
          return {
            piece: "Hidden",
            player: cell.player,
            revealed: false,
          };
        })
      );
      
      return { ...game, board: boardCopy };
    } else if (isSpectator) {
      // Spectators can see all pieces (both revealed and unrevealed)
      return game;
    }

    return game;
  },
});

// Setup pieces on board
export const setupPieces = mutation({
  args: {
    gameId: v.id("games"),
    pieces: v.array(v.object({
      piece: v.string(),
      row: v.number(),
      col: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "setup") {
      throw new Error("Game is not in setup phase");
    }

    const isPlayer1 = userId === game.player1Id;
    const isPlayer2 = userId === game.player2Id;

    if (!isPlayer1 && !isPlayer2) {
      throw new Error("Not a player in this game");
    }

    // Validate piece setup
    if (args.pieces.length !== INITIAL_PIECES.length) {
      throw new Error("Invalid number of pieces");
    }

    // Check if pieces are in correct area
    const validRows = isPlayer1 ? [5, 6, 7] : [0, 1, 2];
    for (const piece of args.pieces) {
      if (!validRows.includes(piece.row) || piece.col < 0 || piece.col > 8) {
        throw new Error("Pieces must be placed in your area");
      }
    }

    // Update board with pieces
    const newBoard = [...game.board];
    for (const piece of args.pieces) {
      newBoard[piece.row][piece.col] = {
        piece: piece.piece,
        player: isPlayer1 ? "player1" : "player2",
        revealed: false,
      };
    }

    // Update game state
    const updates: any = {
      board: newBoard,
    };

    if (isPlayer1) {
      updates.player1Setup = true;
    } else {
      updates.player2Setup = true;
    }

    // If both players have setup, start the game
    if ((isPlayer1 && game.player2Setup) || (isPlayer2 && game.player1Setup)) {
      updates.status = "playing";
      updates.gameTimeStarted = Date.now();
      // Save the initial setup board for replay purposes
      updates.initialSetupBoard = newBoard.map(row => 
        row.map(cell => cell ? { ...cell, revealed: false } : null)
      );
    }

    await ctx.db.patch(args.gameId, updates);
  },
});

// Make a move
export const makeMove = mutation({
  args: {
    gameId: v.id("games"),
    fromRow: v.number(),
    fromCol: v.number(),
    toRow: v.number(),
    toCol: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "playing") {
      throw new Error("Game is not active");
    }

    const isPlayer1 = userId === game.player1Id;
    const isPlayer2 = userId === game.player2Id;

    if (!isPlayer1 && !isPlayer2) {
      throw new Error("Not a player in this game");
    }

    const currentPlayer = isPlayer1 ? "player1" : "player2";
    if (game.currentTurn !== currentPlayer) {
      throw new Error("Not your turn");
    }

    // Validate move
    const fromPiece = game.board[args.fromRow][args.fromCol];
    if (!fromPiece || fromPiece.player !== currentPlayer) {
      throw new Error("Invalid piece selection");
    }

    // Check if move is valid (adjacent squares only)
    const rowDiff = Math.abs(args.toRow - args.fromRow);
    const colDiff = Math.abs(args.toCol - args.fromCol);
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      // Valid move
    } else {
      throw new Error("Invalid move - pieces can only move to adjacent squares");
    }

    // Check bounds
    if (args.toRow < 0 || args.toRow > 7 || args.toCol < 0 || args.toCol > 8) {
      throw new Error("Move out of bounds");
    }

    const toPiece = game.board[args.toRow][args.toCol];
    const newBoard = game.board.map(row => [...row]);

    let challengeResult = null;
    let gameWinner = null;

    if (toPiece) {
      // Challenge/battle
      if (toPiece.player === currentPlayer) {
        throw new Error("Cannot attack your own piece");
      }

      const attackerRank = PIECES[fromPiece.piece as keyof typeof PIECES];
      const defenderRank = PIECES[toPiece.piece as keyof typeof PIECES];

      // Special rules for Game of the Generals
      let winner: "attacker" | "defender" | "tie";
      
      if (fromPiece.piece === "Flag" || toPiece.piece === "Flag") {
        // Flag logic: can only eat another flag
        if (fromPiece.piece === "Flag" && toPiece.piece === "Flag") {
          winner = "attacker"; // Attacking flag wins over defending flag
        } else if (fromPiece.piece === "Flag") {
          // Flag trying to attack a non-flag piece: flag always loses
          winner = "defender";
        } else {
          // Non-flag attacking flag: attacker wins
          winner = "attacker";
        }
      } else if (fromPiece.piece === "Spy") {
        // Spy eliminates all officers (Sergeant through 5 Star General) and Flag
        if (toPiece.piece === "Flag" || 
            (defenderRank >= 2 && defenderRank <= 13)) { // Sergeant to 5 Star General
          winner = "attacker";
        } else if (toPiece.piece === "Private") {
          winner = "defender"; // Private eliminates Spy
        } else if (toPiece.piece === "Spy") {
          winner = "tie"; // Same rank eliminates each other
        } else {
          winner = "tie";
        }
      } else if (toPiece.piece === "Spy") {
        // Spy is eliminated by Private only
        if (fromPiece.piece === "Private") {
          winner = "attacker";
        } else if (fromPiece.piece === "Spy") {
          winner = "tie"; // Same rank eliminates each other
        } else if (attackerRank >= 2 && attackerRank <= 13) { // Sergeant to 5 Star General
          winner = "defender"; // Spy eliminates officers
        } else {
          winner = "tie";
        }
      } else if (fromPiece.piece === "Private") {
        // Private eliminates Spy and Flag
        if (toPiece.piece === "Flag") {
          winner = "attacker";
        } else if (toPiece.piece === "Spy") {
          winner = "attacker";
        } else if (toPiece.piece === "Private") {
          winner = "tie"; // Same rank eliminates each other
        } else {
          winner = "defender"; // All other pieces eliminate Private
        }
      } else if (toPiece.piece === "Private") {
        // Private is eliminated by all pieces except Spy
        if (fromPiece.piece === "Spy") {
          winner = "defender"; // Spy loses to Private
        } else if (fromPiece.piece === "Private") {
          winner = "tie"; // Same rank eliminates each other
        } else {
          winner = "attacker"; // All other pieces eliminate Private
        }
      } else if (fromPiece.piece === "Sergeant") {
        // Sergeant eliminates Private and Flag only
        if (toPiece.piece === "Flag") {
          winner = "attacker";
        } else if (toPiece.piece === "Private") {
          winner = "attacker";
        } else if (toPiece.piece === "Sergeant") {
          winner = "tie"; // Same rank eliminates each other
        } else {
          winner = "defender"; // Higher ranks eliminate Sergeant
        }
      } else if (toPiece.piece === "Sergeant") {
        // Sergeant is eliminated by officers and eliminates Private
        if (fromPiece.piece === "Private") {
          winner = "defender"; // Sergeant eliminates Private
        } else if (fromPiece.piece === "Sergeant") {
          winner = "tie"; // Same rank eliminates each other
        } else if (attackerRank > 2) { // Officers above Sergeant
          winner = "attacker";
        } else {
          winner = "tie";
        }
      } else {
        // Regular officer hierarchy: higher rank eliminates lower rank
        if (attackerRank > defenderRank) {
          winner = "attacker";
        } else if (attackerRank < defenderRank) {
          winner = "defender";
        } else {
          winner = "tie"; // Same rank eliminates each other
        }
      }

      challengeResult = {
        attacker: fromPiece.piece,
        defender: toPiece.piece,
        winner,
      };

      // Reveal attacking piece only when there's a challenge
      const revealedFromPiece = { ...fromPiece, revealed: false };

      if (winner === "attacker") {
        // Attacker wins, move attacking piece and reveal it
        newBoard[args.toRow][args.toCol] = revealedFromPiece;
        newBoard[args.fromRow][args.fromCol] = null;
        
        // Check if flag was captured
        if (toPiece.piece === "Flag") {
          gameWinner = currentPlayer;
        }
      } else if (winner === "defender") {
        // Attacker loses, only attacker piece is removed
        // Defender piece stays and remains hidden (not revealed)
        newBoard[args.toRow][args.toCol] = toPiece; // Keep original defender piece without revealing
        newBoard[args.fromRow][args.fromCol] = null;
        
        // Check if the attacking piece was a flag - if so, opponent wins
        if (fromPiece.piece === "Flag") {
          gameWinner = currentPlayer === "player1" ? "player2" : "player1";
        }
      } else {
        // Tie - both eliminated and both revealed
        newBoard[args.toRow][args.toCol] = null;
        newBoard[args.fromRow][args.fromCol] = null;
      }
    } else {
      // Simple move
      newBoard[args.toRow][args.toCol] = fromPiece;
      newBoard[args.fromRow][args.fromCol] = null;

      // Immediate check: If player2's flag reaches player1's base (row 0), game ends immediately
      if (fromPiece.piece === "Flag" && currentPlayer === "player2" && args.toRow === 0) {
        gameWinner = "player2";
      }
      // Note: Player1's flag reaching player2's base is checked after player2's turn (deferred)
    }

    // Record move
    await ctx.db.insert("moves", {
      gameId: args.gameId,
      playerId: userId,
      moveType: toPiece ? "challenge" : "move",
      fromRow: args.fromRow,
      fromCol: args.fromCol,
      toRow: args.toRow,
      toCol: args.toCol,
      piece: fromPiece.piece,
      challengeResult: challengeResult || undefined,
      timestamp: Date.now(),
    });

    // Calculate time used for current player
    const currentTime = Date.now();
    let timeUsedThisTurn = 0;
    
    if (game.lastMoveTime || game.gameTimeStarted) {
      const turnStartTime = game.lastMoveTime || game.gameTimeStarted || currentTime;
      timeUsedThisTurn = currentTime - turnStartTime; // Keep in milliseconds
    }
    
    // Update game state
    const updates: any = {
      board: newBoard,
      currentTurn: currentPlayer === "player1" ? "player2" : "player1",
      lastMoveTime: currentTime,
      lastMoveFrom: { row: args.fromRow, col: args.fromCol },
      lastMoveTo: { row: args.toRow, col: args.toCol },
      moveCount: (game.moveCount || 0) + 1, // Increment cached move count
    };

    // Update time used for current player
    if (currentPlayer === "player1") {
      updates.player1TimeUsed = (game.player1TimeUsed || 0) + timeUsedThisTurn;
    } else {
      updates.player2TimeUsed = (game.player2TimeUsed || 0) + timeUsedThisTurn;
    }

    // Deferred check: After player2's turn, check if player1's flag is in player2's base (row 7)
    // This ensures player2 gets one more turn when player1's flag reaches their base
    // Note: Player2's flag reaching player1's base ends immediately (checked above)
    let flagReachedBase = false;
    const nextTurn = updates.currentTurn;
    if (!gameWinner && nextTurn === "player1") {
      // After turn switches to player1 (meaning player2 just moved), check if player1's flag is in player2's base
      const player2BackRow = 7; // Player 2's back row (bottom of board)
      for (let col = 0; col < 9; col++) {
        const cell = newBoard[player2BackRow][col];
        if (cell && cell.player === "player1" && cell.piece === "Flag") {
          gameWinner = "player1";
          flagReachedBase = true;
          break;
        }
      }
    }

    if (gameWinner) {
      updates.status = "finished";
      updates.winner = gameWinner;
      updates.finishedAt = Date.now();
      
      // Determine the reason for winning
      if (challengeResult && (challengeResult.defender === "Flag" || challengeResult.attacker === "Flag")) {
        updates.gameEndReason = "flag_captured" as const;
      } else if (flagReachedBase) {
        updates.gameEndReason = "flag_reached_base" as const;
      } else if (fromPiece.piece === "Flag") {
        updates.gameEndReason = "flag_reached_base" as const;
      } else {
        updates.gameEndReason = "flag_captured" as const; // Default fallback
      }

      // Update lobby status
      await ctx.db.patch(game.lobbyId, {
        status: "finished",
      });

      // Clear gameId from both players' profiles
      const [player1Profile, player2Profile] = await Promise.all([
        ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", game.player1Id))
          .unique(),
        ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", game.player2Id))
          .unique()
      ]);

      if (player1Profile) {
        await ctx.db.patch(player1Profile._id, {
          gameId: undefined,
        });
      }

      if (player2Profile) {
        await ctx.db.patch(player2Profile._id, {
          gameId: undefined,
        });
      }

      // Clean up spectator chat when game ends
      await ctx.runMutation(api.spectate.cleanupSpectatorChat, { gameId: args.gameId });

      // Update player stats
      const winnerId = gameWinner === "player1" ? game.player1Id : game.player2Id;
      const loserId = gameWinner === "player1" ? game.player2Id : game.player1Id;

      // Calculate game duration and stats for achievement tracking
      const gameDuration = currentTime - (game.gameTimeStarted || game.createdAt);
      
      // OPTIMIZED: Use indexed queries instead of collecting all moves
      // Count pieces eliminated and spies revealed from moves in this game
      // OPTIMIZED: Added limit to prevent excessive document scanning
      const [winnerMoves, loserMoves] = await Promise.all([
        ctx.db
          .query("moves")
          .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
          .filter((q) => q.eq(q.field("playerId"), winnerId))
          .take(250), // Reasonable limit - games rarely exceed 500 moves
        ctx.db
          .query("moves")
          .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
          .filter((q) => q.eq(q.field("playerId"), loserId))
          .take(250) // Reasonable limit - games rarely exceed 500 moves
      ]);

      let winnerPiecesEliminated = 0;
      let winnerSpiesRevealed = 0;
      let loserPiecesEliminated = 0;
      let loserSpiesRevealed = 0;
      let flagCapturedByWinner = false;

      // Process winner's moves
      for (const move of winnerMoves) {
        if (move.challengeResult) {
          if (move.challengeResult.winner === "attacker") {
            winnerPiecesEliminated++;
            if (move.challengeResult.defender === "Flag") {
              flagCapturedByWinner = true;
            }
            if (move.challengeResult.attacker === "Spy") {
              winnerSpiesRevealed++;
            }
          } else if (move.challengeResult.winner === "defender") {
            // Winner's move was defended successfully
            if (move.challengeResult.defender === "Spy") {
              loserSpiesRevealed++;
            }
          }
        }
      }

      // Process loser's moves
      for (const move of loserMoves) {
        if (move.challengeResult) {
          if (move.challengeResult.winner === "attacker") {
            loserPiecesEliminated++;
            if (move.challengeResult.attacker === "Spy") {
              loserSpiesRevealed++;
            }
          } else if (move.challengeResult.winner === "defender") {
            // Loser's move was defended successfully by winner
            winnerPiecesEliminated++;
            if (move.challengeResult.attacker === "Spy") {
              winnerSpiesRevealed++;
            }
          }
        }
      }

      // Update player stats with detailed information
      await ctx.runMutation(api.profiles.updateProfileStats, { 
        userId: winnerId, 
        won: true,
        gameTime: gameDuration,
        flagCaptured: flagCapturedByWinner,
        piecesEliminated: winnerPiecesEliminated,
        spiesRevealed: winnerSpiesRevealed
      });
      
      await ctx.runMutation(api.profiles.updateProfileStats, { 
        userId: loserId, 
        won: false,
        gameTime: gameDuration,
        flagCaptured: false,
        piecesEliminated: loserPiecesEliminated,
        spiesRevealed: loserSpiesRevealed
      });

      // Get profiles for ELO update and achievements
      const winnerProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", winnerId))
        .unique();
      
      const loserProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", loserId))
        .unique();

      // Update ELO ratings for quick match games only
      const isQuickMatch = await isQuickMatchGame(ctx, game.lobbyId);
      if (isQuickMatch && winnerProfile && loserProfile) {
        await updateEloRatings(
          ctx,
          winnerId,
          loserId,
          winnerProfile.elo ?? 1500,
          loserProfile.elo ?? 1500,
          winnerProfile.gamesPlayed,
          loserProfile.gamesPlayed
        );
      }

      // Check and unlock achievements for both players

      if (winnerProfile) {
        await ctx.runMutation(api.achievements.checkAchievements, { profileId: winnerProfile._id });
      }
      
      if (loserProfile) {
        await ctx.runMutation(api.achievements.checkAchievements, { profileId: loserProfile._id });
      }

      // Check game-specific achievements (like Perfectionist, Comeback King)
      await ctx.runMutation(api.achievements.checkGameSpecificAchievements, {
        gameId: args.gameId,
        winnerId,
        loserId
      });
    }

    await ctx.db.patch(args.gameId, updates);

    // Clean up presence room when game ends
    if (gameWinner) {
      await presence.removeRoom(ctx, args.gameId);
    }

    // Update user's last seen time (they performed a significant action)
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        lastSeenAt: currentTime,
      });
    }

    return { success: true, challengeResult, winner: gameWinner };
  },
});

// Get game moves with optional filtering - Optimized for performance
export const getGameMoves = query({
  args: {
    gameId: v.id("games"),
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    })),
    moveTypes: v.optional(v.array(v.string())), // Optional filter by move types
  },
  handler: async (ctx, args) => {
    const { paginationOpts } = args;
    const limit = paginationOpts ? Math.min(paginationOpts.numItems, 100) : 50;
    
    let queryBuilder = ctx.db
      .query("moves")
      .withIndex("by_game_timestamp", (q) => q.eq("gameId", args.gameId))
      .order("asc");

    // Optimized: Apply move type filter at database level if possible
    if (args.moveTypes && args.moveTypes.length === 1) {
      // Use the by_game_type index for single move type filters
      const moveType = args.moveTypes[0] as "setup" | "move" | "challenge";
      queryBuilder = ctx.db
        .query("moves")
        .withIndex("by_game_type", (q) => q.eq("gameId", args.gameId).eq("moveType", moveType))
        .order("asc");
    }

    if (paginationOpts && paginationOpts.cursor) {
      const result = await queryBuilder.paginate({
        numItems: limit,
        cursor: paginationOpts.cursor,
      });

      // Filter by move types if multiple types specified
      if (args.moveTypes && args.moveTypes.length > 1) {
        return {
          ...result,
          page: result.page.filter(move => args.moveTypes!.includes(move.moveType)),
        };
      }
      
      return result;
    } else {
      // Initial load
      const moves = await queryBuilder.take(limit);

      // Filter by move types if multiple types specified (less common case)
      const filteredMoves = args.moveTypes && args.moveTypes.length > 1
        ? moves.filter(move => args.moveTypes!.includes(move.moveType))
        : moves;

      return {
        page: filteredMoves,
        isDone: filteredMoves.length < limit,
        continueCursor: filteredMoves.length > 0 ? filteredMoves[filteredMoves.length - 1]._id : "",
      };
    }
  },
});

// Surrender game
export const surrenderGame = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "playing") {
      throw new Error("Game is not active");
    }

    const isPlayer1 = userId === game.player1Id;
    const isPlayer2 = userId === game.player2Id;

    if (!isPlayer1 && !isPlayer2) {
      throw new Error("Not a player in this game");
    }

    // Winner is the other player
    const winner = isPlayer1 ? "player2" : "player1";
    const winnerId = isPlayer1 ? game.player2Id : game.player1Id;
    const loserId = userId;

    // Calculate game duration
    const gameDuration = Date.now() - (game.gameTimeStarted || game.createdAt);

    // Update game state
    await ctx.db.patch(args.gameId, {
      status: "finished",
      winner,
      finishedAt: Date.now(),
      gameEndReason: "surrender" as const,
    });

    // Update lobby status
    await ctx.db.patch(game.lobbyId, {
      status: "finished",
    });

    // Clean up presence room when game ends
    await presence.removeRoom(ctx, args.gameId);

    // Clean up spectator chat when game ends
    await ctx.runMutation(api.spectate.cleanupSpectatorChat, { gameId: args.gameId });

    // Update player stats with game duration
    await ctx.runMutation(api.profiles.updateProfileStats, { 
      userId: winnerId, 
      won: true,
      gameTime: gameDuration
    });
    
    await ctx.runMutation(api.profiles.updateProfileStats, { 
      userId: loserId, 
      won: false,
      gameTime: gameDuration
    });

    // Check achievements for both players
    const winnerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", winnerId))
      .unique();
    
    const loserProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", loserId))
      .unique();

    // Update ELO ratings for quick match games only
    const isQuickMatch = await isQuickMatchGame(ctx, game.lobbyId);
    if (isQuickMatch && winnerProfile && loserProfile) {
      await updateEloRatings(
        ctx,
        winnerId,
        loserId,
        winnerProfile.elo ?? 1500,
        loserProfile.elo ?? 1500,
        winnerProfile.gamesPlayed,
        loserProfile.gamesPlayed
      );
    }

    if (winnerProfile) {
      void Promise.all([
        await ctx.runMutation(api.achievements.checkAchievements, { profileId: winnerProfile._id }),
        await ctx.db.patch(winnerProfile._id, {
          gameId: undefined,
        })
      ]);

    }
    
    if (loserProfile) {
      void Promise.all([
        await ctx.runMutation(api.achievements.checkAchievements, { profileId: loserProfile._id }),
        await ctx.db.patch(loserProfile._id, {
          gameId: undefined,
        })
      ]);
    }

    // Check game-specific achievements for surrender scenario
    await ctx.runMutation(api.achievements.checkGameSpecificAchievements, {
      gameId: args.gameId,
      winnerId,
      loserId
    });

    return { success: true, winner };
  },
});

// Handle timeout - when a player runs out of time
export const timeoutGame = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "playing") {
      throw new Error("Game is not active");
    }

    const isPlayer1 = userId === game.player1Id;
    const isPlayer2 = userId === game.player2Id;

    if (!isPlayer1 && !isPlayer2) {
      throw new Error("Not a player in this game");
    }

    // For timeout handling, allow either player to call timeout when it's their turn OR their opponent's turn
    // This enables offline opponent timeout handling
    const isCurrentPlayer = (isPlayer1 && game.currentTurn === "player1") ||
                           (isPlayer2 && game.currentTurn === "player2");
    const isOpponentTurn = (isPlayer1 && game.currentTurn === "player2") ||
                          (isPlayer2 && game.currentTurn === "player1");

    if (!isCurrentPlayer && !isOpponentTurn) {
      throw new Error("Not authorized to handle timeout for this game");
    }

    // Determine who timed out based on whose turn it is
    const timedOutPlayer = game.currentTurn;
    const winner = timedOutPlayer === "player1" ? "player2" : "player1";
    const winnerId = timedOutPlayer === "player1" ? game.player2Id : game.player1Id;
    const loserId = timedOutPlayer === "player1" ? game.player1Id : game.player2Id;

    // Calculate game duration
    const gameDuration = Date.now() - (game.gameTimeStarted || game.createdAt);

    // Update game state
    await ctx.db.patch(args.gameId, {
      status: "finished",
      winner,
      finishedAt: Date.now(),
      gameEndReason: "timeout" as const,
    });

    // Update lobby status
    await ctx.db.patch(game.lobbyId, {
      status: "finished",
    });

    // Clean up presence room when game ends
    await presence.removeRoom(ctx, args.gameId);

    // Update player stats with game duration
    await ctx.runMutation(api.profiles.updateProfileStats, { 
      userId: winnerId, 
      won: true,
      gameTime: gameDuration,
    });
    
    await ctx.runMutation(api.profiles.updateProfileStats, { 
      userId: loserId, 
      won: false,
      gameTime: gameDuration
    });

    // Check achievements for both players
    const winnerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", winnerId))
      .unique();
    
    const loserProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", loserId))
      .unique();

    // Update ELO ratings for quick match games only
    const isQuickMatch = await isQuickMatchGame(ctx, game.lobbyId);
    if (isQuickMatch && winnerProfile && loserProfile) {
      await updateEloRatings(
        ctx,
        winnerId,
        loserId,
        winnerProfile.elo ?? 1500,
        loserProfile.elo ?? 1500,
        winnerProfile.gamesPlayed,
        loserProfile.gamesPlayed
      );
    }

    if (winnerProfile) {
      void Promise.all([
        await ctx.runMutation(api.achievements.checkAchievements, { profileId: winnerProfile._id }),
        await ctx.db.patch(winnerProfile._id, {
          gameId: undefined,
        })
      ]);
    }
    
    if (loserProfile) {
      void Promise.all([
        await ctx.runMutation(api.achievements.checkAchievements, { profileId: loserProfile._id }),
        await ctx.db.patch(loserProfile._id, {
          gameId: undefined,
        })
      ]);
    }

    // Check game-specific achievements for timeout scenario
    await ctx.runMutation(api.achievements.checkGameSpecificAchievements, {
      gameId: args.gameId,
      winnerId,
      loserId
    });

    return { success: true, winner };
  },
});


// Handle game forfeit due to disconnection
export const forfeitGame = mutation({
  args: { 
    gameId: v.id("games"),
    reason: v.union(v.literal("disconnection_timeout"), v.literal("manual"))
  },
  handler: async (ctx, { gameId, reason }) => {
    const game = await ctx.db.get(gameId);
    if (!game || game.status !== "playing") {
      throw new Error("Game not found or not in playing state");
    }

    // Determine winner (the player who didn't disconnect)
    const winner = game.currentTurn === "player1" ? "player2" : "player1";
    const winnerId = game.currentTurn === "player1" ? game.player2Id : game.player1Id;
    const loserId = game.currentTurn === "player1" ? game.player1Id : game.player2Id;

    // Update game status
    await ctx.db.patch(gameId, {
      status: "finished",
      winner,
      finishedAt: Date.now(),
      gameEndReason: reason === "disconnection_timeout" ? "timeout" : "surrender",
    });

    // Update lobby status
    const lobby = await ctx.db.get(game.lobbyId);
    if (lobby) {
      await ctx.db.patch(game.lobbyId, { status: "finished" });
    }

    // Clean up presence room when game ends
    await presence.removeRoom(ctx, gameId);

    // Update player profiles
    const [winnerProfile, loserProfile] = await Promise.all([
      ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", winnerId))
        .unique(),
      ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", loserId))
        .unique(),
    ]);

    if (winnerProfile) {
      await ctx.db.patch(winnerProfile._id, {
        wins: winnerProfile.wins + 1,
        gamesPlayed: winnerProfile.gamesPlayed + 1,
        winStreak: (winnerProfile.winStreak || 0) + 1,
        bestWinStreak: Math.max(winnerProfile.bestWinStreak || 0, (winnerProfile.winStreak || 0) + 1),
        gameId: undefined,
      });
    }

    if (loserProfile) {
      await ctx.db.patch(loserProfile._id, {
        losses: loserProfile.losses + 1,
        gamesPlayed: loserProfile.gamesPlayed + 1,
        winStreak: 0,
        gameId: undefined,
      });
    }

    // Update ELO ratings for quick match games only
    const isQuickMatch = await isQuickMatchGame(ctx, game.lobbyId);
    if (isQuickMatch && winnerProfile && loserProfile) {
      await updateEloRatings(
        ctx,
        winnerId,
        loserId,
        winnerProfile.elo ?? 1500,
        loserProfile.elo ?? 1500,
        winnerProfile.gamesPlayed, // Use current value before increment
        loserProfile.gamesPlayed   // Use current value before increment
      );
    }

    // Check achievements
    if (winnerProfile) {
      await ctx.runMutation(api.achievements.checkAchievements, { profileId: winnerProfile._id });
    }
    if (loserProfile) {
      await ctx.runMutation(api.achievements.checkAchievements, { profileId: loserProfile._id });
    }

    // Check game-specific achievements
    await ctx.runMutation(api.achievements.checkGameSpecificAchievements, {
      gameId,
      winnerId,
      loserId,
    });
  },
});

// Get current user's active game - Optimized to reduce queries
export const getCurrentUserGame = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Optimized: Use Promise.all to query both player indexes in parallel
    const [player1Games, player2Games] = await Promise.all([
      ctx.db
        .query("games")
        .withIndex("by_player1", (q) => q.eq("player1Id", userId))
        .filter((q) => q.or(
          q.eq(q.field("status"), "setup"),
          q.eq(q.field("status"), "playing")
        ))
        .first(),
      ctx.db
        .query("games")
        .withIndex("by_player2", (q) => q.eq("player2Id", userId))
        .filter((q) => q.or(
          q.eq(q.field("status"), "setup"),
          q.eq(q.field("status"), "playing")
        ))
        .first()
    ]);

    // Return the most recent active game
    const activeGame = player1Games || player2Games;
    if (activeGame) return activeGame;

    // If no active game, check for recently finished games that need acknowledgment
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    // Optimized: Single query with filter for both players
    const finishedGames = await ctx.db
      .query("games")
      .withIndex("by_status_finished", (q) => q.eq("status", "finished").gte("finishedAt", fiveMinutesAgo))
      .filter((q) => 
        q.or(
          q.and(
            q.eq(q.field("player1Id"), userId),
            q.neq(q.field("player1ResultAcknowledged"), true)
          ),
          q.and(
            q.eq(q.field("player2Id"), userId),
            q.neq(q.field("player2ResultAcknowledged"), true)
          )
        )
      )
      .order("desc")
      .first();

    return finishedGames;
  },
});

export const checkOpponentTimeout = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "playing") {
      throw new Error("Game is not active");
    }

    // Each player gets 15 minutes total
    const TIME_LIMIT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

    const currentTime = Date.now();
    const gameStartTime = game.gameTimeStarted || game.createdAt;
    const totalAllowedTime = gameStartTime + TIME_LIMIT_MS;

    // Get current player and opponent info
    const currentPlayer = game.currentTurn;
    const opponent = currentPlayer === "player1" ? "player2" : "player1";

    const currentPlayerTimeUsed = currentPlayer === "player1" ? game.player1TimeUsed || 0 : game.player2TimeUsed || 0;
    const opponentTimeUsed = opponent === "player1" ? game.player1TimeUsed || 0 : game.player2TimeUsed || 0;

    // Calculate remaining time: total allowed - current player's time used + opponent's time used
    const remainingTime = totalAllowedTime - currentPlayerTimeUsed + opponentTimeUsed;

    if (remainingTime < 0) {
      // Timeout the opponent
      const winner = currentPlayer;
      const winnerId = currentPlayer === "player1" ? game.player1Id : game.player2Id;
      const loserId = opponent === "player1" ? game.player1Id : game.player2Id;

      // Calculate game duration
      const gameDuration = currentTime - gameStartTime;

      // Update game state
      await ctx.db.patch(args.gameId, {
        status: "finished",
        winner,
        finishedAt: currentTime,
        gameEndReason: "timeout" as const,
      });

    // Update lobby status
    await ctx.db.patch(game.lobbyId, {
      status: "finished",
    });

      // Clean up presence room when game ends
      await presence.removeRoom(ctx, args.gameId);

      // Clean up spectator chat when game ends
      await ctx.runMutation(api.spectate.cleanupSpectatorChat, { gameId: args.gameId });

      // Update player stats
      await ctx.runMutation(api.profiles.updateProfileStats, {
        userId: winnerId,
        won: true,
        gameTime: gameDuration
      });

      await ctx.runMutation(api.profiles.updateProfileStats, {
        userId: loserId,
        won: false,
        gameTime: gameDuration
      });

      // Check achievements for both players
      const winnerProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", winnerId))
        .unique();

      const loserProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", loserId))
        .unique();

      // Update ELO ratings for quick match games only
      const isQuickMatch = await isQuickMatchGame(ctx, game.lobbyId);
      if (isQuickMatch && winnerProfile && loserProfile) {
        await updateEloRatings(
          ctx,
          winnerId,
          loserId,
          winnerProfile.elo ?? 1500,
          loserProfile.elo ?? 1500,
          winnerProfile.gamesPlayed,
          loserProfile.gamesPlayed
        );
      }

      if (winnerProfile) {
        void Promise.all([
          await ctx.runMutation(api.achievements.checkAchievements, { profileId: winnerProfile._id }),
          await ctx.db.patch(winnerProfile._id, {
            gameId: undefined,
          })
        ]);

      }
      
      if (loserProfile) {
        void Promise.all([
          await ctx.runMutation(api.achievements.checkAchievements, { profileId: loserProfile._id }),
          await ctx.db.patch(loserProfile._id, {
            gameId: undefined,
          })
        ]);
      }

      // Check game-specific achievements for timeout scenario
      await ctx.runMutation(api.achievements.checkGameSpecificAchievements, {
        gameId: args.gameId,
        winnerId,
        loserId
      });

      return { success: true, timedOut: true, winner, reason: "opponent_timeout" };
    }

    return { success: true, timedOut: false };
  },
})

// Update timer for current player (called periodically for sync) - REMOVED FOR PERFORMANCE
// This function was causing too many unnecessary requests. Timer is now handled client-side.

// Update timer for current player - REMOVED FOR PERFORMANCE  
// This function was causing too many unnecessary requests. Timer is now handled client-side.

// Check and handle timeouts - DEPRECATED - REMOVE FOR PERFORMANCE
// This function was causing performance issues due to frequent calls
// Timeout handling is now done client-side via Timer component
// export const checkGameTimeout = mutation({...}); // REMOVED

// Get match result details
export const getMatchResult = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    if (game.status !== "finished") return null;

    // Use cached move count instead of querying moves - much faster
    const moveCount = game.moveCount || 0;

    // Determine the reason for game ending
    let reason: "flag_captured" | "flag_reached_base" | "timeout" | "surrender" | "elimination" = "flag_captured";
    
    if (game.gameEndReason === "timeout") {
      reason = "timeout";
    } else if (game.gameEndReason === "surrender") {
      reason = "surrender";
    } else if (game.gameEndReason === "flag_reached_base") {
      reason = "flag_reached_base";
    } else {
      // Only query moves if we need to determine the exact reason (expensive fallback)
      if (!game.gameEndReason) {
        const moves = await ctx.db
          .query("moves")
          .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
          .order("desc")
          .take(1);
        
        const lastMove = moves[0];
        if (lastMove?.challengeResult?.defender === "Flag") {
          reason = "flag_captured";
        } else {
          reason = "elimination";
        }
      } else {
        reason = game.gameEndReason;
      }
    }

    // Duration should measure actual play time (exclude setup). Fallback to createdAt for legacy games.
    const startedAt = game.gameTimeStarted || game.createdAt;
    const duration = game.finishedAt ? Math.floor((game.finishedAt - startedAt) / 1000) : 0;

    return {
      winner: game.winner || "draw",
      reason,
      duration,
      moves: moveCount, // Use cached count
      player1Username: game.player1Username,
      player2Username: game.player2Username,
      finalBoard: game.board,
    };
  },
});

// Get match history for a user with optimized cursor-based pagination
export const getMatchHistory = query({
  args: {
    userId: v.optional(v.id("users")),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    }),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("games"),
      opponentUsername: v.string(),
      isWin: v.boolean(),
      isDraw: v.boolean(),
      reason: v.string(),
      duration: v.number(),
      moves: v.number(),
      createdAt: v.number(),
      rankAtTime: v.string(),
      gameId: v.id("games"),
      lobbyName: v.string(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userId = args.userId || await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { paginationOpts } = args;
    const limit = Math.min(paginationOpts.numItems, 20);

    // Get user's profile once for rank info
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    // Use proper pagination with cursor support
    let result;
    if (paginationOpts.cursor && paginationOpts.cursor.trim() !== "") {
      try {
        // Create a fresh query for pagination
        const paginatedQuery = ctx.db
          .query("games")
          .withIndex("by_status_finished", (q) => q.eq("status", "finished"))
          .filter((q) => 
            q.or(
              q.eq(q.field("player1Id"), userId),
              q.eq(q.field("player2Id"), userId)
            )
          )
          .order("desc");

        result = await paginatedQuery.paginate({
          numItems: limit,
          cursor: paginationOpts.cursor,
        });
      } catch (error) {
        // If cursor parsing fails, fall back to first page with proper pagination
        console.warn("Failed to parse cursor, falling back to first page:", error);
        const fallbackQuery = ctx.db
          .query("games")
          .withIndex("by_status_finished", (q) => q.eq("status", "finished"))
          .filter((q) => 
            q.or(
              q.eq(q.field("player1Id"), userId),
              q.eq(q.field("player2Id"), userId)
            )
          )
          .order("desc");

        // Use paginate even for fallback to get proper cursor
        result = await fallbackQuery.paginate({
          numItems: limit,
          cursor: null,
        });
      }
    } else {
      // First page - create a fresh query with proper pagination
      const firstPageQuery = ctx.db
        .query("games")
        .withIndex("by_status_finished", (q) => q.eq("status", "finished"))
        .filter((q) => 
          q.or(
            q.eq(q.field("player1Id"), userId),
            q.eq(q.field("player2Id"), userId)
          )
        )
        .order("desc");

      result = await firstPageQuery.paginate({
        numItems: limit,
        cursor: null,
      });
    }

    // Transform games into match history format
    const matchHistory = await Promise.all(
      result.page.map(async (game) => {
        const isPlayer1 = game.player1Id === userId;
        const opponentUsername = isPlayer1 ? game.player2Username : game.player1Username;
        const isWin = game.winner === (isPlayer1 ? "player1" : "player2");
        const isDraw = game.winner === undefined;

        // Use cached move count instead of querying moves table
        const movesCount = game.moveCount || 0;

        return {
          _id: game._id,
          opponentUsername,
          isWin,
          isDraw,
          reason: game.gameEndReason || "flag_captured",
          // Use gameTimeStarted to reflect actual play duration (exclude setup). Fallback for legacy games.
          duration: game.finishedAt
            ? Math.floor((game.finishedAt - (game.gameTimeStarted || game.createdAt)) / 1000)
            : 0,
          moves: movesCount,
          createdAt: game.createdAt,
          rankAtTime: profile?.rank || "Recruit",
          gameId: game._id,
          lobbyName: game.lobbyName || "Unknown",
        };
      })
    );

    return {
      page: matchHistory,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      hasMore: !result.isDone,
    };
  },
});

// Get game replay data
export const getGameReplay = query({
  args: {
    gameId: v.id("games"),
    moveLimit: v.optional(v.number()), // Allow limiting moves for large games
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "finished") {
      throw new Error("Can only replay finished games");
    }

    // Limit moves if specified (useful for very long games)
    const moveLimit = args.moveLimit || 1000; // Default limit of 1000 moves

    // Get moves in chronological order with limit
    const allMoves = await ctx.db
      .query("moves")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .order("asc")
      .take(moveLimit);

    // Filter out setup moves and keep only game moves
    const gameMoves = allMoves.filter(move => move.moveType === "move" || move.moveType === "challenge");

    // Use the saved initial setup board, or reconstruct from current board if not available
    let initialBoard = game.initialSetupBoard;
    
    if (!initialBoard) {
      // Fallback for games created before we saved initial setup
      // Try to reconstruct initial positions from final board and moves
      initialBoard = game.board.map(row => 
        row.map(cell => cell ? { ...cell, revealed: false } : null)
      );
      
      // If we have moves, try to reverse them to get initial positions
      // This is a best-effort reconstruction for legacy games
      if (gameMoves.length > 0) {
        // For now, just use the final board with pieces hidden
        // A more sophisticated approach could reverse-engineer the moves
        console.warn("Game missing initial setup board, using fallback reconstruction");
      }
    }

    return {
      game,
      moves: gameMoves,
      initialBoard,
      player1Username: game.player1Username,
      player2Username: game.player2Username,
      moveCount: gameMoves.length,
      isTruncated: allMoves.length >= moveLimit, // Indicate if moves were truncated
    };
  },
});

// Acknowledge game result (so it won't show the modal again)
export const acknowledgeGameResult = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "finished") {
      throw new Error("Game is not finished");
    }

    const isPlayer1 = userId === game.player1Id;
    const isPlayer2 = userId === game.player2Id;

    if (!isPlayer1 && !isPlayer2) {
      throw new Error("Not a player in this game");
    }

    // Update the acknowledgment field for the current player
    const updateField = isPlayer1 ? "player1ResultAcknowledged" : "player2ResultAcknowledged";
    
    await ctx.db.patch(args.gameId, {
      [updateField]: true,
    });

    return { success: true };
  },
});

// Internal function to cleanup stale games (setup >40 mins, playing >40 mins)
export const cleanupStaleGames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const fortyMinutesAgo = Date.now() - (40 * 60 * 1000); // 40 minutes in milliseconds
    let deletedSetupGames = 0;
    let forfeitedPlayingGames = 0;

    // Handle stale setup games (>40 minutes old)
    // OPTIMIZED: Added limit to prevent excessive document scanning
    const staleSetupGames = await ctx.db
      .query("games")
      .withIndex("by_status_setup_time", (q) =>
        q.eq("status", "setup").lt("setupTimeStarted", fortyMinutesAgo)
      )
      .take(100); // Process in batches to avoid timeout

    for (const game of staleSetupGames) {
      try {
        // Get both player profiles
        const [player1Profile, player2Profile] = await Promise.all([
          ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", game.player1Id))
            .unique(),
          ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", game.player2Id))
            .unique(),
        ]);

        // Clear gameId and lobbyId from both profiles
        if (player1Profile) {
          await ctx.db.patch(player1Profile._id, {
            gameId: undefined,
            lobbyId: undefined,
          });
        }
        if (player2Profile) {
          await ctx.db.patch(player2Profile._id, {
            gameId: undefined,
            lobbyId: undefined,
          });
        }

        // Delete the associated lobby
        await ctx.db.delete(game.lobbyId);

        // Delete the game
        await ctx.db.delete(game._id);

        // Clean up presence room
        await presence.removeRoom(ctx, game._id);

        deletedSetupGames++;
      } catch (error) {
        console.error(`Error deleting stale setup game ${game._id}:`, error);
      }
    }

    // Handle stale playing games (>40 minutes old)
    // OPTIMIZED: Added limit to prevent excessive document scanning
    const stalePlayingGames = await ctx.db
      .query("games")
      .withIndex("by_status_game_time", (q) =>
        q.eq("status", "playing").lt("gameTimeStarted", fortyMinutesAgo)
      )
      .take(100); // Process in batches to avoid timeout

    for (const game of stalePlayingGames) {
      try {
        // Use existing forfeitGame mutation to handle playing games
        // The current turn player loses (took too long on their turn)
        await ctx.runMutation(api.games.forfeitGame, {
          gameId: game._id,
          reason: "disconnection_timeout",
        });

        forfeitedPlayingGames++;
      } catch (error) {
        console.error(`Error forfeiting stale playing game ${game._id}:`, error);
      }
    }

    console.log(`Cleaned up ${deletedSetupGames} stale setup games and ${forfeitedPlayingGames} stale playing games`);
    return { deletedSetupGames, forfeitedPlayingGames };
  },
});
