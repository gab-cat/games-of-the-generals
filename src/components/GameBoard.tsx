import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useConvexMutationWithQuery } from "../lib/convex-query-hooks";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
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
  ArrowDown,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Timer } from "../pages/game/Timer";
import { GameResultModal } from "../pages/game/GameResultModal";
import { AchievementNotification } from "../pages/achievements/AchievementNotification";
import { UserAvatar } from "./UserAvatar";
import { getPieceDisplay } from "../lib/piece-display";
import { SetupPresets } from "./setup-presets/SetupPresets";

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

// Game pieces for setup (21 pieces total) - Memoized constant
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

// Constants for better performance
const TOTAL_TIME_SECONDS = 15 * 60; // 15 minutes
const BOARD_ROWS = 8;
const BOARD_COLS = 9;

// Create empty board factory function
const createEmptyBoard = () => Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null));

// Helper functions for board flipping
const flipRowForDisplay = (row: number, shouldFlip: boolean) => shouldFlip ? BOARD_ROWS - 1 - row : row;
const flipRowForLogic = (displayRow: number, shouldFlip: boolean) => shouldFlip ? BOARD_ROWS - 1 - displayRow : displayRow;

// Helper function to flip board data for display
const flipBoardForDisplay = (board: any[][], shouldFlip: boolean) => {
  if (!shouldFlip) return board;
  return [...board].reverse();
};

