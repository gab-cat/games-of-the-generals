import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { UserAvatar } from "@/components/UserAvatar";
import {
  EASE,
  Insignia,
  PLAYER_RANKS,
  nextRank,
  toPlayerRank,
  type PlayerRank,
} from "@/components/season/art";
import { cn } from "@/lib/utils";
import { PlayerRow, rowId, type Player } from "./02.player-row";

/** Everyone below the podium, grouped under their rank, General first. */
export function RankSections({
  players,
  selfName,
  expandedId,
  onToggle,
}: {
  players: Player[];
  selfName?: string;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  const groups = PLAYER_RANKS.map((r) => ({
    rank: r.name,
    minWins: r.minWins,
    players: players.filter((p) => toPlayerRank(p.rank, p.wins) === r.name),
  })).filter((g) => g.players.length > 0);

  let index = 0;
  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const start = index;
        index += g.players.length;
        return (
          <RankSection
            key={g.rank}
            rank={g.rank}
            minWins={g.minWins}
            players={g.players}
            startIndex={start}
            selfName={selfName}
            expandedId={expandedId}
            onToggle={onToggle}
          />
        );
      })}
    </div>
  );
}

function RankSection({
  rank,
  minWins,
  players,
  startIndex,
  selfName,
  expandedId,
  onToggle,
}: {
  rank: PlayerRank;
  minWins: number;
  players: Player[];
  startIndex: number;
  selfName?: string;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  const count = `${players.length} ${players.length === 1 ? "player" : "players"}`;
  return (
    <section
      aria-label={`${rank}, ${count}`}
      className="grid gap-2 border-t border-border pt-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6"
    >
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 + startIndex * 0.02, duration: 0.35, ease: EASE }}
        className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-3 sm:pt-2"
      >
        <Insignia
          rank={rank}
          className={cn("h-7 sm:h-10", rank === "General" ? "text-gold-400" : "text-foreground")}
        />
        <div>
          <h2 className="text-lg font-semibold leading-tight sm:text-2xl">{rank}</h2>
          <p className="text-xs text-foreground/70 sm:text-sm">
            {minWins === 0 ? "Under 3 wins" : `${minWins}+ wins`} · {count}
          </p>
        </div>
      </motion.div>
      <div>
        {players.map((p, i) => (
          <PlayerRow
            key={p._id}
            player={p}
            index={startIndex + i}
            isSelf={p.username === selfName}
            isExpanded={expandedId === p._id}
            onToggle={() => onToggle(p._id)}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * The viewer's own standing, pinned to the bottom of the screen: their
 * place when they're on the board, and how many wins to the next rank.
 */
export function SelfBar({
  username,
  avatarUrl,
  avatarFrame,
  wins,
  rank: rawRank,
  position,
  boardSize,
}: {
  username: string;
  avatarUrl?: string;
  avatarFrame?: string;
  wins: number;
  rank?: string;
  position?: number;
  boardSize: number;
}) {
  const rank = toPlayerRank(rawRank, wins);
  const next = nextRank(wins);
  const from = PLAYER_RANKS.find((r) => r.name === rank)!.minWins;
  const pct = next ? Math.min(100, ((wins - from) / (next.minWins - from)) * 100) : 100;
  const toGo = next ? next.minWins - wins : 0;

  const findMe = () => {
    const el = document.getElementById(rowId(username));
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Brief highlight so the eye lands on it.
    el.animate?.(
      [{ opacity: 0.4 }, { opacity: 1 }],
      { duration: 500, easing: "ease-out" },
    );
  };

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.4, ease: EASE }}
      className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 mt-6"
    >
      <div className="overflow-hidden rounded-lg border border-gold-500/40 bg-[#15120c]">
        <div className="flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
          <Insignia rank={rank} className="h-6 shrink-0 text-gold-400" />
          <UserAvatar
            username={username}
            avatarUrl={avatarUrl}
            frame={avatarFrame}
            size="sm"
            className="hidden shrink-0 sm:flex"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {position ? `You're #${position}` : `You're not in the top ${boardSize} yet`}
              <span className="block font-normal text-foreground/85 sm:inline">
                <span className="hidden sm:inline"> · </span>
                {wins} {wins === 1 ? "win" : "wins"}
                {next ? ` · ${toGo} more to ${next.name}` : " · Top rank"}
              </span>
            </p>
            <div
              className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"
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
                transition={{ delay: 0.9, duration: 0.8, ease: EASE }}
              />
            </div>
          </div>
          {position ? (
            <button
              type="button"
              onClick={findMe}
              className="h-10 shrink-0 rounded-md bg-white/[0.06] px-3 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]"
            >
              Find me
            </button>
          ) : (
            <Link
              to="/"
              className="inline-flex h-10 shrink-0 items-center rounded-md bg-white/[0.06] px-3 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]"
            >
              Find a game
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
