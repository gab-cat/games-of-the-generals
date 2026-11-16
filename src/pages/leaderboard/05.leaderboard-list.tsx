import { useEffect, useState } from "react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { LeaderboardHeader } from "./01.leaderboard-header";
import type { Player } from "./02.player-row";
import { LeaderboardLoading } from "./03.leaderboard-loading";
import { LeaderboardError } from "./04.leaderboard-error";
import { RankCongratsDialog } from "./07.rank-congrats-dialog";
import { Podium } from "./08.podium";
import { RankSections, SelfBar } from "./09.rank-sections";

const TOP_TEN = 10;

function bestKey(username: string) {
  return `leaderboard_best_position_${username}`;
}

function readBest(username: string): number | null {
  try {
    const raw = localStorage.getItem(bestKey(username));
    const n = raw === null ? NaN : parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function LeaderboardList() {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [congratsPosition, setCongratsPosition] = useState<number | null>(null);
  const [congratsOpen, setCongratsOpen] = useState(false);

  const {
    data: leaderboardData,
    isPending: isLoadingLeaderboard,
    error: leaderboardError,
  } = useConvexQuery(api.profiles.getLeaderboard, {});

  const { data: currentProfile } = useConvexQuery(
    api.profiles.getCurrentProfile,
  );

  // Extract leaderboard from paginated response. The first page always
  // carries `position` (convex/profiles.ts getLeaderboard).
  const leaderboard = (
    Array.isArray(leaderboardData) ? leaderboardData : leaderboardData?.page || []
  ) as Player[];

  const self = currentProfile
    ? leaderboard.find((p) => p.username === currentProfile.username)
    : undefined;
  const selfPosition: number | undefined = self?.position;
  const selfWins: number = self?.wins ?? 0;
  const selfName: string | undefined = self?.username;

  // Congratulate once, and only when it is true and new: the viewer is on the
  // board, has won games, is in the top ten, and is higher than the best
  // position they were already congratulated for.
  useEffect(() => {
    if (!selfName || !selfPosition || selfWins <= 0) return;
    if (selfPosition > TOP_TEN) return;
    const best = readBest(selfName);
    if (best !== null && selfPosition >= best) return;
    const timer = setTimeout(() => {
      setCongratsPosition(selfPosition);
      setCongratsOpen(true);
      try {
        localStorage.setItem(bestKey(selfName), String(selfPosition));
      } catch {
        // Storage blocked: worst case they see it again next visit.
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [selfName, selfPosition, selfWins]);

  const handlePlayerToggle = (playerId: string) => {
    setExpandedPlayerId(expandedPlayerId === playerId ? null : playerId);
  };

  if (isLoadingLeaderboard) {
    return <LeaderboardLoading />;
  }

  if (leaderboardError) {
    return <LeaderboardError hasError={true} />;
  }

  if (!leaderboard || leaderboard.length === 0) {
    return <LeaderboardError hasError={false} />;
  }

  const toggle = (id: string) => handlePlayerToggle(id);

  return (
    <div className="space-y-6 sm:space-y-8">
      <LeaderboardHeader />

      <Podium
        players={leaderboard.slice(0, 3)}
        selfName={selfName ?? currentProfile?.username}
        expandedId={expandedPlayerId}
        onToggle={toggle}
      />

      {leaderboard.length > 3 && (
        <RankSections
          players={leaderboard.slice(3)}
          selfName={currentProfile?.username}
          expandedId={expandedPlayerId}
          onToggle={toggle}
        />
      )}

      {currentProfile && (
        <SelfBar
          username={currentProfile.username}
          avatarUrl={currentProfile.avatarUrl}
          wins={currentProfile.wins ?? 0}
          rank={currentProfile.rank}
          position={selfPosition}
          boardSize={leaderboard.length}
        />
      )}

      <RankCongratsDialog
        open={congratsOpen}
        position={congratsPosition}
        player={leaderboard.find((p) => p.position === congratsPosition)}
        onClose={() => setCongratsOpen(false)}
      />
    </div>
  );
}
