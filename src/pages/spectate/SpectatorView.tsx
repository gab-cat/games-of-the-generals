"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { FixedDigits } from "@/components/ui/fixed-digits";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import {
  useConvexMutationWithQuery,
  useConvexQuery,
} from "@/lib/convex-query-hooks";
import { useQuery } from "convex-helpers/react/cache";
import { getPieceDisplay } from "@/lib/piece-display";
import { useSound } from "@/lib/SoundProvider";

import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
  avatarFrame?: string;
  usernameColor?: string;
  avatarUrl?: string;
}

interface OptimisticMessage {
  _id: string;
  gameId: Id<"games">;
  userId: Id<"users">;
  username: string;
  message: string;
  timestamp: number;
  isOptimistic?: boolean;
  error?: boolean;
}

interface SpectatorViewProps {
  gameId: Id<"games">;
  profile: Profile;
  onBack: () => void;
}

export function SpectatorView({ gameId, profile, onBack }: SpectatorViewProps) {
  const [chatMessage, setChatMessage] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [optimisticMessages, setOptimisticMessages] = useState<
    OptimisticMessage[]
  >([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInputFocusedRef = useRef(false);

  // Refs for tracking previous game state to detect changes for SFX
  const previousMoveCountRef = useRef<number>(0);
  const previousEliminatedCountRef = useRef<number>(0);
  const previousGameStatusRef = useRef<string>("");

  // Sound effects hook
  const { playSFX } = useSound();

  const game = useQuery(api.games.getGame, { gameId });
  const isLoadingGame = game === undefined;

  const { data: spectators } = useConvexQuery(api.spectate.getGameSpectators, {
    gameId,
  });

  const { data: chatMessages } = useConvexQuery(
    api.spectate.getSpectatorChatMessages,
    { gameId },
  );

  const player1Profile = useQuery(
    api.profiles.getProfileByUsername,
    game ? { username: game.player1Username } : "skip",
  );

  const player2Profile = useQuery(
    api.profiles.getProfileByUsername,
    game ? { username: game.player2Username } : "skip",
  );

  const { mutate: joinAsSpectator } = useConvexMutationWithQuery(
    api.spectate.joinAsSpectator,
    {
      onSuccess: () => {
        toast.success("You're watching this game.");
      },
      onError: () => {
        toast.error("Failed to join as spectator");
      },
    },
  );

  const { mutate: leaveAsSpectator } = useConvexMutationWithQuery(
    api.spectate.leaveAsSpectator,
    {
      onSuccess: () => {
        toast.success("Left spectating");
      },
      onError: () => {
        toast.error("Failed to leave spectating");
      },
    },
  );

  const { mutate: sendChatMessage } = useConvexMutationWithQuery(
    api.spectate.sendSpectatorChatMessage,
    {
      onSuccess: (_, variables) => {
        setChatMessage("");
        // Remove the optimistic message when confirmed
        setOptimisticMessages((prev) =>
          prev.filter(
            (msg) =>
              !(
                msg.isOptimistic &&
                msg.message === variables.message &&
                msg.timestamp
              ),
          ),
        );
      },
      onError: (_, variables) => {
        toast.error("Failed to send message");
        // Mark the optimistic message as error or remove it
        setOptimisticMessages((prev) =>
          prev.filter(
            (msg) => !(msg.isOptimistic && msg.message === variables.message),
          ),
        );
      },
    },
  );

  // Update current time every second for timer display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Function to format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate remaining time for each player
  const getPlayerTime = (isPlayer1: boolean) => {
    if (!game) return "15:00"; // Default time display

    if (game.status === "finished") {
      // Show final time used for finished games
      const TOTAL_TIME = 15 * 60; // 15 minutes in seconds
      const timeUsed = isPlayer1
        ? game.player1TimeUsed || 0
        : game.player2TimeUsed || 0;
      const timeUsedSeconds = Math.floor(timeUsed / 1000); // Convert milliseconds to seconds
      const remaining = Math.max(0, TOTAL_TIME - timeUsedSeconds);
      return formatTime(remaining);
    }

    if (game.status !== "playing") return "15:00"; // Default time display for setup

    const TOTAL_TIME = 15 * 60; // 15 minutes in seconds
    const timeUsed = isPlayer1
      ? game.player1TimeUsed || 0
      : game.player2TimeUsed || 0;
    const timeUsedSeconds = Math.floor(timeUsed / 1000); // Convert milliseconds to seconds

    // If it's current player's turn, add elapsed time since turn started
    let currentTurnTime = 0;
    const isCurrentTurn =
      (isPlayer1 && game.currentTurn === "player1") ||
      (!isPlayer1 && game.currentTurn === "player2");

    if (isCurrentTurn && (game.lastMoveTime || game.gameTimeStarted)) {
      const turnStartTime =
        game.lastMoveTime || game.gameTimeStarted || currentTime;
      currentTurnTime = Math.floor((currentTime - turnStartTime) / 1000);
    }

    const totalUsed = timeUsedSeconds + currentTurnTime;
    const remaining = Math.max(0, TOTAL_TIME - totalUsed);

    return formatTime(remaining);
  };

  // Move count and battles come from the game row, so spectators don't
  // subscribe to the move list (which also named hidden pieces).
  const moveCount = game?.moveCount ?? 0;
  const eliminatedCount = game?.eliminatedPieces?.length ?? 0;

  // Get eliminated pieces for both players from game data
  const eliminatedPieces = useMemo(() => {
    if (!game?.eliminatedPieces) {
      return { player1: [], player2: [] };
    }

    const player1Eliminated = game.eliminatedPieces
      .filter((ep) => ep.player === "player1")
      .map((ep) => ({
        piece: ep.piece,
        moveNumber: ep.turn,
        battleOutcome: ep.battleOutcome,
      }))
      .reverse(); // Most recent first

    const player2Eliminated = game.eliminatedPieces
      .filter((ep) => ep.player === "player2")
      .map((ep) => ({
        piece: ep.piece,
        moveNumber: ep.turn,
        battleOutcome: ep.battleOutcome,
      }))
      .reverse(); // Most recent first

    return {
      player1: player1Eliminated,
      player2: player2Eliminated,
    };
  }, [game?.eliminatedPieces]);

  // Helper function to check if user is near bottom of chat container
  const isNearBottom = (threshold = 50): boolean => {
    if (!chatContainerRef.current) return true; // Default to true if container not found

    const container = chatContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Check if user is within threshold pixels of the bottom
    return scrollHeight - scrollTop - clientHeight <= threshold;
  };

  // Auto-scroll chat to bottom (only when input is not focused and user was near bottom)
  useEffect(() => {
    // Don't auto-scroll if input is focused (user is typing)
    if (isInputFocusedRef.current) {
      return;
    }

    // Only auto-scroll if user was already near the bottom
    if (!isNearBottom()) {
      return;
    }

    // Use scrollTop manipulation for more control
    if (chatContainerRef.current && chatEndRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [chatMessages, optimisticMessages]);

  // Combine actual messages with optimistic messages
  const allMessages = [
    ...(chatMessages || []).map((msg) => ({ ...msg, isOptimistic: false })),
    ...optimisticMessages.filter(
      (optMsg) =>
        !chatMessages?.some(
          (realMsg) =>
            realMsg.message === optMsg.message &&
            Math.abs(realMsg.timestamp - optMsg.timestamp) < 5000, // 5 second window
        ),
    ),
  ].sort((a, b) => a.timestamp - b.timestamp);

  // Cleanup old optimistic messages that weren't confirmed
  useEffect(() => {
    const cleanup = () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      setOptimisticMessages((prev) =>
        prev.filter((msg) => msg.timestamp > fiveMinutesAgo),
      );
    };

    const interval = setInterval(cleanup, 60000); // Cleanup every minute
    return () => clearInterval(interval);
  }, []);

  // Join as spectator on mount
  useEffect(() => {
    if (game && !game.spectators?.includes(profile.userId)) {
      joinAsSpectator({ gameId });
    }
  }, [game, gameId, profile.userId, joinAsSpectator]);

  // Detect new moves and play SFX. Every battle eliminates at least one piece.
  useEffect(() => {
    if (!game || game.status !== "playing") return;

    const previousMoveCount = previousMoveCountRef.current;
    const previousEliminated = previousEliminatedCountRef.current;

    // If this is not the initial load and we have new moves
    if (previousMoveCount > 0 && moveCount > previousMoveCount) {
      playSFX(eliminatedCount > previousEliminated ? "kill" : "piece-move");
    }

    previousMoveCountRef.current = moveCount;
    previousEliminatedCountRef.current = eliminatedCount;
  }, [moveCount, eliminatedCount, game, playSFX]);

  // Detect game end and play victory SFX
  useEffect(() => {
    if (!game) return;

    const currentStatus = game.status;
    const previousStatus = previousGameStatusRef.current;

    // If game just finished (changed from playing/setup to finished)
    if (
      previousStatus &&
      previousStatus !== "finished" &&
      currentStatus === "finished"
    ) {
      playSFX("player-victory");
    }

    // Update the ref with current status
    previousGameStatusRef.current = currentStatus;
  }, [game, playSFX]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const trimmedMessage = chatMessage.trim();
    const timestamp = Date.now();

    // Add optimistic message
    const optimisticMessage: OptimisticMessage = {
      _id: `optimistic-${timestamp}-${Math.random()}`,
      gameId,
      userId: profile.userId,
      username: profile.username,
      message: trimmedMessage,
      timestamp,
      isOptimistic: true,
    };

    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    setChatMessage("");

    sendChatMessage({ gameId, message: trimmedMessage });
  };

  const handleLeaveSpectating = () => {
    leaveAsSpectator({ gameId });
    onBack();
  };

  const isSpectating = game?.spectators?.includes(profile.userId);
  const isPlayer =
    game?.player1Id === profile.userId || game?.player2Id === profile.userId;

  if (isLoadingGame) {
    return (
      <div role="status" aria-label="Loading game">
        <div className="mb-6 space-y-2 sm:mb-8">
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-8">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
            <Skeleton className="aspect-[9/8] w-full rounded-lg" />
          </div>
          <div className="space-y-4 lg:col-span-4">
            <Skeleton className="h-[360px] w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <EmptyState
        title="This game is not available"
        body="It has ended and been removed, or it cannot be watched."
        action={
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft />
            Back to lobbies
          </Button>
        }
      />
    );
  }

  const isLive = game.status === "playing";
  const statusLabel = isLive
    ? "Live"
    : game.status === "setup"
      ? "Setting up"
      : game.status === "finished"
        ? "Finished"
        : game.status;
  const spectatorCount = spectators?.length || 0;

  const playerCard = (side: "player1" | "player2") => {
    const isP1 = side === "player1";
    const name = isP1 ? game.player1Username : game.player2Username;
    const profileData = isP1 ? player1Profile : player2Profile;
    const isTurn = game.currentTurn === side && isLive;
    const isWinner = game.winner === side;

    return (
      <div
        className={cn(
          "flex min-w-0 items-center gap-3 rounded-lg border p-3 transition-colors",
          isP1 ? "bg-white/[0.04]" : "bg-gold-500/[0.06]",
          isTurn
            ? isP1
              ? "border-foreground/60"
              : "border-gold-500/60"
            : isP1
              ? "border-border"
              : "border-gold-500/20",
        )}
      >
        <UserAvatar
          username={profileData?.username || name}
          avatarUrl={profileData?.avatarUrl}
          rank={profileData?.rank}
          size="md"
          frame={profileData?.avatarFrame}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {name}
            </span>
            {isWinner ? <Badge variant="success">Winner</Badge> : null}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-sm text-foreground">
            <FixedDigits>{getPlayerTime(isP1)}</FixedDigits>
            {isTurn ? (
              <span className="text-xs text-foreground/80">to move</span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title={
          game.lobbyName || `${game.player1Username} vs ${game.player2Username}`
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              {isLive ? (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                </span>
              ) : null}
              {statusLabel}
            </span>
            <span>
              {spectatorCount} {spectatorCount === 1 ? "viewer" : "viewers"}
            </span>
            {game.status !== "setup" ? (
              <span className="tabular-nums">
                Turn {Math.floor(moveCount / 2 + 1)}
              </span>
            ) : null}
          </span>
        }
        actions={
          <>
            <Button variant="secondary" onClick={handleLeaveSpectating}>
              <ArrowLeft />
              Leave
            </Button>
            <Button
              variant="secondary"
              aria-label="Copy game ID"
              onClick={() => {
                void navigator.clipboard.writeText(gameId);
                toast.success("Game ID copied");
              }}
            >
              <Copy />
              <span className="hidden sm:inline">Copy game ID</span>
            </Button>
            <Button
              variant="secondary"
              aria-pressed={showChat}
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare />
              {showChat ? "Hide chat" : "Show chat"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Board */}
        <div
          className={cn(
            "space-y-3",
            showChat ? "lg:col-span-8" : "lg:col-span-12",
          )}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {playerCard("player1")}
            {playerCard("player2")}
          </div>

          {game.status === "setup" ? (
            <EmptyState
              title="Players are placing their pieces"
              body="The board appears when both sides are ready."
              action={
                <div className="space-y-1 text-sm text-foreground">
                  <p>
                    {game.player1Username}:{" "}
                    {game.player1Setup ? "ready" : "placing pieces"}
                  </p>
                  <p>
                    {game.player2Username}:{" "}
                    {game.player2Setup ? "ready" : "placing pieces"}
                  </p>
                </div>
              }
            />
          ) : (
            // Full bleed on phones so squares stay as large as possible.
            <div className="-mx-4 border-y border-border bg-card p-1 sm:mx-0 sm:rounded-lg sm:border sm:p-4">
              <div className="mx-auto grid w-full max-w-3xl grid-cols-9 gap-0.5 sm:gap-1.5">
                {game.board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isLastMoveFrom =
                      game?.lastMoveFrom &&
                      game.lastMoveFrom.row === rowIndex &&
                      game.lastMoveFrom.col === colIndex;
                    const isLastMoveTo =
                      game?.lastMoveTo &&
                      game.lastMoveTo.row === rowIndex &&
                      game.lastMoveTo.col === colIndex;
                    const isLastMove = isLastMoveFrom || isLastMoveTo;

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={cn(
                          "relative flex aspect-square items-center justify-center rounded border p-0.5 transition-colors",
                          !cell && "border-border bg-white/[0.025]",
                          cell?.player === "player1" &&
                            "border-border-strong bg-white/[0.08] text-foreground",
                          cell?.player === "player2" &&
                            "border-gold-500/25 bg-gold-500/[0.08] text-gold-300",
                          isLastMove && "ring-2 ring-foreground/80",
                        )}
                      >
                        {cell && (
                          <span
                            className="flex items-center justify-center"
                            aria-label={`${cell.player === "player1" ? game.player1Username : game.player2Username}: ${cell.piece}`}
                          >
                            <span className="block sm:hidden">
                              {getPieceDisplay(cell.piece, {
                                size: "small",
                                showLabel: false,
                                isOpponent: false,
                              })}
                            </span>
                            <span className="hidden sm:block">
                              {getPieceDisplay(cell.piece, {
                                size: "medium",
                                showLabel: true,
                                isOpponent: false,
                              })}
                            </span>
                          </span>
                        )}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={cn("space-y-4 lg:col-span-4", !showChat && "hidden")}>
          <section
            aria-label="Chat"
            className="flex h-[360px] flex-col overflow-hidden rounded-lg border border-border bg-card lg:h-[420px]"
          >
            <h2 className="border-b border-border px-4 py-3 text-base font-semibold text-foreground">
              Chat
            </h2>

            <div
              ref={chatContainerRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
            >
              {allMessages && allMessages.length > 0 ? (
                allMessages.map((message) => (
                  <div
                    key={`${message._id}-${message.timestamp}`}
                    className={cn(
                      "animate-in fade-in slide-in-from-bottom-1 duration-200",
                      message.isOptimistic && "opacity-60",
                    )}
                  >
                    <div className="flex items-baseline gap-2 text-sm">
                      <span
                        className={cn(
                          "font-semibold",
                          message.userId === game.player2Id
                            ? "text-gold-300"
                            : "text-foreground",
                        )}
                      >
                        {message.username}
                      </span>
                      {message.userId !== game.player1Id &&
                      message.userId !== game.player2Id ? (
                        <span className="text-xs text-foreground/70">
                          watching
                        </span>
                      ) : null}
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 break-words text-sm text-foreground">
                      {message.message}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-foreground/80">
                  No messages yet.
                </p>
              )}
              <div ref={chatEndRef} />
            </div>

            {(isSpectating || isPlayer) && game.status !== "finished" ? (
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 border-t border-border p-3"
              >
                <Input
                  ref={inputRef}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Write a message"
                  aria-label="Chat message"
                  maxLength={500}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Send message"
                  disabled={!chatMessage.trim()}
                >
                  <Send />
                </Button>
              </form>
            ) : (
              <p className="border-t border-border px-4 py-3 text-sm text-foreground/80">
                {game.status === "finished"
                  ? "Chat is closed because the game is over."
                  : "Joining the game to chat."}
              </p>
            )}
          </section>

          <section
            aria-label="Viewers"
            className="rounded-lg border border-border bg-card p-4"
          >
            <h2 className="text-base font-semibold text-foreground">
              Watching{" "}
              <span className="tabular-nums">({spectatorCount})</span>
            </h2>
            <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
              {spectators?.map((s) => (
                <span
                  key={s._id}
                  className="max-w-[140px] truncate rounded border border-border bg-white/[0.04] px-2 py-1 text-sm text-foreground"
                  title={s.username}
                >
                  {s.username}
                </span>
              ))}
              {spectatorCount === 0 && (
                <span className="text-sm text-foreground/80">
                  Nobody is watching yet.
                </span>
              )}
            </div>
          </section>

          {(eliminatedPieces.player1.length > 0 ||
            eliminatedPieces.player2.length > 0) && (
            <section
              aria-label="Captured pieces"
              className="flex max-h-[300px] flex-col rounded-lg border border-border bg-card p-4"
            >
              <h2 className="text-base font-semibold text-foreground">
                Captured pieces
              </h2>
              <ul className="mt-3 space-y-1 overflow-y-auto pr-1 text-sm">
                {[
                  ...eliminatedPieces.player1.map((p) => ({
                    ...p,
                    team: "p1",
                  })),
                  ...eliminatedPieces.player2.map((p) => ({
                    ...p,
                    team: "p2",
                  })),
                ]
                  .sort((a, b) => b.moveNumber - a.moveNumber) // Most recent first
                  .map((e, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-2.5 py-1.5"
                    >
                      <span
                        className={cn(
                          e.team === "p1" ? "text-foreground" : "text-gold-300",
                        )}
                      >
                        {e.piece}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        Turn {e.moveNumber}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
