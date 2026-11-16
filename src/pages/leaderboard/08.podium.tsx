import { motion } from "framer-motion";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Duotone, EASE, Grain, Insignia, toPlayerRank } from "@/components/season/art";
import { cn } from "@/lib/utils";
import { PlayerExpandable, rowId, type Player } from "./02.player-row";

const TONE = ["gold", "blue", "red"] as const;
const CROP = ["summit", "march", "march"] as const;

/**
 * One of the top three as a poster: the painting as a two-colour print
 * (gold for first, the two army colours for second and third), the place
 * number cut off by the edge, the name and wins at poster size.
 */
function PodiumCard({
  player,
  place,
  isSelf,
  isExpanded,
  onToggle,
}: {
  player: Player;
  place: 0 | 1 | 2;
  isSelf: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const first = place === 0;
  const rank = toPlayerRank(player.rank, player.wins);
  const winRate = Math.round(player.winRate);

  return (
    <motion.div
      id={rowId(player.username)}
      className="scroll-mt-24"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + place * 0.12, duration: 0.5, ease: EASE }}
    >
      <PlayerExpandable player={player} isExpanded={isExpanded} onToggle={onToggle}>
        <div
          className={cn(
            "group relative flex flex-col justify-end overflow-hidden rounded-lg border text-left transition-colors",
            isSelf ? "border-gold-400/70" : "border-white/10 hover:border-white/30",
            first ? "min-h-[300px] sm:min-h-[380px]" : "min-h-[180px] sm:min-h-[182px]",
          )}
        >
          <Duotone
            crop={CROP[place]}
            tone={TONE[place]}
            className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]"
          >
            <Grain />
          </Duotone>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute select-none font-bold leading-none text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.55)]",
              first
                ? "-right-3 -top-8 text-[220px] sm:-top-10 sm:text-[300px]"
                : "-right-2 -top-4 text-[90px] sm:-top-5 sm:text-[150px]",
            )}
          >
            {player.position}
          </div>

          <div className={cn("relative flex flex-col", first ? "gap-4 p-5 sm:p-7" : "gap-2 p-4")}>
            <div className="flex items-center gap-3">
              <UserAvatar
                username={player.username}
                avatarUrl={player.avatarUrl}
                frame={player.avatarFrame}
                size={first ? "xl" : "md"}
                className={cn("shrink-0", first && "sm:h-20 sm:w-20")}
              />
              <Insignia
                rank={rank}
                className={cn(first ? "h-7 text-gold-200" : "h-5 text-white/90")}
              />
              {isSelf && <Badge className="ml-auto shrink-0">You</Badge>}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "font-bold leading-[0.95] tracking-tight text-white [overflow-wrap:anywhere]",
                  first ? "text-[28px] sm:text-6xl" : "text-base sm:text-2xl",
                )}
                title={player.username}
              >
                {player.username}
              </p>
              <p className={cn("mt-1 text-white/85", first ? "text-sm sm:text-base" : "text-xs sm:text-sm")}>
                {rank} · {winRate}% win rate
                <span className={cn(!first && "hidden sm:inline")}> · {player.elo ?? 1500} rating</span>
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn("font-bold leading-none text-white", first ? "text-6xl sm:text-7xl" : "text-3xl")}>
                {player.wins}
              </span>
              <span className={cn("text-white/85", first ? "text-base" : "text-xs")}>
                {player.wins === 1 ? "win" : "wins"}
              </span>
            </div>
          </div>
        </div>
      </PlayerExpandable>
    </motion.div>
  );
}

export function Podium({
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
  const [first, second, third] = players;
  if (!first) return null;
  const card = (p: Player, place: 0 | 1 | 2) => (
    <PodiumCard
      player={p}
      place={place}
      isSelf={p.username === selfName}
      isExpanded={expandedId === p._id}
      onToggle={() => onToggle(p._id)}
    />
  );
  return (
    <div className={cn("grid gap-3", second && "lg:grid-cols-[1.6fr_1fr]")}>
      {card(first, 0)}
      {second && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {card(second, 1)}
          {third && card(third, 2)}
        </div>
      )}
    </div>
  );
}
