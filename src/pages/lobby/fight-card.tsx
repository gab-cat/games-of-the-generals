/*
 * The lobby's "fight card" look: quick match as a Season 3 title card (you on
 * the blue chevron, whoever's next on the red), every open lobby a bout, and
 * live games as bouts you can watch. Pieces shared by the lobby files.
 */
import { Component, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Eye, RotateCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FixedDigits } from "@/components/ui/fixed-digits";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import {
  CHEVRON,
  Duotone,
  EASE,
  Grain,
  Insignia,
  toPlayerRank,
} from "@/components/season/art";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Army colours as readable text on the dark page. */
export const BLUE_TEXT = "text-[#8fb8ff]";
export const RED_TEXT = "text-[#ff8f86]";

export type GameModeName = "classic" | "blitz" | "reveal";
export const MODE_LABEL: Record<GameModeName, string> = {
  classic: "Classic",
  blitz: "Blitz",
  reveal: "Reveal",
};

/** The game mode as a small printed stamp between the two corners. */
export function ModeStamp({ mode }: { mode?: GameModeName }) {
  const m = mode ?? "classic";
  return (
    <span className="inline-flex -rotate-3 items-center gap-1 rounded border-2 border-[#17110a] bg-[#f3ead8] px-1.5 py-0.5 text-xs font-bold leading-none text-[#17110a]">
      {m === "blitz" && <Zap className="size-3" aria-hidden="true" />}
      {m === "reveal" && <Eye className="size-3" aria-hidden="true" />}
      {MODE_LABEL[m]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Quick match title card                                              */
/* ------------------------------------------------------------------ */

export type Opponent =
  | { kind: "anyone"; elo: number }
  | { kind: "searching"; secondsLeft: number | null }
  | { kind: "waiting"; lobbyName: string }
  | { kind: "joined"; username: string; status: string };

interface HeroProfile {
  username: string;
  avatarUrl?: string;
  avatarFrame?: string;
  rank?: string;
  wins: number;
  elo?: number;
}

/** One half of the painting, cut as a box-art chevron. */
function Half({
  side,
  children,
}: {
  side: "left" | "right";
  children: ReactNode;
}) {
  const left = side === "left";
  return (
    <motion.div
      className="absolute inset-y-0 w-1/2 overflow-hidden"
      style={{
        [left ? "left" : "right"]: 0,
        clipPath: left ? CHEVRON.rightFlat : CHEVRON.leftFlat,
      }}
      initial={{ x: left ? "-105%" : "105%" }}
      animate={{ x: [left ? "-105%" : "105%", left ? "2%" : "-2%", "0%"] }}
      transition={{
        duration: 0.9,
        times: [0, 0.82, 1],
        ease: EASE,
        delay: 0.1,
      }}
    >
      {/* The standoff painting spans both halves: each half shows its own army */}
      <Duotone
        crop="standoff"
        tone={left ? "blue" : "red"}
        className={cn(
          "absolute inset-y-0 w-[200%]",
          left ? "left-0" : "right-0",
        )}
      >
        <Grain />
      </Duotone>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"
      />
      {children}
    </motion.div>
  );
}

export function QuickMatchHero({
  profile,
  opponent,
}: {
  profile: HeroProfile;
  opponent: Opponent;
}) {
  const rank = toPlayerRank(profile.rank, profile.wins);
  const elo = profile.elo ?? 1500;

  return (
    <section
      aria-label="Quick match"
      className="relative h-[250px] overflow-hidden rounded-lg border border-border bg-[#0a0909] sm:h-[360px]"
    >
      <Half side="left">
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 pr-8 sm:p-8 sm:pr-24">
          <UserAvatar
            username={profile.username}
            avatarUrl={profile.avatarUrl}
            frame={profile.avatarFrame}
            size="xl"
            className="h-12 w-12 ring-2 ring-white/40 sm:h-[72px] sm:w-[72px]"
          />
          <h2
            className="truncate text-xl font-bold leading-none text-white sm:text-6xl"
            title={profile.username}
          >
            {profile.username}
          </h2>
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-white/90 sm:text-base">
            <Insignia
              rank={rank}
              className="h-4 shrink-0 text-[#f3ead8] sm:h-5"
            />
            <span className="truncate">{rank}</span>
            <span className="text-white/40" aria-hidden="true">
              ·
            </span>
            <span>{elo}</span>
          </div>
        </div>
      </Half>

      <Half side="right">
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-end gap-1 p-4 pl-8 text-right sm:p-8 sm:pl-24">
          <OpponentCorner opponent={opponent} />
        </div>
      </Half>

      {/* Where the tips meet */}
      <motion.div
        aria-hidden="true"
        // Centring goes through framer's x: an animated transform replaces
        // Tailwind's translate classes, which pushed this off the middle.
        className="pointer-events-none absolute left-1/2 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-gold-200 to-transparent"
        style={{ x: "-50%" }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 1, 0.35], scaleY: [0, 1, 1] }}
        transition={{ duration: 0.7, delay: 0.85, times: [0, 0.25, 1] }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-[12%] text-3xl font-bold leading-none text-gold-400 sm:top-[14%] sm:text-5xl"
        style={{ x: "-50%" }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.3, ease: EASE }}
      >
        vs
      </motion.div>
    </section>
  );
}

function BigMark({ pulse }: { pulse?: boolean }) {
  return (
    <motion.div
      aria-hidden="true"
      className="text-7xl font-bold leading-[0.8] text-white sm:text-[9rem]"
      initial={{ opacity: 0, scale: 1.4 }}
      animate={
        pulse ? { opacity: [1, 0.45, 1], scale: 1 } : { opacity: 1, scale: 1 }
      }
      transition={
        pulse
          ? { opacity: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }
          : { delay: 0.95, duration: 0.35, ease: EASE }
      }
    >
      ?
    </motion.div>
  );
}

/** 598 → "9:58" */
function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function OpponentCorner({ opponent }: { opponent: Opponent }) {
  switch (opponent.kind) {
    case "anyone":
      return (
        <>
          <BigMark />
          <p className="text-sm font-medium text-white/90 sm:text-base">
            Anyone near {opponent.elo}
          </p>
        </>
      );
    case "searching":
      return (
        <div role="status" className="flex flex-col items-end gap-1">
          <BigMark pulse />
          <p className="text-sm font-medium text-white sm:text-base">
            Finding an opponent
          </p>
          {opponent.secondsLeft !== null && (
            <p className="text-xs text-white/85 sm:text-sm">
              Stops in{" "}
              <FixedDigits>{formatClock(opponent.secondsLeft)}</FixedDigits>
            </p>
          )}
        </div>
      );
    case "waiting":
      return (
        <div
          role="status"
          className="flex min-w-0 max-w-full flex-col items-end gap-1"
        >
          <BigMark pulse />
          <p className="text-sm font-medium text-white sm:text-base">
            Waiting for an opponent
          </p>
          <p
            className="max-w-full truncate text-xs text-white/85 sm:text-sm"
            title={opponent.lobbyName}
          >
            {opponent.lobbyName}
          </p>
        </div>
      );
    case "joined":
      return (
        <motion.div
          role="status"
          className="flex min-w-0 max-w-full flex-col items-end gap-2"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <p
            className="max-w-full truncate text-xl font-bold leading-none text-white sm:text-6xl"
            title={opponent.username}
          >
            {opponent.username}
          </p>
          <p className="text-sm font-medium text-white/90 sm:text-base">
            {opponent.status}
          </p>
        </motion.div>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Bouts                                                               */
/* ------------------------------------------------------------------ */

/** Rank insignia, rank and rating for a player in a bout corner. */
export function CornerRecord({
  rank,
  wins,
  elo,
  className,
}: {
  rank?: string;
  wins?: number;
  elo?: number;
  className?: string;
}) {
  const r = toPlayerRank(rank, wins ?? 0);
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-xs text-foreground/80 sm:text-sm",
        className,
      )}
    >
      <Insignia rank={r} className="h-3.5 shrink-0 text-foreground/80" />
      <span className="truncate">
        {r}
        {elo !== undefined && ` · ${elo}`}
      </span>
    </div>
  );
}

/** The shape of a bout while lobbies load, so nothing jumps. */
export function BoutSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-[minmax(0,1fr)_auto_6.5rem] items-center gap-2 rounded-lg border border-border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_14rem] sm:gap-5 sm:p-4"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="hidden h-11 w-11 shrink-0 rounded-full sm:block" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32 sm:h-8 sm:w-48" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Skeleton className="h-5 w-6" />
        <Skeleton className="h-4 w-14" />
      </div>
      <Skeleton className="h-14 w-full sm:h-[60px]" />
      <div className="col-span-3 flex items-center justify-between border-t border-border pt-2 sm:col-span-1 sm:flex-col sm:items-end sm:gap-2 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/** No open lobbies: one empty bout and the action that fills it. */
