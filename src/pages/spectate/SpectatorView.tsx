"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Send, 
  Users, 
  MessageSquare,
  Clock,
  Info,
  Crown,
  Swords,
  Sword,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import { useConvexMutationWithQuery, useConvexQuery } from "@/lib/convex-query-hooks";
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
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
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

  const { data: spectators } = useConvexQuery(
    api.spectate.getGameSpectators,
    { gameId }
  );

  const { data: chatMessages } = useConvexQuery(
    api.spectate.getSpectatorChatMessages,
    { gameId }
  );

  const moves = useQuery(api.games.getGameMoves, { gameId });

  const player1Profile = useQuery(
    api.profiles.getProfileByUsername,
    game ? { username: game.player1Username } : "skip"
  );

  const player2Profile = useQuery(
    api.profiles.getProfileByUsername,
    game ? { username: game.player2Username } : "skip"
  );

  const { mutate: joinAsSpectator } = useConvexMutationWithQuery(api.spectate.joinAsSpectator, {
    onSuccess: () => {
      toast.success("Joined as spectator!");
    },
    onError: () => {
      toast.error("Failed to join as spectator");
    }
  });

  const { mutate: leaveAsSpectator } = useConvexMutationWithQuery(api.spectate.leaveAsSpectator, {
    onSuccess: () => {
      toast.success("Left spectating");
    },
    onError: () => {
      toast.error("Failed to leave spectating");
    }
  });

  const { mutate: sendChatMessage } = useConvexMutationWithQuery(api.spectate.sendSpectatorChatMessage, {
    onSuccess: (_, variables) => {
      setChatMessage("");
      // Remove the optimistic message when confirmed
      setOptimisticMessages(prev => 
        prev.filter(msg => !(msg.isOptimistic && msg.message === variables.message && msg.timestamp))
      );
    },
    onError: (_, variables) => {
      toast.error("Failed to send message");
      // Mark the optimistic message as error or remove it
      setOptimisticMessages(prev => 
        prev.filter(msg => !(msg.isOptimistic && msg.message === variables.message))
      );
    }
  });

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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate remaining time for each player
  const getPlayerTime = (isPlayer1: boolean) => {
    if (!game) return "15:00"; // Default time display
    
    if (game.status === "finished") {
      // Show final time used for finished games
      const TOTAL_TIME = 15 * 60; // 15 minutes in seconds
      const timeUsed = isPlayer1 ? (game.player1TimeUsed || 0) : (game.player2TimeUsed || 0);
      const timeUsedSeconds = Math.floor(timeUsed / 1000); // Convert milliseconds to seconds
      const remaining = Math.max(0, TOTAL_TIME - timeUsedSeconds);
      return formatTime(remaining);
    }
    
    if (game.status !== "playing") return "15:00"; // Default time display for setup
    
    const TOTAL_TIME = 15 * 60; // 15 minutes in seconds
    const timeUsed = isPlayer1 ? (game.player1TimeUsed || 0) : (game.player2TimeUsed || 0);
    const timeUsedSeconds = Math.floor(timeUsed / 1000); // Convert milliseconds to seconds
    
    // If it's current player's turn, add elapsed time since turn started
    let currentTurnTime = 0;
    const isCurrentTurn = (isPlayer1 && game.currentTurn === "player1") || (!isPlayer1 && game.currentTurn === "player2");
    
    if (isCurrentTurn && (game.lastMoveTime || game.gameTimeStarted)) {
      const turnStartTime = game.lastMoveTime || game.gameTimeStarted || currentTime;
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

  // Process moves to extract eliminated pieces for both players
  const eliminatedPieces = useMemo(() => {
    if (!movesArray || !game) {
      return { player1: [], player2: [] };
    }
    
    const player1Eliminated: Array<{
      piece: string;
      moveNumber: number;
      battleOutcome: "attacker" | "defender" | "tie";
    }> = [];
    
    const player2Eliminated: Array<{
      piece: string;
      moveNumber: number;
      battleOutcome: "attacker" | "defender" | "tie";
    }> = [];
    
    let moveNumber = 0;
    
    for (const move of movesArray) {
      // Skip setup moves
      if (move.moveType === "setup") continue;
      
      // Count all game moves (both "move" and "challenge")
      moveNumber++;
      
      // Process challenge moves to extract eliminated pieces
      if (move.moveType === "challenge" && move.challengeResult) {
        const result = move.challengeResult;
        
        // Determine which player made this move
        const isPlayer1Move = move.playerId === game.player1Id;
        const attackerPlayerId = isPlayer1Move ? game.player1Id : game.player2Id;
        const defenderPlayerId = isPlayer1Move ? game.player2Id : game.player1Id;
        
        if (result.winner === "attacker") {
          // Defender was eliminated
          if (defenderPlayerId === game.player1Id) {
            player1Eliminated.push({
              piece: result.defender,
              moveNumber,
              battleOutcome: "attacker", // Attacker won, so defender (player1) lost
            });
          } else {
            player2Eliminated.push({
              piece: result.defender,
              moveNumber,
              battleOutcome: "attacker", // Attacker won, so defender (player2) lost
            });
          }
        } else if (result.winner === "defender") {
          // Attacker was eliminated
          if (attackerPlayerId === game.player1Id) {
            player1Eliminated.push({
              piece: result.attacker,
              moveNumber,
              battleOutcome: "defender", // Defender won, so attacker (player1) lost
            });
          } else {
            player2Eliminated.push({
              piece: result.attacker,
              moveNumber,
              battleOutcome: "defender", // Defender won, so attacker (player2) lost
            });
          }
        } else if (result.winner === "tie") {
          // Both pieces were eliminated
          if (attackerPlayerId === game.player1Id) {
            player1Eliminated.push({
              piece: result.attacker,
              moveNumber,
              battleOutcome: "tie",
            });
          } else {
            player2Eliminated.push({
              piece: result.attacker,
              moveNumber,
              battleOutcome: "tie",
            });
          }
          if (defenderPlayerId === game.player1Id) {
            player1Eliminated.push({
              piece: result.defender,
              moveNumber,
              battleOutcome: "tie",
            });
          } else {
            player2Eliminated.push({
              piece: result.defender,
              moveNumber,
              battleOutcome: "tie",
            });
          }
        }
      }
    }
    
    // Reverse to show most recent eliminated pieces at the top
    return {
      player1: player1Eliminated.reverse(),
      player2: player2Eliminated.reverse(),
    };
  }, [movesArray, game]);

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
    ...(chatMessages || []).map(msg => ({ ...msg, isOptimistic: false })),
    ...optimisticMessages.filter(optMsg => 
      !chatMessages?.some(realMsg => 
        realMsg.message === optMsg.message && 
        Math.abs(realMsg.timestamp - optMsg.timestamp) < 5000 // 5 second window
      )
    )
  ].sort((a, b) => a.timestamp - b.timestamp);

  // Cleanup old optimistic messages that weren't confirmed
  useEffect(() => {
    const cleanup = () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      setOptimisticMessages(prev => 
        prev.filter(msg => msg.timestamp > fiveMinutesAgo)
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
    if (previousStatus && previousStatus !== "finished" && currentStatus === "finished") {
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
      isOptimistic: true
    };
    
    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    setChatMessage("");
    
    sendChatMessage({ gameId, message: trimmedMessage });
  };

  const handleLeaveSpectating = () => {
    leaveAsSpectator({ gameId });
    onBack();
  };

  const isSpectating = game?.spectators?.includes(profile.userId);
  const isPlayer = game?.player1Id === profile.userId || game?.player2Id === profile.userId;

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
            <h3 className="text-xl font-bold text-white/90 mb-2">Game Not Found</h3>
            <p className="text-white/60 mb-4">This game no longer exists or is not available for spectating.</p>
            <Button onClick={onBack} variant="outline" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20">
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleLeaveSpectating}
                variant="outline"
                size="sm"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Lobby
              </Button>
              
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-12 h-12 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl flex items-center justify-center"
                >
                  <Eye className="h-6 w-6 text-purple-400" />
                </motion.div>
                
                <div>
                  <CardTitle className="text-xl font-bold text-white/90">Spectating Game</CardTitle>
                  <p className="text-sm text-white/60">{game.lobbyName || "Battle Arena"}</p>
                  <div className="flex items-center gap-2 mt-1">
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
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                <Users className="h-4 w-4 mr-1" />
                {spectators?.length || 0} Spectators
              </Badge>
              
              <Button
                onClick={() => setShowChat(!showChat)}
                variant="outline"
                size="sm"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
              >
                {showChat ? <EyeOff className="h-4 w-4 mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                {showChat ? "Hide Chat" : "Show Chat"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Spectator Header */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center gap-4 mb-6"
      >
        {/* Live Battle Observatory Icon Section */}
        <motion.div
          initial={{ scale: 0, rotateY: -180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
          className="w-12 h-12 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
        >
          {/* Animated live indicator */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl"
          />
          <Eye className="h-6 w-6 text-purple-400 relative z-10" />
        </motion.div>
        
        <div className="flex flex-col">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <h3 className="text-lg font-semibold text-white/90">Live Battle Observatory</h3>
            <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/30 animate-pulse">
              LIVE
            </Badge>
          </motion.div>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <div className="h-0.5 w-8 bg-gradient-to-r from-purple-500/60 to-blue-500/60 rounded-full"></div>
            <span className="text-xs text-white/50 font-mono">
              {game.player1Username} vs {game.player2Username}
            </span>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
        {/* Game Board */}
        <div className="xl:col-span-3 order-1">
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 w-full lg:w-auto">
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

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full lg:w-auto">
                  <Badge 
                    variant={game.status === "setup" ? "secondary" : game.status === "playing" ? "default" : "outline"}
                    className={
                      game.status === "setup" 
                        ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                        : game.status === "playing"
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                    }
                  >
                    {game.status === "setup" ? "Setup Phase" : 
                     game.status === "playing" ? "Playing" : "Finished"}
                  </Badge>

                  {game.status === "playing" && (
                    <div className="text-sm text-white/60">
                      Turn {Math.floor(((movesArray.length || 0) / 2) + 1)} • {game.currentTurn === "player1" ? game.player1Username : game.player2Username}'s turn
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {game.status === "setup" ? (
                <div className="flex items-center justify-center h-96 bg-gray-900/20 rounded-lg border border-white/10">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white/90 mb-2">Setting Up Pieces</h3>
                    <p className="text-white/60">Players are still setting up their pieces. Please wait...</p>
                    <div className="mt-4 flex items-center justify-center gap-4">
                      <Badge variant={game.player1Setup ? "default" : "secondary"} className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {game.player1Username}: {game.player1Setup ? "Ready" : "Setting up..."}
                      </Badge>
                      <Badge variant={game.player2Setup ? "default" : "secondary"} className="bg-red-500/20 text-red-300 border-red-500/30">
                        {game.player2Username}: {game.player2Setup ? "Ready" : "Setting up..."}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : game.status === "finished" ? (
                <div className="space-y-4">
                  {/* Game Result Display */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-lg border border-purple-500/20">
                    {/* Left side - Game Status */}
                    <div className="flex items-center gap-4">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 10 }}
                        className="w-12 h-12 bg-gradient-to-br from-yellow-400/20 via-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center"
                      >
                        <Crown className="h-6 w-6 text-yellow-400" />
                      </motion.div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-white/90">Game Finished!</h3>
                        <div className="flex items-center gap-3 mt-1">
                          {game.gameEndReason && (
                            <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                              {game.gameEndReason === "flag_captured" ? "Flag Captured" :
                               game.gameEndReason === "flag_reached_base" ? "Flag Reached Base" :
                               game.gameEndReason === "timeout" ? "Time Expired" :
                               game.gameEndReason === "surrender" ? "Surrender" :
                               game.gameEndReason === "elimination" ? "Elimination" :
                               "Game Complete"}
                            </Badge>
                          )}
                          
                          <div className="text-xs text-white/60">
                            {movesArray.length || 0} moves
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Players */}
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 ${game.winner === "player1" ? 'text-yellow-400' : 'text-white/60'}`}>
                        <UserAvatar
                          username={player1Profile?.username || game.player1Username}
                          avatarUrl={player1Profile?.avatarUrl}
                          rank={player1Profile?.rank}
                          size="sm"
                          className={game.winner === "player1" ? 'border-2 border-yellow-400' : ''}
                        />
                        <span className="font-semibold text-sm">{game.player1Username}</span>
                        {game.winner === "player1" && <Crown className="h-4 w-4 text-yellow-400" />}
                      </div>
                      
                      <span className="text-white/40 font-bold text-sm">VS</span>
                      
                      <div className={`flex items-center gap-2 ${game.winner === "player2" ? 'text-yellow-400' : 'text-white/60'}`}>
                        <UserAvatar
                          username={player2Profile?.username || game.player2Username}
                          avatarUrl={player2Profile?.avatarUrl}
                          rank={player2Profile?.rank}
                          size="sm"
                          className={game.winner === "player2" ? 'border-2 border-yellow-400' : ''}
                        />
                        <span className="font-semibold text-sm">{game.player2Username}</span>
                        {game.winner === "player2" && <Crown className="h-4 w-4 text-yellow-400" />}
                      </div>
                    </div>
                  </div>
                  
                  {/* Final Board State */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-9 gap-1 sm:gap-2 w-full max-w-2xl mx-auto p-2 sm:p-4 rounded-lg ring-1 ring-muted bg-muted/10 border border-muted/30 overflow-hidden"
                  >
                    {game.board.map((row, rowIndex) =>
                      row.map((cell, colIndex) => {
                        // Check if this is part of the last move (for highlighting)
                        const isLastMoveFrom = game?.lastMoveFrom && 
                          game.lastMoveFrom.row === rowIndex && game.lastMoveFrom.col === colIndex;
                        const isLastMoveTo = game?.lastMoveTo && 
                          game.lastMoveTo.row === rowIndex && game.lastMoveTo.col === colIndex;
                        const isLastMove = isLastMoveFrom || isLastMoveTo;
                        
                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`
                              aspect-square border flex items-center justify-center rounded-sm sm:rounded-lg transition-all relative
                              bg-muted/30 border-border min-h-[32px] sm:min-h-0
                              ${isLastMove ? 'ring-1 ring-yellow-500 border-yellow-500' : ''}
                            `}
                          >
                            {cell && (
                              <div className="text-center">
                                <div className={`${cell.player === 'player1' ? 'text-blue-400' : 'text-red-400'}`}>
                                  {getPieceDisplay(cell.piece, { 
                                    size: "small", 
                                    showLabel: true,
                                    isOpponent: false // Always show all pieces for spectators
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-9 gap-1 sm:gap-2 w-full max-w-2xl mx-auto p-2 sm:p-4 rounded-lg ring-1 ring-muted bg-muted/10 border border-muted/30 overflow-hidden"
                >
                  {game.board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                      // Check if this is part of the last move (for highlighting)
                      const isLastMoveFrom = game?.lastMoveFrom && 
                        game.lastMoveFrom.row === rowIndex && game.lastMoveFrom.col === colIndex;
                      const isLastMoveTo = game?.lastMoveTo && 
                        game.lastMoveTo.row === rowIndex && game.lastMoveTo.col === colIndex;
                      const isLastMove = isLastMoveFrom || isLastMoveTo;
                      
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            aspect-square border flex items-center justify-center rounded-sm sm:rounded-lg transition-all relative
                            bg-muted/30 border-border min-h-[32px] sm:min-h-0
                            ${isLastMove ? 'ring-1 ring-yellow-500 border-yellow-500' : ''}
                          `}
                        >
                          {cell && (
                            <div className="text-center">
                              <div className={`${cell.player === 'player1' ? 'text-blue-400' : 'text-red-400'}`}>
                                {getPieceDisplay(cell.piece, { 
                                  size: "small", 
                                  showLabel: true,
                                  isOpponent: false // Always show all pieces for spectators
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:space-y-6 order-2 xl:order-2">
          {/* Chat */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                      Spectator Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Chat Messages */}
                    <div ref={chatContainerRef} className="space-y-2 h-64 overflow-y-auto mb-4 pr-2">
                      {allMessages && allMessages.length > 0 ? (
                        allMessages.map((message) => (
                          <motion.div
                            key={`${message._id}-${message.timestamp}`}
                            initial={message.isOptimistic ? { opacity: 0, y: 10 } : false}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-sm flex items-start gap-2 ${
                              message.isOptimistic ? 'opacity-60' : ''
                            }`}
                          >
                            {message.isOptimistic && (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="flex-shrink-0 mt-0.5"
                              >
                                <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full" />
                              </motion.div>
                            )}
                            <div className="flex-1">
                              <span className="font-semibold text-blue-300">{message.username}:</span>
                              <span className="text-white/80 ml-2">{message.message}</span>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full text-white/60">
                          <div className="text-center">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No messages yet</p>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    {(isSpectating || isPlayer) && game.status !== "finished" && (
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          ref={inputRef}
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onFocus={() => {
                            isInputFocusedRef.current = true;
                            // Store current scroll positions to prevent unwanted scrolling
                            const chatScrollTop = chatContainerRef.current?.scrollTop ?? 0;
                            const pageScrollY = window.scrollY;
                            
                            // Prevent browser from scrolling input into view
                            // Use multiple attempts to catch browser scroll behavior
                            const restoreScroll = () => {
                              if (chatContainerRef.current) {
                                chatContainerRef.current.scrollTop = chatScrollTop;
                              }
                              window.scrollTo({ top: pageScrollY, behavior: 'instant' });
                            };
                            
                            // Restore immediately and after browser attempts to scroll
                            restoreScroll();
                            requestAnimationFrame(restoreScroll);
                            setTimeout(restoreScroll, 0);
                            setTimeout(restoreScroll, 10);
                          }}
                          onBlur={() => {
                            isInputFocusedRef.current = false;
                          }}
                          placeholder="Type a message..."
                          maxLength={500}
                          className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!chatMessage.trim()}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                    
                    {/* Game Finished Message */}
                    {game.status === "finished" && (
                      <div className="flex items-center justify-center p-3 bg-gray-500/10 rounded-lg border border-gray-500/20">
                        <p className="text-sm text-gray-400">Chat is disabled - Game has finished</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spectators List */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-purple-400" />
                Spectators ({spectators?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {spectators && spectators.length > 0 ? (
                  spectators.map((spectator) => (
                    <div key={spectator._id} className="flex items-center gap-2">
                      <UserAvatar 
                        username={spectator.username}
                        avatarUrl={spectator.avatarUrl}
                        rank={spectator.rank}
                        size="sm" 
                      />
                      <span className="text-sm text-white/80">{spectator.username}</span>
                      {spectator.userId === profile.userId && (
                        <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                          You
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/60">No spectators yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Eliminated Pieces */}
          {(eliminatedPieces.player1.length > 0 || eliminatedPieces.player2.length > 0) && (
            <div className="space-y-4">
              {/* Player 1 Eliminated Pieces */}
              {eliminatedPieces.player1.length > 0 && (
                <Card className="bg-black/20 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-black/20">
                  <CardHeader className="p-4 sm:p-6 sm:pb-2 pb-2">
                    <CardTitle className="flex items-center gap-2 text-white/90 text-lg sm:text-xl">
                      <Sword className="h-5 w-5 text-blue-400" />
                      {game.player1Username}'s Eliminated
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-2 sm:pt-2 pt-2">
                    <div className="max-h-48 sm:max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {eliminatedPieces.player1.map((eliminated, index) => (
                          <motion.div
                            key={`player1-${eliminated.piece}-${eliminated.moveNumber}-${index}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 p-2 rounded-lg border bg-blue-500/10 border-blue-500/30"
                          >
                            <div className="flex-shrink-0 text-blue-400">
                              {getPieceDisplay(eliminated.piece, { size: "small" })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-white/90 truncate">
                                {eliminated.piece}
                              </div>
                              <div className="text-xs text-blue-300/70">
                                {eliminated.battleOutcome === "attacker" && "Attacker won"}
                                {eliminated.battleOutcome === "defender" && "Defender won"}
                                {eliminated.battleOutcome === "tie" && "Tie - both eliminated"}
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-xs sm:text-sm font-semibold text-white/70">
                              Move {eliminated.moveNumber}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Player 2 Eliminated Pieces */}
              {eliminatedPieces.player2.length > 0 && (
                <Card className="bg-black/20 backdrop-blur-xl border border-red-500/30 shadow-2xl shadow-black/20">
                  <CardHeader className="p-4 sm:p-6 sm:pb-2 pb-2">
                    <CardTitle className="flex items-center gap-2 text-white/90 text-lg sm:text-xl">
                      <Sword className="h-5 w-5 text-red-400" />
                      {game.player2Username}'s Eliminated
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-2 sm:pt-2 pt-2">
                    <div className="max-h-48 sm:max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {eliminatedPieces.player2.map((eliminated, index) => (
                          <motion.div
                            key={`player2-${eliminated.piece}-${eliminated.moveNumber}-${index}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 p-2 rounded-lg border bg-red-500/10 border-red-500/30"
                          >
                            <div className="flex-shrink-0 text-red-400">
                              {getPieceDisplay(eliminated.piece, { size: "small" })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-white/90 truncate">
                                {eliminated.piece}
                              </div>
                              <div className="text-xs text-red-300/70">
                                {eliminated.battleOutcome === "attacker" && "Attacker won"}
                                {eliminated.battleOutcome === "defender" && "Defender won"}
                                {eliminated.battleOutcome === "tie" && "Tie - both eliminated"}
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-xs sm:text-sm font-semibold text-white/70">
                              Move {eliminated.moveNumber}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Game Info */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-green-400" />
                Game Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Moves:</span>
                  <span className="text-white/90">{movesArray.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Status:</span>
                  <span className="text-white/90">{game.status}</span>
                </div>
                {game.lastMoveFrom && game.lastMoveTo && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Last Move:</span>
                    <span className="text-white/90 font-mono text-xs">
                      {String.fromCharCode(65 + game.lastMoveFrom.col)}{8 - game.lastMoveFrom.row} → {String.fromCharCode(65 + game.lastMoveTo.col)}{8 - game.lastMoveTo.row}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
