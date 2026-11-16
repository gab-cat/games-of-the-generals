import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useNavigate } from "@tanstack/react-router";
import { LeaderboardHeader } from "./01.leaderboard-header";

interface LeaderboardErrorProps {
  hasError: boolean;
}

export function LeaderboardError({ hasError }: LeaderboardErrorProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 sm:space-y-8">
      <LeaderboardHeader />
      {hasError ? (
        <EmptyState
          title="The leaderboard didn't load"
          body="Check your connection and try again."
          action={
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="No ranked players yet"
          body="Win a game to be the first on the board."
          action={
            <Button onClick={() => void navigate({ to: "/" })}>
              Find a game
            </Button>
          }
        />
      )}
    </div>
  );
}
