import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Medal, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Id } from "../../../convex/_generated/dataModel";
import { MatchHistoryHeader } from "./01.match-history-header";
import { LoadingSpinner } from "./04.loading-spinner";
import { ErrorMessage } from "./05.error-message";
import { MatchItem } from "./MatchItem";
import { Button } from "../../components/ui/button";
import { useAutoAnimate } from "../../lib/useAutoAnimate";

interface MatchListProps {
  userId: Id<"users">;
  onViewReplay?: (gameId: Id<"games">) => void;
}

export function MatchList({ userId, onViewReplay }: MatchListProps) {
  const listRef = useAutoAnimate();
  const [currentPage, setCurrentPage] = useState(0);
  const [cursors, setCursors] = useState<{[page: number]: string | undefined}>({ 0: undefined });
  const [hasMorePages, setHasMorePages] = useState<{[page: number]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 8;
  
  // Get the cursor for the current page
  const currentCursor = cursors[currentPage];
  
  // Get match history data with cursor-based pagination
  const { data: matchHistory, isPending, error } = useConvexQuery(api.games.getMatchHistory, { 
    userId,
    paginationOpts: {
      numItems: pageSize,
      cursor: currentCursor,
    },
  });

  // Update cursors and page info when new data arrives
  useEffect(() => {
    if (matchHistory) {
      console.log(`Page ${currentPage}: received ${matchHistory.page?.length || 0} items, hasMore: ${matchHistory.hasMore}, cursor: ${matchHistory.continueCursor}`);
      
      // Update hasMore info for current page
      setHasMorePages(prev => ({
        ...prev,
        [currentPage]: matchHistory.hasMore && !!matchHistory.continueCursor
      }));

      // If there's a next page cursor and we haven't stored it yet, store it
      if (matchHistory.continueCursor && matchHistory.hasMore) {
        const nextPage = currentPage + 1;
        setCursors(prev => {
          if (!(nextPage in prev)) {
            console.log(`Storing cursor for page ${nextPage}: ${matchHistory.continueCursor}`);
            return {
              ...prev,
              [nextPage]: matchHistory.continueCursor
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
      console.log(`Going to previous page: ${currentPage - 1}`);
      setIsLoading(true);
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const canGoNext = hasMorePages[currentPage] === true && (currentPage + 1 in cursors);
    console.log(`Attempting next page. Current: ${currentPage}, canGoNext: ${canGoNext}, hasMore: ${hasMorePages[currentPage]}, nextPageCursor: ${cursors[currentPage + 1]}`);
    
    if (canGoNext) {
      console.log(`Going to next page: ${currentPage + 1} with cursor: ${cursors[currentPage + 1]}`);
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

  if (!matchHistory && !isPending) {
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

  if ((!matchHistory?.page || matchHistory.page.length === 0) && !isPending) {
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

  const canGoPrev = currentPage > 0;
  const canGoNext = hasMorePages[currentPage] === true && (currentPage + 1 in cursors);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <MatchHistoryHeader totalMatches={matchHistory?.page?.length || 0} />
        
        {/* Pagination Controls */}
        {(canGoPrev || canGoNext) && (
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!canGoPrev || isLoading}
              className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-white/70 px-2 min-w-[80px] text-center">
              {isLoading || isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                `Page ${currentPage + 1}`
              )}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!canGoNext || isLoading}
              className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div ref={listRef} className="space-y-2 sm:space-y-3">
        {matchHistory?.page?.map((match, index: number) => (
          <MatchItem
            key={match._id}
            match={match}
            index={index}
            onViewReplay={onViewReplay}
          />
        ))}
      </div>

      {/* Show loading state when navigating pages */}
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-4"
        >
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
        </motion.div>
      )}
    </div>
  );
}
