import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { ReplayLimitCTA } from "./ReplayLimitCTA";
import { Id } from "../../../convex/_generated/dataModel";
import { MatchHistoryHeader } from "./01.match-history-header";
import { PaginationControls } from "./02.pagination-controls";
import { LoadingSpinner } from "./04.loading-spinner";
import { ErrorMessage } from "./05.error-message";
import { MatchItem } from "./MatchItem";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { fadeUp, stagger } from "../../lib/motion";

interface MatchListProps {
  userId: Id<"users">;
  onViewReplay?: (gameId: Id<"games">) => void;
}

export function MatchList({ userId, onViewReplay }: MatchListProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [cursors, setCursors] = useState<{
    [page: number]: string | Id<"games"> | undefined;
  }>({ 0: undefined });
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

  const { data: subscription } = useConvexQuery(
    api.subscriptions.getCurrentSubscription,
    {},
  );

  // Determine if user is limited
  const isFreeTier = subscription?.tier === "free";
  const showReplayLimitCTA =
    isFreeTier && (matchHistory?.page?.length || 0) > 0;

  // Update cursors when new data arrives
  useEffect(() => {
    if (matchHistory?.continueCursor && matchHistory.hasMore) {
      const nextPage = currentPage + 1;
      setCursors((prev) => {
        if (prev[nextPage] !== matchHistory.continueCursor) {
          return {
            ...prev,
            [nextPage]: matchHistory.continueCursor ?? undefined,
          };
        }
        return prev;
      });
    }
    setIsLoading(false);
  }, [matchHistory, currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setIsLoading(true);
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (matchHistory?.hasMore && matchHistory.continueCursor) {
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
      <div>
        <MatchHistoryHeader />
        <EmptyState
          title="No games yet"
          body="Finished games show up here, and you can replay them."
          action={
            <Button onClick={() => void navigate({ to: "/" })}>
              Play a game
            </Button>
          }
        />
      </div>
    );
  }

  const canGoPrev = currentPage > 0;
  const canGoNext = !!matchHistory?.hasMore && !!matchHistory?.continueCursor;

  return (
    <div>
      <MatchHistoryHeader />
      {showReplayLimitCTA && <ReplayLimitCTA />}

      <motion.ul
        key={currentPage}
        variants={stagger(0.03)}
        initial="hidden"
        animate="show"
        className="space-y-2"
      >
        {matchHistory?.page?.map((match) => (
          <motion.li key={match._id} variants={fadeUp}>
            <MatchItem match={match} onViewReplay={onViewReplay} />
          </motion.li>
        ))}
      </motion.ul>

      <PaginationControls
        currentPage={currentPage}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        isLoading={isLoading}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
      />
    </div>
  );
}
