import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { LeaderboardHeader } from "./01.leaderboard-header";
import { PlayerRow } from "./02.player-row";
import { LeaderboardLoading } from "./03.leaderboard-loading";
import { LeaderboardError } from "./04.leaderboard-error";

export function LeaderboardList() {
  const { data: leaderboard, isPending: isLoadingLeaderboard, error: leaderboardError } = useConvexQuery(
    api.profiles.getLeaderboard, 
    { 
      limit: 15, // Load top 15 instead of 50 for better performance
      offset: 0 
    }
  );

  if (isLoadingLeaderboard) {
    return <LeaderboardLoading />;
  }

  if (leaderboardError) {
    return <LeaderboardError hasError={true} />;
  }

  if (!leaderboard || leaderboard.length === 0) {
    return <LeaderboardError hasError={false} />;
  }

  return (
    <div className="space-y-4">
      <LeaderboardHeader />
      
      <div className="space-y-3">
        {leaderboard.map((player, index) => (
          <PlayerRow 
            key={player._id} 
            player={player} 
            index={index} 
          />
        ))}
      </div>
    </div>
  );
}
