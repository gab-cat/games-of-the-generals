import { useState, useEffect } from "react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  FastForward,
  Rewind,
  Sword,
  Square,
  Activity,
  User,
} from "lucide-react";
import { Button } from "../../components/ui/button";

import { Badge } from "../../components/ui/badge";
import { Slider } from "../../components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { Id } from "../../../convex/_generated/dataModel";
import { getPieceDisplay } from "../../lib/piece-display";
import { cn } from "@/lib/utils";
import type { LocalReplayData } from "./LocalReplayViewer";

// Move type that matches the structure from server
interface MoveData {
  moveType: "move" | "challenge";
  piece?: string;
  fromRow?: number;
  fromCol?: number;
  toRow: number;
  toCol: number;
  challengeResult?: {
    attacker: string;
    defender: string;
    winner: "attacker" | "defender" | "tie";
  };
}

// Normalized replay data type used internally
interface NormalizedReplayData {
  moves: MoveData[];
  initialBoard: unknown[][];
  player1Username: string;
  player2Username: string;
  game?: {
    _creationTime: number;
  };
}

interface GameReplayProps {
  gameId?: Id<"games">;
  localReplayData?: LocalReplayData;
  onBack: () => void;
}

export function GameReplay({
  gameId,
  localReplayData,
  onBack,
}: GameReplayProps) {
  // Only query server if we don't have local data
  const {
    data: serverReplayData,
    isPending: isLoadingReplay,
    error: replayError,
  } = useConvexQuery(
    api.games.getGameReplay,
    gameId && !localReplayData ? { gameId } : "skip",
  );

  // Normalize replay data from either source
  const replayData: NormalizedReplayData | null = localReplayData
    ? {
        moves: localReplayData.moves as MoveData[],
        initialBoard: localReplayData.initialBoard as unknown[][],
        player1Username: localReplayData.player1Username,
        player2Username: localReplayData.player2Username,
        game: { _creationTime: localReplayData.gameMetadata.createdAt },
      }
    : serverReplayData
      ? {
          moves: serverReplayData.moves as MoveData[],
          initialBoard: serverReplayData.initialBoard as unknown[][],
          player1Username: serverReplayData.player1Username,
          player2Username: serverReplayData.player2Username,
          game: serverReplayData.game,
        }
      : null;

  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // -1 means initial state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // milliseconds between moves
  const [showAllPieces, setShowAllPieces] = useState(true); // New state to toggle piece visibility

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !replayData) return;

    const timer = setInterval(() => {
      setCurrentMoveIndex((prev) => {
        if (prev >= replayData.moves.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, replayData, playbackSpeed]);

  // Show loading state (only for server replays)
  if (isLoadingReplay && !localReplayData) {
    return (
      <div className="min-h-screen p-4">
        <div className="flex justify-center items-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"
          />
        </div>
      </div>
    );
  }

  // Show error state
  if (replayError) {
    return (
      <div className="min-h-screen p-4">
        <div className="flex justify-center items-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="text-red-400 text-lg">
              Failed to load game replay
            </div>
            <div className="text-white/60 text-sm">
              Please try refreshing the page
            </div>
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!replayData) {
    return (
      <div className="min-h-screen p-4">
        <div className="flex justify-center items-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="text-white/60 text-lg">Replay not available</div>
            <Button onClick={onBack} variant="outline">
              Go Back
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const reconstructBoardAtMove = (moveIndex: number) => {
    if (!replayData) return null;

    // Start with the initial board state (pieces placed during setup)
    const board = replayData.initialBoard.map((row: any) =>
      row.map((cell: any) =>
        cell
          ? {
              ...cell,
              revealed: false, // Start with all pieces hidden
            }
          : null,
      ),
    );

    // Apply moves up to the current index
    for (let i = 0; i <= moveIndex && i < replayData.moves.length; i++) {
      const move = replayData.moves[i];

      if (move.moveType === "move" || move.moveType === "challenge") {
        const fromPiece = board[move.fromRow!][move.fromCol!];

        if (move.moveType === "challenge" && move.challengeResult) {
          // Handle challenge result - follow the same logic as server
          const revealedFromPiece = fromPiece
            ? { ...fromPiece, revealed: true }
            : null;

          if (move.challengeResult.winner === "attacker") {
            // Attacker wins, move attacking piece and reveal it
            board[move.toRow][move.toCol] = revealedFromPiece;
            board[move.fromRow!][move.fromCol!] = null;
          } else if (move.challengeResult.winner === "defender") {
            // Attacker loses, defender piece stays hidden, attacker removed
            board[move.fromRow!][move.fromCol!] = null;
            // Defender piece stays in place and remains hidden
          } else {
            // Tie - both eliminated
            board[move.toRow][move.toCol] = null;
            board[move.fromRow!][move.fromCol!] = null;
          }
        } else {
          // Simple move - piece moves without revealing
          board[move.toRow][move.toCol] = fromPiece;
          board[move.fromRow!][move.fromCol!] = null;
        }
      }
    }

    return board;
  };

  const currentBoard = reconstructBoardAtMove(currentMoveIndex);
  const currentMove =
    currentMoveIndex >= 0 && currentMoveIndex < (replayData?.moves.length || 0)
      ? replayData.moves[currentMoveIndex]
      : null;

  if (!replayData) {
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

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 lg:space-y-6 p-0 sm:p-4"
      >
        {/* Header Section */}
        <div className="mb-8 md:mb-12 space-y-4 px-2 md:px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "circOut" }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-3 text-blue-400/60 font-mono text-xs tracking-[0.2em] uppercase">
              <RotateCcw className="w-4 h-4" />
              <span>Replay System</span>
              <span className="w-px h-3 bg-blue-500/30" />
              <span>
                {gameId
                  ? `Archive ID: ${gameId.slice(0, 8)}...`
                  : "Local Replay"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl md:text-5xl font-display font-medium text-white tracking-tight leading-none">
                Combat <span className="text-white/20">Review</span>
              </h1>
              <Button
                variant="outline"
                onClick={onBack}
                className="hidden sm:flex items-center gap-2 bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 font-mono text-xs uppercase tracking-wider"
              >
                <ArrowLeft className="h-3 w-3" />
                Return to Base
              </Button>
            </div>
            <p className="max-w-xl text-white/50 text-sm leading-relaxed font-light font-mono">
              <span className="text-blue-400">log_entry:</span>{" "}
              {replayData.player1Username} vs {replayData.player2Username} //{" "}
              <span className="text-white/30">
                {new Date(
                  replayData.game?._creationTime ?? Date.now(),
                ).toLocaleDateString()}
              </span>
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-2 md:px-4 pb-12">
          {/* Game Board (Left Column) */}
          <div className="lg:col-span-8">
            {/* Board Container */}
            <div className="relative">
              {/* Board Decoration */}
              <div className="absolute -inset-4 bg-gradient-to-b from-blue-500/5 to-transparent rounded-2xl pointer-events-none" />

              {/* Main Board Card */}
              <div className="relative z-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden shadow-2xl group">
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors z-20" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors z-20" />
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <h3 className="font-mono text-sm uppercase tracking-widest text-white/70">
                      Tactical Display
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="bg-white/5 text-white/40 border-white/10 font-mono text-[10px] uppercase tracking-wider px-2 py-1"
                    >
                      Grid 9x8
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllPieces(!showAllPieces)}
                      className="h-8 text-[10px] font-mono uppercase tracking-wider text-white/40 hover:text-white hover:bg-white/5"
                    >
                      {showAllPieces ? (
                        <EyeOff className="h-3 w-3 mr-2" />
                      ) : (
                        <Eye className="h-3 w-3 mr-2" />
                      )}
                      {showAllPieces ? "Mask Intel" : "Reveal Intel"}
                    </Button>
                  </div>
                </div>
                <div className="p-0 sm:p-6 bg-black/40">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="grid grid-cols-9 gap-1 sm:gap-2 w-full max-w-2xl mx-auto p-0 sm:p-4 rounded-lg bg-white/5 backdrop-blur-sm border sm:border border-white/10 overflow-hidden"
                  >
                    {(currentBoard || replayData.initialBoard).map(
                      (row: any, rowIndex: number) =>
                        row.map((cell: any, colIndex: number) => {
                          const isLastMoveFrom =
                            currentMove?.fromRow === rowIndex &&
                            currentMove?.fromCol === colIndex;
                          const isLastMoveTo =
                            currentMove?.toRow === rowIndex &&
                            currentMove?.toCol === colIndex;
                          const isChallenge =
                            currentMove?.moveType === "challenge";

                          // Calculate arrow direction for "from" position
                          const getArrowDirection = () => {
                            if (!isLastMoveFrom || !currentMove) return null;

                            const rowDiff =
                              currentMove.toRow - currentMove.fromRow!;
                            const colDiff =
                              currentMove.toCol - currentMove.fromCol!;

                            if (rowDiff > 0) return ArrowDown; // Moving down
                            if (rowDiff < 0) return ArrowUp; // Moving up
                            if (colDiff > 0) return ArrowRight; // Moving right
                            if (colDiff < 0) return ArrowLeft; // Moving left

                            return null;
                          };

                          const ArrowComponent = getArrowDirection();

                          return (
                            <motion.div
                              key={`${rowIndex}-${colIndex}`}
                              animate={
                                isLastMoveFrom || isLastMoveTo
                                  ? {
                                      scale: [1, 1.05, 1],
                                    }
                                  : {}
                              }
                              transition={{ duration: 0.5 }}
                              className={cn(
                                "aspect-square border-2 flex items-center justify-center rounded-lg transition-all bg-muted/30 border-border relative",
                                isLastMoveFrom && isChallenge
                                  ? "ring-2 ring-red-500"
                                  : "",
                                isLastMoveFrom && !isChallenge
                                  ? "ring-2 ring-yellow-500"
                                  : "",
                                isLastMoveTo && isChallenge
                                  ? "ring-2 ring-red-500"
                                  : "",
                                isLastMoveTo && !isChallenge
                                  ? "ring-2 ring-yellow-500"
                                  : "",
                              )}
                            >
                              {/* Directional arrow indicator for "from" position */}
                              {isLastMoveFrom && ArrowComponent && (
                                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                  <div className="rounded-full p-0.5 sm:p-1">
                                    <ArrowComponent
                                      className={cn(
                                        "h-3 w-3 sm:h-4 sm:w-4",
                                        isChallenge
                                          ? "text-red-500"
                                          : "text-yellow-500",
                                      )}
                                    />
                                  </div>
                                </div>
                              )}

                              {cell && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-center cursor-pointer">
                                      <div
                                        className={`${cell.player === "player1" ? "text-blue-400" : "text-red-400"}`}
                                      >
                                        {showAllPieces || cell.revealed ? (
                                          <div className="flex flex-col items-center justify-center">
                                            <div className="flex items-center justify-center">
                                              {getPieceDisplay(cell.piece, {
                                                showLabel: false,
                                                size: "small",
                                              })}
                                            </div>
                                            <div className="hidden sm:block text-center mt-0.5 text-xs">
                                              {cell.piece}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center justify-center">
                                            <Square
                                              className="w-4 h-4 sm:w-6 sm:h-6"
                                              fill="currentColor"
                                            />
                                            <div className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                                              Hidden
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {showAllPieces || cell.revealed
                                        ? cell.piece
                                        : "Hidden Piece"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </motion.div>
                          );
                        }),
                    )}
                  </motion.div>
                </div>
                {/* Footer Status Bar for Board */}
                <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-white/30 uppercase tracking-widest">
                  <span>
                    View Mode: {showAllPieces ? "Omniscient" : "Standard"}
                  </span>
                  <span>Render: 99.8%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mission Control */}
          <div className="lg:col-span-4 space-y-6">
            {/* Playback Controls */}
            <div className="rounded-sm border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden relative group">
              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors z-20" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors z-20" />
              {/* Scanline overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-10 pointer-events-none" />

              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Play className="h-3 w-3" />
                  Playback Sequence
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isPlaying ? "bg-green-500 animate-pulse" : "bg-white/20",
                    )}
                  />
                  <span className="text-[10px] font-mono uppercase text-white/30">
                    {isPlaying ? "Running" : "Paused"}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6 relative z-10">
                {/* Timeline Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-white/40">
                    <span>T-Minus 00:00</span>
                    <span>Op-End</span>
                  </div>
                  <Slider
                    value={[currentMoveIndex + 1]}
                    onValueChange={([value]: number[]) => {
                      setCurrentMoveIndex(value - 1);
                      setIsPlaying(false);
                    }}
                    max={replayData.moves.length}
                    min={0}
                    step={1}
                    className="w-full [&>.relative>.bg-primary]:bg-blue-500 [&>.bg-secondary]:bg-white/10"
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setCurrentMoveIndex(-1);
                      setIsPlaying(false);
                    }}
                    className="w-10 h-10 rounded-full bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setCurrentMoveIndex(Math.max(-1, currentMoveIndex - 1));
                      setIsPlaying(false);
                    }}
                    disabled={currentMoveIndex <= -1}
                    className="w-10 h-10 rounded-full bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all disabled:opacity-30"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={currentMoveIndex >= replayData.moves.length - 1}
                    className={cn(
                      "w-14 h-14 rounded-full border-2 transition-all shadow-lg",
                      isPlaying
                        ? "bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30 hover:shadow-red-500/20"
                        : "bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30 hover:shadow-blue-500/20",
                    )}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" fill="currentColor" />
                    ) : (
                      <Play className="h-6 w-6 ml-1" fill="currentColor" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setCurrentMoveIndex(
                        Math.min(
                          replayData.moves.length - 1,
                          currentMoveIndex + 1,
                        ),
                      );
                      setIsPlaying(false);
                    }}
                    disabled={currentMoveIndex >= replayData.moves.length - 1}
                    className="w-10 h-10 rounded-full bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all disabled:opacity-30"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Speed Control */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-white/40">
                    <span>Tempo Control</span>
                    <span>{playbackSpeed}ms / turn</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Rewind className="h-4 w-4 text-white/20" />
                    <Slider
                      value={[2000 - playbackSpeed]}
                      onValueChange={([value]: number[]) =>
                        setPlaybackSpeed(2000 - value)
                      }
                      max={1800}
                      min={200}
                      step={200}
                      className="flex-1 [&>.relative>.bg-primary]:bg-white/20"
                    />
                    <FastForward className="h-4 w-4 text-white/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Current Move Info */}
            {currentMove && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-sm border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden relative group"
              >
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors z-20" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors z-20" />
                <div className="p-4 border-b border-white/10 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white/40">
                    Action Log
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-white/40">SEQUENCE:</span>
                    <span className="text-white/80">
                      #{currentMoveIndex + 1}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-black/40 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40 font-mono">TYPE:</span>
                      <Badge
                        variant={
                          currentMove.moveType === "challenge"
                            ? "destructive"
                            : "secondary"
                        }
                        className={cn(
                          "h-5 text-[10px] tracking-wider uppercase font-mono rounded-sm px-1.5",
                          currentMove.moveType === "challenge"
                            ? "bg-red-900/40 text-red-400 border-red-500/20"
                            : "bg-blue-900/40 text-blue-400 border-blue-500/20",
                        )}
                      >
                        {currentMove.moveType}
                      </Badge>
                    </div>

                    {currentMove.piece && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40 font-mono">UNIT:</span>
                        <span className="text-white font-bold">
                          {currentMove.piece}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 font-mono text-[10px]">
                      <div className="flex items-center gap-2 text-white/30">
                        <span className="uppercase">Origin</span>
                        <span className="text-white/60">
                          [{currentMove.fromRow}, {currentMove.fromCol}]
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/30 justify-end">
                        <span className="text-white/60">
                          [{currentMove.toRow}, {currentMove.toCol}]
                        </span>
                        <span className="uppercase">Dest</span>
                      </div>
                    </div>
                  </div>

                  {/* Battle Outcome Display */}
                  {currentMove.challengeResult && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">
                        Engagement Result
                      </div>
                      <div className="p-3 bg-red-500/5 border border-red-500/20 rounded relative overflow-hidden">
                        {/* Flash effect for heavy combat */}
                        <div className="absolute top-0 right-0 p-1">
                          <Sword className="w-8 h-8 text-red-500/10 rotate-12" />
                        </div>

                        <div className="flex justify-between items-center relative z-10 text-xs">
                          {/* Attacker */}
                          <div
                            className={cn(
                              "text-center",
                              currentMove.challengeResult.winner === "attacker"
                                ? "text-green-400"
                                : "text-red-400 opacity-60",
                            )}
                          >
                            <div className="font-bold">
                              {currentMove.challengeResult.attacker}
                            </div>
                            <div className="text-[9px] uppercase tracking-wider opacity-50">
                              ATK
                            </div>
                          </div>

                          <div className="text-white/20 font-mono font-bold">
                            VS
                          </div>

                          {/* Defender */}
                          <div
                            className={cn(
                              "text-center",
                              currentMove.challengeResult.winner === "defender"
                                ? "text-green-400"
                                : "text-red-400 opacity-60",
                            )}
                          >
                            <div className="font-bold">
                              {currentMove.challengeResult.defender}
                            </div>
                            <div className="text-[9px] uppercase tracking-wider opacity-50">
                              DEF
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-red-500/10 text-center">
                          <div
                            className={cn(
                              "text-[10px] uppercase tracking-widest font-bold",
                              currentMove.challengeResult.winner === "tie"
                                ? "text-yellow-500"
                                : currentMove.challengeResult.winner ===
                                    "attacker"
                                  ? "text-green-500"
                                  : "text-blue-500",
                            )}
                          >
                            {currentMove.challengeResult.winner === "tie" &&
                              "Mutually Assured Destruction"}
                            {currentMove.challengeResult.winner ===
                              "attacker" && "Attacker Victory"}
                            {currentMove.challengeResult.winner ===
                              "defender" && "Defender Repelled Attack"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Players Info */}
            <div className="rounded-sm border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-4 relative group overflow-hidden">
              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors z-20" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors z-20" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
                <User className="w-3 h-3" />
                Commanders
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    <span className="font-mono text-xs text-blue-200">
                      {replayData.player1Username}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-blue-500/20 text-blue-400 text-[9px] h-5"
                  >
                    P1
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span className="font-mono text-xs text-red-200">
                      {replayData.player2Username}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-red-500/20 text-red-400 text-[9px] h-5"
                  >
                    P2
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
