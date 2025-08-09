"use client";

import { useState } from "react";
import { useConvexQuery, useConvexMutationWithQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { GameBoard } from "./GameBoard";
import { Leaderboard } from "./Leaderboard";
import { MatchHistory } from "./MatchHistory";
import { GameReplay } from "./GameReplay";
import { SpectatorView } from "./SpectatorView";
import { LobbyCard } from "./LobbyCard";
import { motion } from "framer-motion";
import { Plus, Users, Trophy, Target, Sword, History, Lock, Copy, ChevronDown, Key, Eye, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
}

interface GameLobbyProps {
  profile: Profile;
}

export function GameLobby({ profile }: GameLobbyProps) {
  const [activeTab, setActiveTab] = useState<"lobbies" | "spectate" | "leaderboard" | "history">("lobbies");
  const [showCreateLobby, setShowCreateLobby] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [showSpectateById, setShowSpectateById] = useState(false);
  const [lobbyName, setLobbyName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [maxSpectators, setMaxSpectators] = useState("");
  const [spectateGameId, setSpectateGameId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [replayGameId, setReplayGameId] = useState<string | null>(null);
  const [spectatingGameId, setSpectatingGameId] = useState<string | null>(null);
  const [lobbiesCursor, setLobbiesCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const LOBBIES_PER_PAGE = 10;

  const { data: lobbiesQuery } = useConvexQuery(api.lobbies.getLobbies, {
    paginationOpts: {
      numItems: LOBBIES_PER_PAGE,
      cursor: lobbiesCursor || undefined,
    },
  });

  const { data: spectatableGamesQuery } = useConvexQuery(api.spectate.getSpectatableGames, {
    paginationOpts: {
      numItems: LOBBIES_PER_PAGE,
      cursor: lobbiesCursor || undefined,
    },
  });

  const { data: activeLobby } = useConvexQuery(api.lobbies.getUserActiveLobby);
  const { data: activeGame } = useConvexQuery(api.games.getCurrentUserGame);

  const createLobbyMutation = useConvexMutationWithQuery(api.lobbies.createLobby, {
    onSuccess: (newLobby) => {
      setLobbyName("");
      setIsPrivate(false);
      setAllowSpectators(true);
      setMaxSpectators("");
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
  
  const startGameMutation = useConvexMutationWithQuery(api.games.startGame, {
    onError: () => {
      toast.error("Failed to start game");
    }
  });

  const spectateByIdMutation = useConvexMutationWithQuery(api.lobbies.spectateGameById, {
    onSuccess: (gameId) => {
      setSpectatingGameId(gameId as string);
      setSpectateGameId("");
      setShowSpectateById(false);
      toast.success("Joining game as spectator!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to join game");
    }
  });

  const lobbies = lobbiesQuery?.page || [];

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lobbyName.trim()) return;

    const maxSpectatorsNum = maxSpectators.trim() === "" ? undefined : parseInt(maxSpectators.trim());
    
    createLobbyMutation.mutate({ 
      name: lobbyName.trim(),
      isPrivate,
      allowSpectators,
      maxSpectators: maxSpectatorsNum,
    });
  };

  const handleJoinLobby = async (lobbyId: Id<"lobbies">) => {
    try {
      await new Promise<void>((resolve, reject) => {
        joinLobbyMutation.mutate({ lobbyId }, {
          onSuccess: () => resolve(),
          onError: reject
        });
      });
      
      const gameId = await new Promise<string>((resolve, reject) => {
        startGameMutation.mutate({ lobbyId }, {
          onSuccess: (result) => resolve(result as string),
          onError: reject
        });
      });
      
      setCurrentGameId(gameId);
      toast.success("Joined game!");
    } catch {
      toast.error("Failed to join lobby");
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      const lobbyId = await new Promise<Id<"lobbies">>((resolve, reject) => {
        joinLobbyByCodeMutation.mutate({ lobbyCode: joinCode.trim().toUpperCase() }, {
          onSuccess: (result) => resolve(result as Id<"lobbies">),
          onError: reject
        });
      });
      
      const gameId = await new Promise<string>((resolve, reject) => {
        startGameMutation.mutate({ lobbyId }, {
          onSuccess: (result) => resolve(result as string),
          onError: reject
        });
      });
      
      setCurrentGameId(gameId);
      setJoinCode("");
      setShowJoinByCode(false);
      toast.success("Joined private lobby!");
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

  const copyLobbyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success("Lobby code copied to clipboard!");
  };

  const handleSpectateById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spectateGameId.trim()) return;

    spectateByIdMutation.mutate({ gameId: spectateGameId.trim() as Id<"games"> });
  };

  const copyGameId = (gameId: string) => {
    void navigator.clipboard.writeText(gameId);
    toast.success("Game ID copied to clipboard!");
  };

  // Check if user has an active game (either from state or from database)
  const gameToShow = currentGameId || activeGame?._id;
  
  // Show game replay if user wants to view one
  if (replayGameId) {
    return <GameReplay gameId={replayGameId as Id<"games">} onBack={() => setReplayGameId(null)} />;
  }

  // Show spectator view if user is spectating a game
  if (spectatingGameId) {
    return <SpectatorView gameId={spectatingGameId as Id<"games">} profile={profile} onBack={() => setSpectatingGameId(null)} />;
  }
  
  if (gameToShow) {
    return <GameBoard gameId={gameToShow as Id<"games">} profile={profile} onBackToLobby={() => setCurrentGameId(null)} />;
  }

  const winRate = profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* User Stats */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-4"
            >
              {/* Stats Icon Section */}
              <motion.div
                initial={{ scale: 0, rotateY: -180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
              >
                {/* Animated background pattern */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl"
                />
                <Target className="h-8 w-8 text-blue-400 relative z-10" />
              </motion.div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="flex items-center gap-1 bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <Target className="h-4 w-4" />
                    {profile.rank}
                  </Badge>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="h-px w-12 bg-gradient-to-r from-blue-500/60 to-purple-500/60"
                  />
                </div>
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <CardTitle className="text-xl font-bold text-white/90">Commander Profile</CardTitle>
                  <p className="text-sm text-white/60 mt-1">Battle Statistics & Performance</p>
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-4 gap-6 text-center"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-2xl font-bold text-green-400">{profile.wins}</div>
                <div className="text-xs text-white/60">Wins</div>
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-2xl font-bold text-red-400">{profile.losses}</div>
                <div className="text-xs text-white/60">Losses</div>
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="text-2xl font-bold text-white/90">{profile.gamesPlayed}</div>
                <div className="text-xs text-white/60">Games</div>
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="text-2xl font-bold text-blue-400">{winRate}%</div>
                <div className="text-xs text-white/60">Win Rate</div>
              </motion.div>
            </motion.div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "lobbies" | "spectate" | "leaderboard" | "history")}>
          <CardHeader>
            <TabsList className="grid rounded-full w-full grid-cols-4 bg-white/10 backdrop-blur-sm border border-white/20">
              <TabsTrigger value="lobbies" className="flex rounded-full items-center gap-2 border data-[state=active]:border-white/30 data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">
                <Sword className="h-4 w-4" />
                Battle Lobbies
              </TabsTrigger>
              <TabsTrigger value="spectate" className="flex rounded-full items-center gap-2 border data-[state=active]:border-white/30 data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">
                <Eye className="h-4 w-4" />
                Spectate
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex rounded-full items-center gap-2 border data-[state=active]:border-white/30 data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="history" className="flex rounded-full items-center gap-2 border data-[state=active]:border-white/30 data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">
                <History className="h-4 w-4" />
                Match History
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="lobbies" className="space-y-4">
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
              <div className="flex justify-between items-center">
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-4"
                >
                  {/* Battle Rooms Icon Section */}
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="w-12 h-12 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-pink-500/20 backdrop-blur-sm border border-orange-500/30 rounded-xl flex items-center justify-center shadow-lg"
                    >
                      <Sword className="h-6 w-6 text-orange-400" />
                    </motion.div>
                    
                    <div className="flex flex-col">
                      <motion.h3 
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg font-semibold text-white/90"
                      >
                        Battle Rooms
                      </motion.h3>
                      <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="flex items-center gap-2"
                      >
                        <div className="h-0.5 w-8 bg-gradient-to-r from-orange-500/60 to-red-500/60 rounded-full"></div>
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
                  className="flex gap-2"
                >
                  <Dialog open={showJoinByCode} onOpenChange={setShowJoinByCode}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20">
                        <Key className="h-4 w-4" />
                        Join by Code
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
                        <Button className="flex items-center gap-2 bg-gradient-to-r text-white from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Plus className="h-4 w-4" />
                          Create Lobby
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
                          <Input
                            value={lobbyName}
                            onChange={(e) => setLobbyName(e.target.value)}
                            placeholder="Enter lobby name"
                            required
                            disabled={createLobbyMutation.isPending}
                            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50"
                          />
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="private-lobby"
                              checked={isPrivate}
                              onChange={(e) => setIsPrivate(e.target.checked)}
                              disabled={createLobbyMutation.isPending}
                              className="rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-500/50 disabled:opacity-50"
                            />
                            <label htmlFor="private-lobby" className="text-sm flex items-center gap-2 text-white/80">
                              <Lock className="h-4 w-4" />
                              Private lobby (requires code to join)
                            </label>
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
                              <Eye className="h-4 w-4" />
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
              <div className="space-y-3">
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
            </TabsContent>

            <TabsContent value="spectate" className="space-y-4">
              {/* Spectate by ID Section */}
              <div className="flex justify-between items-center">
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="w-12 h-12 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-red-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl flex items-center justify-center shadow-lg"
                    >
                      <Eye className="h-6 w-6 text-purple-400" />
                    </motion.div>
                    
                    <div className="flex flex-col">
                      <h2 className="text-xl font-bold text-white/90">Spectate Games</h2>
                      <p className="text-sm text-white/60">Watch ongoing battles in real-time</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Dialog open={showSpectateById} onOpenChange={setShowSpectateById}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2 bg-gradient-to-r text-white from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        <Search className="h-4 w-4" />
                        Spectate by ID
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-gray-500/10 backdrop-blur-md border border-white/10">
                      <DialogHeader>
                        <DialogTitle className="text-white/90">Spectate Game by ID</DialogTitle>
                        <DialogDescription className="text-white/60">
                          Enter a game ID to join as a spectator
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={(e) => void handleSpectateById(e)} className="space-y-4">
                        <Input
                          value={spectateGameId}
                          onChange={(e) => setSpectateGameId(e.target.value)}
                          placeholder="Enter game ID"
                          required
                          disabled={spectateByIdMutation.isPending}
                          className="bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50"
                        />
                        
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowSpectateById(false)} className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20">
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-gradient-to-r text-white from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            disabled={spectateByIdMutation.isPending}
                          >
                            {spectateByIdMutation.isPending ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Joining...
                              </div>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Spectate
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              </div>

              {/* Spectatable Games List */}
              <div className="space-y-3">
                {spectatableGamesQuery === undefined ? (
                  <div className="flex justify-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
                    />
                  </div>
                ) : spectatableGamesQuery.page.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Users className="h-12 w-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">No games available for spectating.</p>
                    <p className="text-sm text-white/40">Games will appear here when players are setting up or playing!</p>
                  </motion.div>
                ) : (
                  <>
                    {spectatableGamesQuery.page.map((game, index) => (
                      <motion.div
                        key={game._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all hover:bg-white/10">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-purple-500/20 rounded-lg backdrop-blur-sm">
                                    <Users className="h-5 w-5 text-purple-300" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-white/90">{game.lobbyName || "Battle Arena"}</h3>
                                    <div className="flex items-center gap-2 text-sm text-white/60">
                                      <span>{game.player1Username} vs {game.player2Username}</span>
                                      <Badge 
                                        variant={game.status === "setup" ? "secondary" : "default"}
                                        className={
                                          game.status === "setup" 
                                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                            : "bg-green-500/20 text-green-300 border-green-500/30"
                                        }
                                      >
                                        {game.status === "setup" ? "Setting Up" : "Playing"}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                                      <span>Game ID:</span>
                                      <code className="bg-white/10 px-2 py-1 rounded text-xs font-mono">{game.gameId}</code>
                                      <Button
                                        onClick={() => copyGameId(game.gameId)}
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

                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                  <Users className="h-4 w-4 mr-1" />
                                  {game.spectatorCount || 0}{game.maxSpectators ? `/${game.maxSpectators}` : ""} watching
                                </Badge>
                                <Button
                                  onClick={() => setSpectatingGameId(game._id)}
                                  className="bg-purple-500 hover:bg-purple-600 text-white"
                                  disabled={!!(game.maxSpectators && game.spectatorCount >= game.maxSpectators)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {game.maxSpectators && game.spectatorCount >= game.maxSpectators ? "Full" : "Spectate"}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}

                    {/* Load More Button for Spectatable Games */}
                    {spectatableGamesQuery && !spectatableGamesQuery.isDone && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          onClick={loadMoreLobbies}
                          className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
                          disabled={isLoadingMore}
                        >
                          {isLoadingMore ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                              />
                              Loading...
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              Load More Games
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="leaderboard">
              <Leaderboard />
            </TabsContent>

            <TabsContent value="history">
              <MatchHistory 
                userId={profile.userId} 
                onViewReplay={(gameId) => setReplayGameId(gameId as string)}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}
