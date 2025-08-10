import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Medal } from "lucide-react";
import { MatchItem } from "./MatchItem";
import { Id } from "../../../convex/_generated/dataModel";
import { MatchHistoryHeader } from "./01.match-history-header";
import { LoadingSpinner } from "./04.loading-spinner";
import { ErrorMessage } from "./05.error-message";

interface MatchListProps {
  userId: Id<"users">;
  onViewReplay?: (gameId: Id<"games">) => void;
}

export function MatchList({ userId, onViewReplay }: MatchListProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 8; // Increased from 5 to reduce pagination requests
  
  const { data: matchHistory, isPending, error } = useConvexQuery(api.games.getMatchHistory, { 
    userId,
    paginationOpts: {
      numItems: pageSize,
      cursor,
    },
  });

  // Update matches when new data arrives
  useEffect(() => {
    if (matchHistory) {
      if (cursor === undefined) {
        // First load
        setAllMatches(matchHistory.page || matchHistory.matches || []);
      } else {
        // Load more
        setAllMatches(prev => [...prev, ...(matchHistory.page || [])]);
      }
      setHasMore(!matchHistory.isDone && matchHistory.page?.length === pageSize);
    }
  }, [matchHistory, cursor, pageSize]);

  const loadMore = () => {
    if (matchHistory && !matchHistory.isDone && matchHistory.continueCursor) {
      setCursor(matchHistory.continueCursor);
    }
  };

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (isPending) {
    return <LoadingSpinner />;
  }

  if (!matchHistory || (allMatches.length === 0 && !isPending)) {
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

  const displayMatches = allMatches.length > 0 ? allMatches : (matchHistory?.matches || []);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <MatchHistoryHeader totalMatches={matchHistory?.total || displayMatches.length} />
        {hasMore && (
          <button 
            onClick={loadMore}
            disabled={isPending}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
          >
            {isPending ? "Loading..." : "Load More"}
          </button>
        )}
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {displayMatches.map((match, index: number) => (
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
