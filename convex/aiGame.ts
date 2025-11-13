import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

// Game pieces and their ranks (same as regular games)
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

// Generate random AI setup
function generateAISetup() {
  const shuffledPieces = [...INITIAL_PIECES].sort(() => Math.random() - 0.5);
  const board = createEmptyBoard();
  let pieceIndex = 0;
  
  // AI places pieces in rows 0, 1, 2 (top of board)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      if (pieceIndex < shuffledPieces.length) {
        board[row][col] = {
          piece: shuffledPieces[pieceIndex],
          player: "player2",
          revealed: false,
        };
        pieceIndex++;
      }
    }
  }
  
  return board;
}

// Start a new AI game session
export const startAIGameSession = mutation({
  args: { 
    profileId: v.id("profiles"), 
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    behavior: v.union(
      v.literal("aggressive"),
      v.literal("defensive"),
      v.literal("passive"),
      v.literal("balanced"),
    ),
  },
  returns: v.object({ 
    sessionId: v.string(), 
    initialBoard: v.array(v.array(v.union(v.null(), v.object({
      piece: v.string(),
      player: v.union(v.literal("player1"), v.literal("player2")),
      revealed: v.boolean(),
    }))))
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db.get(args.profileId);
    if (!profile || profile.userId !== userId) {
      throw new Error("Invalid profile");
    }

    // Generate unique session ID
    const sessionId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate AI setup
    const aiBoard = generateAISetup();
    
    // Store session in database
    const inserted = await ctx.db.insert("aiGameSessions", {
      sessionId,
      playerId: userId,
      playerUsername: profile.username,
      behavior: args.behavior,
      difficulty: args.difficulty,
      status: "setup",
      currentTurn: "player1",
      board: aiBoard,
      playerSetup: false,
      aiSetup: true,
      createdAt: Date.now(),
      setupTimeStarted: Date.now(),
      moveCount: 0,
    });

    // Mark profile with active ai session id for quick presence lookup
    await ctx.db.patch(profile._id, { aiSessionId: inserted });

    return { 
      sessionId, 
      initialBoard: aiBoard
    };
  },
});

// Get AI game session
export const getAIGameSession = query({
  args: { sessionId: v.string() },
  returns: v.union(v.null(), v.object({
    _id: v.id("aiGameSessions"),
    _creationTime: v.number(),
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
  })),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const session = await ctx.db
      .query("aiGameSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session || session.playerId !== userId) {
      return null;
    }

    return session;
  },
});

