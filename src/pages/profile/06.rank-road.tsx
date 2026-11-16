import { motion } from "framer-motion";
import {
  EASE,
  Insignia,
  PLAYER_RANKS,
  nextRank,
  toPlayerRank,
} from "@/components/season/art";
import { cn } from "@/lib/utils";
import { plural } from "../match-history/format";

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
};

/**
 * All seven ranks in a row, Private to General, lit up to the player's
 * current one, with the bar filling toward the next. Ranks come from wins
 * (updateProfileStats in convex/profiles.ts).
 */
export function RankRoad({
  wins,
  rank: rawRank,
  isOwnProfile,
}: {
  wins: number;
  rank?: string;
  isOwnProfile: boolean;
}) {
  const rank = toPlayerRank(rawRank, wins);
  const next = nextRank(wins);
  const ladder = [...PLAYER_RANKS].reverse(); // Private → General
  const currentIndex = ladder.findIndex((r) => r.name === rank);
  const current = ladder[currentIndex];
  const toGo = next ? Math.max(next.minWins - wins, 0) : 0;
  // The bar runs from the centre of the current rank's cell toward the next.
  const step = next
    ? Math.min(1, Math.max(0, (wins - current.minWins) / (next.minWins - current.minWins)))
    : 0;
  const pct = ((currentIndex + 0.5 + step) / ladder.length) * 100;

  return (
    <section className="space-y-4" aria-labelledby="rank-road-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="rank-road-title" className="text-lg font-semibold text-foreground">
          {next ? `Road to ${next.name}` : "Top rank"}
        </h3>
        <p className="text-sm text-foreground">
          {next
            ? `${plural(toGo, "win")} to go`
            : isOwnProfile
              ? "You've reached General"
              : "Reached General"}
        </p>
      </div>
      <motion.ol
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.3 } } }}
        className="grid grid-cols-7 gap-1 sm:gap-2"
      >
        {ladder.map((r) => {
          const reached = wins >= r.minWins;
          const isCurrent = r.name === rank;
          const isNext = next?.name === r.name;
          return (
            <motion.li
              key={r.name}
              variants={item}
              aria-current={isCurrent ? "step" : undefined}
              title={`${r.name}: ${r.minWins === 0 ? "from the start" : `${r.minWins} wins`}`}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border px-1 py-3 text-center sm:py-4",
                isCurrent
                  ? "border-gold-500/50 bg-gold-500/10 text-gold-400"
                  : isNext
                    ? "border-dashed border-border-strong text-foreground"
                    : reached
                      ? "border-border text-foreground"
                      : "border-border text-foreground/30",
              )}
            >
              <Insignia rank={r.name} className="h-5 sm:h-7" />
              <span className="hidden text-xs sm:block">{r.name}</span>
              <span className="text-[11px] text-foreground/60 sm:text-xs">{r.minWins}</span>
            </motion.li>
          );
        })}
      </motion.ol>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/[0.06]"
        role="progressbar"
        aria-label={next ? `Progress to ${next.name}` : "Top rank reached"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
      >
        <motion.div
          className="h-full bg-gold-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
        />
      </div>
      <p className="text-sm text-foreground sm:hidden">
        {rank} now{next ? `. ${next.name} at ${next.minWins} wins.` : "."}
      </p>
    </section>
  );
}
