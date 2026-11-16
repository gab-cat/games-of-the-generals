import { LeaderboardList } from "./05.leaderboard-list";
import { UpgradeDonationCTA } from "../../components/subscription/UpgradeDonationCTA";

export function LeaderboardPage() {
  return (
    <>
      <div className="w-full">
        <LeaderboardList />
      </div>
      <UpgradeDonationCTA />
    </>
  );
}
