import { SectionHeader } from "../../components/ui/page-header";
import { RecordGrid } from "./03.battle-stats";

export interface PastSeason {
  season: number;
  elo: number;
  rank: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  bestWinStreak: number;
  place: number;
}

// Season 3 reset everyone's stats; records from before it are saved as season 2.
function seasonTitle(season: number) {
  return season === 2 ? "Seasons 1 and 2" : `Season ${season}`;
}

export function PastSeasons({
  seasons,
  isOwnProfile,
}: {
  seasons: PastSeason[];
  isOwnProfile: boolean;
}) {
  return (
    <div className="space-y-8 sm:space-y-10">
      {seasons.map((s) => (
        <section key={s.season}>
          <SectionHeader
            title={seasonTitle(s.season)}
            description={
              isOwnProfile
                ? "Your final record, saved when Season 3 started."
                : "Their final record, saved when Season 3 started."
            }
          />
          <RecordGrid
            size="sm"
            className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
            rows={[
              { label: "Final rating", value: s.elo, tone: "text-gold-400" },
              { label: "Rating place", value: `#${s.place.toLocaleString("en-US")}` },
              { label: "Rank", value: s.rank },
              { label: "Wins", value: s.wins.toLocaleString("en-US"), tone: "text-emerald-400" },
              { label: "Losses", value: s.losses.toLocaleString("en-US"), tone: "text-red-400" },
              { label: "Best streak", value: s.bestWinStreak },
            ]}
          />
        </section>
      ))}
    </div>
  );
}