// Setup player pieces for AI game
export const setupAIGamePieces = mutation({
  args: {
    sessionId: v.string(),
    pieces: v.array(v.object({
      piece: v.string(),
      row: v.number(),
      col: v.number(),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db
      .query("aiGameSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session || session.playerId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    if (session.status !== "setup") {
      throw new Error("Game is not in setup phase");
    }

    // Validate piece setup
    if (args.pieces.length !== INITIAL_PIECES.length) {
      throw new Error("Invalid number of pieces");
    }

    // Check if pieces are in correct area (player uses rows 5, 6, 7)
    const validRows = [5, 6, 7];
    for (const piece of args.pieces) {
      if (!validRows.includes(piece.row) || piece.col < 0 || piece.col > 8) {
        throw new Error("Pieces must be placed in your area");
      }
    }

    // Update board with player pieces
    const newBoard = [...session.board];
    for (const piece of args.pieces) {
      newBoard[piece.row][piece.col] = {
        piece: piece.piece,
        player: "player1",
        revealed: false,
      };
    }

    // Start the game since AI is always ready
    await ctx.db.patch(session._id, {
      board: newBoard,
      playerSetup: true,
      status: "playing",
      gameTimeStarted: Date.now(),
    });

    return null;
  },
});

// Battle logic helper function
function resolveBattle(attacker: string, defender: string): "attacker" | "defender" | "tie" {
  const attackerRank = PIECES[attacker as keyof typeof PIECES];
  const defenderRank = PIECES[defender as keyof typeof PIECES];

  if (attacker === "Flag" || defender === "Flag") {
    if (attacker === "Flag" && defender === "Flag") {
      return "attacker";
    } else if (attacker === "Flag") {
      throw new Error("Flag cannot move to attack");
    } else {
      return "attacker";
    }
  } else if (attacker === "Spy") {
    if (defender === "Flag" || (defenderRank >= 2 && defenderRank <= 13)) {
      return "attacker";
    } else if (defender === "Private") {
      return "defender";
    } else if (defender === "Spy") {
      return "tie";
    } else {
      return "tie";
    }
  } else if (defender === "Spy") {
    if (attacker === "Private") {
      return "attacker";
    } else if (attacker === "Spy") {
      return "tie";
    } else if (attackerRank >= 2 && attackerRank <= 13) {
      return "defender";
    } else {
      return "tie";
    }
  } else if (attacker === "Private") {
    if (defender === "Flag" || defender === "Spy") {
      return "attacker";
    } else if (defender === "Private") {
      return "tie";
    } else {
      return "defender";
    }
  } else if (defender === "Private") {
    if (attacker === "Spy") {
      return "defender";
    } else if (attacker === "Private") {
      return "tie";
    } else {
      return "attacker";
    }
  } else {
    if (attackerRank > defenderRank) {
      return "attacker";
    } else if (attackerRank < defenderRank) {
      return "defender";
    } else {
      return "tie";
    }
  }
}

// Make a move in AI game
export const makeAIGameMove = mutation({
  args: {
    sessionId: v.string(),
    fromRow: v.number(),
    fromCol: v.number(),
    toRow: v.number(),
    toCol: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    challengeResult: v.optional(v.object({
      attacker: v.string(),
      defender: v.string(),
      winner: v.union(v.literal("attacker"), v.literal("defender"), v.literal("tie")),
    })),
    winner: v.optional(v.union(v.literal("player1"), v.literal("player2")))
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db
      .query("aiGameSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session || session.playerId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    if (session.status !== "playing") {
      throw new Error("Game is not active");
    }

    if (session.currentTurn !== "player1") {
      throw new Error("Not your turn");
    }

    // Validate move
    const fromPiece = session.board[args.fromRow][args.fromCol];
    if (!fromPiece || fromPiece.player !== "player1") {
      throw new Error("Invalid piece selection");
    }

    // Check if move is valid (adjacent squares only)
    const rowDiff = Math.abs(args.toRow - args.fromRow);
    const colDiff = Math.abs(args.toCol - args.fromCol);
    if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
      throw new Error("Invalid move - pieces can only move to adjacent squares");
    }

    // Check bounds
    if (args.toRow < 0 || args.toRow > 7 || args.toCol < 0 || args.toCol > 8) {
      throw new Error("Move out of bounds");
    }

    const toPiece = session.board[args.toRow][args.toCol];
    const newBoard = session.board.map((row: any) => [...row]);

    let challengeResult: { attacker: string; defender: string; winner: "attacker" | "defender" | "tie" } | null = null;
    let gameWinner: "player1" | "player2" | null = null;

    if (toPiece) {
      // Challenge/battle
      if (toPiece.player === "player1") {
        throw new Error("Cannot attack your own piece");
      }

      // Validate flag can only attack another flag
      if (fromPiece.piece === "Flag" && toPiece.piece !== "Flag") {
        throw new Error("Flag can only capture another Flag");
      }

      const winner = resolveBattle(fromPiece.piece, toPiece.piece);

      challengeResult = {
        attacker: fromPiece.piece,
        defender: toPiece.piece,
        winner,
      };

      const revealedFromPiece = { ...fromPiece, revealed: false };

      if (winner === "attacker") {
        newBoard[args.toRow][args.toCol] = revealedFromPiece;
        newBoard[args.fromRow][args.fromCol] = null;

        if (toPiece.piece === "Flag") {
          gameWinner = "player1";
        }
      } else if (winner === "defender") {
        newBoard[args.toRow][args.toCol] = toPiece;
        newBoard[args.fromRow][args.fromCol] = null;
      } else {
        newBoard[args.toRow][args.toCol] = null;
        newBoard[args.fromRow][args.fromCol] = null;
      }
    } else {
      // Simple move
      newBoard[args.toRow][args.toCol] = fromPiece;
      newBoard[args.fromRow][args.fromCol] = null;
    }

    // Check if either player has only the flag remaining
    const hasOnlyFlag = (board: any[][], player: "player1" | "player2"): boolean => {
      const pieces = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 9; col++) {
          const cell = board[row][col];
          if (cell && cell.player === player) {
            pieces.push(cell.piece);
          }
        }
      }
      return pieces.length === 1 && pieces[0] === "Flag";
    };

    // If either player has only the flag, end the game
    if (hasOnlyFlag(newBoard, "player1")) {
      gameWinner = "player2";
    } else if (hasOnlyFlag(newBoard, "player2")) {
      gameWinner = "player1";
    }

    // Update session
    const updates: any = {
      board: newBoard,
      currentTurn: "player2", // Switch to AI turn
      lastMoveTime: Date.now(),
      lastMoveFrom: { row: args.fromRow, col: args.fromCol },
      lastMoveTo: { row: args.toRow, col: args.toCol },
      moveCount: session.moveCount + 1,
    };

    // Deferred check: After turn switches to player2, check if player1's flag is in player2's base (row 0)
    // This ensures both players have equal moves before the game ends
    let flagReachedBase = false;
    if (!gameWinner) {
      const player2BaseRow = 0; // Player 2's base row (top of board)
      for (let col = 0; col < 9; col++) {
        const cell = newBoard[player2BaseRow][col];
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

      // Determine game end reason
      let gameEndReason: "flag_captured" | "flag_reached_base" | "elimination" = "flag_captured";
      if (flagReachedBase) {
        gameEndReason = "flag_reached_base";
      } else if (fromPiece.piece === "Flag" && !toPiece) {
        gameEndReason = "flag_reached_base";
      } else if (hasOnlyFlag(newBoard, gameWinner === "player1" ? "player2" : "player1")) {
        gameEndReason = "elimination";
      } else if (challengeResult && challengeResult.defender === "Flag") {
        gameEndReason = "flag_captured";
      }
      updates.gameEndReason = gameEndReason;

      // Clear AI session ID from profile when game ends
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      if (profile?.aiSessionId) {
        await ctx.db.patch(profile._id, { aiSessionId: undefined });
      }
    }

    await ctx.db.patch(session._id, updates);

    return {
      success: true,
      challengeResult: challengeResult || undefined,
      winner: gameWinner || undefined
    } as {
      success: boolean;
      challengeResult?: { attacker: string; defender: string; winner: "attacker" | "defender" | "tie" };
      winner?: "player1" | "player2"
    };
  },
});

// Internal query to get AI session by sessionId - optimized for actions
export const getAISessionById = internalQuery({
  args: {
    sessionId: v.string(),
    userId: v.id("users"),
  },
  returns: v.union(v.null(), v.object({
    _id: v.id("aiGameSessions"),
    _creationTime: v.number(),
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
    moveCount: v.number(),
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
  })),
  handler: async (ctx, args) => {
    // OPTIMIZED: Use profile lookup for direct session access
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile?.aiSessionId) return null;

    // Direct lookup using aiSessionId
    const session = await ctx.db.get(profile.aiSessionId);
    
    // Verify session exists, belongs to user, and matches sessionId
    if (!session || session.playerId !== args.userId || session.sessionId !== args.sessionId) {
      return null;
    }

    return session;
  },
});

