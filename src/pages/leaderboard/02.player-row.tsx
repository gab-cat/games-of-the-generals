import { motion } from "framer-motion";
import { X } from "lucide-react";

import { UserAvatar } from "@/components/UserAvatar";
import { UserNameWithBadge } from "@/components/UserNameWithBadge";
import { ExpandableCard } from "@/components/ExpandableCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EASE } from "@/components/season/art";
import {
  ExpandedPlayerStats,
  ExpandedPlayerStatsSkeleton,
} from "./06.expanded-player-stats";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";

export interface Player {
  _id: string;
  username: string;
  avatarUrl?: string;
  rank: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  elo: number;
  position: number;
  tier?: "free" | "pro" | "pro_plus";
  isDonor?: boolean;
  usernameColor?: string;
  avatarFrame?: string;
}

/** The id a player's row carries, so "Find me" can scroll to it. */
export function rowId(username: string) {
  return `leaderboard-${username}`;
}

/**
 * Anything on the board you can open: a podium card or a row. Opening it
 * shows the player's stats in an overlay, loaded only when it opens.
 */
export function PlayerExpandable({
  player,
  isExpanded,
  onToggle,
  className,
  children,
}: {
  player: Player;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const { data: profileStats, isPending: isLoadingStats } =
    useConvexQueryWithOptions(
      api.profiles.getProfileStatsByUsername,
      { username: player.username },
      { enabled: isExpanded },
    );

  const expandedContent = (
    <div className="rounded-lg border border-border-strong bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-5">
        <span className="min-w-0 truncate text-sm font-medium text-foreground">
          {player.username}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 h-9 w-9"
          onClick={onToggle}
          aria-label="Close player stats"
        >
          <X />
        </Button>
      </div>
      {isLoadingStats ? (
        <ExpandedPlayerStatsSkeleton />
      ) : profileStats ? (
        <ExpandedPlayerStats profileStats={profileStats} />
      ) : (
        <p className="px-5 py-10 text-center text-sm text-foreground">
          This player's stats didn't load. Close this and try again.
        </p>
      )}
    </div>
  );

  return (
    <ExpandableCard
      isExpanded={isExpanded}
      onExpand={onToggle}
      onCollapse={onToggle}
      overlay={true}
      overlayClassName="max-w-3xl"
      overlayLabel={`${player.username}'s stats`}
      expandedContent={expandedContent}
      className={className}
    >
      {children}
    </ExpandableCard>
  );
}

/** Shared by the rows and the loading skeleton so columns line up. */
export const ROW_GRID =
  "grid items-center gap-x-3 grid-cols-[2rem_minmax(0,1fr)_3rem] sm:grid-cols-[2.5rem_minmax(0,1fr)_4rem_4rem_4rem]";

interface PlayerRowProps {
  player: Player;
  isExpanded: boolean;
  onToggle: () => void;
  /** True when this row is the signed-in viewer. */
  isSelf?: boolean;
  /** Position in the list, for the staggered entrance. */
  index?: number;
}

/** One player under their rank's heading. */
export function PlayerRow({
  player,
  isExpanded,
  onToggle,
  isSelf = false,
  index = 0,
}: PlayerRowProps) {
  const rating = player.elo ?? 1500;
  const winRate = Math.round(player.winRate);

  return (
    <motion.div
      id={rowId(player.username)}
      className="scroll-mt-24"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.3 + Math.min(index, 12) * 0.035,
        duration: 0.28,
        ease: EASE,
      }}
    >
      <PlayerExpandable player={player} isExpanded={isExpanded} onToggle={onToggle}>
        <div
          className={cn(
            ROW_GRID,
            "rounded-lg px-3 py-2.5 transition-colors sm:px-4",
            isSelf
              ? "bg-gold-500/[0.08] ring-1 ring-inset ring-gold-500/40 hover:bg-gold-500/[0.12]"
              : "hover:bg-white/[0.04]",
          )}
        >
          <span className="text-right text-sm font-semibold text-foreground/80">
            {player.position}
          </span>

          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              username={player.username}
              avatarUrl={player.avatarUrl}
              size="md"
              frame={player.avatarFrame}
              className="shrink-0"
            />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <UserNameWithBadge
                  username={player.username}
                  tier={player.tier}
                  isDonor={player.isDonor}
                  usernameColor={player.usernameColor}
                  size="md"
                  className="min-w-0"
                />
                {isSelf && (
                  <Badge className="shrink-0" variant="default">
                    You
                  </Badge>
                )}
              </div>
              <div className="truncate text-xs text-foreground/70 sm:hidden">
                {winRate}% won · {rating} rating
              </div>
            </div>
          </div>

          <span className="text-right text-base font-semibold text-foreground">
            {player.wins}
          </span>
          <span className="hidden text-right text-sm text-foreground/85 sm:block">
            {winRate}%
          </span>
          <span className="hidden text-right text-sm text-foreground/85 sm:block">
            {rating}
          </span>
        </div>
      </PlayerExpandable>
    </motion.div>
  );
}
