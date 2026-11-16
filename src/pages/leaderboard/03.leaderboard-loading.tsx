import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardHeader } from "./01.leaderboard-header";

/** Mirrors the podium and the first rank sections, so nothing jumps on load. */
export function LeaderboardLoading() {
  return (
    <div role="status" aria-label="Loading the leaderboard" className="space-y-6 sm:space-y-8">
      <LeaderboardHeader />
      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-[300px] rounded-lg sm:h-[380px]" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <Skeleton className="h-[180px] rounded-lg sm:h-[182px]" />
          <Skeleton className="h-[180px] rounded-lg sm:h-[182px]" />
        </div>
      </div>
      {[0, 1].map((s) => (
        <div
          key={s}
          className="grid gap-3 border-t border-border pt-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6"
        >
          <div className="flex items-center gap-3 sm:flex-col sm:items-start">
            <Skeleton className="h-8 w-12 sm:h-10" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-1">
            {[0, 1, 2].map((r) => (
              <div key={r} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="ml-auto h-4 w-10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
