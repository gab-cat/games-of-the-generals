import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

/** Rows shaped like the real match rows. */
export function LoadingSpinner() {
  return (
    <div role="status" aria-label="Loading match history">
      <PageHeader
        title="Match history"
        description="Your finished games. Open one to watch it back move by move."
      />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:px-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
