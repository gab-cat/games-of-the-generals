import { useState } from "react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, Users, Search, Copy, ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";

interface SpectateTabProps {
  onSpectateGame: (gameId: string) => void;
  spectateByIdMutation: any;
}

export function SpectateTab({ onSpectateGame, spectateByIdMutation }: SpectateTabProps) {
  const [showSpectateById, setShowSpectateById] = useState(false);
  const [spectateGameId, setSpectateGameId] = useState("");
  const [lobbiesCursor, setLobbiesCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const LOBBIES_PER_PAGE = 10;

  const { data: spectatableGamesQuery } = useConvexQuery(api.spectate.getSpectatableGames, {
    paginationOpts: {
      numItems: LOBBIES_PER_PAGE,
      cursor: lobbiesCursor || undefined,
    },
  });

  const handleSpectateById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spectateGameId.trim()) return;

    spectateByIdMutation.mutate({ gameId: spectateGameId.trim() });
    setSpectateGameId("");
    setShowSpectateById(false);
  };

  const copyGameId = (gameId: string) => {
    void navigator.clipboard.writeText(gameId);
    toast.success("Game ID copied to clipboard!");
  };

  const loadMoreGames = () => {
    if (spectatableGamesQuery?.continueCursor) {
      setIsLoadingMore(true);
      setLobbiesCursor(spectatableGamesQuery.continueCursor);
      // Reset loading state after a brief delay to show animation
      setTimeout(() => setIsLoadingMore(false), 500);
    }
  };

  return (
    <>
      {/* Spectate by ID Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-red-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            >
              <Eye className="h-6 w-6 sm:h-7 sm:w-7 text-purple-400" />
            </motion.div>

            <div className="flex flex-col text-center sm:text-left">
              <h2 className="text-left text-lg sm:text-xl font-bold text-white/90">Spectate Games</h2>
              <p className="text-xs sm:text-sm text-white/60">Watch ongoing battles in real-time</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center sm:justify-end"
        >
          <Dialog open={showSpectateById} onOpenChange={setShowSpectateById}>
            <DialogTrigger asChild>
              <Button variant='gradient' className="flex items-center gap-2 transition-all w-full sm:w-auto">
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
                    variant="gradient"
                    className="transition-all"
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-purple-500/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                            <Users className="h-5 w-5 text-purple-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white/90 truncate">{game.lobbyName || "Battle Arena"}</h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-white/60">
                              <span className="truncate text-xs sm:text-sm">{game.player1Username} vs {game.player2Username}</span>
                              <Badge
                                variant={game.status === "setup" ? "secondary" : "default"}
                                className={
                                  game.status === "setup"
                                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs w-fit"
                                    : "bg-green-500/20 text-green-300 border-green-500/30 text-xs w-fit"
                                }
                              >
                                {game.status === "setup" ? "Setting Up" : "Playing"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                              <span>Game ID:</span>
                              <code className="bg-white/10 px-1 sm:px-2 py-1 rounded text-xs font-mono truncate flex-1 min-w-0">{game.gameId}</code>
                              <Button
                                onClick={() => copyGameId(game.gameId)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-white/50 hover:text-white/80 hover:bg-white/10 flex-shrink-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3">
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 w-fit mx-auto sm:mx-0">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="text-xs sm:text-sm">{game.spectatorCount || 0}{game.maxSpectators ? `/${game.maxSpectators}` : ""} watching</span>
                        </Badge>
                        <Button
                          onClick={() => onSpectateGame(game._id)}
                          className="bg-purple-500 hover:bg-purple-600 text-white w-full sm:w-auto"
                          disabled={!!(game.maxSpectators && game.spectatorCount >= game.maxSpectators)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          <span className="text-sm">{game.maxSpectators && game.spectatorCount >= game.maxSpectators ? "Full" : "Spectate"}</span>
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
                  onClick={loadMoreGames}
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
    </>
  );
}
