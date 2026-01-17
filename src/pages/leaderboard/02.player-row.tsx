import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Crown,
  Target,
  Crosshair,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { UserNameWithBadge } from "@/components/UserNameWithBadge";
import { ExpandableCard } from "@/components/ExpandableCard";
import { ExpandedPlayerStats } from "./06.expanded-player-stats";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useQuery } from "convex-helpers/react/cache";
import { useSound } from "@/lib/SoundProvider";
import { cn } from "@/lib/utils";

interface Player {
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

interface PlayerRowProps {
  player: Player;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PlayerRow({
  player,
  index,
  isExpanded,
  onToggle,
}: PlayerRowProps) {
  const [showCongrats, setShowCongrats] = useState(false);

  // Fetch detailed profile stats when expanded
  const { data: profileStats, isPending: isLoadingStats } =
    useConvexQueryWithOptions(
      api.profiles.getProfileStatsByUsername,
      { username: player.username },
      { enabled: isExpanded },
    );

  // Get current user profile
  const currentProfile = useQuery(api.profiles.getCurrentProfile, {});
  const { playSFX } = useSound();

  // Show congratulations logic (maintained from original)
  useEffect(() => {
    if (
      player.position <= 10 &&
      currentProfile &&
      player.username === currentProfile.username
    ) {
      const storageKey = `leaderboard_congrats_${player.position}_${currentProfile.username}`;
      const lastShown = localStorage.getItem(storageKey);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      const shouldShow = !lastShown || now - parseInt(lastShown) > oneDay;

      if (shouldShow) {
        const timer = setTimeout(
          () => {
            setShowCongrats(true);
            playSFX("leaderboard");
            localStorage.setItem(storageKey, now.toString());
          },
          500 + index * 200,
        );
        return () => clearTimeout(timer);
      }
    }
  }, [player.position, index, currentProfile, player.username, playSFX]);

  const getRankStyles = (position: number) => {
    if (position === 1)
      return {
        border: "border-yellow-500/50",
        bg: "bg-yellow-500/5 hover:bg-yellow-500/10",
        text: "text-yellow-500",
        glow: "shadow-[0_0_30px_-5px_rgba(234,179,8,0.2)]",
        icon: <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />,
      };
    if (position === 2)
      return {
        border: "border-slate-400/50",
        bg: "bg-slate-400/5 hover:bg-slate-400/10",
        text: "text-slate-300",
        glow: "shadow-[0_0_30px_-5px_rgba(148,163,184,0.2)]",
        icon: <Medal className="w-5 h-5 text-slate-400 fill-slate-400/20" />,
      };
    if (position === 3)
      return {
        border: "border-orange-500/50",
        bg: "bg-orange-500/5 hover:bg-orange-500/10",
        text: "text-orange-400",
        glow: "shadow-[0_0_30px_-5px_rgba(249,115,22,0.2)]",
        icon: <Trophy className="w-5 h-5 text-orange-500 fill-orange-500/20" />,
      };
    return {
      border: "border-white/5",
      bg: "bg-zinc-900/40 hover:bg-zinc-800/60",
      text: "text-zinc-500",
      glow: "",
      icon: (
        <span className="font-mono font-bold text-zinc-600">#{position}</span>
      ),
    };
  };

  const rankStyle = getRankStyles(player.position);

  // Expanded content
  const expandedContent = (
    <div className="flex justify-center items-center py-8">
      <div className="w-full max-w-5xl">
        {isLoadingStats ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span className="font-mono text-blue-400 text-xs tracking-widest uppercase animate-pulse">
              Retrieving Dossier...
            </span>
          </div>
        ) : profileStats ? (
          <ExpandedPlayerStats profileStats={profileStats} />
        ) : (
          <div className="text-center py-8 text-red-400 font-mono text-sm border border-red-500/20 bg-red-500/5 rounded-lg">
            Error: Profile Data Corrupted
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <ExpandableCard
        isExpanded={isExpanded}
        onExpand={onToggle}
        onCollapse={onToggle}
        overlay={true}
        overlayClassName="w-full max-w-4xl p-0 bg-transparent shadow-none"
        // contentClassName="bg-zinc-950 border border-white/10 rounded-sm overflow-hidden shadow-2xl"
        expandedContent={expandedContent}
      >
        <div
          className={cn(
            "relative flex items-center gap-4 p-3 sm:p-4 border transition-all duration-300 group cursor-pointer backdrop-blur-sm",
            "rounded-sm", // Sharper corners
            rankStyle.border,
            rankStyle.bg,
            rankStyle.glow,
          )}
        >
          {/* Tech Corners */}
          <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-white/20" />
          <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-white/20" />
          {/* Rank Indicator */}
          <div className="flex items-center justify-center w-10 h-10 shrink-0">
            {rankStyle.icon}
          </div>

          {/* Player Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <UserAvatar
              username={player.username}
              avatarUrl={player.avatarUrl}
              rank={player.rank}
              size="md"
              frame={player.avatarFrame}
              className={cn(
                "ring-2 ring-offset-2 ring-offset-black/50 transition-all duration-300",
                player.position <= 3
                  ? "ring-white/20 group-hover:ring-white/40"
                  : "ring-transparent group-hover:ring-white/10",
              )}
            />

            <div className="flex flex-col min-w-0">
              <UserNameWithBadge
                username={player.username}
                tier={player.tier}
                isDonor={player.isDonor}
                usernameColor={player.usernameColor}
                className="font-display text-lg tracking-wide truncate"
              />
              <div className="flex items-center gap-2">
                <div className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] uppercase font-mono text-zinc-400 flex items-center gap-1">
                  <Crosshair className="w-3 h-3" />
                  {player.rank}
                </div>
                {player.tier && player.tier !== "free" && (
                  <div
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold border",
                      player.tier === "pro_plus"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-400",
                    )}
                  >
                    {player.tier === "pro_plus" ? "General" : "Officer"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats (Desktop) */}
          <div className="hidden sm:grid grid-cols-4 gap-8 mr-4">
            <div className="text-center">
              <div className="text-lg font-mono font-bold text-white">
                {player.elo ?? 1500}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                Rating
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono font-bold text-green-400">
                {player.wins}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                Wins
              </div>
            </div>
            <div className="text-center">
              <div
                className={cn(
                  "text-lg font-mono font-bold",
                  player.winRate >= 60
                    ? "text-blue-400"
                    : player.winRate >= 50
                      ? "text-zinc-300"
                      : "text-zinc-500",
                )}
              >
                {player.winRate.toFixed(1)}%
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                WR
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono font-bold text-white/50">
                {player.gamesPlayed}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                Btls
              </div>
            </div>
          </div>

          {/* Mobile Stats (Compact) */}
          <div className="sm:hidden flex flex-col items-end gap-1">
            <span className="text-sm font-mono font-bold text-white">
              {player.elo ?? 1500} ELO
            </span>
            <span
              className={cn(
                "text-xs font-mono",
                player.winRate >= 50 ? "text-green-400" : "text-zinc-400",
              )}
            >
              {player.winRate.toFixed(0)}% WR
            </span>
          </div>

          {/* Expand Arrow */}
          <div className="pl-2 border-l border-white/5 mx-2">
            <ChevronDown
              className={cn(
                "w-5 h-5 text-zinc-500 transition-transform duration-300",
                isExpanded
                  ? "rotate-180 text-white"
                  : "group-hover:text-zinc-300",
              )}
            />
          </div>
        </div>
      </ExpandableCard>

      {/* Legacy Congrats Modal */}
      <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
        <DialogContent className="border border-yellow-500/20 bg-zinc-950/90 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-display text-yellow-500 uppercase tracking-widest">
              Rank Achievement
            </DialogTitle>
            <DialogDescription className="text-center font-mono text-zinc-400 pt-2">
              Outstanding performance recorded. You have secured a top ranking
              position.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <UserAvatar
              username={player.username}
              avatarUrl={player.avatarUrl}
              rank={player.rank}
              size="xl"
              frame={player.avatarFrame}
              className="ring-4 ring-yellow-500/20"
            />
          </div>
          <div className="text-center space-y-2 pb-4">
            <div className="text-3xl font-mono font-bold text-white">
              #{player.position}
            </div>
            <div className="text-sm text-zinc-500 uppercase tracking-wider">
              Global Leaderboard
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