export function EmptyBout({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="rounded-lg border border-border bg-card p-4 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6"
      >
        <div className="flex h-20 items-center justify-center rounded-md border-2 border-dashed border-[#3b82f6]/45 sm:h-28">
          <span className={cn("text-xl font-bold sm:text-4xl", BLUE_TEXT)}>
            You?
          </span>
        </div>
        <span className="text-xl font-bold text-gold-400 sm:text-3xl">vs</span>
        <div className="flex h-20 items-center justify-center rounded-md border-2 border-dashed border-[#ef4b40]/45 sm:h-28">
          <span className={cn("text-xl font-bold sm:text-4xl", RED_TEXT)}>
            ?
          </span>
        </div>
      </div>
      <div className="mt-5 flex flex-col items-center gap-3 text-center sm:mt-6">
        <p className="text-xl font-semibold text-foreground sm:text-2xl">
          {title}
        </p>
        <p className="max-w-md text-sm text-foreground/85">{body}</p>
        {action}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

/**
 * A list query that fails throws while rendering. Catch it here, say so in
 * plain words, and let the player try again (remounting resubscribes).
 */
export class ListErrorBoundary extends Component<
  { message: string; children: ReactNode },
  { failed: boolean; attempt: number }
> {
  state = { failed: false, attempt: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-10 text-center"
        >
          <p className="text-base font-medium text-foreground">
            {this.props.message}
          </p>
          <p className="text-sm text-foreground/85">
            Check your connection, then try again.
          </p>
          <Button
            variant="secondary"
            onClick={() =>
              this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }))
            }
          >
            <RotateCw />
            Try again
          </Button>
        </div>
      );
    }
    return <div key={this.state.attempt}>{this.props.children}</div>;
  }
}
