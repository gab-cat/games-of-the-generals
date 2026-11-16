import { motion } from "framer-motion";
import { plural } from "../match-history/format";

interface PerformanceInsightsProps {
  profileStats: {
    wins: number;
    losses: number;
    gamesPlayed: number;
    winRate: number;
    elo: number;
    rank: string;
    totalPlayTime?: number;
    avgGameTime?: number;
  };
}

const STARTING_RATING = 1500;

/** Everything here is computed from the player's real record. */
export function PerformanceInsights({
  profileStats,
}: PerformanceInsightsProps) {
  const { wins, losses, gamesPlayed } = profileStats;
  const draws = Math.max(0, gamesPlayed - wins - losses);
  const rating = profileStats.elo ?? STARTING_RATING;
  const delta = rating - STARTING_RATING;

  if (gamesPlayed === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border-strong px-4 py-8 text-center text-sm text-foreground/80">
        Insights show up after the first finished game.
      </p>
    );
  }

  const segments = [
    { label: "Wins", count: wins, className: "bg-emerald-500" },
    { label: "Draws", count: draws, className: "bg-white/30" },
    { label: "Losses", count: losses, className: "bg-red-500" },
  ].filter((s) => s.count > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-foreground">Record</h3>
        <p className="mt-1 text-sm text-foreground/80">
          {plural(wins, "win")}, {plural(losses, "loss", "losses")}
          {draws > 0 ? `, ${plural(draws, "draw")}` : ""} in{" "}
          {plural(gamesPlayed, "game")}.
        </p>
        <div
          className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-sm"
          role="img"
          aria-label={`${plural(wins, "win")} and ${plural(losses, "loss", "losses")}`}
        >
          {segments.map((s) => (
            <motion.div
              key={s.label}
              initial={{ width: 0 }}
              animate={{ width: `${(s.count / gamesPlayed) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={s.className}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/80">
          {segments.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-sm ${s.className}`} />
              {s.label}{" "}
              <span className="tabular-nums">{s.count}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-foreground">Rating</h3>
        <p className="mt-1 text-sm text-foreground/80">
          {delta === 0
            ? `At the starting rating of ${STARTING_RATING}.`
            : `${Math.abs(delta)} ${delta > 0 ? "above" : "below"} the starting rating of ${STARTING_RATING}.`}
        </p>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-medium tabular-nums text-foreground">
            {rating}
          </span>
          {delta !== 0 && (
            <span
              className={` text-sm tabular-nums ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {delta > 0 ? "+" : "-"}
              {Math.abs(delta)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
