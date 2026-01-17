import { useState } from "react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";

import { motion } from "framer-motion";
import { Eye, Users, Search, ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/button";

import { Badge } from "../../components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";

interface SpectateTabProps {
  onSpectateGame: (gameId: string) => void;
  spectateByIdMutation: any;
}

export function SpectateTab({
  onSpectateGame,
  spectateByIdMutation,
}: SpectateTabProps) {
  const [showSpectateById, setShowSpectateById] = useState(false);
  const [spectateGameId, setSpectateGameId] = useState("");
  const [lobbiesCursor, setLobbiesCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const LOBBIES_PER_PAGE = 10;

  const { data: spectatableGamesQuery } = useConvexQuery(
    api.spectate.getSpectatableGames,
    {
      paginationOpts: {
        numItems: LOBBIES_PER_PAGE,
        cursor: lobbiesCursor || undefined,
      },
    },
  );

  const handleSpectateById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spectateGameId.trim()) return;

    spectateByIdMutation.mutate({ gameId: spectateGameId.trim() });
    setSpectateGameId("");
    setShowSpectateById(false);
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-8">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-12 h-12 bg-purple-500/10 rounded-sm border border-purple-500/20 flex items-center justify-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-purple-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Eye className="h-6 w-6 text-purple-400 relative z-10" />

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-purple-500/50" />
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-purple-500/50" />
            </motion.div>

            <div className="flex flex-col">
              <h2 className="text-xl font-display font-medium text-white tracking-wide">
                Live <span className="text-purple-400">Feed</span>
              </h2>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Real-time Combat Telemetry
              </p>
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
              <Button
                variant="outline"
                className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-mono text-xs uppercase tracking-wider h-10 gap-2 shadow-lg"
              >
                <Search className="h-3.5 w-3.5" />
                Input Coordinates
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border border-white/10 text-zinc-100">
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-purple-500/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-purple-500/30" />

              <DialogHeader>
                <DialogTitle className="text-white font-display uppercase tracking-widest text-lg flex items-center gap-2">
                  <span className="w-1 h-5 bg-purple-500 block" />
                  Target Acquisition
                </DialogTitle>
                <DialogDescription className="text-zinc-500 font-mono text-xs">
                  Enter encrypted Game ID to establish a specific visual link.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => void handleSpectateById(e)}
                className="space-y-6 mt-4"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-purple-400 uppercase tracking-widest ml-1">
                    Game Identifier
                  </label>
                  <Input
                    value={spectateGameId}
                    onChange={(e) => setSpectateGameId(e.target.value)}
                    placeholder="ENTER_ID_STRING"
                    required
                    disabled={spectateByIdMutation.isPending}
                    className="bg-black/40 border-white/10 text-white placeholder:text-white/20 font-mono tracking-wider focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 h-11"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSpectateById(false)}
                    className="bg-transparent border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white font-mono text-xs uppercase tracking-wider h-10"
                  >
                    Abort
                  </Button>
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-500 text-white border-t border-white/20 font-mono text-xs uppercase tracking-widest h-10 px-6 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                    disabled={spectateByIdMutation.isPending}
                  >
                    {spectateByIdMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </div>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5 mr-2" />
                        Establish Link
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
      <div className="space-y-4">
        {spectatableGamesQuery === undefined ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 border-2 border-purple-500/50 border-t-purple-400 rounded-full"
            />
          </div>
        ) : spectatableGamesQuery.page.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border border-dashed border-white/5 rounded-sm bg-white/[0.02]"
          >
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Users className="h-6 w-6 text-zinc-600" />
            </div>
            <h3 className="text-zinc-300 font-display text-lg mb-1">
              Sector Clear
            </h3>
            <p className="text-zinc-500 text-xs font-mono uppercase tracking-wide">
              No active combat simulations detected in this grid.
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              {spectatableGamesQuery.page.map((game, index) => (
                <motion.div
                  key={game._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="group relative bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-sm p-4 hover:bg-zinc-900/80 transition-all duration-300 overflow-hidden">
                    {/* Accents */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500/0 via-purple-500/50 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 relative z-10">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Icon */}
                        <div className="w-10 h-10 bg-black/40 border border-white/10 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:border-purple-500/30 transition-colors">
                          <Users className="h-5 w-5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-medium text-zinc-200 text-base truncate group-hover:text-purple-200 transition-colors">
                              {game.lobbyName || "Combat Zone"}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-sm px-1.5 py-0 text-[9px] font-mono uppercase tracking-wider border-0",
                                game.status === "setup"
                                  ? "bg-yellow-500/10 text-yellow-500"
                                  : "bg-green-500/10 text-green-500",
                              )}
                            >
                              {game.status === "setup"
                                ? "• PREPARING"
                                : "• LIVE COMBAT"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                            <span className="text-zinc-400">
                              {game.player1Username}
                            </span>
                            <span className="text-zinc-600">VS</span>
                            <span className="text-zinc-400">
                              {game.player2Username}
                            </span>
                            <span className="text-zinc-700">|</span>
                            <span className="text-zinc-600" title="Game ID">
                              ID: {game.gameId}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-sm border border-white/5">
                          <Users className="h-3 w-3 text-zinc-500" />
                          <span className="text-xs font-mono text-zinc-400">
                            <span className="text-zinc-200">
                              {game.spectatorCount || 0}
                            </span>
                            {game.maxSpectators ? `/${game.maxSpectators}` : ""}{" "}
                            watching
                          </span>
                        </div>

                        <Button
                          onClick={() => onSpectateGame(game._id)}
                          className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:border-purple-500/50 w-full sm:w-auto font-mono text-xs uppercase tracking-widest h-9 shadow-[0_0_10px_rgba(147,51,234,0.1)] hover:shadow-[0_0_15px_rgba(147,51,234,0.2)] transition-all"
                          disabled={
                            !!(
                              game.maxSpectators &&
                              game.spectatorCount >= game.maxSpectators
                            )
                          }
                        >
                          {game.maxSpectators &&
                          game.spectatorCount >= game.maxSpectators ? (
                            "Channel Full"
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              Tune In
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Load More Button for Spectatable Games */}
            {spectatableGamesQuery && !spectatableGamesQuery.isDone && (
              <div className="flex justify-center pt-6">
                <Button
                  variant="outline"
                  onClick={loadMoreGames}
                  className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-xs uppercase tracking-widest h-10 w-48"
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-2"
                      />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-2" />
                      Scan Next Sector
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