// Generate AI move
// OPTIMIZED: Queries database directly via internal query instead of calling public query
export const generateAIMove = action({
  args: { 
    sessionId: v.string(),
  },
  returns: v.union(v.null(), v.object({
    fromRow: v.number(),
    fromCol: v.number(),
    toRow: v.number(),
    toCol: v.number(),
    piece: v.string(),
  })),
  handler: async (ctx, args): Promise<{
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    piece: string;
  } | null> => {
    // Get userId from auth via loggedInUser query
    const user = await ctx.runQuery(api.auth.loggedInUser, {});
    if (!user?._id) return null;

    // OPTIMIZED: Use internal query for direct database access instead of public query
    const session = await ctx.runQuery(internal.aiGame.getAISessionById, {
      sessionId: args.sessionId,
      userId: user._id,
    });

    if (!session || session.status !== "playing" || session.currentTurn !== "player2") {
      return null;
    }

    // Behavior- and difficulty-aware AI
    const aiPieces: { row: number; col: number; piece: string }[] = [];
    
    // Find all AI pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 9; col++) {
        const piece = session.board[row][col];
        if (piece && piece.player === "player2") {
          aiPieces.push({ row, col, piece: piece.piece });
        }
      }
    }

    // Utility helpers
    const getPieceRank = (name: string | undefined) => name ? PIECES[name as keyof typeof PIECES] : -1;
    const inBounds = (r: number, c: number) => r >= 0 && r <= 7 && c >= 0 && c <= 8;
    const canPlayerCaptureSquare = (row: number, col: number, aiPieceName: string): boolean => {
      const dirs = [ {r:-1,c:0}, {r:1,c:0}, {r:0,c:-1}, {r:0,c:1} ];
      for (const d of dirs) {
        const rr = row + d.r; const cc = col + d.c;
        if (!inBounds(rr, cc)) continue;
        const p = session.board[rr][cc];
        if (p && p.player === "player1") {
          // Skip pieces that cannot attack (like Flag)
          if (p.piece === "Flag") continue;

          const outcome = resolveBattle(p.piece, aiPieceName);
          if (outcome === "attacker") return true;
        }
      }
      return false;
    };

    // Get all possible moves for AI pieces
    const possibleMoves: Array<{
      fromRow: number; fromCol: number; toRow: number; toCol: number; piece: string;
      isAttack: boolean; targetPiece?: string; forwardDelta: number; isSafe: boolean; attackAdvantage: number;
    }> = [];
    for (const aiPiece of aiPieces) {
      const directions = [
        { row: -1, col: 0 }, // up
        { row: 1, col: 0 },  // down
        { row: 0, col: -1 }, // left
        { row: 0, col: 1 },  // right
      ];

      for (const dir of directions) {
        const newRow = aiPiece.row + dir.row;
        const newCol = aiPiece.col + dir.col;

        // Check bounds
        if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 8) continue;

        const targetPiece = session.board[newRow][newCol];

        // Can't move to own piece
        if (targetPiece && targetPiece.player === "player2") continue;

        // Flag can only attack other Flags
        if (aiPiece.piece === "Flag" && targetPiece && targetPiece.piece !== "Flag") continue;

        const attackAdvantage = targetPiece ? (getPieceRank(aiPiece.piece) - getPieceRank(targetPiece.piece)) : 0;
        const isSafe = !canPlayerCaptureSquare(newRow, newCol, aiPiece.piece);
        possibleMoves.push({
          fromRow: aiPiece.row,
          fromCol: aiPiece.col,
          toRow: newRow,
          toCol: newCol,
          piece: aiPiece.piece,
          isAttack: !!targetPiece,
          targetPiece: targetPiece?.piece,
          forwardDelta: newRow - aiPiece.row,
          isSafe,
          attackAdvantage,
        });
      }
    }

    if (possibleMoves.length === 0) {
      return null;
    }

    // Score moves by behavior and difficulty
    const behavior = session.behavior;
    const difficulty = session.difficulty;

    const scoreMove = (m: typeof possibleMoves[number]): number => {
      let score = 0;
      const myRank = getPieceRank(m.piece);
      const isFlagAttack = m.targetPiece === "Flag";
      const spyGood = m.piece === "Spy" && !!m.targetPiece && m.targetPiece !== "Private" && m.targetPiece !== "Spy";
      const privateVsSpy = m.piece === "Private" && m.targetPiece === "Spy";
      const forwardBonus = m.forwardDelta > 0 ? 2 : m.forwardDelta < 0 ? -1 : 0;
      const safety = m.isSafe ? 3 : -4;

      switch (behavior) {
        case "aggressive":
          score += (m.isAttack ? 10 : 0) + m.attackAdvantage * 2;
          if (isFlagAttack) score += 100;
          if (spyGood) score += 8;
          if (privateVsSpy) score += 6;
          score += forwardBonus;
          score += m.isSafe ? 1 : -1;
          break;
        case "defensive":
          score += (m.isAttack ? 6 : 0) + m.attackAdvantage;
          if (isFlagAttack) score += 100;
          if (spyGood) score += 6;
          if (privateVsSpy) score += 5;
          score += safety * 2;
          if (!m.isSafe && myRank >= PIECES["Captain"]) score -= 4;
          break;
        case "passive":
          score += (m.isAttack ? -5 : 0);
          score += safety * 2;
          score += forwardBonus;
          break;
        case "balanced":
        default:
          score += (m.isAttack ? 8 : 0) + m.attackAdvantage;
          if (isFlagAttack) score += 100;
          if (spyGood) score += 7;
          if (privateVsSpy) score += 5;
          score += safety;
          score += forwardBonus;
      }

      // Difficulty tuning
      if (difficulty === "easy") {
        score = score * 0.5 + (Math.random() * 10 - 5);
      } else if (difficulty === "medium") {
        score = score + (Math.random() * 4 - 2);
      } else if (difficulty === "hard") {
        if (!m.isSafe) {
          const dirs = [ {r:-1,c:0},{r:1,c:0},{r:0,c:-1},{r:0,c:1} ];
          for (const d of dirs) {
            const rr = m.toRow + d.r, cc = m.toCol + d.c;
            if (!inBounds(rr, cc)) continue;
            const p = session.board[rr][cc];
            if (p && p.player === "player1") {
              // Flag can only attack another Flag
              if (p.piece === "Flag" && m.piece !== "Flag") continue;

              const outcome = resolveBattle(p.piece, m.piece);
              if (outcome === "attacker") {
                score -= 8 + Math.max(0, getPieceRank(p.piece) - myRank);
              }
            }
          }
        }
        const centerPenalty = Math.abs(m.toCol - 4) * 0.5;
        score -= centerPenalty;
      }

      return score;
    };

    let selectedMove = possibleMoves[0];
    let bestScore = -Infinity;
    for (const m of possibleMoves) {
      const s = scoreMove(m);
      if (s > bestScore || (s === bestScore && Math.random() < 0.5)) {
        bestScore = s;
        selectedMove = m;
      }
    }

    return {
      fromRow: selectedMove.fromRow,
      fromCol: selectedMove.fromCol,
      toRow: selectedMove.toRow,
      toCol: selectedMove.toCol,
      piece: selectedMove.piece,
    };
  },
});

