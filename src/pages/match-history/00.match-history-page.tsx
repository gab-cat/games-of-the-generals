import { useNavigate } from "@tanstack/react-router";
import { Id } from "../../../convex/_generated/dataModel";
import { MatchList } from "./03.match-list";

interface MatchHistoryPageProps {
  userId: Id<"users">;
}

export function MatchHistoryPage({ userId }: MatchHistoryPageProps) {
  const navigate = useNavigate();

  const handleViewReplay = (gameId: Id<"games">) => {
    void navigate({ to: "/replay", search: { gameId } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <MatchList userId={userId} onViewReplay={handleViewReplay} />
    </div>
  );
}
