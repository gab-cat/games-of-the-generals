import { useState, useEffect, useRef } from "react";
import { useConvexMutationWithQuery, useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { LobbyCard } from "./LobbyCard";
import { motion } from "framer-motion";
import { Plus, Users, Sword, Lock, Copy, ChevronDown, Key, Shuffle, Clock, Zap, X, AlertTriangle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { GameStartCountdownModal } from "../../components/GameStartCountdownModal";
import { GameModeSelector, type GameMode } from "../../components/GameModeSelector";
import generateName from "@scaleway/random-name";
import { useQuery } from "convex-helpers/react/cache";
import { useAutoAnimate } from "../../lib/useAutoAnimate";
import { useNavigate } from "@tanstack/react-router";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
}

interface LobbyListTabProps {
  profile: Profile;
  onGameStart?: (gameId: string) => void;
  startGameMutation: any;
  onOpenMessaging?: (lobbyId?: Id<"lobbies">) => void;
}

export function LobbyListTab({ profile, onGameStart: _onGameStart, startGameMutation, onOpenMessaging }: LobbyListTabProps) {
  const navigate = useNavigate();
  const listRef = useAutoAnimate();
  const [showCreateLobby, setShowCreateLobby] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [lobbyName, setLobbyName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [maxSpectators, setMaxSpectators] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [joinCode, setJoinCode] = useState("");
  const [lobbiesCursor, setLobbiesCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Subscription queries
  const { data: privateLobbyLimit } = useConvexQuery(api.featureGating.checkPrivateLobbyLimit, {});
  const [gameStartData, setGameStartData] = useState<{
    isOpen: boolean;
    player1Username: string;
    player2Username: string;
    currentUsername: string;
  }>({
    isOpen: false,
    player1Username: "",
    player2Username: "",
    currentUsername: "",
  });

  // Track if we've already shown countdown for this lobby state to prevent duplicates
  const countdownShownRef = useRef<string | null>(null);

  // Quick Match state
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueTimeRemaining, setQueueTimeRemaining] = useState<number | null>(null);

  const LOBBIES_PER_PAGE = 10;

  const lobbiesQuery = useQuery(api.lobbies.getLobbies, {
    paginationOpts: {
      numItems: LOBBIES_PER_PAGE,
      cursor: lobbiesCursor || undefined,
    },
  });

  const activeLobby = useQuery(api.lobbies.getUserActiveLobby);
  const currentGame = useQuery(api.games.getCurrentUserGame);

  // Quick Match queries
  const queueStatus = useQuery(api.matchmaking.getQueueStatus);
  // const queueCount = useQuery(api.matchmaking.getQueueCount);

  // Update queue status state
  useEffect(() => {
    if (queueStatus) {
      setIsInQueue(queueStatus.inQueue);
      setQueueTimeRemaining(queueStatus.timeRemaining || null);
    }
  }, [queueStatus]);

  // Clear queue state when player gets matched (has active lobby)
  useEffect(() => {
    if (activeLobby && isInQueue) {
      // Player was matched and now has an active lobby, clear queue state
      setIsInQueue(false);
      setQueueTimeRemaining(null);
    }
  }, [activeLobby, isInQueue]);

  // Show countdown modal when lobby becomes full (for host)
  useEffect(() => {
    const lobbyKey = `${activeLobby?._id}-${activeLobby?.playerId}-host`;
    
    if (activeLobby && 
        activeLobby.playerId && 
        activeLobby.hostId === profile.userId && 
        !gameStartData.isOpen && 
        !currentGame &&
        countdownShownRef.current !== lobbyKey) { // Only if no game has started yet
      
      countdownShownRef.current = lobbyKey;
      setGameStartData({
        isOpen: true,
        player1Username: activeLobby.hostUsername,
        player2Username: activeLobby.playerUsername!,
        currentUsername: profile.username,
      });

      // Auto-start the game after 10 seconds
      setTimeout(() => {
        if (activeLobby) {
          void startGameMutation.mutate({ lobbyId: activeLobby._id }, {
            onSuccess: (gameId: string) => {
              toast.success("Battle has begun!");
              _onGameStart?.(gameId);
            },
            onError: () => {
              toast.error("Failed to start game");
              setGameStartData(prev => ({ ...prev, isOpen: false }));
            }
          });
        }
      }, 10000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLobby, profile.userId, profile.username, currentGame, startGameMutation, _onGameStart]);

  // Show countdown for non-host when they are in a lobby
  useEffect(() => {
    // Skip if already showing countdown
    if (gameStartData.isOpen) return;
    
    // For non-host players in an active lobby, show countdown immediately
    if (activeLobby && 
        activeLobby.hostId !== profile.userId && 
        !currentGame) {
      
      const lobbyKey = `${activeLobby._id}-non-host-player`;
      
      if (countdownShownRef.current !== lobbyKey) {
        countdownShownRef.current = lobbyKey;
        setGameStartData({
          isOpen: true,
          player1Username: activeLobby.hostUsername,
          player2Username: activeLobby.playerUsername || profile.username,
          currentUsername: profile.username,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLobby, profile.userId, profile.username, currentGame]);

  // Monitor for game creation - this will show countdown for the non-host player when game is created
  useEffect(() => {
    const gameKey = `${currentGame?._id}-setup`;
    
    if (currentGame && 
        currentGame.status === "setup" && 
        activeLobby && 
        activeLobby.playerId &&
        activeLobby.hostId !== profile.userId && // Only for non-host player
        !gameStartData.isOpen &&
        countdownShownRef.current !== gameKey) {
      
      countdownShownRef.current = gameKey;
      setGameStartData({
        isOpen: true,
        player1Username: currentGame.player1Username,
        player2Username: currentGame.player2Username,
        currentUsername: profile.username,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame, activeLobby, profile.userId, profile.username]);

  // Reset countdown tracking when modal closes
  useEffect(() => {
    if (!gameStartData.isOpen) {
      countdownShownRef.current = null;
    }
  }, [gameStartData.isOpen]);



  const handleCountdownComplete = () => {
    setGameStartData(prev => ({ ...prev, isOpen: false }));
    // Navigate to the game if we have an active game
    if (currentGame) {
      _onGameStart?.(currentGame._id);
    }
  };

  const createLobbyMutation = useConvexMutationWithQuery(api.lobbies.createLobby, {
    onSuccess: (newLobby) => {
      setLobbyName("");
      setIsPrivate(false);
      setAllowSpectators(true);
      setMaxSpectators("");
      setGameMode("classic");
      setShowCreateLobby(false);
      
      if (isPrivate && newLobby) {
        toast.success("Private lobby created! Share the code with your opponent.");
      } else {
        toast.success("Lobby created!");
      }
    },
    onError: () => {
      toast.error("Failed to create lobby");
    }
  });

  const joinLobbyMutation = useConvexMutationWithQuery(api.lobbies.joinLobby, {
    onError: () => {
      toast.error("Failed to join lobby");
    }
  });
  
  const joinLobbyByCodeMutation = useConvexMutationWithQuery(api.lobbies.joinLobbyByCode, {
    onError: () => {
      toast.error("Failed to join lobby");
    }
  });
  
  const leaveLobbyMutation = useConvexMutationWithQuery(api.lobbies.leaveLobby, {
    onSuccess: () => {
      toast.success("Left lobby");
    },
    onError: () => {
      toast.error("Failed to leave lobby");
    }
  });

  // Quick Match mutations
  const joinQueueMutation = useConvexMutationWithQuery(api.matchmaking.joinQueue, {
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Joined matchmaking queue!");
      } else {
        toast.info("Already in queue");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to join queue");
    }
  });

  const leaveQueueMutation = useConvexMutationWithQuery(api.matchmaking.leaveQueue, {
    onSuccess: () => {
      setIsInQueue(false);
      setQueueTimeRemaining(null);
      toast.success("Left matchmaking queue");
    },
    onError: () => {
      toast.error("Failed to leave queue");
    }
  });

  // Countdown timer for queue timeout
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isInQueue && queueTimeRemaining && queueTimeRemaining > 0) {
      interval = setInterval(() => {
        setQueueTimeRemaining(prev => {
          if (prev && prev > 1000) {
            return prev - 1000;
          } else {
            // Time's up - leave queue (check current queue status to avoid double calls)
            if (queueStatus?.inQueue) {
              leaveQueueMutation.mutate({});
            }
            return null;
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInQueue, queueTimeRemaining, leaveQueueMutation, queueStatus]);

  const lobbies = lobbiesQuery?.page || [];

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate random name if no name is provided
    const finalLobbyName = lobbyName.trim() || generateName();

    const maxSpectatorsNum = maxSpectators.trim() === "" ? undefined : parseInt(maxSpectators.trim());
    
    createLobbyMutation.mutate({ 
      name: finalLobbyName,
      isPrivate,
      allowSpectators,
      maxSpectators: maxSpectatorsNum,
      gameMode,
    });
  };

  const generateRandomName = () => {
    const randomName = generateName();
    setLobbyName(randomName);
  };

  const handleJoinLobby = async (lobbyId: Id<"lobbies">) => {
    try {
      await new Promise<void>((resolve, reject) => {
        joinLobbyMutation.mutate({ lobbyId }, {
          onSuccess: () => {
            toast.success("Joined lobby! Waiting for host to start the game...");
            resolve();
          },
          onError: reject
        });
      });
    } catch {
      toast.error("Failed to join lobby");
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      await new Promise<Id<"lobbies">>((resolve, reject) => {
        joinLobbyByCodeMutation.mutate({ lobbyCode: joinCode.trim().toUpperCase() }, {
          onSuccess: (result: any) => {
            setJoinCode("");
            setShowJoinByCode(false);
            toast.success("Joined private lobby! Waiting for host to start the game...");
            resolve(result as Id<"lobbies">);
          },
          onError: reject
        });
      });
    } catch {
      toast.error("Failed to join lobby");
    }
  };

  const handleLeaveLobby = async (lobbyId: Id<"lobbies">) => {
    leaveLobbyMutation.mutate({ lobbyId });
  };

  const loadMoreLobbies = () => {
    if (lobbiesQuery?.continueCursor) {
      setIsLoadingMore(true);
      setLobbiesCursor(lobbiesQuery.continueCursor);
      // Reset loading state after a brief delay to show animation
      setTimeout(() => setIsLoadingMore(false), 500);
    }
  };

  const handleInviteToLobby = (lobbyId: Id<"lobbies">) => {
    onOpenMessaging?.(lobbyId);
  };

  const copyLobbyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success("Lobby code copied to clipboard!");
  };

  return (
    <>
      {/* Active Lobby Display */}
      {activeLobby && (
        <Card className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm">
                  {activeLobby.isPrivate ? <Lock className="h-5 w-5 text-blue-300" /> : <Users className="h-5 w-5 text-blue-300" />}
                </div>
                <div>
                  <h4 className="font-semibold text-blue-200">Your Active Lobby</h4>
                  <p className="text-sm text-blue-100">{activeLobby.name}</p>
                  {activeLobby.isPrivate && activeLobby.lobbyCode && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-blue-200">Code:</span>
                      <code className="bg-blue-500/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-blue-200 border border-blue-500/30">
                        {activeLobby.lobbyCode}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
                        onClick={() => activeLobby.lobbyCode && copyLobbyCode(activeLobby.lobbyCode)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-500/30">
                  {activeLobby.playerId ? "2/2" : "1/2"}
                </Badge>
                
                {/* Game Starting Indicator - show when countdown is active */}
                {activeLobby.hostId === profile.userId && activeLobby.playerId && gameStartData.isOpen && (
                  <div className="bg-orange-500/20 text-orange-300 border border-orange-500/30 px-4 py-2 rounded-lg flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-300/30 border-t-orange-300 rounded-full animate-spin" />
                    Battle Starting...
                  </div>
                )}
                
                {/* Ready indicator for non-host when countdown is active */}
                {activeLobby.hostId !== profile.userId && activeLobby.playerId && gameStartData.isOpen && (
                  <div className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-lg flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin" />
                    Battle Starting...
                  </div>
                )}
                
                {/* Start Game Button - only show for host when lobby is full and no countdown active */}
                {activeLobby.hostId === profile.userId && activeLobby.playerId && !gameStartData.isOpen && (
                  <div className="bg-green-500/20 text-green-300 border border-green-500/30 px-4 py-2 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Ready to Start
                  </div>
                )}
                
                {/* Waiting indicator for non-host when lobby is full but no countdown */}
                {activeLobby.hostId !== profile.userId && activeLobby.playerId && !gameStartData.isOpen && (
                  <div className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-4 py-2 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    Waiting for Host...
                  </div>
                )}
                
                <Button
                  variant="destructive"
                  size="sm"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                  onClick={() => void handleLeaveLobby(activeLobby._id)}
                  disabled={leaveLobbyMutation.isPending}
                >
                  {leaveLobbyMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />
                      Leaving...
                    </div>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Join Lobby Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
        >
          {/* Battle Rooms Icon Section */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-pink-500/20 backdrop-blur-sm border border-orange-500/30 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            >
              <Sword className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
            </motion.div>
            
            <div className="flex flex-col min-w-0">
              <motion.h3 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-base sm:text-lg font-semibold text-white/90"
              >
                Battle Rooms
              </motion.h3>
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex items-center gap-2"
              >
                <div className="h-0.5 w-6 sm:w-8 bg-gradient-to-r from-orange-500/60 to-red-500/60 rounded-full"></div>
                <span className="text-xs text-white/50 font-mono">
                  {lobbies.length} available
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"
        >
          {/* Quick Match Button */}
          {!activeLobby && !isInQueue && (
            <Button
              className="flex items-center justify-center transition-all duration-300 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 w-full sm:w-auto"
              onClick={() => joinQueueMutation.mutate({})}
              disabled={joinQueueMutation.isPending}
            >
              <Zap className="h-4 w-4" />
              <span className="sm:hidden">Quick Match</span>
              <span className="hidden sm:inline">Quick Match</span>
            </Button>
          )}

          {/* Queue Status */}
          {isInQueue && (
            <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <div>
                  <p className="text-green-200 font-medium text-sm">Finding opponent...</p>
                  {queueTimeRemaining && (
                    <p className="text-xs text-green-300">
                      {Math.ceil(queueTimeRemaining / 1000)}s remaining
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                onClick={() => leaveQueueMutation.mutate({})}
                disabled={leaveQueueMutation.isPending}
              >
                <X className="h-4 w-4" />
                {leaveQueueMutation.isPending ? "Leaving..." : "Cancel"}
              </Button>
            </div>
          )}

          <Dialog open={showJoinByCode} onOpenChange={setShowJoinByCode}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20 w-full sm:w-auto">
                <Key className="h-4 w-4" />
                <span className="sm:hidden">Join by Code</span>
                <span className="hidden sm:inline">Join by Code</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gray-500/10 backdrop-blur-md  border border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white/90">Join Private Lobby</DialogTitle>
                <DialogDescription className="text-white/60">
                  Enter the 6-character lobby code to join a private battle room
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => void handleJoinByCode(e)} className="space-y-4">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  required
                  disabled={joinLobbyByCodeMutation.isPending || startGameMutation.isPending}
                  className="font-mono tracking-wider text-center text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowJoinByCode(false)} className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={joinLobbyByCodeMutation.isPending || startGameMutation.isPending}
                  >
                    {joinLobbyByCodeMutation.isPending || startGameMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Joining...
                      </div>
                    ) : (
                      "Join Lobby"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {!activeLobby && (
            <Dialog open={showCreateLobby} onOpenChange={setShowCreateLobby}>
              <DialogTrigger asChild>
                <Button className="flex items-center justify-center gap-2 bg-gradient-to-r text-white from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="sm:hidden">Create Room</span>
                  <span className="hidden sm:inline">Create Lobby</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-gray-500/10 backdrop-blur-md border border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white/90">Create Battle Room</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Create a new lobby for strategic warfare
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => void handleCreateLobby(e)} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={lobbyName}
                        onChange={(e) => setLobbyName(e.target.value)}
                        placeholder="Enter lobby name"
                        disabled={createLobbyMutation.isPending}
                        className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateRandomName}
                        disabled={createLobbyMutation.isPending}
                        className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 px-3"
                        title="Generate random name"
                      >
                        <Shuffle className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-white/50">
                      Leave empty to auto-generate a random name
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="private-lobby"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        disabled={createLobbyMutation.isPending || (privateLobbyLimit && !privateLobbyLimit.canCreate)}
                        className="rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500/50 disabled:opacity-50"
                      />
                      <label htmlFor="private-lobby" className="text-sm flex items-center gap-2 text-white/80">
                        <Lock className="h-4 w-4" />
                        Private lobby (requires code to join)
                      </label>
                    </div>
                    {isPrivate && privateLobbyLimit && (
                      <div className="ml-6 space-y-1">
                        {!privateLobbyLimit.canCreate && (
                          <div className={`rounded-lg p-2 text-xs ${
                            privateLobbyLimit.reason === "subscription_expired"
                              ? "bg-red-500/20 border border-red-500/30 text-red-300"
                              : "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                          }`}>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="font-medium">
                                {privateLobbyLimit.reason === "subscription_expired"
                                  ? "Subscription Expired"
                                  : "Daily Limit Reached"}
                              </span>
                            </div>
                            <p className="mt-1 font-light">
                              {privateLobbyLimit.reason === "subscription_expired"
                                ? "Your subscription has expired. Please renew to create private lobbies."
                                : `You've reached your daily limit of ${privateLobbyLimit.limit} private lobbies for ${privateLobbyLimit.tier === "free" ? "Free" : privateLobbyLimit.tier === "pro" ? "Pro" : "Pro+"} tier.`}
                            </p>
                            {privateLobbyLimit.reason === "subscription_expired" ? (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => navigate({ to: "/subscription" })}
                                className="text-xs p-0 h-auto mt-1 font-light underline"
                              >
                                Renew Now
                              </Button>
                            ) : privateLobbyLimit.tier === "free" ? (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => navigate({ to: "/pricing" })}
                                className="text-xs p-0 h-auto mt-1 font-light underline"
                              >
                                Upgrade to Pro for 50/day, or Pro+ for unlimited
                              </Button>
                            ) : privateLobbyLimit.tier === "pro" ? (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => navigate({ to: "/pricing" })}
                                className="text-xs p-0 h-auto mt-1 font-light underline"
                              >
                                Upgrade to Pro+ for unlimited private lobbies
                              </Button>
                            ) : null}
                          </div>
                        )}
                        {privateLobbyLimit.canCreate && (
                          <div className="text-xs text-white/60 font-light">
                            {privateLobbyLimit.limit === Infinity ? (
                              "Unlimited private lobbies"
                            ) : (
                              `${privateLobbyLimit.limit - privateLobbyLimit.today} remaining today (${privateLobbyLimit.today}/${privateLobbyLimit.limit})`
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allow-spectators"
                      checked={allowSpectators}
                      onChange={(e) => setAllowSpectators(e.target.checked)}
                      disabled={createLobbyMutation.isPending}
                      className="rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500/50 disabled:opacity-50"
                    />
                    <label htmlFor="allow-spectators" className="text-sm flex items-center gap-2 text-white/80">
                      <Users className="h-4 w-4" />
                      Allow spectators
                    </label>
                  </div>

                  {allowSpectators && (
                    <Input
                      value={maxSpectators}
                      onChange={(e) => setMaxSpectators(e.target.value)}
                      placeholder="Max spectators (leave empty for unlimited)"
                      type="number"
                      min="1"
                      disabled={createLobbyMutation.isPending}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50"
                    />
                  )}

                  <GameModeSelector
                    value={gameMode}
                    onChange={setGameMode}
                    disabled={createLobbyMutation.isPending}
                  />

                  {/* Warning about auto-deletion */}
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <Clock className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-200">
                      <strong>Note:</strong> Waiting lobbies that are inactive for more than 30 minutes are automatically deleted to keep the server clean.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateLobby(false)} className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20">
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r text-white from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={createLobbyMutation.isPending}
                    >
                      {createLobbyMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </div>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>
      </div>

      {/* Lobbies List */}
      <div ref={listRef} className="space-y-3">
        {lobbiesQuery === undefined ? (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : lobbies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Sword className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">No public battle rooms available.</p>
            <p className="text-sm text-white/40">Create one to start your conquest!</p>
          </motion.div>
        ) : (
          <>
            {lobbies.map((lobby, index) => (
              <LobbyCard
                key={lobby._id}
                lobby={lobby}
                index={index}
                currentUserId={profile.userId}
                onJoin={(lobbyId) => void handleJoinLobby(lobbyId)}
                onLeave={(lobbyId) => void handleLeaveLobby(lobbyId)}
                onInviteToLobby={handleInviteToLobby}
                isJoining={joinLobbyMutation.isPending || startGameMutation.isPending}
                isLeaving={leaveLobbyMutation.isPending}
              />
            ))}

            {/* Load More Button */}
            {lobbiesQuery && !lobbiesQuery.isDone && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMoreLobbies}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Load More Lobbies
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Game Start Countdown Modal */}
      <GameStartCountdownModal
        isOpen={gameStartData.isOpen}
        onComplete={handleCountdownComplete}
        player1Username={gameStartData.player1Username}
        player2Username={gameStartData.player2Username}
        currentUsername={gameStartData.currentUsername}
      />
    </>
  );
}
