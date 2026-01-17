import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, FileWarning } from "lucide-react";

import { Id } from "../../../convex/_generated/dataModel";
import { MatchHistoryHeader } from "./01.match-history-header";
import { LoadingSpinner } from "./04.loading-spinner";
import { ErrorMessage } from "./05.error-message";
import { MatchItem } from "./MatchItem";
import { Button } from "../../components/ui/button";
import { useAutoAnimate } from "../../lib/useAutoAnimate";
import { cn } from "@/lib/utils";

interface MatchListProps {
  userId: Id<"users">;
  onViewReplay?: (gameId: Id<"games">) => void;
}

export function MatchList({ userId, onViewReplay }: MatchListProps) {
  const listRef = useAutoAnimate();
  const [currentPage, setCurrentPage] = useState(0);
  const [cursors, setCursors] = useState<{
    [page: number]: string | undefined;
  }>({ 0: undefined });
  const [hasMorePages, setHasMorePages] = useState<{ [page: number]: boolean }>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 8;

  // Get the cursor for the current page
  const currentCursor = cursors[currentPage];

  // Get match history data with cursor-based pagination
  const {
    data: matchHistory,
    isPending,
    error,
  } = useConvexQuery(api.games.getMatchHistory, {
    userId,
    paginationOpts: {
      numItems: pageSize,
      cursor: currentCursor,
    },
  });

  // Update cursors and page info when new data arrives
  useEffect(() => {
    if (matchHistory) {
      setHasMorePages((prev) => ({
        ...prev,
        [currentPage]: matchHistory.hasMore && !!matchHistory.continueCursor,
      }));

      if (matchHistory.continueCursor && matchHistory.hasMore) {
        const nextPage = currentPage + 1;
        setCursors((prev) => {
          if (!(nextPage in prev)) {
            return {
              ...prev,
              [nextPage]: matchHistory.continueCursor,
            };
          }
          return prev;
        });
      }

      setIsLoading(false);
    }
  }, [matchHistory, currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setIsLoading(true);
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const canGoNext =
      hasMorePages[currentPage] === true && currentPage + 1 in cursors;
    if (canGoNext) {
      setIsLoading(true);
      setCurrentPage(currentPage + 1);
    }
  };

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (isPending && currentPage === 0) {
    return <LoadingSpinner />;
  }

  if ((!matchHistory?.page || matchHistory.page.length === 0) && !isPending) {
    return (
      <div className="space-y-6">
        <MatchHistoryHeader totalMatches={0} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 bg-zinc-900/40 rounded-xl border border-white/5 border-dashed"
        >
          <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 text-zinc-600">
            <FileWarning className="w-8 h-8" />
          </div>
          <h3 className="text-zinc-300 font-display text-lg mb-1">
            No Combat Logs Found
          </h3>
          <p className="text-zinc-500 text-sm font-mono text-center max-w-xs">
            Commander, your service record is empty. Engage in battles to
            populate this archival stream.
          </p>
        </motion.div>
      </div>
    );
  }

  const canGoPrev = currentPage > 0;
  const canGoNext =
    hasMorePages[currentPage] === true && currentPage + 1 in cursors;

  return (
    <div className="space-y-6">
      <MatchHistoryHeader totalMatches={matchHistory?.page?.length || 0} />

      <div ref={listRef} className="space-y-3">
        {matchHistory?.page?.map((match, index: number) => (
          <MatchItem
            key={match._id}
            match={match}
            index={index}
            onViewReplay={onViewReplay}
          />
        ))}
      </div>

      {/* Pagination Controls - Tactical Style */}
      {(canGoPrev || canGoNext) && (
        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Sector {currentPage + 1}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevPage}
              disabled={!canGoPrev || isLoading}
              className={cn(
                "h-8 w-8 p-0 rounded-lg hover:bg-white/5",
                !canGoPrev || isLoading
                  ? "opacity-30 cursor-not-allowed"
                  : "text-zinc-300 hover:text-white",
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="font-mono text-xs text-zinc-400 min-w-[32px] text-center">
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin mx-auto" />
              ) : (
                currentPage + 1
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextPage}
              disabled={!canGoNext || isLoading}
              className={cn(
                "h-8 w-8 p-0 rounded-lg hover:bg-white/5",
                !canGoNext || isLoading
                  ? "opacity-30 cursor-not-allowed"
                  : "text-zinc-300 hover:text-white",
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