// Execute AI move
export const executeAIMove = mutation({
  args: {
    sessionId: v.string(),
    fromRow: v.number(),
    fromCol: v.number(),
    toRow: v.number(),
    toCol: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    challengeResult: v.optional(v.object({
      attacker: v.string(),
      defender: v.string(),
      winner: v.union(v.literal("attacker"), v.literal("defender"), v.literal("tie")),
    })),
    winner: v.optional(v.union(v.literal("player1"), v.literal("player2")))
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("aiGameSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session || session.status !== "playing" || session.currentTurn !== "player2") {
      throw new Error("Invalid AI move attempt");
    }

    // Execute move (similar to player move but for AI)
    const fromPiece = session.board[args.fromRow][args.fromCol];
    if (!fromPiece || fromPiece.player !== "player2") {
      throw new Error("Invalid AI piece selection");
    }

    const toPiece = session.board[args.toRow][args.toCol];
    const newBoard = session.board.map((row: any) => [...row]);

    let challengeResult: { attacker: string; defender: string; winner: "attacker" | "defender" | "tie" } | null = null;
    let gameWinner: "player1" | "player2" | null = null;

    if (toPiece) {
      // Validate flag can only attack another flag (safety check)
      if (fromPiece.piece === "Flag" && toPiece.piece !== "Flag") {
        throw new Error("Flag can only capture another Flag");
      }

      // Battle logic
      const winner = resolveBattle(fromPiece.piece, toPiece.piece);

      challengeResult = {
        attacker: fromPiece.piece,
        defender: toPiece.piece,
        winner,
      };

      const revealedFromPiece = { ...fromPiece, revealed: false };

      if (winner === "attacker") {
        newBoard[args.toRow][args.toCol] = revealedFromPiece;
        newBoard[args.fromRow][args.fromCol] = null;

        if (toPiece.piece === "Flag") {
          gameWinner = "player2";
        }
      } else if (winner === "defender") {
        newBoard[args.toRow][args.toCol] = toPiece;
        newBoard[args.fromRow][args.fromCol] = null;
      } else {
        newBoard[args.toRow][args.toCol] = null;
        newBoard[args.fromRow][args.fromCol] = null;
      }
    } else {
      // Simple move
      newBoard[args.toRow][args.toCol] = fromPiece;
      newBoard[args.fromRow][args.fromCol] = null;

      // Note: Flag reaching opponent's base is checked after opponent's turn (deferred)
    }

    // Check if either player has only the flag remaining
    const hasOnlyFlag = (board: any[][], player: "player1" | "player2"): boolean => {
      const pieces = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 9; col++) {
          const cell = board[row][col];
          if (cell && cell.player === player) {
            pieces.push(cell.piece);
          }
        }
      }
      return pieces.length === 1 && pieces[0] === "Flag";
    };

    // If either player has only the flag, end the game
    if (hasOnlyFlag(newBoard, "player1")) {
      gameWinner = "player2";
    } else if (hasOnlyFlag(newBoard, "player2")) {
      gameWinner = "player1";
    }

    // Update session
    const updates: any = {
      board: newBoard,
      currentTurn: "player1", // Switch back to player
      lastMoveTime: Date.now(),
      lastMoveFrom: { row: args.fromRow, col: args.fromCol },
      lastMoveTo: { row: args.toRow, col: args.toCol },
      moveCount: session.moveCount + 1,
    };

    // Deferred check: After AI's turn, check if player2's flag reached player1's base (row 7)
    // This ensures player1 gets one more turn to react when player2's flag reaches their base
    let flagReachedBase = false;
    if (!gameWinner) {
      const player1BaseRow = 7; // Player 1's base row (bottom of board)
      for (let col = 0; col < 9; col++) {
        const cell = newBoard[player1BaseRow][col];
        if (cell && cell.player === "player2" && cell.piece === "Flag") {
          gameWinner = "player2";
          flagReachedBase = true;
          break;
        }
      }
    }

    if (gameWinner) {
      updates.status = "finished";
      updates.winner = gameWinner;

      // Determine game end reason
      let gameEndReason: "flag_captured" | "flag_reached_base" | "elimination" = "flag_captured";
      if (flagReachedBase) {
        gameEndReason = "flag_reached_base";
      } else if (fromPiece.piece === "Flag" && !toPiece) {
        gameEndReason = "flag_reached_base";
      } else if (hasOnlyFlag(newBoard, gameWinner === "player1" ? "player2" : "player1")) {
        gameEndReason = "elimination";
      } else if (challengeResult && challengeResult.defender === "Flag") {
        gameEndReason = "flag_captured";
      }
      updates.gameEndReason = gameEndReason;

      // Clear AI session ID from profile when game ends
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", session.playerId))
        .unique();
      if (profile?.aiSessionId) {
        await ctx.db.patch(profile._id, { aiSessionId: undefined });
      }
    }

    await ctx.db.patch(session._id, updates);

    return {
      success: true,
      challengeResult: challengeResult || undefined,
      winner: gameWinner || undefined
    } as {
      success: boolean;
      challengeResult?: { attacker: string; defender: string; winner: "attacker" | "defender" | "tie" };
      winner?: "player1" | "player2"
    };
  },
});

