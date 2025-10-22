import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useAction } from "convex/react";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Bot,
  Shuffle,
  CheckCircle,
  RefreshCw,
  ArrowRightLeft,
  Info,
  Sword,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { motion } from "framer-motion";
import { getPieceDisplay } from "../../lib/piece-display";
import { SetupPresets } from "../setup-presets/SetupPresets";
import { AIGameResultModal } from "./AIGameResultModal";
import { toast } from "sonner";

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

const BOARD_ROWS = 8;
const BOARD_COLS = 9;

// Create empty board factory function
const createEmptyBoard = () => Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null));

interface AIGameBoardProps {
  sessionId: string;
  revealAIPieces?: boolean;
}

export function AIGameBoard({ sessionId, revealAIPieces = false }: AIGameBoardProps) {
  // Setup state
  const [setupBoard, setSetupBoard] = useState<(string | null)[][]>(() => createEmptyBoard());
  const [availablePieces, setAvailablePieces] = useState(() => [...INITIAL_PIECES]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [selectedSetupSquare, setSelectedSetupSquare] = useState<{row: number, col: number} | null>(null);
  const [isSwapMode, setIsSwapMode] = useState(false);

  // Game state
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  
  // Mutations
  const setupPiecesMutation = useMutation(api.aiGame.setupAIGamePieces);
  const makeMove = useMutation(api.aiGame.makeAIGameMove);
  const executeAIMove = useMutation(api.aiGame.executeAIMove);
  const startNewGame = useMutation(api.aiGame.startAIGameSession);
  const cleanupSession = useMutation(api.aiGame.cleanupAIGameSession);
  
  // Actions
  const generateAIMove = useAction(api.aiGame.generateAIMove);
  
  // Queries
  const { data: session } = useConvexQueryWithOptions(
    api.aiGame.getAIGameSession,
    { sessionId },
    {
      staleTime: 10000, // 10 seconds - active game session needs to be fresh
      gcTime: 300000, // 5 minutes cache
    }
  );

  // Profile data changes infrequently
  const { data: profile } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    {
      staleTime: 120000, // 2 minutes - profile data changes infrequently
      gcTime: 600000, // 10 minutes cache
    }
  );

  // Valid rows for player placement (always bottom 3 rows for player)
  const validRows = useMemo(() => [5, 6, 7], []);

  // Auto-select next piece after placing one and auto-enable swap mode when no pieces left
  useEffect(() => {
    if (availablePieces.length === 0) {
      setIsSwapMode(true);
      setSelectedPiece(null);
    } else if (!selectedPiece && availablePieces.length > 0 && !isSwapMode) {
      setSelectedPiece(availablePieces[0]);
    }
  }, [selectedPiece, availablePieces, isSwapMode]);

  useEffect(() => {
    // Process AI moves
    if (session?.status === "playing" && session.currentTurn === "player2" && !isProcessingMove) {
      setIsProcessingMove(true);

      // Generate and execute AI move
      generateAIMove({ sessionId })
        .then((aiMove) => {
          if (aiMove) {
            return executeAIMove({
              sessionId,
              fromRow: aiMove.fromRow,
              fromCol: aiMove.fromCol,
              toRow: aiMove.toRow,
              toCol: aiMove.toCol,
            });
          }
        })
        .catch((error) => {
          console.error("AI move failed:", error);
        })
        .finally(() => {
          setIsProcessingMove(false);
        });
    }
  }, [session?.status, session?.currentTurn, sessionId, generateAIMove, executeAIMove, isProcessingMove]);

  // Open result modal when game finishes
  useEffect(() => {
    if (session?.status === "finished" && session.winner) {
      setIsResultModalOpen(true);
    }
  }, [session?.status, session?.winner]);

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

  // Memoized setup square click handler
  const handleSetupSquareClick = useCallback((row: number, col: number) => {
    if (!validRows.includes(row)) {
      toast.error("You can only place pieces in your area");
      return;
    }

    const currentPiece = setupBoard[row][col];
    
    if (isSwapMode || availablePieces.length === 0) {
      if (selectedSetupSquare) {
        // Swap pieces
        const selectedRow = selectedSetupSquare.row;
        const selectedCol = selectedSetupSquare.col;
        const selectedPieceValue = setupBoard[selectedRow][selectedCol];
        
        const newBoard = setupBoard.map(r => [...r]);
        newBoard[selectedRow][selectedCol] = currentPiece;
        newBoard[row][col] = selectedPieceValue;
        setSetupBoard(newBoard);
        setSelectedSetupSquare(null);
        return;
      }

      if (currentPiece) {
        setSelectedSetupSquare({ row, col });
        return;
      }
      
      if (isSwapMode) {
        toast.error("No piece to select for swapping");
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
    newBoard[row][col] = selectedPiece;
    setSetupBoard(newBoard);

    const pieceIndex = availablePieces.indexOf(selectedPiece);
    const newAvailable = [...availablePieces];
    newAvailable.splice(pieceIndex, 1);
    setAvailablePieces(newAvailable);

    setSelectedPiece(null);
  }, [validRows, setupBoard, isSwapMode, availablePieces, selectedSetupSquare, selectedPiece]);

  const handleFinishSetup = useCallback(async () => {
    if (availablePieces.length > 0) {
      toast.error("Please place all pieces before finishing setup");
      return;
    }

    const pieces = [];
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const piece = setupBoard[row][col];
        if (piece) {
          pieces.push({ piece, row, col });
        }
      }
    }

    try {
      await setupPiecesMutation({ sessionId, pieces });
    } catch (error) {
      console.error("Failed to setup pieces:", error);
      toast.error("Failed to setup pieces");
    }
  }, [availablePieces.length, setupBoard, setupPiecesMutation, sessionId]);

  // Modal handlers
  const handlePlayAgain = useCallback(async () => {
    if (!profile || !session) return;

    try {
      // Close the modal first
      setIsResultModalOpen(false);

      // Start a new game with the same settings
      await startNewGame({
        profileId: profile._id,
        difficulty: session.difficulty,
        behavior: session.behavior,
      });

      // Reset local state
      setSetupBoard(createEmptyBoard());
      setAvailablePieces([...INITIAL_PIECES]);
      setSelectedPiece(null);
      setSelectedSetupSquare(null);
      setIsSwapMode(false);
      setSelectedSquare(null);
      setIsProcessingMove(false);

      toast.success("New game started!");
    } catch (error) {
      console.error("Failed to start new game:", error);
      toast.error("Failed to start new game");
    }
  }, [profile, session, startNewGame]);

  const handleReturnToLobby = useCallback(async () => {
    try {
      // Close the modal
      setIsResultModalOpen(false);

      // Cleanup the current session
      await cleanupSession({ sessionId });

      toast.success("Returned to lobby!");
    } catch (error) {
      console.error("Failed to return to lobby:", error);
      toast.error("Failed to return to lobby");
    }
  }, [cleanupSession, sessionId]);

  // Helper function to get arrow direction for moves
  const getArrowDirection = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    if (rowDiff > 0) return ArrowDown;
    if (rowDiff < 0) return ArrowUp;
    if (colDiff > 0) return ArrowRight;
    if (colDiff < 0) return ArrowLeft;
    
    return null;
  }, []);

  // Optimized game square click handler
  const handleGameSquareClick = useCallback((row: number, col: number) => {
    if (!session || session.status !== "playing" || session.currentTurn !== "player1" || isProcessingMove) return;

    const board = session.board;
    
    if (selectedSquare) {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        // Deselect
        setSelectedSquare(null);
        return;
      }

      const isValidMove = Math.abs(selectedSquare.row - row) + Math.abs(selectedSquare.col - col) === 1;
      if (!isValidMove) {
        toast.error("Invalid move! You can only move to adjacent squares.");
        setSelectedSquare(null);
        return;
      }

      const targetPiece = board[row][col];
      
      if (targetPiece && targetPiece.player === "player1") {
        toast.error("Cannot attack your own piece!");
        setSelectedSquare(null);
        return;
      }

      // Make the move
      makeMove({
        sessionId,
        fromRow: selectedSquare.row,
        fromCol: selectedSquare.col,
        toRow: row,
        toCol: col,
      }).then(() => {
        setSelectedSquare(null);
      }).catch((error) => {
        console.error("Move failed:", error);
        toast.error("Move failed");
        setSelectedSquare(null);
      });

    } else {
      const piece = board[row][col];
      if (piece && piece.player === "player1") {
        setSelectedSquare({ row, col });
      }
    }
  }, [session, isProcessingMove, selectedSquare, makeMove, sessionId]);

  if (!session) {
    return (
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
        <CardContent className="p-8 text-center">
          <div className="text-white/90">Loading AI game session...</div>
        </CardContent>
      </Card>
    );
  }

  if (session.status === "setup") {
    return (
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
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                >
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-white/90">
                    VS AI Setup
                  </CardTitle>
                  <p className="text-white/60 mt-1 text-sm sm:text-base">
                    Strategically position your pieces against the AI
                  </p>
                </div>
              </motion.div>
            </div>
          </CardHeader>
        </Card>

        {/* Controls */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button onClick={randomizeSetup} className="flex items-center gap-2 bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/80 text-sm">
                  <Shuffle className="h-4 w-4" />
                  <span className="hidden sm:inline">Randomize</span>
                  <span className="sm:hidden">Random</span>
                </Button>
                <Button onClick={clearSetup} variant="outline" className="flex items-center gap-2 bg-white/10 border-white/20 text-white/90 hover:bg-white/20 text-sm">
                  <RefreshCw className="h-4 w-4" />
                  Clear
                </Button>
                {(availablePieces.length > 0 || (availablePieces.length === 0 && !isSwapMode)) && (
                  <Button
                    onClick={() => setIsSwapMode(!isSwapMode)}
                    variant={isSwapMode ? "default" : "outline"}
                    className={`flex items-center gap-2 text-sm ${isSwapMode ? 'bg-green-600/80 backdrop-blur-sm hover:bg-green-700/80' : 'bg-white/10 border-white/20 text-white/90 hover:bg-white/20'}`}
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
              <CardContent className="p-2 sm:p-6">
                <motion.div
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-9 gap-0.5 sm:gap-2 w-full max-w-lg mx-auto overflow-hidden"
                >
                  {setupBoard.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
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
                            aspect-square border-2 flex items-center justify-center cursor-pointer rounded-sm sm:rounded-lg transition-all text-xs sm:text-sm min-h-[32px] sm:min-h-0 p-0.5 sm:p-1
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
            {availablePieces.length > 0 && (
              <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-white/90 text-lg sm:text-xl">
                    <Sword className="h-5 w-5 text-purple-400" />
                    Available Pieces ({availablePieces.length})
                  </CardTitle>
                  <Badge variant="outline" className="w-fit bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs sm:text-sm">
                    Selected: {selectedPiece || "None"}
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

            {/* Setup Presets */}
            <SetupPresets 
              currentSetup={setupBoard}
              onLoadPreset={loadPresetSetup}
            />

            {/* Legend */}
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-white/90 text-lg sm:text-xl">
                  <Info className="h-5 w-5 text-orange-400" />
                  Piece Legend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
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
                  className="w-full py-3 sm:py-4 text-sm text-black rounded-full"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Finish Setup & Start Battle
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Playing/Finished states
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6 px-1 sm:px-4 lg:px-0"
    >


      {/* Game Board */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
        <CardContent className="p-2 sm:p-6">
          <motion.div
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-9 gap-0.5 sm:gap-2 w-full max-w-lg mx-auto overflow-hidden"
          >
            {session.board.map((row: any[], rowIndex: number) =>
              row.map((cell: { player: string; piece: string; revealed: any; }, colIndex: number) => {
                const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
                const isValidMove = selectedSquare && 
                  Math.abs(selectedSquare.row - rowIndex) + Math.abs(selectedSquare.col - colIndex) === 1;
                
                // Recent move highlighting
                const isLastMoveFrom = session.lastMoveFrom && 
                  session.lastMoveFrom.row === rowIndex && session.lastMoveFrom.col === colIndex;
                const isLastMoveTo = session.lastMoveTo && 
                  session.lastMoveTo.row === rowIndex && session.lastMoveTo.col === colIndex;
                
                // Get arrow component for last move
                const ArrowComponent = isLastMoveFrom && session.lastMoveFrom && session.lastMoveTo 
                  ? getArrowDirection(session.lastMoveFrom.row, session.lastMoveFrom.col, session.lastMoveTo.row, session.lastMoveTo.col)
                  : null;
                
                return (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    whileHover={session.status === "playing" && session.currentTurn === "player1" && !isProcessingMove ? { scale: 1.02 } : {}}
                    whileTap={session.status === "playing" && session.currentTurn === "player1" && !isProcessingMove ? { scale: 0.98 } : {}}
                    onClick={() => handleGameSquareClick(rowIndex, colIndex)}
                    className={`
                      aspect-square border-2 flex items-center justify-center cursor-pointer rounded-sm sm:rounded-lg transition-all text-xs sm:text-sm min-h-[32px] sm:min-h-0 p-0.5 sm:p-1 relative
                      bg-muted/30 border-border hover:bg-muted/50
                      ${isSelected ? 'ring-1 ring-primary bg-primary/20 border-primary' : ''}
                      ${isValidMove ? 'ring-1 ring-green-500 bg-green-500/20 border-green-500' : ''}
                      ${isLastMoveFrom ? 'ring-1 ring-yellow-500 bg-yellow-500/20 border-yellow-500' : ''}
                      ${isLastMoveTo ? 'ring-1 ring-orange-500 bg-orange-500/20 border-orange-500' : ''}
                      ${session.status === "playing" && session.currentTurn === "player1" && !isProcessingMove ? 'hover:bg-accent' : ''}
                    `}
                  >
                    {/* Arrow for last move from position */}
                    {isLastMoveFrom && ArrowComponent && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <ArrowComponent className="h-4 w-4 text-yellow-400" />
                      </div>
                    )}
                    
                    {cell && (
                      <div className="text-center">
                        {cell.player === "player1" ? (
                          <div className="text-foreground">
                            {/* Mobile: No labels, small size */}
                            <div className="block sm:hidden">
                              {getPieceDisplay(cell.piece, { showLabel: false, size: "small" })}
                            </div>
                            {/* Desktop: With labels, medium size */}
                            <div className="hidden sm:block">
                              {getPieceDisplay(cell.piece, { showLabel: true, size: "medium" })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-foreground">
                            {(cell.revealed || revealAIPieces) ? (
                              <>
                                {/* Mobile: No labels, small size */}
                                <div className="block sm:hidden">
                                  {getPieceDisplay(cell.piece, { showLabel: false, size: "small", isOpponent: false })}
                                </div>
                                {/* Desktop: With labels, medium size */}
                                <div className="hidden sm:block">
                                  {getPieceDisplay(cell.piece, { showLabel: true, size: "medium", isOpponent: false })}
                                </div>
                              </>
                            ) : (
                              <>
                                {/* Mobile: No labels, small size */}
                                <div className="block sm:hidden">
                                  {getPieceDisplay("Hidden", { showLabel: false, size: "small", isOpponent: true })}
                                </div>
                                {/* Desktop: With labels, medium size */}
                                <div className="hidden sm:block">
                                  {getPieceDisplay("Hidden", { showLabel: false, size: "medium", isOpponent: true })}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* Game Result Modal */}
      <AIGameResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        winner={session.winner}
        gameEndReason={session.gameEndReason}
        difficulty={session.difficulty}
        behavior={session.behavior}
        moveCount={session.moveCount}
        onPlayAgain={() => void handlePlayAgain()}
        onReturnToLobby={() => void handleReturnToLobby()}
      />
    </motion.div>
  );
}