// Memoized board square component for better performance
const BoardSquare = memo(({
  row,
  col,
  cell,
  isSelected,
  isValidMove,
  highlightType,
  isPendingMove,
  isPendingFromPosition,
  isLastMoveFrom,
  isCurrentPlayer,
  ArrowComponent,
  onClick
}: {
  row: number;
  col: number;
  cell: any;
  isSelected: boolean;
  isValidMove: boolean;
  highlightType: string | null;
  isPendingMove: boolean;
  isPendingFromPosition: boolean;
  isLastMoveFrom: boolean;
  isCurrentPlayer: boolean;
  ArrowComponent: any;
  onClick: (row: number, col: number) => void;
}) => {
  return (
    <motion.div
      key={`${row}-${col}`}
      whileHover={isCurrentPlayer ? { scale: 1.00 } : {}}
      whileTap={isCurrentPlayer ? { scale: 1 } : {}}
      animate={
        isPendingMove ? {
          scale: [1, 1.02, 1],
          opacity: [0.75, 0.9, 0.75]
        } : {}
      }
      transition={
        isPendingMove ? {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}
      }
      onClick={() => onClick(row, col)}
      className={`
        aspect-square border flex items-center justify-center cursor-pointer rounded-sm sm:rounded-lg transition-all relative min-h-[38px] sm:min-h-0
        bg-muted/30 border-border hover:bg-muted/50 p-0.5 sm:p-1
        ${isSelected ? 'ring-1 ring-primary bg-primary/20 border-primary' : ''}
        ${isValidMove ? 'ring-1 ring-green-500 bg-green-500/20 border-green-500' : ''}
        ${highlightType === 'last-move' ? 'ring-1 ring-yellow-500 border-yellow-500' : ''}
        ${isPendingMove ? 'ring-1 ring-orange-500 bg-orange-500/20 border-orange-500 opacity-75' : ''}
        ${isCurrentPlayer ? 'hover:bg-accent' : ''}
      `}
    >
      {isPendingFromPosition && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full"
          />
        </div>
      )}

      {isLastMoveFrom && ArrowComponent && !isPendingFromPosition && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="rounded-full p-1">
            <ArrowComponent className="h-6 w-6 text-yellow-500" />
          </div>
        </div>
      )}

      {cell && (
        <div className="text-center">
          <div className={`${cell.player === 'player1' ? 'text-blue-400' : 'text-red-400'}`}>
            {cell.piece === "Hidden" ? 
              getPieceDisplay(cell.piece, { isOpponent: true, size: "small" }) : 
              <>
                {/* Mobile: No labels, small size */}
                <div className="block sm:hidden">
                  {getPieceDisplay(cell.piece, { showLabel: false, size: "small" })}
                </div>
                {/* Desktop: With labels, medium size */}
                <div className="hidden sm:block">
                  {getPieceDisplay(cell.piece, { showLabel: true, size: "medium" })}
                </div>
              </>
            }
          </div>
          {cell.revealed && cell.piece !== "Hidden" && (
            <div className="text-[10px] sm:text-xs font-bold mt-0.5 sm:mt-1 text-muted-foreground leading-tight">
              {cell.piece.split(' ').map((word: string) => word[0]).join('')}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});

BoardSquare.displayName = 'BoardSquare';

const GameBoard = memo(function GameBoard({ gameId, profile, onBackToLobby }: GameBoardProps) {
  const navigate = useNavigate();
  
  const game = useQuery(api.games.getGame, { gameId });
  const isLoadingGame = game === undefined;



  const movesData = useQuery(api.games.getGameMoves, { gameId });
  const isLoadingMoves = !movesData;

  // Extract moves from paginated response
  const moves = Array.isArray(movesData) ? movesData : movesData?.page || [];
  
  const matchResult = useQuery(api.games.getMatchResult, { gameId });

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

  // Get player profiles for avatars - conditional queries
  const player1Profile = useQuery(
    api.profiles.getProfileByUsername,
    game?.player1Username ? { username: game.player1Username } : "skip"
  );
  const isLoadingPlayer1 = game?.player1Username && !player1Profile;

  const player2Profile = useQuery(
    api.profiles.getProfileByUsername,
    game?.player2Username ? { username: game.player2Username } : "skip"
  );
  const isLoadingPlayer2 = game?.player2Username && !player2Profile;

  // Optimized state initialization
  const [setupBoard, setSetupBoard] = useState<(string | null)[][]>(() => createEmptyBoard());
  const [availablePieces, setAvailablePieces] = useState(() => [...INITIAL_PIECES]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
  const [selectedSetupSquare, setSelectedSetupSquare] = useState<{row: number, col: number} | null>(null);
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [optimisticBoard, setOptimisticBoard] = useState<any[][] | null>(null);
  const [pendingMove, setPendingMove] = useState<{fromRow: number, fromCol: number, toRow: number, toCol: number} | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  
  const [_, setBoardRect] = useState<DOMRect | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Memoized computed values
  const isPlayer1 = useMemo(() => game?.player1Id === profile.userId, [game?.player1Id, profile.userId]);
  const isPlayer2 = useMemo(() => game?.player2Id === profile.userId, [game?.player2Id, profile.userId]);
  const isCurrentPlayer = useMemo(() => 
    game?.currentTurn === (isPlayer1 ? "player1" : "player2"), 
    [game?.currentTurn, isPlayer1]
  );
  
  // Determine if board should be flipped (player2 sees board flipped so they appear at bottom)
  const shouldFlipBoard = useMemo(() => isPlayer2, [isPlayer2]);
  // Check if current user has acknowledged the result
  const hasAcknowledgedResult = useMemo(() => 
    game?.status === "finished" && 
    ((isPlayer1 && game.player1ResultAcknowledged) || 
     (isPlayer2 && game.player2ResultAcknowledged)),
    [game?.status, game?.player1ResultAcknowledged, game?.player2ResultAcknowledged, isPlayer1, isPlayer2]
  );

  // Memoized board dimensions
  const updateBoardRect = useCallback(() => {
    if (boardRef.current) {
      setBoardRect(boardRef.current.getBoundingClientRect());
    }
  }, []);

  // Optimized useEffect hooks with proper dependencies
  
  // Timer effect - optimized with cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Board rect tracking - optimized with throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const throttledUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(updateBoardRect, 100);
    };

    updateBoardRect();
    window.addEventListener('resize', throttledUpdate);
    return () => {
      window.removeEventListener('resize', throttledUpdate);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [updateBoardRect]);

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
    if (game && optimisticBoard && !pendingMove) {
      // If we have optimistic state but no pending move, clear it
      setOptimisticBoard(null);
    }
  }, [game, optimisticBoard, pendingMove]);

  // Memoized helper functions
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Memoized timeout handlers
  const handlePlayer1Timeout = useCallback(() => {
    if (isPlayer1 && game?.currentTurn === "player1") {
      toast.error("Your time expired! You lose the game.");
      timeoutGame({ gameId });
    }
  }, [isPlayer1, game?.currentTurn, timeoutGame, gameId]);

  const handlePlayer2Timeout = useCallback(() => {
    if (isPlayer2 && game?.currentTurn === "player2") {
      toast.error("Your time expired! You lose the game.");
      timeoutGame({ gameId });
    }
  }, [isPlayer2, game?.currentTurn, timeoutGame, gameId]);

  // Optimized getPlayerTime function with timeout handling
  const getPlayerTime = useCallback((isPlayerParam: boolean) => {
    if (!game) return "15:00"; // Default time display
    
    if (game.status === "finished") {
      // Show final time remaining for finished games
      const timeUsed = isPlayerParam ? (game.player1TimeUsed || 0) : (game.player2TimeUsed || 0);
      const timeUsedSeconds = Math.floor(timeUsed / 1000);
      const remaining = Math.max(0, TOTAL_TIME_SECONDS - timeUsedSeconds);
      return formatTime(remaining);
    }
    
    if (game.status !== "playing") return "15:00"; // Default time display for setup
    
    const timeUsed = isPlayerParam ? (game.player1TimeUsed || 0) : (game.player2TimeUsed || 0);
    const timeUsedSeconds = Math.floor(timeUsed / 1000);
    
    // If it's current player's turn, add elapsed time since turn started
    let currentTurnTime = 0;
    const isCurrentTurn = (isPlayerParam && game.currentTurn === "player1") || (!isPlayerParam && game.currentTurn === "player2");
    
    if (isCurrentTurn && (game.lastMoveTime || game.gameTimeStarted)) {
      const turnStartTime = game.lastMoveTime || game.gameTimeStarted || currentTime;
      currentTurnTime = Math.floor((currentTime - turnStartTime) / 1000);
    }
    
    const totalUsed = timeUsedSeconds + currentTurnTime;
    const remaining = Math.max(0, TOTAL_TIME_SECONDS - totalUsed);
    
    // Check for timeout condition - only trigger once per timeout
    if (remaining <= 0 && isCurrentTurn && game.status === "playing") {
      // Trigger timeout for the current player (only the player whose time ran out)
      if (game.currentTurn === "player1" && isPlayerParam && isPlayer1) {
        setTimeout(() => handlePlayer1Timeout(), 100);
      } else if (game.currentTurn === "player2" && !isPlayerParam && isPlayer2) {
        setTimeout(() => handlePlayer2Timeout(), 100);
      }
    }
    
    return formatTime(remaining);
  }, [game, currentTime, formatTime, handlePlayer1Timeout, handlePlayer2Timeout, isPlayer1, isPlayer2]);

  // Memoized valid rows calculation - logical positions (not display positions)
  const validRows = useMemo(() => isPlayer1 ? [5, 6, 7] : [0, 1, 2], [isPlayer1]);
  
  // Valid rows for display (considering board flip for player2)
  const validDisplayRows = useMemo(() => {
    if (!shouldFlipBoard) return validRows;
    return validRows.map(row => flipRowForDisplay(row, shouldFlipBoard));
  }, [validRows, shouldFlipBoard]);

  // Memoized game actions
  const randomizeSetup = useCallback(() => {
    setSetupBoard(createEmptyBoard());
    setAvailablePieces([...INITIAL_PIECES]);
    
    const shuffledPieces = [...INITIAL_PIECES].sort(() => Math.random() - 0.5);
    const newBoard = createEmptyBoard();
    let pieceIndex = 0;
    
    for (const row of validRows) {
      for (let col = 0; col < BOARD_COLS; col++) {
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
  }, [validRows]);

  const clearSetup = useCallback(() => {
    setSetupBoard(createEmptyBoard());
    setAvailablePieces([...INITIAL_PIECES]);
    setSelectedPiece(null);
    setSelectedSetupSquare(null);
    setIsSwapMode(false);
    toast.success("Setup cleared!");
  }, []);

  const loadPresetSetup = useCallback((pieces: { piece: string; row: number; col: number }[]) => {
    // Clear the board first
    const newBoard = createEmptyBoard();
    
    // Place the pieces from the preset
    for (const { piece, row, col } of pieces) {
      newBoard[row][col] = piece;
    }
    
    setSetupBoard(newBoard);
    setAvailablePieces([]);
    setSelectedPiece(null);
    setSelectedSetupSquare(null);
    setIsSwapMode(true);
    toast.success("Preset loaded successfully!");
  }, []);

  const handleSurrender = useCallback(() => {
    if (window.confirm("Are you sure you want to surrender? This cannot be undone.")) {
      surrenderGame({ gameId });
    }
  }, [surrenderGame, gameId]);

  const handleAcknowledgeResult = useCallback(() => {
    acknowledgeGameResult({ gameId });
  }, [acknowledgeGameResult, gameId]);

  const handleViewReplay = useCallback((gameId: Id<"games">) => {
    void navigate({ to: "/spectate", search: { gameId: gameId as string } });
  }, [navigate]);

  const handleReturnToLobby = useCallback(() => {
    void handleAcknowledgeResult();
    setShowResultModal(false);
    onBackToLobby();
  }, [handleAcknowledgeResult, onBackToLobby]);

  // Helper function to check if a square is highlighted - memoized
  const isSquareHighlighted = useCallback((row: number, col: number) => {
    if (game?.lastMoveFrom && game?.lastMoveTo) {
      if ((game.lastMoveFrom.row === row && game.lastMoveFrom.col === col) ||
          (game.lastMoveTo.row === row && game.lastMoveTo.col === col)) {
        return "last-move";
      }
    }
    
    if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
      return "selected";
    }
    
    return null;
  }, [game?.lastMoveFrom, game?.lastMoveTo, selectedSquare]);

  // Helper function to get arrow direction for moves - memoized
  const getArrowDirection = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number, isFlipped: boolean = false) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    // If board is flipped, reverse the row direction logic
    if (isFlipped) {
      if (rowDiff > 0) return ArrowUp;   // Down becomes up when flipped
      if (rowDiff < 0) return ArrowDown; // Up becomes down when flipped
    } else {
      if (rowDiff > 0) return ArrowDown;
      if (rowDiff < 0) return ArrowUp;
    }
    
    // Column directions remain the same regardless of flip
    if (colDiff > 0) return ArrowRight;
    if (colDiff < 0) return ArrowLeft;
    
    return null;
  }, []);

  // Result modal state management
  useEffect(() => {
    if (game?.status === "finished" && !gameFinished && !hasAcknowledgedResult) {
      setShowResultModal(true);
      setGameFinished(true);
    }
  }, [game?.status, gameFinished, hasAcknowledgedResult]);

  // Auto-select next piece optimization
  useEffect(() => {
    if (availablePieces.length === 0) {
      setIsSwapMode(true);
      setSelectedPiece(null);
    } else if (!selectedPiece && availablePieces.length > 0 && !isSwapMode) {
      setSelectedPiece(availablePieces[0]);
    }
  }, [selectedPiece, availablePieces, isSwapMode]);

  // Optimistic state cleanup
  useEffect(() => {
    if (game && optimisticBoard && !pendingMove) {
      setOptimisticBoard(null);
    }
  }, [game, optimisticBoard, pendingMove]);

  // Game result toast notification - separated for better performance
  useEffect(() => {
    if (game?.status === "finished" && !hasAcknowledgedResult) {
      const isCurrentUserWinner = game.winner === (isPlayer1 ? "player1" : "player2");
      
      if (isCurrentUserWinner) {
        toast.success("Victory! You won the game!");
      } else {
        toast.error("Defeat! You lost the game.");
      }
      
      if (!gameFinished) {
        setShowResultModal(true);
        setGameFinished(true);
      }
    }
  }, [game?.status, game?.winner, isPlayer1, gameFinished, hasAcknowledgedResult]);

  // Memoized setup square click handler
  const handleSetupSquareClick = useCallback((logicalRow: number, logicalCol: number) => {
    if (!validRows.includes(logicalRow)) {
      toast.error("You can only place pieces in your area");
      return;
    }

    const currentPiece = setupBoard[logicalRow][logicalCol];
    
    if (isSwapMode || availablePieces.length === 0) {
      if (selectedSetupSquare) {
        const selectedPiece = setupBoard[selectedSetupSquare.row][selectedSetupSquare.col];
        
        if (selectedSetupSquare.row === logicalRow && selectedSetupSquare.col === logicalCol) {
          setSelectedSetupSquare(null);
          return;
        }
        
        const newBoard = setupBoard.map(r => [...r]);
        newBoard[selectedSetupSquare.row][selectedSetupSquare.col] = currentPiece;
        newBoard[logicalRow][logicalCol] = selectedPiece;
        setSetupBoard(newBoard);
        setSelectedSetupSquare(null);
        return;
      }

      if (currentPiece) {
        setSelectedSetupSquare({ row: logicalRow, col: logicalCol });
        return;
      }
      
      if (isSwapMode) {
        toast.info("Click on a piece to select it for swapping");
        return;
      }
    }

    if (currentPiece) {
      toast.error("Square is already occupied. Enable swap mode to move pieces.");
      return;
    }

    if (!selectedPiece) {
      toast.error("Please select a piece to place");
      return;
    }

    const newBoard = setupBoard.map(r => [...r]);
    newBoard[logicalRow][logicalCol] = selectedPiece;
    setSetupBoard(newBoard);

    const pieceIndex = availablePieces.indexOf(selectedPiece);
    const newAvailable = [...availablePieces];
    newAvailable.splice(pieceIndex, 1);
    setAvailablePieces(newAvailable);

    setSelectedPiece(null);
  }, [validRows, setupBoard, isSwapMode, availablePieces, selectedSetupSquare, selectedPiece]);

  // Handler for display setup square clicks (converts display coordinates to logical)
  const handleDisplaySetupSquareClick = useCallback((displayRow: number, displayCol: number) => {
    const logicalRow = flipRowForLogic(displayRow, shouldFlipBoard);
    handleSetupSquareClick(logicalRow, displayCol);
  }, [shouldFlipBoard, handleSetupSquareClick]);

  const handleFinishSetup = useCallback(async () => {
    if (availablePieces.length > 0) {
      toast.error("Please place all pieces before finishing setup");
      return;
    }

    const pieces = [];
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
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
  }, [availablePieces.length, setupBoard, setupPieces, gameId]);

  // Optimized game square click handler
  const handleGameSquareClick = useCallback((row: number, col: number) => {
    if (!game || game.status !== "playing" || !isCurrentPlayer || isMakingMove) return;

    if (selectedSquare) {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null);
        return;
      }

      const isValidMove = Math.abs(selectedSquare.row - row) + Math.abs(selectedSquare.col - col) === 1;
      if (!isValidMove) {
        toast.error("Invalid move: pieces can only move to adjacent squares");
        setSelectedSquare(null);
        return;
      }

      const movingPiece = game.board[selectedSquare.row][selectedSquare.col];
      const targetPiece = game.board[row][col];

      if (targetPiece && targetPiece.player === (isPlayer1 ? "player1" : "player2")) {
        toast.error("Cannot move to a square occupied by your own piece");
        setSelectedSquare(null);
        return;
      }

      setPendingMove({
        fromRow: selectedSquare.row,
        fromCol: selectedSquare.col,
        toRow: row,
        toCol: col
      });

      const fromSquare = selectedSquare;
      setSelectedSquare(null);

      // Create optimistic board update
      const newBoard = game.board.map(r => [...r]);
      newBoard[row][col] = movingPiece;
      newBoard[fromSquare.row][fromSquare.col] = null;
      setOptimisticBoard(newBoard);

      // Make the move immediately
      makeMove({
        gameId,
        fromRow: fromSquare.row,
        fromCol: fromSquare.col,
        toRow: row,
        toCol: col,
      });

    } else {
      const boardToUse = optimisticBoard || game.board;
      const piece = boardToUse[row][col];
      if (piece && piece.player === (isPlayer1 ? "player1" : "player2")) {
        setSelectedSquare({ row, col });
      }
    }
  }, [game, isCurrentPlayer, isMakingMove, selectedSquare, isPlayer1, optimisticBoard, makeMove, gameId]);

  const handleSetupTimeout = useCallback(() => {
    toast.error("Setup time expired! Pieces will be placed randomly.");
    randomizeSetup();
    setTimeout(() => {
      void handleFinishSetup();
    }, 1000);
  }, [randomizeSetup, handleFinishSetup]);

  // Memoized board data for performance
  const boardData = useMemo(() => {
    return optimisticBoard || game?.board;
  }, [optimisticBoard, game?.board]);

  // Memoized display board data (flipped for player2)
  const displayBoardData = useMemo(() => {
    if (!boardData) return null;
    return flipBoardForDisplay(boardData, shouldFlipBoard);
  }, [boardData, shouldFlipBoard]);

  // Memoized display setup board data (flipped for player2)
  const displaySetupBoard = useMemo(() => {
    return flipBoardForDisplay(setupBoard, shouldFlipBoard);
  }, [setupBoard, shouldFlipBoard]);

  // Memoized board squares rendering
  const renderBoardSquares = useMemo(() => {
    if (!displayBoardData) return null;
    
    return displayBoardData.map((row, displayRowIndex) =>
      row.map((cell, colIndex) => {
        // Convert display coordinates to logical coordinates for game logic
        const logicalRowIndex = flipRowForLogic(displayRowIndex, shouldFlipBoard);
        
        const isSelected = selectedSquare?.row === logicalRowIndex && selectedSquare?.col === colIndex;
        const isValidMove = selectedSquare && 
          Math.abs(selectedSquare.row - logicalRowIndex) + Math.abs(selectedSquare.col - colIndex) === 1;
        const highlightType = isSquareHighlighted(logicalRowIndex, colIndex);
        const isPendingMove = pendingMove && 
          ((pendingMove.fromRow === logicalRowIndex && pendingMove.fromCol === colIndex) ||
           (pendingMove.toRow === logicalRowIndex && pendingMove.toCol === colIndex));
        
        const isPendingFromPosition = pendingMove &&
          pendingMove.fromRow === logicalRowIndex && pendingMove.fromCol === colIndex;

        const isLastMoveFrom = game?.lastMoveFrom &&
          game.lastMoveFrom.row === logicalRowIndex && game.lastMoveFrom.col === colIndex;
        
        const ArrowComponent = isLastMoveFrom && game?.lastMoveFrom && game?.lastMoveTo 
          ? getArrowDirection(game.lastMoveFrom.row, game.lastMoveFrom.col, game.lastMoveTo.row, game.lastMoveTo.col, shouldFlipBoard)
          : null;
        
        return (
          <BoardSquare
            key={`${displayRowIndex}-${colIndex}`}
            row={logicalRowIndex}
            col={colIndex}
            cell={cell}
            isSelected={isSelected}
            isValidMove={!!isValidMove}
            highlightType={highlightType}
            isPendingMove={!!isPendingMove}
            isPendingFromPosition={!!isPendingFromPosition}
            isLastMoveFrom={!!isLastMoveFrom}
            isCurrentPlayer={isCurrentPlayer}
            ArrowComponent={ArrowComponent}
            onClick={(row, col) => handleGameSquareClick(row, col)}
          />
        );
      })
    );
  }, [
    displayBoardData,
    shouldFlipBoard,
    selectedSquare,
    pendingMove,
    game?.lastMoveFrom,
    game?.lastMoveTo,
    isCurrentPlayer,
    isSquareHighlighted,
    getArrowDirection,
    handleGameSquareClick
  ]);

  // If not part of the game, show toast and redirect to lobby
  // if (!game) {
  //   toast.error("You are not part of this game");
  //   onBackToLobby();
  //   return null;
  // }


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

  // show message that the game might not exist or not a player of it
  if (!game) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center items-center min-h-[60vh]"
      >
        <Card className="w-full max-w-md bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardContent className="text-center p-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6"
            >
              <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm border mx-auto border-red-500/30 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-semibold text-white/90">Game Not Found</h3>
              <p className="text-white/60 leading-relaxed">
                This game doesn't exist or you're not authorized to view it. The game may have been deleted or you might not be a participant.
              </p>
              
              <div className="pt-4">
                <Button 
                  onClick={onBackToLobby} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Lobby
                </Button>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
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
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-4">
                <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Your setup is complete</span>
                </div>
              </div>
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
        className="space-y-4 sm:space-y-6 px-1 sm:px-4 lg:px-0"
      >
        {/* Setup Header */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-3 sm:gap-4"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500/20 via-orange-500/20 to-yellow-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                >
                  <Sword className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-white/90">
                    Army Setup
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 mb-1 flex-wrap">
                    <span className="text-xs text-white/50">Game ID:</span>
                    <code className="bg-white/10 px-2 py-1 rounded text-xs font-mono text-white/70 break-all">{gameId}</code>
                    <Button
                      onClick={() => {
                        void navigator.clipboard.writeText(gameId);
                        toast.success("Game ID copied to clipboard!");
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-white/50 hover:text-white/80 hover:bg-white/10 flex-shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-white/60 mt-1 text-sm sm:text-base">
                    Strategically position your pieces for battle
                  </p>
                </div>
              </motion.div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Timer
                  duration={300} // 5 minutes for setup
                  onTimeout={handleSetupTimeout}
                  label="Setup Time"
                  variant="setup"
                  isActive={needsSetup}
                  timeUsed={game.setupTimeStarted ? Math.floor((Date.now() - game.setupTimeStarted) / 1000) : 0}
                  turnStartTime={game.setupTimeStarted}
                />
                <Button variant="outline" onClick={onBackToLobby} className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 w-full sm:w-auto">
                  Back to Lobby
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Controls */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button onClick={randomizeSetup} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm">
                  <Shuffle className="h-4 w-4" />
                  <span className="hidden sm:inline">Randomize</span>
                  <span className="sm:hidden">Random</span>
                </Button>
                <Button onClick={clearSetup} variant="outline" className="flex items-center gap-2 bg-white/10 border-white/20 text-white/90 hover:bg-white/20 text-sm">
                  <RefreshCw className="h-4 w-4" />
                  Clear
                </Button>
                {/* Show swap mode button always, but hide "Exit Swap Mode" when no pieces left */}
                {(availablePieces.length > 0 || (availablePieces.length === 0 && !isSwapMode)) && (
                  <Button
                    onClick={() => setIsSwapMode(!isSwapMode)}
                    variant={isSwapMode ? "default" : "outline"}
                    className={`flex items-center gap-2 text-sm ${isSwapMode ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'bg-white/10 border-white/20 text-white/90 hover:bg-white/20'}`}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">{isSwapMode ? 'Exit Swap Mode' : 'Swap Mode'}</span>
                    <span className="sm:hidden">Swap</span>
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs sm:text-sm">
                  {availablePieces.length === 0 ? 'All pieces placed - Swap Mode' : 
                   isSwapMode ? 'Swap Mode Active' : `${availablePieces.length} pieces remaining`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-white/90 text-lg sm:text-xl">
                  <Target className="h-5 w-5 text-blue-400" />
                  Battle Grid
                </CardTitle>
                <p className="text-xs sm:text-sm text-white/60">
                  {isSwapMode ? "Click on pieces to swap their positions" : "Click empty spaces to place selected pieces"}
                </p>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <motion.div
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-9 gap-0.5 sm:gap-2 max-w-lg mx-auto"
                >
                  {displaySetupBoard.map((row, displayRowIndex) =>
                    row.map((cell, colIndex) => {
                      // Check if this display row is in the valid area for the current player
                      const isValidArea = validDisplayRows.includes(displayRowIndex);
                      const isOccupied = !!cell;
                      // Convert selected square logical coordinates to display coordinates for comparison
                      const selectedDisplayRow = selectedSetupSquare ? flipRowForDisplay(selectedSetupSquare.row, shouldFlipBoard) : -1;
                      const isSelected = selectedDisplayRow === displayRowIndex && selectedSetupSquare?.col === colIndex;
                      
                      return (
                        <motion.div
                          key={`${displayRowIndex}-${colIndex}`}
                          whileHover={isValidArea ? { scale: 1.05 } : {}}
                          whileTap={isValidArea ? { scale: 0.95 } : {}}
                          onClick={() => handleDisplaySetupSquareClick(displayRowIndex, colIndex)}
                          className={`
                            aspect-square border-2 flex items-center justify-center cursor-pointer rounded-sm sm:rounded-lg transition-all text-xs sm:text-sm min-h-[38px] sm:min-h-0 p-0.5 sm:p-1
                            ${isValidArea 
                              ? 'border-primary/50 bg-primary/10 hover:bg-primary/20' 
                              : 'border-muted bg-muted/20'
                            }
                            ${isOccupied ? 'bg-accent border-accent-foreground/50' : ''}
                            ${isSelected ? 'ring-1 ring-yellow-500 bg-yellow-500/20' : ''}
                            ${selectedPiece && isValidArea && !isOccupied ? 'hover:bg-primary/30' : ''}
                          `}
                        >
                          {cell && (
                            <div className="text-foreground" title={cell}>
                              {/* Mobile: No labels, small size */}
                              <div className="block sm:hidden">
                                {getPieceDisplay(cell, { showLabel: false, size: "small" })}
                              </div>
                              {/* Desktop: With labels, medium size */}
                              <div className="hidden sm:block">
                                {getPieceDisplay(cell, { showLabel: true, size: "medium" })}
                              </div>
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
          <div className="space-y-4 sm:space-y-6">
            {/* Setup Presets - moved to top */}
            <SetupPresets 
              currentSetup={displaySetupBoard}
              onLoadPreset={loadPresetSetup}
              shouldFlipBoard={shouldFlipBoard}
            />

            {availablePieces.length > 0 && (
              <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-white/90 text-lg sm:text-xl">
                    <Square className="h-5 w-5 text-purple-400" />
                    Available Pieces ({availablePieces.length})
                  </CardTitle>
                  <Badge variant="outline" className="w-fit bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs sm:text-sm">
                    Selected: {selectedPiece}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
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
                          p-2 sm:p-3 border-2 rounded-lg text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-1 min-h-[60px] sm:min-h-[80px]
                          ${selectedPiece === piece 
                            ? 'border-primary bg-primary/20 ring-1 ring-primary/50' 
                            : 'border-border bg-card hover:bg-accent hover:border-accent-foreground/50'
                          }
                        `}
                      >
                        {/* Mobile: No labels, small size */}
                        <div className="flex sm:hidden flex-col items-center justify-center gap-1">
                          <div className="text-foreground flex items-center justify-center">{getPieceDisplay(piece, { showLabel: false, size: "small" })}</div>
                          <div className="text-[10px] text-center font-medium text-muted-foreground truncate w-full leading-tight">{piece}</div>
                        </div>
                        {/* Desktop: With labels, medium size */}
                        <div className="hidden sm:flex sm:flex-col sm:items-center sm:justify-center sm:gap-1">
                          <div className="text-foreground flex items-center justify-center">{getPieceDisplay(piece, { showLabel: false, size: "medium" })}</div>
                          <div className="text-xs text-center font-medium text-muted-foreground truncate w-full">{piece}</div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            )}

            {/* Collapsible Legend - moved to bottom */}
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
              <CardHeader className="p-4 sm:p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white/90 text-lg sm:text-xl">
                    <Info className="h-5 w-5 text-orange-400" />
                    Piece Legend
                  </CardTitle>
                  <Button
                    onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white"
                  >
                    {isLegendExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <AnimatePresence>
                {isLegendExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="p-4 sm:p-4 sm:pt-0">
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
                  </motion.div>
                )}
              </AnimatePresence>
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
                  className="w-full py-3 sm:py-4 text-sm text-black rounded-full disabled:opacity-50"
                  size="lg"
                >
                  {isSettingUpPieces ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-2 border-2 border-black border-t-transparent rounded-full"
                      />
                      Setting up pieces...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
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
      className="space-y-4 sm:space-y-6 px-1 sm:px-4 lg:px-0"
    >
      {/* Game Header */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Game ID Section */}
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <span className="text-xs text-white/50">Game ID:</span>
              <code className="bg-white/10 px-2 py-1 rounded text-xs font-mono text-white/70 break-all">{gameId}</code>
              <Button
                onClick={() => {
                  void navigator.clipboard.writeText(gameId);
                  toast.success("Game ID copied to clipboard!");
                }}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-white/50 hover:text-white/80 hover:bg-white/10 flex-shrink-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {/* Surrender Button */}
            {game.status === "playing" && (isPlayer1 || isPlayer2) && (
              <div className="order-1 sm:order-2">
                <Button
                  onClick={() => void handleSurrender()}
                  disabled={isSurrendering}
                  variant="destructive"
                  size="sm"
                  className="flex items-center rounded-full gap-2 disabled:opacity-50 w-full sm:w-auto"
                >
                  {isSurrendering ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span className="hidden sm:inline">Surrendering...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Flag className="h-4 w-4" />
                      <span className="hidden sm:inline">Surrender</span>
                      <span className="sm:hidden">Give Up</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* VS Design */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Player 1 */}
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-all w-full sm:w-auto ${
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/90 text-sm sm:text-base truncate">{game.player1Username}</span>
                    {game.status === "finished" && game.winner === "player1" && (
                      <Crown className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    )}
                    {game.currentTurn === "player1" && game.status === "playing" && (
                      <Crown className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className={`text-xs sm:text-sm font-mono ${
                    game.status === "finished" && game.winner === "player1" 
                      ? 'text-yellow-300' 
                      : 'text-blue-300'
                  }`}>
                    {getPlayerTime(true)}
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex">
                <Swords className="h-6 w-6 text-white/40" />
              </div>

              {/* Player 2 */}
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-all w-full sm:w-auto ${
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white/90 text-sm sm:text-base truncate">{game.player2Username}</span>
                    {game.status === "finished" && game.winner === "player2" && (
                      <Crown className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    )}
                    {game.currentTurn === "player2" && game.status === "playing" && (
                      <Crown className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className={`text-xs sm:text-sm font-mono ${
                    game.status === "finished" && game.winner === "player2" 
                      ? 'text-yellow-300' 
                      : 'text-red-300'
                  }`}>
                    {getPlayerTime(false)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
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
                <div className="text-xs sm:text-sm text-white/60 text-center sm:text-left">
                  Turn {Math.floor(((moves.length || 0) / 2) + 1)} • {game.currentTurn === "player1" ? game.player1Username : game.player2Username}'s turn
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Game Board */}
        <div className="xl:col-span-3">
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  <span className="text-white/90 text-lg sm:text-xl">Battle Arena</span>
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
                    className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 border-2 ${
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
                        <strong className="hidden sm:inline">YOUR TURN</strong>
                        <strong className="sm:hidden">YOUR TURN</strong>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="hidden sm:inline">Opponent's Turn</span>
                        <span className="sm:hidden">Waiting</span>
                      </>
                    )}
                  </motion.div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-1 sm:p-4 lg:p-6">
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
                className={`grid grid-cols-9 gap-0.5 sm:gap-2 max-w-3xl mx-auto p-1 sm:p-4 rounded-lg transition-all duration-500 relative ring-1 border-2 ${
                  isCurrentPlayer
                    ? 'ring-primary/70 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30'
                    : 'ring-muted/30 bg-muted/10 border-muted/30'
                } ${isMakingMove ? 'pointer-events-none' : ''}`}
              >
                {/* Simple text indicator when making move */}
                <AnimatePresence>
                  {isMakingMove && (
                    <motion.div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {/* Soft feathered blur backdrop - board-sized circle */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute inset-0 backdrop-blur-sm"
                        style={{
                          width: '100vw',
                          height: '100vh',
                          top: '-50vh',
                          left: '-50vw',
                          maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0) 80%)',
                          WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0) 80%)'
                        }}
                      />
                      
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="relative bg-white/20 backdrop-blur-xl shadow-2xl shadow-white/10 border border-white/20 rounded-full px-3 sm:px-4 py-2 flex items-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span className="text-white !bg-transparent text-xs sm:text-sm font-medium">
                          <span className="hidden sm:inline">Processing move...</span>
                          <span className="sm:hidden">Moving...</span>
                        </span>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {renderBoardSquares}
                

              </motion.div>
            </CardContent>
          </Card>
        </div>

        {/* Game Info & Legend */}
        <div className="space-y-4 sm:space-y-6">
          {/* Player Info */}
          <div className="space-y-3 sm:space-y-4">
            <Card className="bg-black/20 backdrop-blur-xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
              <CardContent className="p-3 sm:p-4">
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-3"
                >
                  {isLoadingPlayer1 ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-400/20 border-2 border-blue-400/50 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-400 border-t-transparent rounded-full"
                      />
                    </div>
                  ) : (
                    <UserAvatar 
                      username={game.player1Username}
                      avatarUrl={player1Profile?.avatarUrl}
                      rank={player1Profile?.rank}
                      size="sm"
                      className="ring-1 ring-blue-400/50"
                    />
                  )}
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-blue-400 text-sm sm:text-base truncate">{game.player1Username}</h3>
                    <div className="text-blue-400/80 text-xs sm:text-sm">Blue Army</div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
            <Card className="bg-black/20 backdrop-blur-xl border border-red-500/30 shadow-lg shadow-red-500/10">
              <CardContent className="p-3 sm:p-4">
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3"
                >
                  {isLoadingPlayer2 ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-400/20 border-2 border-red-400/50 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-400 border-t-transparent rounded-full"
                      />
                    </div>
                  ) : (
                    <UserAvatar 
                      username={game.player2Username}
                      avatarUrl={player2Profile?.avatarUrl}
                      rank={player2Profile?.rank}
                      size="sm"
                      className="ring-1 ring-red-400/50"
                    />
                  )}
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-400 rounded-full shadow-lg shadow-red-400/50 flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-red-400 text-sm sm:text-base truncate">{game.player2Username}</h3>
                    <div className="text-red-400/80 text-xs sm:text-sm">Red Army</div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </div>

          {/* Legend */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-white/90 text-lg sm:text-xl">
                <Info className="h-5 w-5 text-orange-400" />
                Piece Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="max-h-60 sm:max-h-80 overflow-y-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1 sm:py-2 px-1 font-medium text-muted-foreground">Icon</th>
                      <th className="text-left py-1 sm:py-2 px-1 font-medium text-muted-foreground">Piece</th>
                      <th className="text-left py-1 sm:py-2 px-1 font-medium text-muted-foreground">Rank</th>
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
                        <td className="py-1 sm:py-2 px-1">
                          <div className="flex justify-center">
                            {getPieceDisplay(piece, { size: "medium" })}
                          </div>
                        </td>
                        <td className="py-1 sm:py-2 px-1 font-medium truncate">{piece}</td>
                        <td className="py-1 sm:py-2 px-1 text-muted-foreground">{rank}</td>
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-white/90 text-lg sm:text-xl">
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
          <CardContent className="p-4 sm:p-6">
            {isLoadingMoves ? (
              <div className="flex items-center justify-center py-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-purple-400 border-t-transparent rounded-full"
                />
                <span className="ml-2 text-white/70 text-sm sm:text-base">Loading moves...</span>
              </div>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-2">
                {moves && moves.slice(-5).reverse().map((move: any) => (
                  <motion.div
                    key={move._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs sm:text-sm text-white/70 bg-white/10 backdrop-blur-sm border border-white/20 rounded p-2"
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
        onReturnToLobby={handleReturnToLobby}
        gameId={gameId}
        onViewReplay={handleViewReplay}
        player1Profile={player1Profile}
        player2Profile={player2Profile}
      />
    )}
    </>
  );
});

GameBoard.displayName = 'GameBoard';

export { GameBoard };
