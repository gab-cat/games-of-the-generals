import { motion } from "framer-motion";
import { EASE } from "@/components/season/art";
import { cn } from "@/lib/utils";
import { formatSpan } from "../match-history/format";

interface BattleStatsProps {
  profileStats: {
    winStreak?: number;
    bestWinStreak?: number;
    totalPlayTime?: number;
    avgGameTime?: number;
    fastestWin?: number;
    longestGame?: number;
    capturedFlags?: number;
    piecesEliminated?: number;
    spiesRevealed?: number;
    wins: number;
    losses?: number;
    gamesPlayed?: number;
    winRate?: number;
    rank: string;
    elo: number;
  };
}

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
};

type Row = { label: string; value: string | number; tone?: string };

/** Numbers set like a printed record: big figures on thin rules, no cards. */
function RecordGrid({
  rows,
  size,
  className,
}: {
  rows: Row[];
  size: "lg" | "sm";
  className?: string;
}) {
  return (
    <motion.dl
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } } }}
      className={cn("grid border-t border-border", className)}
    >
      {rows.map((r) => (
        <motion.div
          key={r.label}
          variants={item}
          className={cn("border-b border-border pr-4", size === "lg" ? "py-4" : "py-3")}
        >
          <dt className="text-sm text-foreground/80">{r.label}</dt>
          <dd
            className={cn(
              "font-bold leading-tight text-foreground",
              size === "lg"
                ? "text-3xl tracking-[-0.03em] sm:text-4xl"
                : "text-xl tracking-[-0.02em]",
              r.tone,
            )}
          >
            {r.value}
          </dd>
        </motion.div>
      ))}
    </motion.dl>
  );
}

export function BattleStats({ profileStats }: BattleStatsProps) {
  const span = (ms?: number, empty = "None") => (ms ? formatSpan(ms) : empty);
  const games = profileStats.gamesPlayed ?? 0;

  return (
    <div className="space-y-6">
      <RecordGrid
        size="lg"
        className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
        rows={[
          { label: "Rating", value: profileStats.elo ?? 1500, tone: "text-gold-400" },
          { label: "Wins", value: profileStats.wins, tone: "text-emerald-400" },
          { label: "Losses", value: profileStats.losses ?? 0, tone: "text-red-400" },
          {
            label: "Win rate",
            value: games > 0 ? `${Math.round(profileStats.winRate ?? 0)}%` : "None",
          },
          { label: "Games", value: games },
          { label: "Best streak", value: profileStats.bestWinStreak || 0 },
        ]}
      />
      <RecordGrid
        size="sm"
        className="grid-cols-2 sm:grid-cols-4"
        rows={[
          { label: "Win streak", value: profileStats.winStreak || 0 },
          { label: "Flags captured", value: profileStats.capturedFlags || 0 },
          { label: "Pieces taken", value: profileStats.piecesEliminated || 0 },
          { label: "Spies found", value: profileStats.spiesRevealed || 0 },
          { label: "Time played", value: span(profileStats.totalPlayTime, "0m") },
          { label: "Average game", value: span(profileStats.avgGameTime) },
          { label: "Fastest win", value: span(profileStats.fastestWin) },
          { label: "Longest game", value: span(profileStats.longestGame) },
        ]}
      />
    </div>
  );
}
