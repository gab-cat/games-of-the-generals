import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { useQuery } from "convex-helpers/react/cache";
import { motion } from "framer-motion";
import {
  Target,
  Crown,
  Calendar,
  Clock,
  Trophy,
  Play,
  Swords,
  Skull,
  Flag,
  Hand,
  XOctagon,
  MonitorSmartphone,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface MatchItemProps {
  match: {
    _id: Id<"games">;
    gameId: Id<"games">;
    opponentUsername: string;
    isWin: boolean;
    isDraw: boolean;
    lobbyName: string | undefined;
    createdAt: number;
    duration: number;
    moves: number;
    rankAtTime: string;
    reason: string;
  };
  index: number;
  onViewReplay?: (gameId: Id<"games">) => void;
}

export function MatchItem({ match, index, onViewReplay }: MatchItemProps) {
  const opponentProfile = useQuery(api.profiles.getProfileByUsername, {
    username: match.opponentUsername,
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case "flag_captured":
        return <Flag className="w-3.5 h-3.5" />;
      case "flag_reached_base":
        return <Target className="w-3.5 h-3.5" />;
      case "timeout":
        return <Clock className="w-3.5 h-3.5" />;
      case "surrender":
        return <Hand className="w-3.5 h-3.5" />;
      case "elimination":
        return <Skull className="w-3.5 h-3.5" />;
      default:
        return <XOctagon className="w-3.5 h-3.5" />;
    }
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case "flag_captured":
        return "Flag Seized";
      case "flag_reached_base":
        return "Base Breached";
      case "timeout":
        return "Time Limit";
      case "surrender":
        return "Forfeited";
      case "elimination":
        return "Force Wipeout";
      default:
        return "Terminated";
    }
  };

  // Status Styles
  const isWin = match.isWin;
  const isDraw = match.isDraw;
  const isLoss = !isWin && !isDraw;

  const statusColor = isWin
    ? "bg-green-500/10 border-green-500/20 hover:border-green-500/40"
    : isDraw
      ? "bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40"
      : "bg-red-500/10 border-red-500/20 hover:border-red-500/40";

  const glowColor = isWin
    ? "shadow-[0_0_15px_-3px_rgba(34,197,94,0.1)]"
    : isDraw
      ? "shadow-[0_0_15px_-3px_rgba(234,179,8,0.1)]"
      : "shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <div
        className={cn(
          "relative flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-3 sm:p-4 border-b border-r border-t border-white/5 backdrop-blur-sm transition-all duration-300",
          statusColor,
          glowColor,
          "hover:bg-opacity-20",
          // Sharper corners for command center vibe
          "rounded-sm",
        )}
      >
        {/* Status Indicator Bar */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1",
            isWin ? "bg-green-500" : isDraw ? "bg-yellow-500" : "bg-red-500",
          )}
        />

        {/* Tech decorative corner */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20" />

        {/* Date & Time Section (Compact) */}
        <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 text-[10px] font-mono text-zinc-500 w-full sm:w-20 shrink-0 border-b sm:border-b-0 border-white/5 pb-2 sm:pb-0">
          <span className="text-zinc-400 uppercase tracking-widest">
            {formatDate(match.createdAt)}
          </span>
          <span className="hidden sm:inline text-zinc-600">
            {formatTime(match.createdAt)}
          </span>
          <div className="sm:hidden w-px h-3 bg-white/10 mx-1" />
          <span className="sm:hidden">{formatTime(match.createdAt)}</span>
        </div>

        {/* Match Info & Rivals */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar
                username={match.opponentUsername}
                avatarUrl={opponentProfile?.avatarUrl}
                rank={opponentProfile?.rank}
                size="sm"
                frame={opponentProfile?.avatarFrame}
                className={cn(
                  "ring-2 ring-offset-2 ring-offset-black/50",
                  isWin
                    ? "ring-red-500/50 grayscale opacity-80"
                    : "ring-green-500/50",
                )}
              />
              {isWin && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-black text-[8px] font-bold px-1 rounded-sm border border-green-400">
                  DEF
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide truncate">
                  vs {match.opponentUsername}
                </span>
                <div
                  className={cn(
                    "text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border",
                    isWin
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : isDraw
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30",
                  )}
                >
                  {isWin ? "Victory" : isDraw ? "Draw" : "Defeat"}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                {match.lobbyName && (
                  <span className="flex items-center gap-1">
                    <MonitorSmartphone className="w-3 h-3" />
                    {match.lobbyName}
                  </span>
                )}
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="flex items-center gap-1 font-mono">
                  <Trophy className="w-3 h-3" />
                  {match.rankAtTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 py-2 sm:py-0 border-t sm:border-t-0 sm:border-l border-white/5 sm:pl-6">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] text-zinc-600 uppercase font-mono tracking-wider mb-0.5">
              Time
            </span>
            <span className="text-sm font-mono text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-zinc-500" />
              {formatDuration(match.duration)}
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] text-zinc-600 uppercase font-mono tracking-wider mb-0.5">
              Moves
            </span>
            <span className="text-sm font-mono text-zinc-300 flex items-center gap-1.5">
              <Swords className="w-3 h-3 text-zinc-500" />
              {match.moves}
            </span>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] text-zinc-600 uppercase font-mono tracking-wider mb-0.5">
              Outcome
            </span>
            <span
              className={cn(
                "text-xs font-mono flex items-center gap-1.5",
                isWin
                  ? "text-green-400"
                  : isDraw
                    ? "text-yellow-400"
                    : "text-red-400",
              )}
            >
              {getReasonIcon(match.reason)}
              <span className="truncate max-w-[80px] sm:max-w-[100px]">
                {getReasonText(match.reason)}
              </span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        {onViewReplay && (
          <div className="flex sm:flex-col justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewReplay(match.gameId)}
              className="h-8 w-8 p-0 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 hover:border-white/20 transition-all"
            >
              <Play className="h-3.5 w-3.5 ml-0.5" />
              <span className="sr-only">Replay</span>
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
