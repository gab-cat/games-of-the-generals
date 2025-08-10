import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Medal } from "lucide-react";

import { Id } from "../../../convex/_generated/dataModel";
import { MatchHistoryHeader } from "./01.match-history-header";
import { LoadingSpinner } from "./04.loading-spinner";
import { ErrorMessage } from "./05.error-message";
import { PaginationControls } from "./02.pagination-controls";
import { MatchItem } from "./MatchItem";

interface MatchListProps {
  userId: Id<"users">;
  onViewReplay?: (gameId: Id<"games">) => void;
}

export function MatchList({ userId, onViewReplay }: MatchListProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [cursors, setCursors] = useState<Record<number, string | null>>({ 0: null });
  const pageSize = 8;
  
  // Get match history data with server-side pagination
  const { data: matchHistory, isPending, error } = useConvexQuery(api.games.getMatchHistory, { 
    userId,
    paginationOpts: {
      numItems: pageSize,
      cursor: cursors[currentPage] || undefined,
    },
  });

  // Update cursors when new data arrives
  useEffect(() => {
    if (matchHistory?.continueCursor && matchHistory.continueCursor.trim() !== "") {
      const nextPage = currentPage + 1;
      setCursors(prev => {
        // Only update if we don't already have this cursor
        if (!prev[nextPage]) {
          return {
            ...prev,
            [nextPage]: matchHistory.continueCursor
          };
        }
        return prev;
      });
    }
  }, [matchHistory?.continueCursor, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 0) return;
    setCurrentPage(page);
  };

  // Calculate total pages more accurately
  const hasNextPage = matchHistory?.hasMore ?? false;
  // We know we have at least currentPage + 1 pages, and if there's more data, we can show a next page
  const totalPages = hasNextPage ? currentPage + 2 : Math.max(currentPage + 1, 1);

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (isPending) {
    return <LoadingSpinner />;
  }

  if (!matchHistory || matchHistory.page.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8 sm:py-12 px-4"
      >
        <Medal className="h-10 w-10 sm:h-12 sm:w-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60 text-sm sm:text-base">No battle history yet.</p>
        <p className="text-xs sm:text-sm text-white/40">Fight your first battle to start your legend!</p>
      </motion.div>
    );
  }

  // Use a rough estimate for total matches - show current page items plus some if there are more
  const totalMatches = (currentPage * pageSize) + matchHistory.page.length + (hasNextPage ? pageSize : 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-row justify-between mb-4 sm:mb-6">
        <MatchHistoryHeader totalMatches={totalMatches} />
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {matchHistory.page.map((match, index: number) => (
          <MatchItem
            key={match._id}
            match={match}
            index={index}
            onViewReplay={onViewReplay}
          />
        ))}
      </div>


    </div>
  );
}
