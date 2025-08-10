import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { motion } from "framer-motion";
import { Medal } from "lucide-react";

import { Id } from "../../../convex/_generated/dataModel";
import { MatchHistoryHeader } from "./01.match-history-header";
import { PaginationControls } from "./02.pagination-controls";
import { LoadingSpinner } from "./04.loading-spinner";
import { ErrorMessage } from "./05.error-message";
import { MatchItem } from "./MatchItem";

interface MatchListProps {
  userId: Id<"users">;
  onViewReplay?: (gameId: Id<"games">) => void;
}

export function MatchList({ userId, onViewReplay }: MatchListProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 8; // Increased from 5 to reduce pagination requests
  
  const { data: matchHistory, isPending, error } = useConvexQuery(api.games.getMatchHistory, { 
    userId,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (isPending) {
    return <LoadingSpinner />;
  }

  if (!matchHistory || matchHistory.matches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Medal className="h-12 w-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60">No battle history yet.</p>
        <p className="text-sm text-white/40">Fight your first battle to start your legend!</p>
      </motion.div>
    );
  }

  const totalPages = Math.ceil(matchHistory.total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <MatchHistoryHeader totalMatches={matchHistory.total} />
        <PaginationControls 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>
      
      <div className="space-y-2">
        {matchHistory.matches.map((match, index: number) => (
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