// Surrender AI game
export const surrenderAIGame = mutation({
  args: { sessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db
      .query("aiGameSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session || session.playerId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    if (session.status !== "playing") {
      throw new Error("Game is not active");
    }

    await ctx.db.patch(session._id, {
      status: "finished",
      winner: "player2",
      gameEndReason: "surrender",
    });

    // Clear profile ai session link
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile?.aiSessionId) {
      await ctx.db.patch(profile._id, { aiSessionId: undefined });
    }

    return null;
  },
});

// Clean up AI game session
export const cleanupAIGameSession = mutation({
  args: { sessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db
      .query("aiGameSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session || session.playerId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    // Delete the session
    await ctx.db.delete(session._id);

    // Clear profile ai session link if pointing to this session
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (profile?.aiSessionId) {
      await ctx.db.patch(profile._id, { aiSessionId: undefined });
    }

    return null;
  },
});

// Get current user's active AI game
// OPTIMIZED: Uses profile.aiSessionId for O(1) direct lookup instead of index scan + filter
export const getCurrentUserAIGame = query({
  args: {},
  returns: v.union(v.null(), v.object({
    _id: v.id("aiGameSessions"),
    _creationTime: v.number(),
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
  })),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // OPTIMIZED: Get profile first to use aiSessionId for direct lookup
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile?.aiSessionId) return null;

    // Direct lookup using aiSessionId - O(1) instead of index scan + filter
    const session = await ctx.db.get(profile.aiSessionId);
    
    // Verify session exists, belongs to user, and is active
    if (!session || session.playerId !== userId) {
      return null;
    }

    // Only return if session is in setup or playing status
    if (session.status !== "setup" && session.status !== "playing") {
      return null;
    }

    return session;
  },
});

// Cleanup stale AI game sessions (internal function for cron job)
export const cleanupStaleAIGameSessions = internalMutation({
  args: {},
  returns: v.object({
    deletedCount: v.number(),
    processedCount: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds

    // OPTIMIZED: Added limit and batch processing to prevent excessive document scanning
    const BATCH_SIZE = 100;
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      // Find all AI game sessions older than 1 hour (uses by_created_at index)
      const staleSessions = await ctx.db
        .query("aiGameSessions")
        .withIndex("by_created_at")
        .filter((q) => q.lt(q.field("createdAt"), oneHourAgo))
        .take(BATCH_SIZE);

      if (staleSessions.length === 0) {
        hasMore = false;
        break;
      }

      // Process batch
      for (const session of staleSessions) {
        // Clear aiSessionId from associated profile if it matches this session
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", session.playerId))
          .unique();

        if (profile?.aiSessionId === session._id) {
          await ctx.db.patch(profile._id, { aiSessionId: undefined });
        }

        // Delete the stale session
        await ctx.db.delete(session._id);
        totalDeleted++;
      }

      // If we got less than batch size, we're done
      if (staleSessions.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    return {
      deletedCount: totalDeleted,
      processedCount: totalDeleted,
    };
  },
});
