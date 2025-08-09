import { useState, useEffect, useRef } from "react";
import { useConvexQuery, useConvexMutationWithQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { 
  Shuffle,
  RefreshCw,
  ArrowRightLeft,
  Info,
  CheckCircle,
  Users,
  Sword,
  Target,
  Square,
  Flag,
  Eye,
  Copy,
  Crown,
  Swords,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Timer } from "./Timer";
import { GameResultModal } from "./GameResultModal";
import { AchievementNotification } from "./AchievementNotification";
import { UserAvatar } from "./UserAvatar";
import { getPieceDisplay } from "../lib/piece-display";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
}

interface GameBoardProps {
  gameId: Id<"games">;
  profile: Profile;
  onBackToLobby: () => void;
}

// Game pieces for setup (21 pieces total)
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

export function GameBoard({ gameId, profile, onBackToLobby }: GameBoardProps) {
  const { data: game, isPending: isLoadingGame } = useConvexQuery(
    api.games.getGame, 
    { gameId }
  );
  
  const { data: moves, isPending: isLoadingMoves } = useConvexQuery(
    api.games.getGameMoves, 
    { gameId }
  );
  
  const { data: matchResult } = useConvexQuery(
    api.games.getMatchResult, 
    { gameId }
  );

  const { mutate: setupPieces, isPending: isSettingUpPieces } = useConvexMutationWithQuery(api.games.setupPieces, {
    onSuccess: () => {
      toast.success("Pieces setup complete!");
    },
    onError: () => {
      toast.error("Failed to setup pieces");
    }
  });

  const { mutate: makeMove, isPending: isMakingMove } = useConvexMutationWithQuery(api.games.makeMove, {
    onSuccess: (result: any) => {
      // Clear optimistic state when real data comes back
      setOptimisticBoard(null);
      setPendingMove(null);
      setAnimatingPiece(null);
      
      if (result.challengeResult) {
        // Don't reveal pieces in toast, just indicate if it was a win/loss
        const isCurrentPlayerWinner = result.challengeResult.winner === "attacker";
        if (isCurrentPlayerWinner) {
          toast.success("Victory! Your piece wins the battle!");
        } else if (result.challengeResult.winner === "defender") {
          toast.error("Defeat! Your piece was eliminated!");
        } else {
          toast.info("Both pieces eliminated in battle!");
        }
      }
    },
    onError: (error: any) => {
      // Revert optimistic update on error
      setOptimisticBoard(null);
      setPendingMove(null);
      setAnimatingPiece(null);
      toast.error(error instanceof Error ? error.message : "Invalid move");
    }
  });

  const { mutate: surrenderGame, isPending: isSurrendering } = useConvexMutationWithQuery(api.games.surrenderGame, {
    onSuccess: () => {
      toast.success("Game surrendered");
    },
    onError: () => {
      toast.error("Failed to surrender");
    }
  });

  const { mutate: timeoutGame } = useConvexMutationWithQuery(api.games.timeoutGame, {
    onSuccess: () => {
      toast.error("Time expired! You lose the game.");
    },
    onError: () => {
      toast.error("Failed to process timeout");
    }
  });

  const { mutate: acknowledgeGameResult } = useConvexMutationWithQuery(api.games.acknowledgeGameResult, {
    onError: () => {
      toast.error("Failed to acknowledge result");
    }
  });

  // Get player profiles for avatars
  const { data: player1Profile, isPending: isLoadingPlayer1 } = useConvexQuery(
    api.profiles.getProfileByUsername, 
    game ? { username: game.player1Username } : undefined
  );
  
  const { data: player2Profile, isPending: isLoadingPlayer2 } = useConvexQuery(
    api.profiles.getProfileByUsername, 
    game ? { username: game.player2Username } : undefined
  );

  const [setupBoard, setSetupBoard] = useState<(string | null)[][]>(
    Array(8).fill(null).map(() => Array(9).fill(null))
  );
  const [availablePieces, setAvailablePieces] = useState([...INITIAL_PIECES]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
  const [selectedSetupSquare, setSelectedSetupSquare] = useState<{row: number, col: number} | null>(null);
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [optimisticBoard, setOptimisticBoard] = useState<any[][] | null>(null);
  const [pendingMove, setPendingMove] = useState<{fromRow: number, fromCol: number, toRow: number, toCol: number} | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Animation states
  const [animatingPiece, setAnimatingPiece] = useState<{
    piece: any;
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    startTime: number;
  } | null>(null);
  const [boardRect, setBoardRect] = useState<DOMRect | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const isPlayer1 = game?.player1Id === profile.userId;
  const isPlayer2 = game?.player2Id === profile.userId;
  const isCurrentPlayer = game?.currentTurn === (isPlayer1 ? "player1" : "player2");
  
  // Check if current user has acknowledged the result
  const hasAcknowledgedResult = game?.status === "finished" && 
    ((isPlayer1 && game.player1ResultAcknowledged) || 
     (isPlayer2 && game.player2ResultAcknowledged));

  // Update current time every second for timer display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track board dimensions for animation positioning
  useEffect(() => {
    const updateBoardRect = () => {
      if (boardRef.current) {
        setBoardRect(boardRef.current.getBoundingClientRect());
      }
    };

    updateBoardRect();
    window.addEventListener('resize', updateBoardRect);
    return () => window.removeEventListener('resize', updateBoardRect);
  }, [game]); // Re-calculate when game changes

  // Initialize showResultModal to true if game is already finished when component loads
  // but only if the user hasn't acknowledged the result yet
  useEffect(() => {
    if (game?.status === "finished" && !gameFinished && !hasAcknowledgedResult) {
      setShowResultModal(true);
      setGameFinished(true);
    }
  }, [game?.status, gameFinished, hasAcknowledgedResult]);

  // Auto-select next piece after placing one and auto-enable swap mode when no pieces left
  useEffect(() => {
    if (availablePieces.length === 0) {
      setIsSwapMode(true);
      setSelectedPiece(null);
    } else if (!selectedPiece && availablePieces.length > 0 && !isSwapMode) {
      setSelectedPiece(availablePieces[0]);
    }
  }, [selectedPiece, availablePieces, isSwapMode]);

  // Clear optimistic state when game updates from server
  useEffect(() => {
    if (game && optimisticBoard && !pendingMove && !animatingPiece) {
      // If we have optimistic state but no pending move or animation, clear it
      setOptimisticBoard(null);
    }
  }, [game, optimisticBoard, pendingMove, animatingPiece]);

  // Helper function to format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to get formatted player time (matching SpectatorView logic)
  const getPlayerTime = (isPlayer1: boolean) => {
    if (!game) return "15:00"; // Default time display
    
    if (game.status === "finished") {
      // Show final time remaining for finished games
      const TOTAL_TIME = 15 * 60; // 15 minutes in seconds
      const timeUsed = isPlayer1 ? (game.player1TimeUsed || 0) : (game.player2TimeUsed || 0);
      const timeUsedSeconds = Math.floor(timeUsed / 1000);
      const remaining = Math.max(0, TOTAL_TIME - timeUsedSeconds);
      return formatTime(remaining);
    }
    
    if (game.status !== "playing") return "15:00"; // Default time display for setup
    
    const TOTAL_TIME = 15 * 60; // 15 minutes in seconds
    const timeUsed = isPlayer1 ? (game.player1TimeUsed || 0) : (game.player2TimeUsed || 0);
    const timeUsedSeconds = Math.floor(timeUsed / 1000);
    
    // If it's current player's turn, add elapsed time since turn started
    let currentTurnTime = 0;
    const isCurrentTurn = (isPlayer1 && game.currentTurn === "player1") || (!isPlayer1 && game.currentTurn === "player2");
    
    if (isCurrentTurn && (game.lastMoveTime || game.gameTimeStarted)) {
      const turnStartTime = game.lastMoveTime || game.gameTimeStarted || currentTime;
      currentTurnTime = Math.floor((currentTime - turnStartTime) / 1000);
    }
    
    const totalUsed = timeUsedSeconds + currentTurnTime;
    const remaining = Math.max(0, TOTAL_TIME - totalUsed);
    
    // Check for timeout condition - only trigger once per timeout
    if (remaining <= 0 && isCurrentTurn && game.status === "playing") {
      // Trigger timeout for the current player (only the player whose time ran out)
      if (game.currentTurn === "player1" && isPlayer1) {
        setTimeout(() => handlePlayer1Timeout(), 100);
      } else if (game.currentTurn === "player2" && isPlayer2) {
        setTimeout(() => handlePlayer2Timeout(), 100);
      }
    }
    
    return formatTime(remaining);
  };

  // Timer handlers - need to be accessible by getPlayerTime
  const handlePlayer1Timeout = () => {
    // Only the current player whose time ran out should trigger the timeout
    if (isPlayer1 && game?.currentTurn === "player1") {
      toast.error("Your time expired! You lose the game.");
      timeoutGame({ gameId });
    }
  };

  const handlePlayer2Timeout = () => {
    // Only the current player whose time ran out should trigger the timeout
    if (isPlayer2 && game?.currentTurn === "player2") {
      toast.error("Your time expired! You lose the game.");
      timeoutGame({ gameId });
    }
  };

  const randomizeSetup = () => {
    // Clear current setup
    setSetupBoard(Array(8).fill(null).map(() => Array(9).fill(null)));
    setAvailablePieces([...INITIAL_PIECES]);
    
    // Get player's valid rows
    const validRows = isPlayer1 ? [5, 6, 7] : [0, 1, 2];
    const shuffledPieces = [...INITIAL_PIECES].sort(() => Math.random() - 0.5);
    
    const newBoard = Array(8).fill(null).map(() => Array(9).fill(null));
    let pieceIndex = 0;
    
    // Fill the valid area with shuffled pieces
    for (const row of validRows) {
      for (let col = 0; col < 9; col++) {
        if (pieceIndex < shuffledPieces.length) {
          newBoard[row][col] = shuffledPieces[pieceIndex];
          pieceIndex++;
        }
      }
    }
    
    setSetupBoard(newBoard);
    setAvailablePieces([]);
    setSelectedPiece(null);
    setIsSwapMode(true);
    toast.success("Pieces randomized!");
  };

  const clearSetup = () => {
    setSetupBoard(Array(8).fill(null).map(() => Array(9).fill(null)));
    setAvailablePieces([...INITIAL_PIECES]);
    setSelectedPiece(null);
    setSelectedSetupSquare(null);
    setIsSwapMode(false);
    toast.success("Setup cleared!");
  };

  const handleSurrender = () => {
    if (window.confirm("Are you sure you want to surrender? This cannot be undone.")) {
      surrenderGame({ gameId });
    }
  };

  const handleAcknowledgeResult = () => {
    acknowledgeGameResult({ gameId });
  };

  useEffect(() => {
    if (game?.status === "finished" && !hasAcknowledgedResult) {
      const isCurrentUserWinner = game.winner === (isPlayer1 ? "player1" : "player2");
      
      if (isCurrentUserWinner) {
        toast.success("Victory! You won the game!");
      } else {
        toast.error("Defeat! You lost the game.");
      }
      
      // Show results modal immediately for finished games (only if not acknowledged)
      if (!gameFinished) {
        setShowResultModal(true);
        setGameFinished(true);
      }
    }
  }, [game?.status, game?.winner, isPlayer1, gameFinished, hasAcknowledgedResult]);

  const handleSetupSquareClick = (row: number, col: number) => {
    const validRows = isPlayer1 ? [5, 6, 7] : [0, 1, 2];
    if (!validRows.includes(row)) {
      toast.error("You can only place pieces in your area");
      return;
    }

    const currentPiece = setupBoard[row][col];
    
    // If in swap mode or no available pieces, handle swapping
    if (isSwapMode || availablePieces.length === 0) {
      if (selectedSetupSquare) {
        const selectedPiece = setupBoard[selectedSetupSquare.row][selectedSetupSquare.col];
        
        if (selectedSetupSquare.row === row && selectedSetupSquare.col === col) {
          // Deselect if clicking the same square
          setSelectedSetupSquare(null);
          return;
        }
        
        // Swap pieces
        const newBoard = setupBoard.map(r => [...r]);
        newBoard[selectedSetupSquare.row][selectedSetupSquare.col] = currentPiece;
        newBoard[row][col] = selectedPiece;
        setSetupBoard(newBoard);
        setSelectedSetupSquare(null);
        toast.success("Pieces swapped!");
        return;
      }

      // If there's a piece here, select it for swapping
      if (currentPiece) {
        setSelectedSetupSquare({ row, col });
        return;
      }
      
      // If no piece here and in swap mode, show message
      if (isSwapMode) {
        toast.info("Click on a piece to select it for swapping");
        return;
      }
    }

    // Normal placing mode
    if (currentPiece) {
      toast.error("Square is already occupied. Enable swap mode to move pieces.");
      return;
    }

    // If no piece selected from available pieces, can't place
    if (!selectedPiece) {
      toast.error("Please select a piece to place");
      return;
    }

    // Place piece
    const newBoard = setupBoard.map(r => [...r]);
    newBoard[row][col] = selectedPiece;
    setSetupBoard(newBoard);

    // Remove piece from available pieces
    const pieceIndex = availablePieces.indexOf(selectedPiece);
    const newAvailable = [...availablePieces];
    newAvailable.splice(pieceIndex, 1);
    setAvailablePieces(newAvailable);

    setSelectedPiece(null); // Will auto-select next piece via useEffect
  };

  const _handleRemovePiece = (row: number, col: number) => {
    const piece = setupBoard[row][col];
    if (!piece) return;

    // Remove from board
    const newBoard = setupBoard.map(r => [...r]);
    newBoard[row][col] = null;
    setSetupBoard(newBoard);

    // Add back to available pieces
    setAvailablePieces([...availablePieces, piece].sort());
  };

  const handleFinishSetup = async () => {
    if (availablePieces.length > 0) {
      toast.error("Please place all pieces before finishing setup");
      return;
    }

    const pieces = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 9; col++) {
        if (setupBoard[row][col]) {
          pieces.push({
            piece: setupBoard[row][col]!,
            row,
            col,
          });
        }
      }
    }

    setupPieces({ gameId, pieces });
  };

  const handleGameSquareClick = (row: number, col: number) => {
    if (!game || game.status !== "playing" || !isCurrentPlayer || isMakingMove || animatingPiece) return;

    if (selectedSquare) {
      // Make move
      if (selectedSquare.row === row && selectedSquare.col === col) {
        // Deselect
        setSelectedSquare(null);
        return;
      }

      // Check if it's a valid move (adjacent squares only)
      const isValidMove = Math.abs(selectedSquare.row - row) + Math.abs(selectedSquare.col - col) === 1;
      if (!isValidMove) {
        toast.error("Invalid move: pieces can only move to adjacent squares");
        setSelectedSquare(null);
        return;
      }

      const movingPiece = game.board[selectedSquare.row][selectedSquare.col];
      const targetPiece = game.board[row][col];
      
      // Check if trying to move to own piece
      if (targetPiece && targetPiece.player === (isPlayer1 ? "player1" : "player2")) {
        toast.error("Cannot move to a square occupied by your own piece");
        setSelectedSquare(null);
        return;
      }

      // Start piece animation
      setAnimatingPiece({
        piece: movingPiece,
        fromRow: selectedSquare.row,
        fromCol: selectedSquare.col,
        toRow: row,
        toCol: col,
        startTime: Date.now()
      });

      // Set pending move immediately
      setPendingMove({
        fromRow: selectedSquare.row,
        fromCol: selectedSquare.col,
        toRow: row,
        toCol: col
      });

      setSelectedSquare(null);

      // Delay the optimistic board update and API call to let animation play
      setTimeout(() => {
        // Apply optimistic update after animation
        const newBoard = game.board.map(r => [...r]);
        if (targetPiece) {
          // Battle scenario
          newBoard[row][col] = movingPiece;
          newBoard[selectedSquare.row][selectedSquare.col] = null;
        } else {
          // Normal move
          newBoard[row][col] = movingPiece;
          newBoard[selectedSquare.row][selectedSquare.col] = null;
        }

        setOptimisticBoard(newBoard);

        // Send mutation after animation completes
        makeMove({
          gameId,
          fromRow: selectedSquare.row,
          fromCol: selectedSquare.col,
          toRow: row,
          toCol: col,
        });

        // Clear animation state
        setAnimatingPiece(null);
      }, 800); // 800ms to ensure animation completes

    } else {
      // Select piece
      const boardToUse = optimisticBoard || game.board;
      const piece = boardToUse[row][col];
      if (piece && piece.player === (isPlayer1 ? "player1" : "player2")) {
        setSelectedSquare({ row, col });
      }
    }
  };

  // Timer handlers - simplified since server now handles timeout enforcement
  const handleSetupTimeout = () => {
    toast.error("Setup time expired! Pieces will be placed randomly.");
    randomizeSetup();
    setTimeout(() => {
      void handleFinishSetup();
    }, 1000);
  };

  // Helper function to check if a square is highlighted
  const isSquareHighlighted = (row: number, col: number) => {
    // Highlight last move
    if (game?.lastMoveFrom && game?.lastMoveTo) {
      if ((game.lastMoveFrom.row === row && game.lastMoveFrom.col === col) ||
          (game.lastMoveTo.row === row && game.lastMoveTo.col === col)) {
        return "last-move";
      }
    }
    
    // Highlight selected square
    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      return "selected";
    }
    
    return null;
  };

  // Helper function to get arrow direction for moves
  const getArrowDirection = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    if (rowDiff > 0) return ArrowDown; // Moving down
    if (rowDiff < 0) return ArrowUp;   // Moving up  
    if (colDiff > 0) return ArrowRight; // Moving right
    if (colDiff < 0) return ArrowLeft;  // Moving left
    
    return null;
  };

  if (isLoadingGame) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent"
          />
          <p className="text-white/70 text-lg">Loading game...</p>
        </motion.div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent"
        />
      </div>
    );
  }

  if (game.status === "setup") {
    const needsSetup = (isPlayer1 && !game.player1Setup) || (isPlayer2 && !game.player2Setup);
    
    if (!needsSetup) {
      return (
        <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[60vh] flex items-center justify-center"
        >
          <Card className="w-full max-w-md bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto mb-4"
              >
                <Users className="h-12 w-12 text-blue-400" />
              </motion.div>
              <CardTitle className="text-xl text-white/90">Waiting for Opponent</CardTitle>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs text-white/50">Game ID:</span>
                <code className="bg-white/10 px-2 py-1 rounded text-xs font-mono text-white/70">{gameId}</code>
                <Button
                  onClick={() => {
                    void navigator.clipboard.writeText(gameId);
                    toast.success("Game ID copied to clipboard!");
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-white/50 hover:text-white/80 hover:bg-white/10"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-white/70">
                Your army is ready! Waiting for your opponent to finish their setup...
              </p>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Your setup complete</span>
                </div>
              </div>
              <Button variant="outline" onClick={onBackToLobby} className="w-full bg-white/10 border-white/20 text-white/90 hover:bg-white/20">
                Return to Lobby
              </Button>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Achievement Notifications */}
        <AchievementNotification userId={profile.userId} />
        </>
      );
    }

    return (
      <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Setup Header */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="w-12 h-12 bg-gradient-to-br from-red-500/20 via-orange-500/20 to-yellow-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl flex items-center justify-center shadow-lg"
                >
                  <Sword className="h-6 w-6 text-red-400" />
                </motion.div>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2 text-white/90">
                    Army Setup
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 mb-1">
                    <span className="text-xs text-white/50">Game ID:</span>
                    <code className="bg-white/10 px-2 py-1 rounded text-xs font-mono text-white/70">{gameId}</code>
                    <Button
                      onClick={() => {
                        void navigator.clipboard.writeText(gameId);
                        toast.success("Game ID copied to clipboard!");
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white/50 hover:text-white/80 hover:bg-white/10"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-white/60 mt-1">
                    Strategically position your pieces for battle
                  </p>
                </div>
              </motion.div>
              <div className="flex items-center gap-3">
                <Timer
                  duration={300} // 5 minutes for setup
                  onTimeout={handleSetupTimeout}
                  label="Setup Time"
                  variant="setup"
                  isActive={needsSetup}
                  timeUsed={game.setupTimeStarted ? Math.floor((Date.now() - game.setupTimeStarted) / 1000) : 0}
                  turnStartTime={game.setupTimeStarted}
                />
                <Button variant="outline" onClick={onBackToLobby} className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20">
                  Back to Lobby
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Controls */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <Button onClick={randomizeSetup} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Shuffle className="h-4 w-4" />
                  Randomize
                </Button>
                <Button onClick={clearSetup} variant="outline" className="flex items-center gap-2 bg-white/10 border-white/20 text-white/90 hover:bg-white/20">
                  <RefreshCw className="h-4 w-4" />
                  Clear
                </Button>
                {/* Show swap mode button always, but hide "Exit Swap Mode" when no pieces left */}
                {(availablePieces.length > 0 || (availablePieces.length === 0 && !isSwapMode)) && (
                  <Button
                    onClick={() => setIsSwapMode(!isSwapMode)}
                    variant={isSwapMode ? "default" : "outline"}
                    className={`flex items-center gap-2 ${isSwapMode ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'bg-white/10 border-white/20 text-white/90 hover:bg-white/20'}`}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    {isSwapMode ? 'Exit Swap Mode' : 'Swap Mode'}
                  </Button>
                )}
              </div>
              
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  {availablePieces.length === 0 ? 'All pieces placed - Swap Mode' : 
                   isSwapMode ? 'Swap Mode Active' : `${availablePieces.length} pieces remaining`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <Target className="h-5 w-5 text-blue-400" />
                  Battle Grid
                </CardTitle>
                <p className="text-sm text-white/60">
                  {isSwapMode ? "Click on pieces to swap their positions" : "Click empty spaces to place selected pieces"}
                </p>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-9 gap-2 max-w-lg mx-auto"
                >
                  {setupBoard.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                      const validRows = isPlayer1 ? [5, 6, 7] : [0, 1, 2];
                      const isValidArea = validRows.includes(rowIndex);
                      const isOccupied = !!cell;
                      const isSelected = selectedSetupSquare?.row === rowIndex && selectedSetupSquare?.col === colIndex;
                      
                      return (
                        <motion.div
                          key={`${rowIndex}-${colIndex}`}
                          whileHover={isValidArea ? { scale: 1.05 } : {}}
                          whileTap={isValidArea ? { scale: 0.95 } : {}}
                          onClick={() => handleSetupSquareClick(rowIndex, colIndex)}
                          className={`
                            aspect-square border-2 flex items-center justify-center cursor-pointer rounded-lg transition-all
                            ${isValidArea 
                              ? 'border-primary/50 bg-primary/10 hover:bg-primary/20' 
                              : 'border-muted bg-muted/20'
                            }
                            ${isOccupied ? 'bg-accent border-accent-foreground/50' : ''}
                            ${isSelected ? 'ring-2 ring-yellow-500 bg-yellow-500/20' : ''}
                            ${selectedPiece && isValidArea && !isOccupied ? 'hover:bg-primary/30' : ''}
                          `}
                        >
                          {cell && (
                            <div className="text-foreground" title={cell}>
                              {getPieceDisplay(cell, { showLabel: true })}
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </div>

          {/* Available Pieces & Controls */}
          <div className="space-y-6">
            {availablePieces.length > 0 && (
              <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white/90">
                    <Square className="h-5 w-5 text-purple-400" />
                    Available Pieces ({availablePieces.length})
                  </CardTitle>
                  <Badge variant="outline" className="w-fit bg-purple-500/20 text-purple-300 border-purple-500/30">
                    Selected: {selectedPiece}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto"
                  >
                    {availablePieces.map((piece, index) => (
                      <motion.button
                        key={`${piece}-${index}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPiece(piece)}
                        className={`
                          p-3 border-2 rounded-lg text-sm transition-all flex flex-col items-center gap-1
                          ${selectedPiece === piece 
                            ? 'border-primary bg-primary/20 ring-2 ring-primary/50' 
                            : 'border-border bg-card hover:bg-accent hover:border-accent-foreground/50'
                          }
                        `}
                      >
                        <div className="text-foreground">{getPieceDisplay(piece, { showLabel: false })}</div>
                        <div className="text-xs text-center font-medium text-muted-foreground">{piece}</div>
                      </motion.button>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <Info className="h-5 w-5 text-orange-400" />
                  Piece Legend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-1 px-1 font-medium text-white/70">Icon</th>
                        <th className="text-left py-1 px-1 font-medium text-white/70">Piece</th>
                        <th className="text-center py-1 px-1 font-medium text-white/70">Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { piece: "5 Star General", rank: "1", short: "5★ Gen" },
                        { piece: "4 Star General", rank: "2", short: "4★ Gen" },
                        { piece: "3 Star General", rank: "3", short: "3★ Gen" },
                        { piece: "2 Star General", rank: "4", short: "2★ Gen" },
                        { piece: "1 Star General", rank: "5", short: "1★ Gen" },
                        { piece: "Colonel", rank: "6", short: "Col" },
                        { piece: "Lieutenant Colonel", rank: "7", short: "Lt Col" },
                        { piece: "Major", rank: "8", short: "Maj" },
                        { piece: "Captain", rank: "9", short: "Cpt" },
                        { piece: "1st Lieutenant", rank: "10", short: "1st Lt" },
                        { piece: "2nd Lieutenant", rank: "11", short: "2nd Lt" },
                        { piece: "Sergeant", rank: "12", short: "Sgt" },
                        { piece: "Private", rank: "13", short: "Pvt" },
                        { piece: "Spy", rank: "★", short: "Spy" },
                        { piece: "Flag", rank: "🏁", short: "Flag" }
                      ].map(({ piece, rank, short }) => (
                        <tr key={piece} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-1 px-1">
                            <div className="flex justify-center">
                              {getPieceDisplay(piece, { size: "small" })}
                            </div>
                          </td>
                          <td className="py-1 px-1 font-medium">{short}</td>
                          <td className="py-1 px-1 text-muted-foreground text-center">{rank}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {availablePieces.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={() => void handleFinishSetup()}
                  disabled={isSettingUpPieces}
                  className="w-full py-4 text-sm text-black rounded-full disabled:opacity-50"
                  size="lg"
                >
                  {isSettingUpPieces ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 mr-2 border-2 border-black border-t-transparent rounded-full"
                      />
                      Setting up pieces...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Finish Setup & Enter Battle
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Achievement Notifications */}
      <AchievementNotification userId={profile.userId} />
      </>
    );
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Game Header */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            {/* Game ID Section */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-white/50">Game ID:</span>
              <code className="bg-white/10 px-2 py-1 rounded text-xs font-mono text-white/70">{gameId}</code>
              <Button
                onClick={() => {
                  void navigator.clipboard.writeText(gameId);
                  toast.success("Game ID copied to clipboard!");
                }}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-white/50 hover:text-white/80 hover:bg-white/10"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {/* Surrender Button */}
            {game.status === "playing" && (isPlayer1 || isPlayer2) && (
              <Button
                onClick={() => void handleSurrender()}
                disabled={isSurrendering}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2 disabled:opacity-50"
              >
                {isSurrendering ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Surrendering...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4" />
                    Surrender
                  </>
                )}
              </Button>
            )}
          </div>

          {/* VS Design */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Player 1 */}
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                game.status === "finished" 
                  ? game.winner === "player1" 
                    ? 'bg-yellow-500/20 border border-yellow-500/30 shadow-lg' 
                    : 'bg-gray-500/10 border border-gray-500/20'
                  : game.currentTurn === "player1" && game.status === "playing" 
                    ? 'bg-blue-500/20 border border-blue-500/30 shadow-lg' 
                    : 'bg-transparent'
              }`}>
                <UserAvatar
                  username={player1Profile?.username || game.player1Username}
                  avatarUrl={player1Profile?.avatarUrl}
                  rank={player1Profile?.rank}
                  size="md"
                  className={`border-2 ${
                    game.status === "finished" && game.winner === "player1" 
                      ? 'border-yellow-400' 
                      : 'border-blue-500/50'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/90">{game.player1Username}</span>
                    {game.status === "finished" && game.winner === "player1" && (
                      <Crown className="h-4 w-4 text-yellow-400" />
                    )}
                    {game.currentTurn === "player1" && game.status === "playing" && (
                      <Crown className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  <div className={`text-sm font-mono ${
                    game.status === "finished" && game.winner === "player1" 
                      ? 'text-yellow-300' 
                      : 'text-blue-300'
                  }`}>
                    {getPlayerTime(true)}
                  </div>
                </div>
              </div>

              <Swords className="h-6 w-6 text-white/40" />

              {/* Player 2 */}
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                game.status === "finished" 
                  ? game.winner === "player2" 
                    ? 'bg-yellow-500/20 border border-yellow-500/30 shadow-lg' 
                    : 'bg-gray-500/10 border border-gray-500/20'
                  : game.currentTurn === "player2" && game.status === "playing" 
                    ? 'bg-red-500/20 border border-red-500/30 shadow-lg' 
                    : 'bg-transparent'
              }`}>
                <UserAvatar
                  username={player2Profile?.username || game.player2Username}
                  avatarUrl={player2Profile?.avatarUrl}
                  rank={player2Profile?.rank}
                  size="md"
                  className={`border-2 ${
                    game.status === "finished" && game.winner === "player2" 
                      ? 'border-yellow-400' 
                      : 'border-red-500/50'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/90">{game.player2Username}</span>
                    {game.status === "finished" && game.winner === "player2" && (
                      <Crown className="h-4 w-4 text-yellow-400" />
                    )}
                    {game.currentTurn === "player2" && game.status === "playing" && (
                      <Crown className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  <div className={`text-sm font-mono ${
                    game.status === "finished" && game.winner === "player2" 
                      ? 'text-yellow-300' 
                      : 'text-red-300'
                  }`}>
                    {getPlayerTime(false)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge 
                variant={game.status === "playing" ? "default" : "outline"}
                className={
                  game.status === "playing"
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                }
              >
                {game.status === "playing" ? "Playing" : "Finished"}
              </Badge>

              {game.status === "playing" && (
                <div className="text-sm text-white/60">
                  Turn {Math.floor(((moves?.length || 0) / 2) + 1)} • {game.currentTurn === "player1" ? game.player1Username : game.player2Username}'s turn
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game Board */}
        <div className="lg:col-span-3">
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  <span className="text-white/90">Battle Arena</span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div 
                    animate={isCurrentPlayer ? {
                      boxShadow: [
                        "0 0 0 0 rgba(34, 197, 94, 0.7)",
                        "0 0 0 10px rgba(34, 197, 94, 0)",
                        "0 0 0 0 rgba(34, 197, 94, 0)"
                      ]
                    } : {}}
                    transition={{ 
                      duration: 2, 
                      repeat: isCurrentPlayer ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border-2 ${
                      isCurrentPlayer 
                        ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border-green-500/50 shadow-lg' 
                        : 'bg-muted/50 text-muted-foreground border-muted/50'
                    }`}
                  >
                    {isCurrentPlayer ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-2 h-2 rounded-full bg-green-400"
                        />
                        <strong>YOUR TURN</strong>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span>Opponent's Turn</span>
                      </>
                    )}
                  </motion.div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                ref={boardRef}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1
                }}
                transition={{ 
                  delay: 0.1
                }}
                className={`grid grid-cols-9 gap-2 max-w-3xl mx-auto p-4 rounded-lg transition-all duration-500 relative ring-1 border-2 ${
                  isCurrentPlayer 
                    ? 'ring-primary/70 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30' 
                    : 'ring-muted/30 bg-muted/10 border-muted/30'
                } ${isMakingMove || animatingPiece ? 'pointer-events-none' : ''}`}
              >
                {/* Simple text indicator when making move */}
                {isMakingMove && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span className="text-white text-sm backdrop-blur-sm font-medium">Processing move...</span>
                    </motion.div>
                  </div>
                )}
                
                {(optimisticBoard || game.board).map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
                    const isValidMove = selectedSquare && 
                      Math.abs(selectedSquare.row - rowIndex) + Math.abs(selectedSquare.col - colIndex) === 1;
                    const highlightType = isSquareHighlighted(rowIndex, colIndex);
                    const isPendingMove = pendingMove && 
                      ((pendingMove.fromRow === rowIndex && pendingMove.fromCol === colIndex) ||
                       (pendingMove.toRow === rowIndex && pendingMove.toCol === colIndex));
                    
                    // Check if this is the "from" position of pending move (for spinner)
                    const isPendingFromPosition = pendingMove && 
                      pendingMove.fromRow === rowIndex && pendingMove.fromCol === colIndex;
                    
                    // Check if this is part of the last move (for arrow)
                    const isLastMoveFrom = game?.lastMoveFrom && 
                      game.lastMoveFrom.row === rowIndex && game.lastMoveFrom.col === colIndex;
                    
                    // Check if this piece is being animated
                    const isAnimatingFromPosition = animatingPiece && 
                      animatingPiece.fromRow === rowIndex && animatingPiece.fromCol === colIndex;
                    
                    // Check if this is the destination square for animation
                    const isAnimatingToPosition = animatingPiece && 
                      animatingPiece.toRow === rowIndex && animatingPiece.toCol === colIndex;
                    
                    // Get arrow direction for last move
                    const ArrowComponent = isLastMoveFrom && game?.lastMoveFrom && game?.lastMoveTo 
                      ? getArrowDirection(game.lastMoveFrom.row, game.lastMoveFrom.col, game.lastMoveTo.row, game.lastMoveTo.col)
                      : null;
                    
                    return (
                      <motion.div
                        key={`${rowIndex}-${colIndex}`}
                        whileHover={isCurrentPlayer && !animatingPiece ? { scale: 1.00 } : {}}
                        whileTap={isCurrentPlayer && !animatingPiece ? { scale: 1 } : {}}
                        animate={
                          isAnimatingToPosition ? {
                            // Pulse effect for destination square
                            scale: [1, 1.05, 1, 1.1, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(34, 197, 94, 0.5)",
                              "0 0 0 4px rgba(34, 197, 94, 0.3)",
                              "0 0 0 8px rgba(34, 197, 94, 0.2)",
                              "0 0 0 12px rgba(34, 197, 94, 0.4)",
                              "0 0 0 0 rgba(34, 197, 94, 0)"
                            ]
                          } : isPendingMove ? {
                            scale: [1, 1.02, 1],
                            opacity: [0.75, 0.9, 0.75]
                          } : {}
                        }
                        transition={
                          isAnimatingToPosition ? {
                            duration: 0.75,
                            ease: "easeInOut",
                            times: [0, 0.3, 0.5, 0.8, 1]
                          } : isPendingMove ? {
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          } : {}
                        }
                        onClick={() => handleGameSquareClick(rowIndex, colIndex)}
                        className={`
                          aspect-square border flex items-center justify-center cursor-pointer rounded-lg transition-all relative
                          bg-muted/30 border-border hover:bg-muted/50
                          ${isSelected ? 'ring-2 ring-primary bg-primary/20 border-primary' : ''}
                          ${isValidMove ? 'ring-2 ring-green-500 bg-green-500/20 border-green-500' : ''}
                          ${highlightType === 'last-move' ? 'ring-1 ring-yellow-500 border-yellow-500' : ''}
                          ${isPendingMove && !isAnimatingToPosition ? 'ring-2 ring-orange-500 bg-orange-500/20 border-orange-500 opacity-75' : ''}
                          ${isAnimatingToPosition ? 'ring-2 ring-green-500 bg-green-500/20 border-green-500' : ''}
                          ${isCurrentPlayer && !animatingPiece ? 'hover:bg-accent' : ''}
                        `}
                      >
                        {/* Spinner for pending move "from" position */}
                        {isPendingFromPosition && !isAnimatingFromPosition && (
                          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full"
                            />
                          </div>
                        )}
                        
                        {/* Arrow for last move "from" position */}
                        {isLastMoveFrom && ArrowComponent && !isPendingFromPosition && !isAnimatingFromPosition && (
                          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <div className="rounded-full p-1">
                              <ArrowComponent className="h-6 w-6 text-yellow-500" />
                            </div>
                          </div>
                        )}
                        
                        {/* Show piece only if it's not being animated from this position */}
                        {cell && !isAnimatingFromPosition && (
                          <div className="text-center">
                            <div className={`${cell.player === 'player1' ? 'text-blue-400' : 'text-red-400'}`}>
                              {cell.piece === "Hidden" ? 
                                getPieceDisplay(cell.piece, { isOpponent: true }) : 
                                getPieceDisplay(cell.piece, { showLabel: true })
                              }
                            </div>
                            {cell.revealed && cell.piece !== "Hidden" && (
                              <div className="text-xs font-bold mt-1 text-muted-foreground">
                                {cell.piece.split(' ').map((word: string) => word[0]).join('')}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
                
                {/* Animated piece overlay */}
                {animatingPiece && boardRect && (
                  <motion.div
                    initial={{ 
                      x: `${(animatingPiece.fromCol * (boardRect.width - 32) / 9) + 16}px`,
                      y: `${(animatingPiece.fromRow * (boardRect.height - 32) / 8) + 16}px`,
                      scale: 1.2,
                      zIndex: 100
                    }}
                    animate={{ 
                      x: `${(animatingPiece.toCol * (boardRect.width - 32) / 9) + 16}px`,
                      y: `${(animatingPiece.toRow * (boardRect.height - 32) / 8) + 16}px`,
                      scale: [1.2, 1.3, 1.2],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 0.75,
                      ease: "easeInOut",
                      scale: {
                        duration: 0.75,
                        ease: "easeInOut",
                        times: [0, 0.5, 1]
                      },
                      rotate: {
                        duration: 0.75,
                        ease: "easeInOut",
                        times: [0, 0.3, 0.7, 1]
                      }
                    }}
                    className="absolute pointer-events-none z-50"
                    style={{
                      width: `${(boardRect.width - 32) / 9}px`,
                      height: `${(boardRect.height - 32) / 8}px`,
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(59, 130, 246, 0.7)",
                            "0 0 15px 3px rgba(59, 130, 246, 0.4)",
                            "0 0 10px 2px rgba(59, 130, 246, 0.6)"
                          ]
                        }}
                        transition={{
                          duration: 0.75,
                          ease: "easeInOut"
                        }}
                        className={`text-center p-2 rounded-lg bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm border border-white/30 ${
                          animatingPiece.piece.player === 'player1' ? 'text-blue-400' : 'text-red-400'
                        }`}
                      >
                        <div className="transform scale-125">
                          {animatingPiece.piece.piece === "Hidden" ? 
                            getPieceDisplay(animatingPiece.piece.piece, { isOpponent: true }) : 
                            getPieceDisplay(animatingPiece.piece.piece, { showLabel: true })
                          }
                        </div>
                        {animatingPiece.piece.revealed && animatingPiece.piece.piece !== "Hidden" && (
                          <div className="text-xs font-bold mt-1 text-muted-foreground">
                            {animatingPiece.piece.piece.split(' ').map((word: string) => word[0]).join('')}
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </div>

        {/* Game Info & Legend */}
        <div className="space-y-6">
          {/* Player Info */}
          <div className="space-y-4">
            <Card className="bg-black/20 backdrop-blur-xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
              <CardContent className="p-4">
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-3"
                >
                  {isLoadingPlayer1 ? (
                    <div className="w-10 h-10 rounded-full bg-blue-400/20 border-2 border-blue-400/50 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
                      />
                    </div>
                  ) : (
                    <UserAvatar 
                      username={game.player1Username}
                      avatarUrl={player1Profile?.avatarUrl}
                      rank={player1Profile?.rank}
                      size="sm"
                      className="ring-2 ring-blue-400/50"
                    />
                  )}
                  <div className="w-4 h-4 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"></div>
                  <div>
                    <h3 className="font-semibold text-blue-400">{game.player1Username}</h3>
                    <div className="text-blue-400/80 text-sm">Blue Army</div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
            <Card className="bg-black/20 backdrop-blur-xl border border-red-500/30 shadow-lg shadow-red-500/10">
              <CardContent className="p-4">
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3"
                >
                  {isLoadingPlayer2 ? (
                    <div className="w-10 h-10 rounded-full bg-red-400/20 border-2 border-red-400/50 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"
                      />
                    </div>
                  ) : (
                    <UserAvatar 
                      username={game.player2Username}
                      avatarUrl={player2Profile?.avatarUrl}
                      rank={player2Profile?.rank}
                      size="sm"
                      className="ring-2 ring-red-400/50"
                    />
                  )}
                  <div className="w-4 h-4 bg-red-400 rounded-full shadow-lg shadow-red-400/50"></div>
                  <div>
                    <h3 className="font-semibold text-red-400">{game.player2Username}</h3>
                    <div className="text-red-400/80 text-sm">Red Army</div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </div>

          {/* Legend */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white/90">
                <Info className="h-5 w-5 text-orange-400" />
                Piece Legend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-1 font-medium text-muted-foreground">Icon</th>
                      <th className="text-left py-2 px-1 font-medium text-muted-foreground">Piece</th>
                      <th className="text-left py-2 px-1 font-medium text-muted-foreground">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { piece: "5 Star General", rank: "1 (Highest)" },
                      { piece: "4 Star General", rank: "2" },
                      { piece: "3 Star General", rank: "3" },
                      { piece: "2 Star General", rank: "4" },
                      { piece: "1 Star General", rank: "5" },
                      { piece: "Colonel", rank: "6" },
                      { piece: "Lieutenant Colonel", rank: "7" },
                      { piece: "Major", rank: "8" },
                      { piece: "Captain", rank: "9" },
                      { piece: "1st Lieutenant", rank: "10" },
                      { piece: "2nd Lieutenant", rank: "11" },
                      { piece: "Sergeant", rank: "12" },
                      { piece: "Private", rank: "13" },
                      { piece: "Spy", rank: "Special*" },
                      { piece: "Flag", rank: "Goal" }
                    ].map(({ piece, rank }) => (
                      <tr key={piece} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-1">
                          <div className="flex justify-center">
                            {getPieceDisplay(piece, { size: "medium" })}
                          </div>
                        </td>
                        <td className="py-2 px-1 font-medium">{piece}</td>
                        <td className="py-2 px-1 text-muted-foreground">{rank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <p>* Spy can eliminate any piece but loses to Private</p>
                  <p>• Higher ranks eliminate lower ranks</p>
                  <p>• Goal: Capture opponent's Flag to win</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Moves */}
      {(moves && moves.length > 0) || isLoadingMoves ? (
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white/90">
              <Eye className="h-5 w-5 text-purple-400" />
              Recent Moves
              {isLoadingMoves && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full ml-2"
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMoves ? (
              <div className="flex items-center justify-center py-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full"
                />
                <span className="ml-2 text-white/70">Loading moves...</span>
              </div>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-2">
                {moves && moves.slice(-5).reverse().map((move) => (
                  <motion.div
                    key={move._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-white/70 bg-white/10 backdrop-blur-sm border border-white/20 rounded p-2"
                  >
                    {move.moveType === "challenge" && move.challengeResult ? (
                      <span>
                        Battle occurred - <span className="font-semibold text-foreground">{move.challengeResult.winner} wins!</span>
                      </span>
                    ) : (
                      <span>
                        Piece moved to ({move.toRow}, {move.toCol})
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </motion.div>

    {/* Achievement Notifications */}
    <AchievementNotification userId={profile.userId} />

    {/* Game Result Modal */}
    {game.status === "finished" && matchResult && !hasAcknowledgedResult && (
      <GameResultModal
        result={{
          winner: (matchResult.winner || "draw") as "player1" | "player2" | "draw",
          reason: matchResult.reason,
          duration: matchResult.duration,
          moves: matchResult.moves,
          player1Username: matchResult.player1Username,
          player2Username: matchResult.player2Username,
        }}
        profile={profile}
        isPlayer1={isPlayer1}
        isOpen={showResultModal}
        onClose={() => {
          void handleAcknowledgeResult();
          setShowResultModal(false);
        }}
        onReturnToLobby={() => {
          void handleAcknowledgeResult();
          setShowResultModal(false);
          onBackToLobby();
        }}
        gameId={gameId}
        onViewReplay={(gameId) => {
          void handleAcknowledgeResult();
          setShowResultModal(false);
          // You can handle replay view here or pass it up to parent
          console.log("View replay for game:", gameId);
        }}
        player1Profile={player1Profile}
        player2Profile={player2Profile}
      />
    )}
    </>
  );
}
