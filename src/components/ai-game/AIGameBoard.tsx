import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useAction } from "convex/react";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { useSound } from "../../lib/SoundProvider";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  Shuffle,
  CheckCircle,
  Loader2,
  RefreshCw,
  ArrowRightLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { riseIn } from "../../lib/motion";
import { cn } from "../../lib/utils";
import { getPieceDisplay } from "../../lib/piece-display";
import { SetupPresets } from "../setup-presets/SetupPresets";
import { AIGameResultModal } from "./AIGameResultModal";
import { toast } from "sonner";

const INITIAL_PIECES = [
  "Flag",
  "Spy",
  "Spy",
  "Private",
  "Private",
  "Private",
  "Private",
  "Private",
  "Private",
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
  "5 Star General",
];

const BOARD_ROWS = 8;
const BOARD_COLS = 9;

// Create empty board factory function
const createEmptyBoard = () =>
  Array(BOARD_ROWS)
    .fill(null)
    .map(() => Array(BOARD_COLS).fill(null));

interface AIGameBoardProps {
  sessionId: string;
  revealAIPieces?: boolean;
}

export function AIGameBoard({
  sessionId,
  revealAIPieces = false,
}: AIGameBoardProps) {
  // Setup state
  const [setupBoard, setSetupBoard] = useState<(string | null)[][]>(() =>
    createEmptyBoard(),
  );
  const [availablePieces, setAvailablePieces] = useState(() => [
    ...INITIAL_PIECES,
  ]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [selectedSetupSquare, setSelectedSetupSquare] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [isSwapMode, setIsSwapMode] = useState(false);

  // Game state
  const [selectedSquare, setSelectedSquare] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Mutations
  const setupPiecesMutation = useMutation(api.aiGame.setupAIGamePieces);
  const makeMove = useMutation(api.aiGame.makeAIGameMove);
  const executeAIMove = useMutation(api.aiGame.executeAIMove);
  const startNewGame = useMutation(api.aiGame.startAIGameSession);
  const cleanupSession = useMutation(api.aiGame.cleanupAIGameSession);

  // Actions
  const generateAIMove = useAction(api.aiGame.generateAIMove);
  const { playSFX, playBGM } = useSound();

  // Queries
  const { data: session } = useConvexQueryWithOptions(
    api.aiGame.getAIGameSession,
    { sessionId },
    {
      staleTime: 10000, // 10 seconds - active game session needs to be fresh
      gcTime: 300000, // 5 minutes cache
    },
  );

  // Profile data changes infrequently
  const { data: profile } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    {
      staleTime: 120000, // 2 minutes - profile data changes infrequently
      gcTime: 600000, // 10 minutes cache
    },
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
    if (
      session?.status === "playing" &&
      session.currentTurn === "player2" &&
      !isProcessingMove
    ) {
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
            }).then((result: any) => {
              // Play kill SFX when AI eliminates pieces in battle
              if (result?.challengeResult) {
                playSFX("kill");
              }
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
  }, [
    session?.status,
    session?.currentTurn,
    sessionId,
    generateAIMove,
    executeAIMove,
    isProcessingMove,
    playSFX,
  ]);

  // Open result modal when game finishes
  // NOTE: We trigger on status change to "finished" - the winner field should always be set
  // when status changes to finished, but we check it anyway for type safety
  useEffect(() => {
    if (session?.status === "finished" && !isResultModalOpen) {
      setIsResultModalOpen(true);
    }
  }, [session?.status, isResultModalOpen]);

  // BGM management based on AI game session status
  useEffect(() => {
    if (!session?.status) return;

    if (session.status === "setup") {
      playBGM("setup");
    } else if (session.status === "playing") {
      playBGM("battle");
    } else if (session.status === "finished") {
      // Game finished, resume main BGM
      playBGM("main");
    }
  }, [session?.status, playBGM]);

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
    toast.success("Pieces placed at random");
  }, [validRows]);

  const clearSetup = useCallback(() => {
    setSetupBoard(createEmptyBoard());
    setAvailablePieces([...INITIAL_PIECES]);
    setSelectedPiece(null);
    setSelectedSetupSquare(null);
    setIsSwapMode(false);
    toast.success("Board cleared");
  }, []);

  const loadPresetSetup = useCallback(
    (pieces: { piece: string; row: number; col: number }[]) => {
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
      toast.success("Setup loaded");
    },
    [],
  );

  // Memoized setup square click handler
  const handleSetupSquareClick = useCallback(
    (row: number, col: number) => {
      if (!validRows.includes(row)) {
        toast.error("Place pieces in your own three rows");
        return;
      }

      const currentPiece = setupBoard[row][col];

      if (isSwapMode || availablePieces.length === 0) {
        if (selectedSetupSquare) {
          // Swap pieces
          const selectedRow = selectedSetupSquare.row;
          const selectedCol = selectedSetupSquare.col;
          const selectedPieceValue = setupBoard[selectedRow][selectedCol];

          const newBoard = setupBoard.map((r) => [...r]);
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
          toast.error("Tap one of your pieces to swap it");
          return;
        }
      }

      if (currentPiece) {
        toast.error("That square is taken. Use Swap pieces to move it.");
        return;
      }

      if (!selectedPiece) {
        toast.error("Pick a piece to place first");
        return;
      }

      const newBoard = setupBoard.map((r) => [...r]);
      newBoard[row][col] = selectedPiece;
      setSetupBoard(newBoard);

      const pieceIndex = availablePieces.indexOf(selectedPiece);
      const newAvailable = [...availablePieces];
      newAvailable.splice(pieceIndex, 1);
      setAvailablePieces(newAvailable);

      setSelectedPiece(null);
    },
    [
      validRows,
      setupBoard,
      isSwapMode,
      availablePieces,
      selectedSetupSquare,
      selectedPiece,
    ],
  );

  const handleFinishSetup = useCallback(async () => {
    if (availablePieces.length > 0) {
      toast.error("Place all your pieces first");
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

    setIsFinishing(true);
    try {
      await setupPiecesMutation({ sessionId, pieces });
    } catch (error) {
      console.error("Failed to setup pieces:", error);
      toast.error("Could not start the battle. Try again.");
    } finally {
      setIsFinishing(false);
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

      toast.success("New game started");
    } catch (error) {
      console.error("Failed to start new game:", error);
      toast.error("Could not start a new game. Try again.");
    }
  }, [profile, session, startNewGame]);

  const handleReturnToLobby = useCallback(async () => {
    try {
      // Close the modal
      setIsResultModalOpen(false);

      // Cleanup the current session
      await cleanupSession({ sessionId });

      toast.success("Game ended");
    } catch (error) {
      console.error("Failed to return to lobby:", error);
      toast.error("Could not leave the game. Try again.");
    }
  }, [cleanupSession, sessionId]);

  // Helper function to get arrow direction for moves
  const getArrowDirection = useCallback(
    (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
      const rowDiff = toRow - fromRow;
      const colDiff = toCol - fromCol;

      if (rowDiff > 0) return ArrowDown;
      if (rowDiff < 0) return ArrowUp;
      if (colDiff > 0) return ArrowRight;
      if (colDiff < 0) return ArrowLeft;

      return null;
    },
    [],
  );

  // Optimized game square click handler
  const handleGameSquareClick = useCallback(
    (row: number, col: number) => {
      if (
        !session ||
        session.status !== "playing" ||
        session.currentTurn !== "player1" ||
        isProcessingMove
      )
        return;

      const board = session.board;

      if (selectedSquare) {
        if (selectedSquare.row === row && selectedSquare.col === col) {
          // Deselect
          setSelectedSquare(null);
          return;
        }

        const isValidMove =
          Math.abs(selectedSquare.row - row) +
            Math.abs(selectedSquare.col - col) ===
          1;
        if (!isValidMove) {
          toast.error("Pieces move one square up, down, left or right");
          setSelectedSquare(null);
          return;
        }

        const targetPiece = board[row][col];

        if (targetPiece && targetPiece.player === "player1") {
          toast.error("You cannot capture your own piece");
          setSelectedSquare(null);
          return;
        }

        // Play piece-move SFX when a piece is moved
        playSFX("piece-move");

        // Make the move
        makeMove({
          sessionId,
          fromRow: selectedSquare.row,
          fromCol: selectedSquare.col,
          toRow: row,
          toCol: col,
        })
          .then((result: any) => {
            // Play kill SFX when pieces are eliminated in battle
            if (result?.challengeResult) {
              playSFX("kill");
            }
            setSelectedSquare(null);
          })
          .catch((error) => {
            console.error("Move failed:", error);
            toast.error("That move did not go through. Try again.");
            setSelectedSquare(null);
          });
      } else {
        const piece = board[row][col];
        if (piece && piece.player === "player1") {
          setSelectedSquare({ row, col });
        }
      }
    },
    [session, isProcessingMove, selectedSquare, makeMove, sessionId],
  );

  if (!session) {
    return (
      <div role="status" className="space-y-4">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="aspect-[9/8] w-full max-w-lg rounded-lg" />
      </div>
    );
  }

  const isMyTurn =
    session.status === "playing" &&
    session.currentTurn === "player1" &&
    !isProcessingMove;

  const setupStatus =
    availablePieces.length === 0
      ? isSwapMode
        ? "All pieces placed. Tap two of your pieces to swap them."
        : "All pieces placed."
      : isSwapMode
        ? "Tap two of your pieces to swap them."
        : `${availablePieces.length} ${availablePieces.length === 1 ? "piece" : "pieces"} left to place`;

  if (session.status === "setup") {
    return (
      <motion.div {...riseIn} className="space-y-4 sm:space-y-6">
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={randomizeSetup}>
              <Shuffle />
              Randomize
            </Button>
            <Button variant="secondary" onClick={clearSetup}>
              <RefreshCw />
              Clear
            </Button>
            {(availablePieces.length > 0 ||
              (availablePieces.length === 0 && !isSwapMode)) && (
              <Button
                variant={isSwapMode ? "default" : "secondary"}
                aria-pressed={isSwapMode}
                onClick={() => setIsSwapMode(!isSwapMode)}
              >
                <ArrowRightLeft />
                {isSwapMode ? "Done swapping" : "Swap pieces"}
              </Button>
            )}
          </div>
          <p role="status" className="text-sm text-foreground">
            {setupStatus}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* Board. Full bleed on phones so squares stay 40px or more. */}
            <div className="-mx-4 border-y border-border bg-card p-1 sm:mx-0 sm:rounded-lg sm:border sm:p-4">
              <div className="mx-auto grid w-full max-w-xl grid-cols-9 gap-0.5 sm:gap-1.5">
                {setupBoard.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isValidArea = validRows.includes(rowIndex);
                    const isOccupied = !!cell;
                    const isSelected =
                      selectedSetupSquare?.row === rowIndex &&
                      selectedSetupSquare?.col === colIndex;

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        type="button"
                        aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}${cell ? `, ${cell}` : isValidArea ? ", empty" : ""}`}
                        aria-pressed={isSelected}
                        disabled={!isValidArea}
                        onClick={() =>
                          handleSetupSquareClick(rowIndex, colIndex)
                        }
                        className={cn(
                          "relative flex aspect-square min-h-10 items-center justify-center overflow-hidden rounded border p-0.5 text-foreground transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                          isValidArea
                            ? "cursor-pointer border-border-strong bg-white/[0.04] hover:bg-white/[0.09]"
                            : "cursor-default border-transparent bg-white/[0.015]",
                          isOccupied && "bg-white/[0.08]",
                          isSelected &&
                            "border-gold-500/60 bg-gold-500/20 ring-1 ring-gold-400",
                          selectedPiece &&
                            isValidArea &&
                            !isOccupied &&
                            "hover:border-gold-500/40 hover:bg-gold-500/10",
                        )}
                      >
                        {cell && (
                          <span title={cell}>
                            <span className="block sm:hidden">
                              {getPieceDisplay(cell, {
                                showLabel: false,
                                size: "small",
                              })}
                            </span>
                            <span className="hidden sm:block">
                              {getPieceDisplay(cell, {
                                showLabel: true,
                                size: "medium",
                              })}
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>

            {availablePieces.length === 0 && (
              <motion.div {...riseIn}>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => void handleFinishSetup()}
                  disabled={isFinishing}
                >
                  {isFinishing ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Starting
                    </>
                  ) : (
                    <>
                      <CheckCircle />
                      Start battle
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Pieces, presets, legend */}
          <div className="space-y-4 sm:space-y-6">
            {availablePieces.length > 0 && (
              <Card>
                <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
                  <CardTitle className="text-base">
                    Pieces to place ({availablePieces.length})
                  </CardTitle>
                  <p className="text-sm text-foreground/80">
                    Pick a piece, then tap a square in your three rows.
                  </p>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                  <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-2">
                    {availablePieces.map((piece, index) => (
                      <button
                        key={`${piece}-${index}`}
                        type="button"
                        aria-pressed={selectedPiece === piece}
                        onClick={() => setSelectedPiece(piece)}
                        className={cn(
                          "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-md border p-2 text-foreground transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]",
                          selectedPiece === piece
                            ? "border-gold-500/50 bg-gold-500/10"
                            : "border-border bg-card hover:border-border-strong hover:bg-white/[0.04]",
                        )}
                      >
                        <span className="flex items-center justify-center">
                          {getPieceDisplay(piece, {
                            showLabel: false,
                            size: "small",
                          })}
                        </span>
                        <span className="w-full truncate text-center text-xs leading-tight">
                          {piece}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Setup Presets */}
            <SetupPresets
              currentSetup={setupBoard}
              onLoadPreset={loadPresetSetup}
            />

            {/* Legend */}
            <Card>
              <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
                <CardTitle className="text-base">Piece ranks</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-1 py-1.5 text-center font-medium">
                          Icon
                        </th>
                        <th className="px-1 py-1.5 font-medium">Piece</th>
                        <th className="px-1 py-1.5 text-center font-medium">
                          Rank
                        </th>
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
                        {
                          piece: "Lieutenant Colonel",
                          rank: "7",
                          short: "Lt Col",
                        },
                        { piece: "Major", rank: "8", short: "Maj" },
                        { piece: "Captain", rank: "9", short: "Cpt" },
                        {
                          piece: "1st Lieutenant",
                          rank: "10",
                          short: "1st Lt",
                        },
                        {
                          piece: "2nd Lieutenant",
                          rank: "11",
                          short: "2nd Lt",
                        },
                        { piece: "Sergeant", rank: "12", short: "Sgt" },
                        { piece: "Private", rank: "13", short: "Pvt" },
                        { piece: "Spy", rank: "Spy", short: "Spy" },
                        { piece: "Flag", rank: "Flag", short: "Flag" },
                      ].map(({ piece, rank, short }) => (
                        <tr
                          key={piece}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="px-1 py-1">
                            <div className="flex justify-center text-foreground">
                              {getPieceDisplay(piece, { size: "small" })}
                            </div>
                          </td>
                          <td className="px-1 py-1 font-medium">{short}</td>
                          <td className="px-1 py-1 text-center tabular-nums">
                            {rank}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  }

  // Playing/Finished states
  return (
    <motion.div {...riseIn} className="space-y-4 sm:space-y-6">
      {/* Game Board. Full bleed on phones so squares stay 40px or more. */}
      <div className="-mx-4 border-y border-border bg-card p-1 sm:mx-0 sm:rounded-lg sm:border sm:p-4">
        <div className="mx-auto grid w-full max-w-2xl grid-cols-9 gap-0.5 sm:gap-1.5">
          {session.board.map((row: any[], rowIndex: number) =>
            row.map(
              (
                cell: { player: string; piece: string; revealed: any },
                colIndex: number,
              ) => {
                const isSelected =
                  selectedSquare?.row === rowIndex &&
                  selectedSquare?.col === colIndex;
                const isValidMove =
                  selectedSquare &&
                  Math.abs(selectedSquare.row - rowIndex) +
                    Math.abs(selectedSquare.col - colIndex) ===
                    1;

                // Recent move highlighting
                const isLastMoveFrom =
                  session.lastMoveFrom &&
                  session.lastMoveFrom.row === rowIndex &&
                  session.lastMoveFrom.col === colIndex;
                const isLastMoveTo =
                  session.lastMoveTo &&
                  session.lastMoveTo.row === rowIndex &&
                  session.lastMoveTo.col === colIndex;

                // Get arrow component for last move
                const ArrowComponent =
                  isLastMoveFrom && session.lastMoveFrom && session.lastMoveTo
                    ? getArrowDirection(
                        session.lastMoveFrom.row,
                        session.lastMoveFrom.col,
                        session.lastMoveTo.row,
                        session.lastMoveTo.col,
                      )
                    : null;

                const isMine = cell?.player === "player1";
                const showFace = isMine || cell?.revealed || revealAIPieces;
                const label = !cell
                  ? "Empty"
                  : isMine
                    ? `Your ${cell.piece}`
                    : showFace
                      ? `Enemy ${cell.piece}`
                      : "Enemy piece, hidden";

                return (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${label}`}
                    aria-pressed={isSelected}
                    whileTap={isMyTurn ? { scale: 0.96 } : {}}
                    onClick={() => handleGameSquareClick(rowIndex, colIndex)}
                    className={cn(
                      "relative flex aspect-square min-h-10 items-center justify-center rounded border p-0.5 transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                      !cell && "border-border bg-white/[0.025]",
                      isMine && "border-border-strong bg-white/[0.08]",
                      cell && !isMine && "border-red-500/25 bg-red-500/[0.08]",
                      isMyTurn
                        ? "cursor-pointer hover:bg-white/[0.12]"
                        : "cursor-default",
                      isLastMoveFrom &&
                        "border-gold-500/50 bg-gold-500/10 ring-1 ring-gold-400/60",
                      isLastMoveTo && "border-gold-500/60 ring-1 ring-gold-400",
                      isValidMove &&
                        "border-emerald-500/60 bg-emerald-500/15 ring-1 ring-emerald-400/70",
                      isSelected &&
                        "border-gold-500/70 bg-gold-500/25 ring-2 ring-gold-400",
                    )}
                  >
                    {/* Arrow for last move from position */}
                    {isLastMoveFrom && ArrowComponent && (
                      <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                        <ArrowComponent className="size-4 text-gold-400" />
                      </span>
                    )}

                    {cell && (
                      <span
                        className={cn(
                          "text-center",
                          isMine ? "text-foreground" : "text-red-300",
                        )}
                      >
                        {showFace ? (
                          <>
                            <span className="block sm:hidden">
                              {getPieceDisplay(cell.piece, {
                                showLabel: false,
                                size: "small",
                                isOpponent: false,
                              })}
                            </span>
                            <span className="hidden sm:block">
                              {getPieceDisplay(cell.piece, {
                                showLabel: true,
                                size: "medium",
                                isOpponent: false,
                              })}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="block sm:hidden">
                              {getPieceDisplay("Hidden", {
                                showLabel: false,
                                size: "small",
                                isOpponent: true,
                              })}
                            </span>
                            <span className="hidden sm:block">
                              {getPieceDisplay("Hidden", {
                                showLabel: false,
                                size: "medium",
                                isOpponent: true,
                              })}
                            </span>
                          </>
                        )}
                      </span>
                    )}
                  </motion.button>
                );
              },
            ),
          )}
        </div>
      </div>

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
