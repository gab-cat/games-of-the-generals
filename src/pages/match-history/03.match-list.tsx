import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
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
  const pageSize = 8;
  
  // Get match history data
  const { data: matchHistory, isPending, error } = useConvexQuery(api.games.getMatchHistory, { 
    userId,
    paginationOpts: {
      numItems: pageSize,
    },
  });

  // Since the API returns all matches in one go, we'll handle pagination client-side
  const allMatches = matchHistory?.matches || matchHistory?.page || [];
  const totalMatches = allMatches.length;
  const totalPages = Math.ceil(totalMatches / pageSize);
  
  // Get current page data
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageMatches = allMatches.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (isPending) {
    return <LoadingSpinner />;
  }

  if (!matchHistory || allMatches.length === 0) {
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

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="mb-4 sm:mb-6">
        <MatchHistoryHeader totalMatches={totalMatches} />
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {currentPageMatches.map((match, index: number) => (
          <MatchItem
            key={match._id}
            match={match}
            index={index}
            onViewReplay={onViewReplay}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
