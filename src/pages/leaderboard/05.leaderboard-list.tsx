import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { LeaderboardHeader } from "./01.leaderboard-header";
import { PlayerRow } from "./02.player-row";
import { LeaderboardLoading } from "./03.leaderboard-loading";
import { LeaderboardError } from "./04.leaderboard-error";
import { useAutoAnimate } from "../../lib/useAutoAnimate";

export function LeaderboardList() {
  const listRef = useAutoAnimate();
  const { data: leaderboardData, isPending: isLoadingLeaderboard, error: leaderboardError } = useConvexQuery(
    api.profiles.getLeaderboard,
    {} // Use default pagination settings
  );

  // Extract leaderboard from paginated response
  const leaderboard = Array.isArray(leaderboardData) ? leaderboardData : leaderboardData?.page || [];

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
      
      <div ref={listRef} className="space-y-3">
        {leaderboard.map((player: any, index: number) => (
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
