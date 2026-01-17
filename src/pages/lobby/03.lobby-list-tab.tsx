import { useState, useEffect, useRef } from "react";
import {
  useConvexMutationWithQuery,
  useConvexQuery,
} from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { LobbyCard } from "./LobbyCard";
import { motion } from "framer-motion";
import {
  Plus,
  Users,
  Sword,
  Lock,
  Copy,
  ChevronDown,
  Key,
  Shuffle,
  Clock,
  Zap,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { GameStartCountdownModal } from "../../components/GameStartCountdownModal";
import {
  GameModeSelector,
  type GameMode,
} from "../../components/GameModeSelector";
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

export function LobbyListTab({
  profile,
  onGameStart: _onGameStart,
  startGameMutation,
  onOpenMessaging,
}: LobbyListTabProps) {
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
  const { data: privateLobbyLimit } = useConvexQuery(
    api.featureGating.checkPrivateLobbyLimit,
    {},
  );
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
  const [queueTimeRemaining, setQueueTimeRemaining] = useState<number | null>(
    null,
  );

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

    if (
      activeLobby &&
      activeLobby.playerId &&
      activeLobby.hostId === profile.userId &&
      !gameStartData.isOpen &&
      !currentGame &&
      countdownShownRef.current !== lobbyKey
    ) {
      // Only if no game has started yet

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
          void startGameMutation.mutate(
            { lobbyId: activeLobby._id },
            {
              onSuccess: (gameId: string) => {
                toast.success("Battle has begun!");
                _onGameStart?.(gameId);
              },
              onError: () => {
                toast.error("Failed to start game");
                setGameStartData((prev) => ({ ...prev, isOpen: false }));
              },
            },
          );
        }
      }, 10000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeLobby,
    profile.userId,
    profile.username,
    currentGame,
    startGameMutation,
    _onGameStart,
  ]);

  // Show countdown for non-host when they are in a lobby
  useEffect(() => {
    // Skip if already showing countdown
    if (gameStartData.isOpen) return;

    // For non-host players in an active lobby, show countdown immediately
    if (activeLobby && activeLobby.hostId !== profile.userId && !currentGame) {
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

    if (
      currentGame &&
      currentGame.status === "setup" &&
      activeLobby &&
      activeLobby.playerId &&
      activeLobby.hostId !== profile.userId && // Only for non-host player
      !gameStartData.isOpen &&
      countdownShownRef.current !== gameKey
    ) {
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
    setGameStartData((prev) => ({ ...prev, isOpen: false }));
    // Navigate to the game if we have an active game
    if (currentGame) {
      _onGameStart?.(currentGame._id);
    }
  };

  const createLobbyMutation = useConvexMutationWithQuery(
    api.lobbies.createLobby,
    {
      onSuccess: (newLobby) => {
        setLobbyName("");
        setIsPrivate(false);
        setAllowSpectators(true);
        setMaxSpectators("");
        setGameMode("classic");
        setShowCreateLobby(false);

        if (isPrivate && newLobby) {
          toast.success(
            "Private lobby created! Share the code with your opponent.",
          );
        } else {
          toast.success("Lobby created!");
        }
      },
      onError: () => {
        toast.error("Failed to create lobby");
      },
    },
  );

  const joinLobbyMutation = useConvexMutationWithQuery(api.lobbies.joinLobby, {
    onError: () => {
      toast.error("Failed to join lobby");
    },
  });

  const joinLobbyByCodeMutation = useConvexMutationWithQuery(
    api.lobbies.joinLobbyByCode,
    {
      onError: () => {
        toast.error("Failed to join lobby");
      },
    },
  );

  const leaveLobbyMutation = useConvexMutationWithQuery(
    api.lobbies.leaveLobby,
    {
      onSuccess: () => {
        toast.success("Left lobby");
      },
      onError: () => {
        toast.error("Failed to leave lobby");
      },
    },
  );

  // Quick Match mutations
  const joinQueueMutation = useConvexMutationWithQuery(
    api.matchmaking.joinQueue,
    {
      onSuccess: (result) => {
        if (result.success) {
          toast.success("Joined matchmaking queue!");
        } else {
          toast.info("Already in queue");
        }
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to join queue",
        );
      },
    },
  );

  const leaveQueueMutation = useConvexMutationWithQuery(
    api.matchmaking.leaveQueue,
    {
      onSuccess: () => {
        setIsInQueue(false);
        setQueueTimeRemaining(null);
        toast.success("Left matchmaking queue");
      },
      onError: () => {
        toast.error("Failed to leave queue");
      },
    },
  );

  // Countdown timer for queue timeout
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isInQueue && queueTimeRemaining && queueTimeRemaining > 0) {
      interval = setInterval(() => {
        setQueueTimeRemaining((prev) => {
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

    const maxSpectatorsNum =
      maxSpectators.trim() === "" ? undefined : parseInt(maxSpectators.trim());

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
        joinLobbyMutation.mutate(
          { lobbyId },
          {
            onSuccess: () => {
              toast.success(
                "Joined lobby! Waiting for host to start the game...",
              );
              resolve();
            },
            onError: reject,
          },
        );
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
        joinLobbyByCodeMutation.mutate(
          { lobbyCode: joinCode.trim().toUpperCase() },
          {
            onSuccess: (result: any) => {
              setJoinCode("");
              setShowJoinByCode(false);
              toast.success(
                "Joined private lobby! Waiting for host to start the game...",
              );
              resolve(result as Id<"lobbies">);
            },
            onError: reject,
          },
        );
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
    <div className="space-y-6">
      {/* Active Lobby Display */}
      {activeLobby && (
        <Card className="bg-zinc-900/40 backdrop-blur-md border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-sm flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-blue-500/5 blur-[2px]" />
                  {activeLobby.isPrivate ? (
                    <Lock className="h-5 w-5 text-blue-400 relative z-10" />
                  ) : (
                    <Users className="h-5 w-5 text-blue-400 relative z-10" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded-sm border border-blue-500/20">
                      Active Mission
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      {activeLobby.isPrivate
                        ? "Private Channel"
                        : "Public Channel"}
                    </span>
                  </div>
                  <h4 className="font-display text-lg text-white tracking-wide">
                    {activeLobby.name}
                  </h4>
                  {activeLobby.isPrivate && activeLobby.lobbyCode && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-zinc-400 font-mono">
                        SECURE CODE:
                      </span>
                      <code className="bg-black/40 px-2 py-0.5 rounded-sm text-xs font-mono text-blue-300 border border-white/10 tracking-wider">
                        {activeLobby.lobbyCode}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 text-zinc-400 hover:text-white hover:bg-white/5"
                        onClick={() =>
                          activeLobby.lobbyCode &&
                          copyLobbyCode(activeLobby.lobbyCode)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <Badge
                  variant="outline"
                  className="bg-zinc-900/50 text-zinc-300 border-white/10 font-mono h-8 px-3"
                >
                  <Users className="w-3 h-3 mr-2 text-zinc-500" />
                  {activeLobby.playerId ? "2/2" : "1/2"} OPERATIVES
                </Badge>

                {/* Game Starting Indicator - show when countdown is active */}
                {activeLobby.hostId === profile.userId &&
                  activeLobby.playerId &&
                  gameStartData.isOpen && (
                    <div className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-4 py-1.5 rounded-sm flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                      <div className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                      Launch Sequence Initiated...
                    </div>
                  )}

                {/* Ready indicator for non-host when countdown is active */}
                {activeLobby.hostId !== profile.userId &&
                  activeLobby.playerId &&
                  gameStartData.isOpen && (
                    <div className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-4 py-1.5 rounded-sm flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                      <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      Launch Sequence Initiated...
                    </div>
                  )}

                {/* Start Game Button - only show for host when lobby is full and no countdown active */}
                {activeLobby.hostId === profile.userId &&
                  activeLobby.playerId &&
                  !gameStartData.isOpen && (
                    <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-1.5 rounded-sm flex items-center gap-2 text-xs font-mono uppercase tracking-wider animate-pulse">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Deployment Ready
                    </div>
                  )}

                {/* Waiting indicator for non-host when lobby is full but no countdown */}
                {activeLobby.hostId !== profile.userId &&
                  activeLobby.playerId &&
                  !gameStartData.isOpen && (
                    <div className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-4 py-1.5 rounded-sm flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                      Awaiting Commander...
                    </div>
                  )}

                <Button
                  variant="destructive"
                  size="sm"
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-sm font-mono text-xs uppercase tracking-wider h-8"
                  onClick={() => void handleLeaveLobby(activeLobby._id)}
                  disabled={leaveLobbyMutation.isPending}
                >
                  {leaveLobbyMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      Aborting...
                    </div>
                  ) : (
                    "Abort Mission"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Bar (Actions & Counts) */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-zinc-900/60 backdrop-blur-md p-4 rounded-sm border border-white/5 shadow-sm">
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
              className="w-10 h-10 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-sm flex items-center justify-center flex-shrink-0"
            >
              <Sword className="h-5 w-5 text-orange-400" />
            </motion.div>

            <div className="flex flex-col min-w-0">
              <motion.h3
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm font-mono uppercase tracking-wider text-white/90 font-semibold"
              >
                Available Operations
              </motion.h3>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex items-center gap-2"
              >
                <div className="h-0.5 w-6 bg-orange-500/50"></div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                  {lobbies.length} Active Zones
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          {/* Quick Match Button */}
          {!activeLobby && !isInQueue && (
            <Button
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-sm w-full sm:w-auto font-mono text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 border border-green-400"
              onClick={() => joinQueueMutation.mutate({})}
              disabled={joinQueueMutation.isPending}
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="sm:hidden">Quick Match</span>
              <span className="hidden sm:inline">Quick Match</span>
            </Button>
          )}

          {/* Queue Status */}
          {isInQueue && (
            <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-sm px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute inset-0" />
                  <div className="w-2 h-2 bg-green-500 rounded-full relative z-10" />
                </div>
                <div>
                  <p className="text-green-300 font-mono text-xs uppercase tracking-wider">
                    Scanning for Opponent...
                  </p>
                  {queueTimeRemaining && (
                    <p className="text-[10px] text-green-500/70 font-mono">
                      TIMEOUT IN {Math.ceil(queueTimeRemaining / 1000)}s
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30 rounded-sm h-7 text-[10px] uppercase font-mono tracking-widest"
                onClick={() => leaveQueueMutation.mutate({})}
                disabled={leaveQueueMutation.isPending}
              >
                <X className="h-3 w-3 mr-1" />
                {leaveQueueMutation.isPending ? "Aborting..." : "Cancel"}
              </Button>
            </div>
          )}

          <Dialog open={showJoinByCode} onOpenChange={setShowJoinByCode}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 hover:text-white rounded-sm w-full sm:w-auto font-mono text-xs uppercase tracking-wider"
              >
                <Key className="h-3.5 w-3.5" />
                <span className="sm:hidden">Enter Code</span>
                <span className="hidden sm:inline">Join by Code</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border border-white/10 rounded-sm">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-sm bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Key className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-white font-display tracking-wide uppercase text-lg">
                      Private Access
                    </DialogTitle>
                  </div>
                </div>
                <DialogDescription className="text-zinc-400 font-mono text-xs">
                  Enter the 6-character encryption key to access the private war
                  room.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => void handleJoinByCode(e)}
                className="space-y-6 mt-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/5 blur-xl pointer-events-none" />
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    required
                    disabled={
                      joinLobbyByCodeMutation.isPending ||
                      startGameMutation.isPending
                    }
                    className="font-mono tracking-[0.5em] text-center text-2xl bg-black/50 border-white/10 text-blue-400 placeholder:text-zinc-700 h-16 rounded-sm focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 transition-all uppercase"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowJoinByCode(false)}
                    className="text-zinc-400 hover:text-white font-mono text-xs uppercase tracking-wider hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-sm font-mono text-xs uppercase tracking-wider min-w-[100px]"
                    disabled={
                      joinLobbyByCodeMutation.isPending ||
                      startGameMutation.isPending
                    }
                  >
                    {joinLobbyByCodeMutation.isPending ||
                    startGameMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Accessing...
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
                <Button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/20 rounded-sm w-full sm:w-auto font-mono text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="sm:hidden">Create</span>
                  <span className="hidden sm:inline">Create Lobby</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-zinc-900 border border-white/10 rounded-sm">
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-sm bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Sword className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <DialogTitle className="text-white font-display tracking-wide uppercase text-lg">
                        Initialize Battlefield
                      </DialogTitle>
                    </div>
                  </div>
                  <DialogDescription className="text-zinc-400 font-mono text-xs">
                    Configure parameters for a new strategic engagement.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => void handleCreateLobby(e)}
                  className="space-y-5 mt-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                      Operation Name
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={lobbyName}
                        onChange={(e) => setLobbyName(e.target.value)}
                        placeholder="ENTER LOBBY DESIGNATION"
                        disabled={createLobbyMutation.isPending}
                        className="flex-1 bg-black/40 border-white/10 text-white placeholder:text-zinc-700 rounded-sm font-mono text-sm focus-visible:ring-blue-500/50"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateRandomName}
                        disabled={createLobbyMutation.isPending}
                        className="bg-zinc-800 border-white/10 text-zinc-400 hover:text-white px-3 rounded-sm"
                        title="Generate random name"
                      >
                        <Shuffle className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-mono">
                      * Leave empty to auto-generate tactical designation
                    </p>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-white/5">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="private-lobby"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        disabled={
                          createLobbyMutation.isPending ||
                          (privateLobbyLimit && !privateLobbyLimit.canCreate)
                        }
                        className="rounded-sm border-white/20 bg-black/40 text-blue-500 focus:ring-blue-500/50 disabled:opacity-50"
                      />
                      <label
                        htmlFor="private-lobby"
                        className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-2 cursor-pointer select-none"
                      >
                        <Lock className="h-3 w-3 text-zinc-500" />
                        Private Channel (Code Required)
                      </label>
                    </div>
                    {isPrivate && privateLobbyLimit && (
                      <div className="ml-6 space-y-2 bg-zinc-950/50 p-2 rounded-sm border border-white/5">
                        {!privateLobbyLimit.canCreate && (
                          <div
                            className={`rounded-sm p-2 text-xs font-mono border ${
                              privateLobbyLimit.reason ===
                              "subscription_expired"
                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="uppercase tracking-wider font-bold">
                                {privateLobbyLimit.reason ===
                                "subscription_expired"
                                  ? "Subscription Expired"
                                  : "Daily Limit Reached"}
                              </span>
                            </div>
                            <p className="opacity-80">
                              {privateLobbyLimit.reason ===
                              "subscription_expired"
                                ? "Renew subscription to restore access."
                                : `Limit: ${privateLobbyLimit.limit} lobbies for ${privateLobbyLimit.tier === "free" ? "Free" : privateLobbyLimit.tier === "pro" ? "Pro" : "Pro+"} tier.`}
                            </p>

                            <Button
                              variant="link"
                              size="sm"
                              onClick={() =>
                                navigate({
                                  to:
                                    privateLobbyLimit.reason ===
                                    "subscription_expired"
                                      ? "/subscription"
                                      : "/pricing",
                                  search: {
                                    subscription: undefined,
                                    donation: undefined,
                                  },
                                })
                              }
                              className="text-xs p-0 h-auto mt-2 font-bold underline decoration-dotted underline-offset-4"
                            >
                              {privateLobbyLimit.reason ===
                              "subscription_expired"
                                ? "RENEW NOW"
                                : "UPGRADE CLEARANCE LEVEL"}
                            </Button>
                          </div>
                        )}
                        {privateLobbyLimit.canCreate && (
                          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${privateLobbyLimit.limit === Infinity ? "bg-green-500" : "bg-amber-500"}`}
                            />
                            {privateLobbyLimit.limit === Infinity
                              ? "UNLIMITED ACCESS GRANTED"
                              : `${privateLobbyLimit.limit - privateLobbyLimit.today} CREATIONS REMAINING TODAY`}
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
                      className="rounded-sm border-white/20 bg-black/40 text-blue-500 focus:ring-blue-500/50 disabled:opacity-50"
                    />
                    <label
                      htmlFor="allow-spectators"
                      className="text-xs font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-2 cursor-pointer select-none"
                    >
                      <Users className="h-3 w-3 text-zinc-500" />
                      Allow Spectators
                    </label>
                  </div>

                  {allowSpectators && (
                    <div className="space-y-1 ml-6">
                      <Input
                        value={maxSpectators}
                        onChange={(e) => setMaxSpectators(e.target.value)}
                        placeholder="MAX LIMIT (EMPTY = UNLIMITED)"
                        type="number"
                        min="1"
                        disabled={createLobbyMutation.isPending}
                        className="bg-black/40 border-white/10 text-white placeholder:text-zinc-700 rounded-sm font-mono text-xs focus-visible:ring-blue-500/50 h-8 w-full"
                      />
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/5">
                    <label className="text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-2">
                      Game Protocol
                    </label>
                    <GameModeSelector
                      value={gameMode}
                      onChange={setGameMode}
                      disabled={createLobbyMutation.isPending}
                    />
                  </div>

                  {/* Warning about auto-deletion */}
                  <div className="flex items-start gap-2 p-2 bg-amber-500/5 border border-amber-500/10 rounded-sm">
                    <Clock className="h-3 w-3 text-amber-500/70 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-amber-500/70 font-mono leading-relaxed">
                      INACTIVE PROTOCOLS AUTOMATICALLY PURGED AFTER 30 MIN.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowCreateLobby(false)}
                      className="text-zinc-400 hover:text-white font-mono text-xs uppercase tracking-wider hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-sm font-mono text-xs uppercase tracking-wider w-[120px]"
                      disabled={createLobbyMutation.isPending}
                    >
                      {createLobbyMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </div>
                      ) : (
                        "Initialize"
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
      <div ref={listRef} className="space-y-3 pb-20">
        {lobbiesQuery === undefined ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">
                Scanning Grid...
              </p>
            </div>
          </div>
        ) : lobbies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border border-dashed border-white/10 rounded-sm bg-zinc-900/20"
          >
            <div className="bg-zinc-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
              <Sword className="h-10 w-10 text-zinc-700" />
            </div>
            <h3 className="text-zinc-400 font-display uppercase tracking-wide text-lg mb-2">
              Sector Clear
            </h3>
            <p className="text-zinc-600 text-sm font-mono mb-6 max-w-sm mx-auto">
              No active battle rooms detected in this sector.
            </p>
            <Button
              onClick={() => setShowCreateLobby(true)}
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 font-mono text-xs uppercase tracking-wider"
            >
              Initialize New Operation
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="grid gap-4">
              {lobbies.map((lobby, index) => (
                <LobbyCard
                  key={lobby._id}
                  lobby={lobby}
                  index={index}
                  currentUserId={profile.userId}
                  onJoin={(lobbyId) => void handleJoinLobby(lobbyId)}
                  onLeave={(lobbyId) => void handleLeaveLobby(lobbyId)}
                  onInviteToLobby={handleInviteToLobby}
                  isJoining={
                    joinLobbyMutation.isPending || startGameMutation.isPending
                  }
                  isLeaving={leaveLobbyMutation.isPending}
                />
              ))}
            </div>

            {/* Load More Button */}
            {lobbiesQuery && !lobbiesQuery.isDone && (
              <div className="flex justify-center pt-8">
                <Button
                  variant="outline"
                  onClick={loadMoreLobbies}
                  className="flex items-center gap-2 bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-sm font-mono text-xs uppercase tracking-wider px-8 h-10"
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading Data...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Load Extended Grid
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
    </div>
  );
}
