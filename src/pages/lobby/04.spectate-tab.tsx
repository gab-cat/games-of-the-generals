import { useState } from "react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";

import { motion } from "framer-motion";
import { Eye, Search, ChevronDown, Loader2, Users } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { EmptyState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { fadeUp, stagger } from "../../lib/motion";
import { cn } from "../../lib/utils";
import {
  BLUE_TEXT,
  ListErrorBoundary,
  ModeStamp,
  RED_TEXT,
} from "./fight-card";

interface SpectateTabProps {
  onSpectateGame: (gameId: string) => void;
  spectateByIdMutation: any;
}

export function SpectateTab(props: SpectateTabProps) {
  return (
    <ListErrorBoundary message="Couldn't load the live games.">
      <LiveGames {...props} />
    </ListErrorBoundary>
  );
}

/** Live games as bouts you can watch: blue corner against red corner. */
function LiveGames({ onSpectateGame, spectateByIdMutation }: SpectateTabProps) {
  const [showSpectateById, setShowSpectateById] = useState(false);
  const [spectateGameId, setSpectateGameId] = useState("");
  const [lobbiesCursor, setLobbiesCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Which row was clicked, so only that button shows the spinner.
  const [openingId, setOpeningId] = useState<string | null>(null);

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

  const hasLive = !!spectatableGamesQuery?.page.length;

  const handleSpectateById = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spectateGameId.trim()) return;

    // The page shows the error toast and moves to the game on success.
    // Keep the dialog open until it works so the ID can be fixed.
    spectateByIdMutation.mutate(
      { gameId: spectateGameId.trim() },
      {
        onSuccess: () => {
          setSpectateGameId("");
          setShowSpectateById(false);
        },
      },
    );
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
            {/* Pulses only while there's something live to watch */}
            <span className="relative flex size-2.5" aria-hidden="true">
              {hasLive && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#ef4b40] opacity-60" />
              )}
              <span
                className={cn(
                  "relative inline-flex size-2.5 rounded-full",
                  hasLive ? "bg-[#ef4b40]" : "bg-foreground/30",
                )}
              />
            </span>
            Live now
          </h2>
          <p className="mt-1 text-sm text-foreground/85">
            Watch a game while it is being played.
          </p>
        </div>

        <Dialog open={showSpectateById} onOpenChange={setShowSpectateById}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="w-full sm:w-auto">
              <Search />
              Watch by game ID
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Watch by game ID</DialogTitle>
              <DialogDescription>
                Paste the ID of a game someone shared with you.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSpectateById} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="spectate-game-id">Game ID</Label>
                <Input
                  id="spectate-game-id"
                  value={spectateGameId}
                  onChange={(e) => setSpectateGameId(e.target.value)}
                  placeholder="Paste the game ID"
                  required
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  disabled={spectateByIdMutation.isPending}
                  className=""
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowSpectateById(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    spectateByIdMutation.isPending || !spectateGameId.trim()
                  }
                >
                  {spectateByIdMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Eye />
                  )}
                  {spectateByIdMutation.isPending ? "Opening" : "Watch game"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 pb-6">
        {spectatableGamesQuery === undefined ? (
          // Same shape as a game row
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_14rem] sm:gap-5 sm:p-4"
              >
                <Skeleton className="h-6 w-28 sm:h-8 sm:w-44" />
                <div className="flex flex-col items-center gap-1.5">
                  <Skeleton className="h-5 w-6" />
                  <Skeleton className="h-4 w-14" />
                </div>
                <Skeleton className="ml-auto h-6 w-28 sm:h-8 sm:w-44" />
                <div className="col-span-3 flex items-center justify-between border-t border-border pt-2 sm:col-span-1 sm:flex-col sm:items-end sm:gap-2 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : spectatableGamesQuery.page.length === 0 ? (
          <EmptyState
            title="No live games right now"
            body="Games show up here while players are in them."
          />
        ) : (
          <>
            <motion.div
              variants={stagger(0.06)}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {spectatableGamesQuery.page.map((game) => {
                const isFull = !!(
                  game.maxSpectators &&
                  game.spectatorCount >= game.maxSpectators
                );
                const isOpening =
                  openingId === game._id && spectateByIdMutation.isPending;
                const watching = game.spectatorCount || 0;
                return (
                  <motion.article
                    key={game._id}
                    variants={fadeUp}
                    aria-label={`${game.player1Username} against ${game.player2Username}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-border-strong sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_14rem] sm:gap-5 sm:p-4"
                  >
                    <p
                      className={cn(
                        "truncate text-lg font-bold leading-tight sm:text-3xl",
                        BLUE_TEXT,
                      )}
                      title={game.player1Username}
                    >
                      {game.player1Username}
                    </p>

                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className="text-lg font-bold text-gold-400 sm:text-2xl"
                        aria-hidden="true"
                      >
                        vs
                      </span>
                      <ModeStamp mode={game.gameMode} />
                    </div>

                    <p
                      className={cn(
                        "truncate text-right text-lg font-bold leading-tight sm:text-3xl",
                        RED_TEXT,
                      )}
                      title={game.player2Username}
                    >
                      {game.player2Username}
                    </p>

                    <div className="col-span-3 flex min-w-0 items-center justify-between gap-3 border-t border-border pt-2 text-sm sm:col-span-1 sm:flex-col sm:items-end sm:justify-center sm:gap-2 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                      <div className="min-w-0 sm:w-full sm:text-right">
                        <p
                          className="truncate font-medium text-foreground"
                          title={game.lobbyName || "Untitled game"}
                        >
                          {game.lobbyName || "Untitled game"}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-foreground/80 sm:justify-end">
                          {game.status === "setup" ? (
                            <span>Setting up</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400">
                              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                              Live
                              {game.moveCount
                                ? ` · move ${game.moveCount}`
                                : ""}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3" aria-hidden="true" />
                            <span className="tabular-nums">
                              {watching}
                              {game.maxSpectators
                                ? `/${game.maxSpectators}`
                                : ""}
                            </span>{" "}
                            watching
                          </span>
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        className="w-28 shrink-0"
                        onClick={() => {
                          setOpeningId(game._id);
                          onSpectateGame(game._id);
                        }}
                        disabled={isFull || spectateByIdMutation.isPending}
                      >
                        {isOpening ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          !isFull && <Eye />
                        )}
                        {isFull ? "Full" : isOpening ? "Opening" : "Watch"}
                      </Button>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>

            {spectatableGamesQuery && !spectatableGamesQuery.isDone && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="secondary"
                  onClick={loadMoreGames}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ChevronDown />
                  )}
                  {isLoadingMore ? "Loading" : "Show more games"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
