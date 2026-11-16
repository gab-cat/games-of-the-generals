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
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Slider } from "../../components/ui/slider";
import { Skeleton } from "../../components/ui/skeleton";
import { PageHeader } from "../../components/ui/page-header";
import { EmptyState } from "../../components/ui/empty-state";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { Id } from "../../../convex/_generated/dataModel";
import { getPieceDisplay } from "../../lib/piece-display";
import { riseIn } from "../../lib/motion";
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
      <div role="status" aria-label="Loading replay">
        <div className="mb-6 space-y-2 sm:mb-8">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="aspect-[9/8] w-full rounded-lg lg:col-span-8" />
          <div className="space-y-4 lg:col-span-4">
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (replayError) {
    return (
      <EmptyState
        title="Could not load this replay"
        body="Check your connection and try again."
        action={
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        }
      />
    );
  }

  // Show no data state
  if (!replayData) {
    return (
      <EmptyState
        title="This replay is not available"
        body="It may have been removed, or it is not one of your games."
        action={
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        }
      />
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

  const totalMoves = replayData.moves.length;
  const atEnd = currentMoveIndex >= totalMoves - 1;
  const stepTo = (index: number) => {
    setCurrentMoveIndex(index);
    setIsPlaying(false);
  };

  const p1Class = "text-foreground";
  const p2Class = "text-gold-300";

  const outcome = currentMove?.challengeResult
    ? currentMove.challengeResult.winner === "tie"
      ? "Both pieces are removed."
      : currentMove.challengeResult.winner === "attacker"
        ? "The attacker wins."
        : "The defender holds."
    : null;

  return (
    <TooltipProvider>
      <div>
        <PageHeader
          title="Replay"
          description={
            <>
              {replayData.player1Username} vs {replayData.player2Username}
              <span className="text-foreground/70">
                {" "}
                on{" "}
                {new Date(
                  replayData.game?._creationTime ?? Date.now(),
                ).toLocaleDateString()}
              </span>
            </>
          }
          actions={
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft />
              {gameId ? "Match history" : "Load another file"}
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Board */}
          <motion.div {...riseIn} className="lg:col-span-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                Board
              </h2>
              <Button
                variant="secondary"
                size="sm"
                aria-pressed={showAllPieces}
                onClick={() => setShowAllPieces(!showAllPieces)}
              >
                {showAllPieces ? <EyeOff /> : <Eye />}
                {showAllPieces ? "Hide unrevealed pieces" : "Show all pieces"}
              </Button>
            </div>

            {/* Full bleed on phones so squares stay 40px or more. */}
            <div className="-mx-4 border-y border-border bg-card p-1 sm:mx-0 sm:rounded-lg sm:border sm:p-4">
              <div className="mx-auto grid w-full max-w-2xl grid-cols-9 gap-0.5 sm:gap-1.5">
                {(currentBoard || replayData.initialBoard).map(
                  (row: any, rowIndex: number) =>
                    row.map((cell: any, colIndex: number) => {
                      const isLastMoveFrom =
                        currentMove?.fromRow === rowIndex &&
                        currentMove?.fromCol === colIndex;
                      const isLastMoveTo =
                        currentMove?.toRow === rowIndex &&
                        currentMove?.toCol === colIndex;
                      const isChallenge = currentMove?.moveType === "challenge";
                      const isHighlighted = isLastMoveFrom || isLastMoveTo;

                      // Arrow direction for the "from" square
                      const getArrowDirection = () => {
                        if (!isLastMoveFrom || !currentMove) return null;

                        const rowDiff =
                          currentMove.toRow - currentMove.fromRow!;
                        const colDiff =
                          currentMove.toCol - currentMove.fromCol!;

                        if (rowDiff > 0) return ArrowDown;
                        if (rowDiff < 0) return ArrowUp;
                        if (colDiff > 0) return ArrowRight;
                        if (colDiff < 0) return ArrowLeft;

                        return null;
                      };

                      const ArrowComponent = getArrowDirection();
                      const faceUp = cell && (showAllPieces || cell.revealed);

                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={cn(
                            "relative flex aspect-square min-h-10 items-center justify-center rounded border p-0.5",
                            !cell && "border-border bg-white/[0.025]",
                            cell?.player === "player1" &&
                              "border-border-strong bg-white/[0.08]",
                            cell?.player === "player2" &&
                              "border-gold-500/25 bg-gold-500/[0.08]",
                            isHighlighted &&
                              (isChallenge
                                ? "ring-2 ring-red-400"
                                : "ring-2 ring-foreground/80"),
                          )}
                        >
                          {isLastMoveFrom && ArrowComponent && (
                            <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                              <ArrowComponent
                                className={cn(
                                  "size-4",
                                  isChallenge
                                    ? "text-red-400"
                                    : "text-foreground",
                                )}
                              />
                            </span>
                          )}

                          {cell && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  className={cn(
                                    "text-center",
                                    cell.player === "player1"
                                      ? p1Class
                                      : p2Class,
                                  )}
                                  aria-label={
                                    faceUp
                                      ? `${cell.player === "player1" ? replayData.player1Username : replayData.player2Username}: ${cell.piece}`
                                      : "Hidden piece"
                                  }
                                >
                                  {faceUp ? (
                                    <>
                                      <span className="block sm:hidden">
                                        {getPieceDisplay(cell.piece, {
                                          showLabel: false,
                                          size: "small",
                                        })}
                                      </span>
                                      <span className="hidden sm:block">
                                        {getPieceDisplay(cell.piece, {
                                          showLabel: true,
                                          size: "medium",
                                        })}
                                      </span>
                                    </>
                                  ) : (
                                    getPieceDisplay("Hidden", {
                                      isOpponent: true,
                                      size: "small",
                                    })
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {faceUp ? cell.piece : "Hidden piece"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      );
                    }),
                )}
              </div>
            </div>

            {/* Players */}
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground">
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-sm border border-border-strong bg-white/[0.2]" />
                {replayData.player1Username}
              </span>
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-sm border border-gold-500/40 bg-gold-500/30" />
                {replayData.player2Username}
              </span>
            </div>
          </motion.div>

          {/* Controls and move details */}
          <div className="space-y-4 lg:col-span-4">
            <motion.section
              {...riseIn}
              aria-label="Playback"
              className="rounded-lg border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  Playback
                </h2>
                <p
                  className="text-sm tabular-nums text-foreground"
                  aria-live="polite"
                >
                  Move {currentMoveIndex + 1} / {totalMoves}
                </p>
              </div>

              <Slider
                aria-label="Move"
                value={[currentMoveIndex + 1]}
                onValueChange={([value]: number[]) => stepTo(value - 1)}
                max={totalMoves}
                min={0}
                step={1}
                className="mt-5 h-6 w-full"
              />

              <div className="mt-5 flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Back to start"
                  title="Back to start"
                  onClick={() => stepTo(-1)}
                  disabled={currentMoveIndex <= -1}
                >
                  <RotateCcw />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Previous move"
                  title="Previous move"
                  onClick={() => stepTo(Math.max(-1, currentMoveIndex - 1))}
                  disabled={currentMoveIndex <= -1}
                >
                  <SkipBack />
                </Button>
                <Button
                  size="icon"
                  className="size-12"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  title={isPlaying ? "Pause" : "Play"}
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={atEnd}
                >
                  {isPlaying ? (
                    <Pause className="!size-5" fill="currentColor" />
                  ) : (
                    <Play className="!size-5" fill="currentColor" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Next move"
                  title="Next move"
                  onClick={() =>
                    stepTo(Math.min(totalMoves - 1, currentMoveIndex + 1))
                  }
                  disabled={atEnd}
                >
                  <SkipForward />
                </Button>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <div className="flex items-baseline justify-between gap-3 text-sm text-foreground">
                  <span>Speed</span>
                  <span className="tabular-nums">
                    {(playbackSpeed / 1000).toFixed(1)} s per move
                  </span>
                </div>
                <Slider
                  aria-label="Playback speed"
                  value={[2000 - playbackSpeed]}
                  onValueChange={([value]: number[]) =>
                    setPlaybackSpeed(2000 - value)
                  }
                  max={1800}
                  min={200}
                  step={200}
                  className="mt-3 h-6 w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-foreground/70">
                  <span>Slower</span>
                  <span>Faster</span>
                </div>
              </div>
            </motion.section>

            <motion.section
              {...riseIn}
              aria-label="Current move"
              className="rounded-lg border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  {currentMove
                    ? `Move ${currentMoveIndex + 1}`
                    : "Starting position"}
                </h2>
                {currentMove ? (
                  <Badge
                    variant={
                      currentMove.moveType === "challenge"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {currentMove.moveType === "challenge" ? "Battle" : "Move"}
                  </Badge>
                ) : null}
              </div>

              {currentMove ? (
                <div className="mt-3 space-y-3 text-sm text-foreground">
                  {currentMove.piece && (
                    <p>
                      <span className="font-medium">{currentMove.piece}</span>{" "}
                      moves from row {(currentMove.fromRow ?? 0) + 1}, column{" "}
                      {(currentMove.fromCol ?? 0) + 1} to row{" "}
                      {currentMove.toRow + 1}, column {currentMove.toCol + 1}.
                    </p>
                  )}

                  {currentMove.challengeResult && (
                    <div className="rounded-md border border-border bg-background/60 p-3">
                      <div className="flex items-center justify-between gap-3 text-center">
                        <div
                          className={cn(
                            "flex-1",
                            currentMove.challengeResult.winner === "attacker"
                              ? "text-emerald-400"
                              : "text-foreground/70",
                          )}
                        >
                          <div className="font-medium">
                            {currentMove.challengeResult.attacker}
                          </div>
                          <div className="text-xs">Attacker</div>
                        </div>
                        <span className="text-xs text-foreground/70">vs</span>
                        <div
                          className={cn(
                            "flex-1",
                            currentMove.challengeResult.winner === "defender"
                              ? "text-emerald-400"
                              : "text-foreground/70",
                          )}
                        >
                          <div className="font-medium">
                            {currentMove.challengeResult.defender}
                          </div>
                          <div className="text-xs">Defender</div>
                        </div>
                      </div>
                      <p className="mt-2 border-t border-border pt-2 text-center">
                        {outcome}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-foreground/80">
                  Press play or use the next button to step through the game.
                </p>
              )}
            </motion.section>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
