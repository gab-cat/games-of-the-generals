import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "@/components/season/art";
import { formatDate, formatExact } from "../match-history/format";
import { percentOf, ribbonStripes, type Progress } from "./progress";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: number;
  /** From the server, in percent. Rarely set; the profile-based count wins. */
  progress?: number;
}

/** Progress shown for a locked ribbon: the profile count, else the server's percent. */
export type RibbonProgress = { count: Progress | null; percent: number };

export const ribbonItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
};

/**
 * One ribbon bar. Earned: full colour with a woven texture and a thin metal
 * edge. Locked: the same stripes, muted, behind a dashed outline, with the
 * part already earned filled in at full colour and a gold line under it.
 */
export function Ribbon({
  achievement,
  progress,
  selected,
  onSelect,
  className,
}: {
  achievement: Achievement;
  progress: RibbonProgress;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  const bg = useMemo(() => ribbonStripes(achievement.id), [achievement.id]);
  const { unlocked } = achievement;
  const pct = progress.percent;
  const label = unlocked
    ? `${achievement.name}. Earned`
    : progress.count
      ? `${achievement.name}. ${progress.count.current} of ${progress.count.target} ${progress.count.unit}`
      : `${achievement.name}. Locked`;

  return (
    <motion.button
      type="button"
      variants={ribbonItem}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={label}
      className={cn(
        "group relative h-10 w-full overflow-hidden rounded-[3px] outline-none transition-transform duration-150 ease-out",
        "hover:-translate-y-0.5 active:scale-[0.98]",
        "focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected && "ring-2 ring-gold-400 ring-offset-2 ring-offset-background",
        className,
      )}
    >
      {unlocked ? (
        <>
          <span className="absolute inset-0" style={{ backgroundImage: bg }} />
          <span
            className="absolute inset-0 opacity-30 mix-blend-multiply"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0 1px, transparent 1px 3px)",
            }}
          />
          <span className="absolute inset-x-0 top-0 h-px bg-[#f3d28a]/70" />
          <span className="absolute inset-x-0 bottom-0 h-px bg-black/50" />
        </>
      ) : (
        <>
          {/* The whole ribbon, muted, so it reads as a goal */}
          <span
            className="absolute inset-0 opacity-40 grayscale-[0.35] transition-opacity group-hover:opacity-55"
            style={{ backgroundImage: bg }}
          />
          {/* The part already earned, at full colour */}
          <motion.span
            className="absolute inset-y-0 left-0 overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
          >
            <span
              className="absolute inset-y-0 left-0"
              style={{
                backgroundImage: bg,
                width: pct > 0 ? `${10000 / pct}%` : "100%",
              }}
            />
          </motion.span>
          <span className="absolute inset-0 rounded-[3px] border border-dashed border-foreground/45" />
          {pct > 0 && (
            <motion.span
              className="absolute bottom-0 left-0 h-[3px] bg-gold-400"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.4 }}
            />
          )}
        </>
      )}
    </motion.button>
  );
}

/** The ribbon with its name and count under it, for the full list. */
export function RibbonTile({
  achievement,
  progress,
  selected,
  onSelect,
}: {
  achievement: Achievement;
  progress: RibbonProgress;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Ribbon
        achievement={achievement}
        progress={progress}
        selected={selected}
        onSelect={onSelect}
      />
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate text-foreground" title={achievement.name}>
          {achievement.name}
        </span>
        {!achievement.unlocked && progress.count && (
          <span className="shrink-0 text-xs text-foreground/80">
            {progress.count.current}/{progress.count.target}
          </span>
        )}
      </div>
    </div>
  );
}

/** What the ribbon under the pointer, focus or last tap is for. */
export function RibbonDetail({
  achievement,
  progress,
}: {
  achievement: Achievement;
  progress: RibbonProgress;
}) {
  const bg = ribbonStripes(achievement.id);
  return (
    <motion.div
      key={achievement.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="space-y-4"
    >
      <div
        className={cn(
          "h-10 w-full rounded-[3px]",
          !achievement.unlocked && "opacity-45 grayscale-[0.35]",
        )}
        style={{ backgroundImage: bg }}
      />
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-foreground">
          {achievement.name}
        </h3>
        <p className="text-sm text-foreground">{achievement.description}</p>
      </div>
      {achievement.unlocked ? (
        <p className="text-sm text-emerald-400">
          Earned
          {achievement.unlockedAt ? (
            <>
              {" "}
              <time
                title={formatExact(achievement.unlockedAt)}
                dateTime={new Date(achievement.unlockedAt).toISOString()}
              >
                {formatDate(achievement.unlockedAt)}
              </time>
            </>
          ) : null}
        </p>
      ) : progress.count ? (
        <div className="space-y-2">
          <div className="flex justify-between gap-3 text-sm text-foreground">
            <span>Progress</span>
            <span>
              {progress.count.current} of {progress.count.target}{" "}
              {progress.count.unit}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentOf(progress.count)}
            aria-label={`${achievement.name} progress`}
          >
            <div
              className="h-full bg-gold-500 transition-[width] duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      ) : progress.percent > 0 ? (
        <p className="text-sm text-foreground">{progress.percent}% of the way</p>
      ) : (
        <p className="text-sm text-foreground">Earned in a single game.</p>
      )}
    </motion.div>
  );
}
