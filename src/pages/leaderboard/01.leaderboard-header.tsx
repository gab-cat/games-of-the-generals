import { PageHeader } from "@/components/ui/page-header";

export function LeaderboardHeader() {
  return (
    <PageHeader
      className="mb-0 sm:mb-0"
      title="Leaderboard"
      description="Ranked by wins. Ranks come from wins too: 3 for Sergeant, 50 for General. Select a player to see their stats."
    />
  );
}
