"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  EyeOff,
  ArrowLeft,
  Users,
  MessageSquare,
  Clock,
  Crown,
  Swords,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

  const moves = useQuery(api.games.getGameMoves, { gameId });

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
        toast.success("Joined as spectator!");
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

  // Extract moves from paginated response - memoized to avoid dependency issues
  const movesArray = useMemo(() => {
    return Array.isArray(moves) ? moves : moves?.page || [];
  }, [moves]);

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

  // Detect new moves and play SFX
  useEffect(() => {
    if (!movesArray || !game || game.status !== "playing") return;

    const currentMoveCount = movesArray.length;
    const previousMoveCount = previousMoveCountRef.current;

    // If this is not the initial load and we have new moves
    if (previousMoveCount > 0 && currentMoveCount > previousMoveCount) {
      // Get the newest move
      const newMoves = movesArray.slice(previousMoveCount);
      const latestMove = newMoves[newMoves.length - 1];

      if (latestMove && latestMove.moveType !== "setup") {
        if (latestMove.moveType === "challenge") {
          // Battle occurred - play kill SFX
          playSFX("kill");
        } else if (latestMove.moveType === "move") {
          // Regular move - play piece-move SFX
          playSFX("piece-move");
        }
      }
    }

    // Update the ref with current move count
    previousMoveCountRef.current = currentMoveCount;
  }, [movesArray, game, playSFX]);

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
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-white/90 mb-2">
              Game Not Found
            </h3>
            <p className="text-white/60 mb-4">
              This game no longer exists or is not available for spectating.
            </p>
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen text-white relative font-sans selection:bg-purple-500/30"
    >
      {/* Command Center Background */}
      <div className="fixed inset-0 pointer-events-none select-none -z-10 bg-black">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-purple-900/10 via-transparent to-transparent opacity-50" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
        {/* Navigation & Actions Bar */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handleLeaveSpectating}
            variant="outline"
            size="sm"
            className="bg-zinc-900/60 backdrop-blur-sm border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-xs uppercase tracking-wider h-8 gap-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return directly to Lobby
          </Button>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-mono text-[10px] uppercase tracking-wider h-7 px-3"
            >
              <Users className="h-3 w-3 mr-2" />
              {spectators?.length || 0} Connected
            </Badge>

            <Button
              onClick={() => setShowChat(!showChat)}
              variant="outline"
              size="sm"
              className={cn(
                "border-white/10 font-mono text-xs uppercase tracking-wider h-8 gap-2 transition-all",
                showChat
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800",
              )}
            >
              {showChat ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5" />
              )}
              {showChat ? "Hide Comms" : "Open Comms"}
            </Button>
          </div>
        </div>

        {/* Main Header Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6"
        >
          <div className="flex items-center gap-5">
            {/* Live Indicator Icon */}
            <div className="relative">
              <div className="w-16 h-16 bg-zinc-900/80 border border-white/10 rounded-sm flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-purple-500/50" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-purple-500/50" />
                <Swords className="h-7 w-7 text-purple-400" />
              </div>
              {game.status === "playing" && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-display font-bold text-white tracking-tight uppercase">
                  {game.lobbyName || "Combat Simulation"}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-sm px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border-0",
                    game.status === "playing"
                      ? "bg-red-500/10 text-red-500 animate-pulse"
                      : "bg-zinc-500/10 text-zinc-400",
                  )}
                >
                  {game.status === "playing"
                    ? "● LIVE FEED"
                    : "● STATUS: " + game.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 uppercase tracking-wide">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  ID: {gameId}
                </span>
                <span className="text-zinc-700">|</span>
                <span
                  className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
                  onClick={() => {
                    void navigator.clipboard.writeText(gameId);
                    toast.success("ID Copied");
                  }}
                >
                  <Copy className="h-3 w-3" />
                  Copy Link
                </span>
              </div>
            </div>
          </div>

          {/* Players Matchup Title (Optional or integrated) */}
          <div className="hidden md:flex items-center gap-3 text-2xl font-display text-white/20 uppercase tracking-widest select-none">
            <span>{game.player1Username}</span>
            <span className="text-purple-500/40 font-mono text-lg">VS</span>
            <span>{game.player2Username}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Game Board */}
          <div className="xl:col-span-3 order-1">
            <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 rounded-sm overflow-hidden flex flex-col shadow-2xl relative min-h-[600px]">
              {/* Tech Corners */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/10" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/10" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/10" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/10" />

              <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  {/* Players HUD */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto text-sm">
                    {/* Player 1 Card */}
                    <div
                      className={cn(
                        "relative flex items-center gap-3 p-2 pr-4 rounded-sm border transition-all w-full sm:w-auto min-w-[200px]",
                        game.currentTurn === "player1" &&
                          game.status === "playing"
                          ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20"
                          : "bg-black/40 border-white/5",
                      )}
                    >
                      <UserAvatar
                        username={
                          player1Profile?.username || game.player1Username
                        }
                        avatarUrl={player1Profile?.avatarUrl}
                        rank={player1Profile?.rank}
                        size="md"
                        frame={player1Profile?.avatarFrame}
                      />
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            "font-display font-medium uppercase tracking-wider",
                            game.winner === "player1" && "text-yellow-400",
                          )}
                        >
                          {game.player1Username}
                          {game.winner === "player1" && (
                            <Crown className="inline h-3 w-3 ml-1" />
                          )}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-xs",
                            game.currentTurn === "player1"
                              ? "text-blue-400"
                              : "text-zinc-500",
                          )}
                        >
                          <Clock className="inline h-3 w-3 mr-1" />
                          {getPlayerTime(true)}
                        </span>
                      </div>
                      {game.currentTurn === "player1" && (
                        <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>

                    <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10">
                      <Swords className="h-4 w-4 text-zinc-500" />
                    </div>

                    {/* Player 2 Card */}
                    <div
                      className={cn(
                        "relative flex items-center gap-3 p-2 pr-4 rounded-sm border transition-all w-full sm:w-auto min-w-[200px]",
                        game.currentTurn === "player2" &&
                          game.status === "playing"
                          ? "bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20"
                          : "bg-black/40 border-white/5",
                      )}
                    >
                      <UserAvatar
                        username={
                          player2Profile?.username || game.player2Username
                        }
                        avatarUrl={player2Profile?.avatarUrl}
                        rank={player2Profile?.rank}
                        size="md"
                        frame={player2Profile?.avatarFrame}
                      />
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            "font-display font-medium uppercase tracking-wider",
                            game.winner === "player2" && "text-yellow-400",
                          )}
                        >
                          {game.player2Username}
                          {game.winner === "player2" && (
                            <Crown className="inline h-3 w-3 ml-1" />
                          )}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-xs",
                            game.currentTurn === "player2"
                              ? "text-red-400"
                              : "text-zinc-500",
                          )}
                        >
                          <Clock className="inline h-3 w-3 mr-1" />
                          {getPlayerTime(false)}
                        </span>
                      </div>
                      {game.currentTurn === "player2" && (
                        <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Game Status Badge */}
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-sm border border-white/10 bg-black/40 font-mono text-xs text-zinc-400 uppercase tracking-wider">
                      Turn{" "}
                      <span className="text-white">
                        {Math.floor((movesArray.length || 0) / 2 + 1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-0 flex-1 flex flex-col justify-center bg-black/20 relative">
                {/* Grid Background Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                {game.status === "setup" ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center animate-pulse">
                      <Users className="h-8 w-8 opacity-50" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-white font-display text-lg uppercase tracking-widest">
                        Deploying Units
                      </h3>
                      <p className="max-w-xs mx-auto font-mono text-xs">
                        Commanders are currently positioning forces. Tactical
                        feed will resume shortly.
                      </p>
                    </div>
                    <div className="flex gap-4 font-mono text-xs uppercase tracking-wider">
                      <span
                        className={cn(
                          game.player1Setup
                            ? "text-green-500"
                            : "text-zinc-600",
                        )}
                      >
                        P1: {game.player1Setup ? "READY" : "PREPARING"}
                      </span>
                      <span className="text-zinc-700">|</span>
                      <span
                        className={cn(
                          game.player2Setup
                            ? "text-green-500"
                            : "text-zinc-600",
                        )}
                      >
                        P2: {game.player2Setup ? "READY" : "PREPARING"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-3xl mx-auto p-4 sm:p-8">
                    {/* Board Container */}
                    <div className="relative aspect-[9/8]">
                      {/* Board Frame */}
                      <div className="absolute -inset-4 border border-white/5 rounded-sm pointer-events-none" />
                      <div className="absolute -inset-1 border border-white/10 rounded-sm pointer-events-none" />

                      <div className="grid grid-cols-9 gap-0 w-full h-full bg-zinc-900/80 p-1 sm:p-2 rounded-sm border border-white/10 shadow-2xl relative z-10">
                        {game.board.map((row, rowIndex) =>
                          row.map((cell, colIndex) => {
                            // Check if this is part of the last move (for highlighting)
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
                                  "aspect-square relative flex items-center justify-center rounded-[2px] overflow-hidden transition-all duration-300",
                                  (rowIndex + colIndex) % 2 === 0
                                    ? "bg-white/[0.03]"
                                    : "bg-transparent",
                                  isLastMove &&
                                    "ring-1 ring-yellow-500/50 bg-yellow-500/10 z-10",
                                )}
                              >
                                {/* Coordinate labels for edges */}
                                {colIndex === 0 && (
                                  <span className="absolute left-0.5 top-0.5 text-[6px] sm:text-[8px] font-mono text-zinc-700 select-none">
                                    {8 - rowIndex}
                                  </span>
                                )}
                                {rowIndex === 8 && (
                                  <span className="absolute right-0.5 bottom-0 text-[6px] sm:text-[8px] font-mono text-zinc-700 select-none">
                                    {String.fromCharCode(65 + colIndex)}
                                  </span>
                                )}

                                {cell && (
                                  <div className="w-full h-full p-0.5 sm:p-1">
                                    <motion.div
                                      layoutId={`piece-${cell.piece}-${rowIndex}-${colIndex}`}
                                      className={cn(
                                        "w-full h-full flex items-center justify-center",
                                        cell.player === "player1"
                                          ? "text-blue-400"
                                          : "text-red-400",
                                      )}
                                    >
                                      {getPieceDisplay(cell.piece, {
                                        size: "medium",
                                        showLabel: true,
                                        isOpponent: false,
                                      })}
                                    </motion.div>
                                  </div>
                                )}
                              </div>
                            );
                          }),
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 order-2 xl:order-2 flex flex-col h-full">
            {/* Terminal Chat */}
            <div className="flex-1 flex flex-col bg-zinc-950 border border-white/10 rounded-sm overflow-hidden h-[400px]">
              <div className="px-3 py-2 bg-zinc-900 border-b border-white/10 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  // Secure Comms Link
                </span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-zinc-800" />
                  <div className="w-2 h-2 rounded-full bg-zinc-800" />
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>

              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800 bg-black/50"
              >
                {allMessages && allMessages.length > 0 ? (
                  allMessages.map((message) => (
                    <div
                      key={`${message._id}-${message.timestamp}`}
                      className={cn(
                        "flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-300",
                        message.isOptimistic && "opacity-50",
                      )}
                    >
                      <div className="flex items-center gap-2 opacity-60 text-[10px]">
                        <span
                          className={cn(
                            message.userId === game.player1Id
                              ? "text-blue-500"
                              : message.userId === game.player2Id
                                ? "text-red-500"
                                : "text-purple-500",
                          )}
                        >
                          [
                          {message.userId === game.player1Id
                            ? "BLU"
                            : message.userId === game.player2Id
                              ? "RED"
                              : "SPC"}
                          ]{message.username}
                        </span>
                        <span className="text-zinc-600">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-zinc-300 pl-2 border-l border-white/10 ml-0.5">
                        &gt; {message.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-2">
                    <MessageSquare className="w-8 h-8 opacity-20" />
                    <p>CHANNEL_EMPTY</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {(isSpectating || isPlayer) && game.status !== "finished" && (
                <div className="p-2 bg-zinc-900 border-t border-white/10">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex gap-2 relative"
                  >
                    <span className="absolute left-3 top-2.5 text-green-500 font-mono text-xs animate-pulse">
                      &gt;
                    </span>
                    <Input
                      ref={inputRef}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="TRANSMIT..."
                      maxLength={500}
                      className="flex-1 bg-black border-zinc-800 text-green-500 placeholder:text-zinc-700 font-mono text-xs h-9 pl-6 focus-visible:ring-0 focus-visible:border-green-500/50"
                    />
                  </form>
                </div>
              )}
            </div>

            {/* Spectator List Mini */}
            <div className="bg-zinc-900/60 border border-white/5 rounded-sm p-3">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                <span className="font-mono text-[10px] uppercase text-zinc-500">
                  Observers
                </span>
                <Badge
                  variant="secondary"
                  className="bg-white/5 text-zinc-400 text-[10px] h-5"
                >
                  {spectators?.length || 0}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {spectators?.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded border border-white/5"
                    title={s.username}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50" />
                    <span className="text-xs font-mono text-zinc-400 truncate max-w-[80px]">
                      {s.username}
                    </span>
                  </div>
                ))}
                {(!spectators || spectators.length === 0) && (
                  <span className="text-xs text-zinc-600 font-mono italic">
                    No observers active
                  </span>
                )}
              </div>
            </div>

            {/* Eliminated Pieces Feed */}
            {(eliminatedPieces.player1.length > 0 ||
              eliminatedPieces.player2.length > 0) && (
              <div className="bg-zinc-900/60 border border-white/5 rounded-sm p-3 flex-1 overflow-hidden flex flex-col max-h-[300px]">
                <span className="font-mono text-[10px] uppercase text-zinc-500 mb-3 pb-2 border-b border-white/5 block">
                  Casualty Feed
                </span>
                <div className="overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                  {eliminatedPieces.player1.length === 0 &&
                    eliminatedPieces.player2.length === 0 && (
                      <div className="text-center py-4 text-zinc-700">
                        No casualties reported
                      </div>
                    )}
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
                      <div
                        key={i}
                        className="flex items-center justify-between px-2 py-1.5 bg-black/20 rounded border border-white/5"
                      >
                        <span
                          className={cn(
                            "uppercase",
                            e.team === "p1" ? "text-blue-400" : "text-red-400",
                          )}
                        >
                          {e.piece}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-600">
                            Turn {e.moveNumber}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
