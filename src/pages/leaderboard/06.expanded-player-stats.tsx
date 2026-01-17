import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Flame,
  Clock,
  Timer,
  Flag,
  Swords,
  TrendingUp,
  Gamepad2,
  Trophy,
  Eye,
  Skull,
  Crosshair,
  Activity,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileStats {
  username: string;
  avatarUrl?: string;
  rank: string;
  createdAt: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  elo: number;
  winStreak?: number;
  bestWinStreak?: number;
  totalPlayTime?: number;
  avgGameTime?: number;
  fastestWin?: number;
  longestGame?: number;
  capturedFlags?: number;
  piecesEliminated?: number;
  spiesRevealed?: number;
  recentGames?: any[];
  bio?: string;
  userId?: string;
  avatarFrame?: string;
}

interface ExpandedPlayerStatsProps {
  profileStats: ProfileStats;
}

const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function ExpandedPlayerStats({
  profileStats,
}: ExpandedPlayerStatsProps) {
  // Calculate combat rating (just a fun derived metric)
  const combatRating = Math.min(
    100,
    Math.round(
      profileStats.winRate * 0.6 + ((profileStats.elo ?? 1500) / 3000) * 40,
    ),
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6"
    >
      {/* Left Column: Identity & Core Stats */}
      <div className="md:col-span-4 space-y-4">
        {/* Identity Card */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-sm p-4 relative overflow-hidden group">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
          <div className="absolute top-0 right-0 p-2">
            <Activity className="w-4 h-4 text-zinc-600 group-hover:text-green-500 transition-colors" />
          </div>

          <div className="flex flex-col items-center py-4">
            <div className="relative mb-4">
              <UserAvatar
                username={profileStats.username}
                avatarUrl={profileStats.avatarUrl}
                rank={profileStats.rank}
                size="xl"
                frame={profileStats.avatarFrame}
                className="w-24 h-24 sm:w-32 sm:h-32 shadow-2xl ring-4 ring-black/50"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                ID: {profileStats.userId?.slice(-6).toUpperCase() || "UNKNOWN"}
              </div>
            </div>

            <h2 className="text-2xl font-display text-white mb-1 tracking-wide">
              {profileStats.username}
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="outline"
                className="bg-white/5 border-white/10 text-zinc-400 font-mono tracking-wider text-[10px] uppercase"
              >
                {profileStats.rank}
              </Badge>
              <span className="text-[10px] font-mono text-zinc-600">
                Recruited: {formatDate(profileStats.createdAt)}
              </span>
            </div>

            {profileStats.bio && (
              <div className="w-full bg-black/30 p-3 rounded border border-white/5 text-center">
                <p className="text-zinc-400 text-xs italic">
                  {profileStats.bio}
                </p>
              </div>
            )}
          </div>

          {/* Decorative scanning line */}
          <motion.div
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-green-500/20 blur-[1px] pointer-events-none"
          />
        </div>

        {/* Combat Efficiency Radial */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-sm p-4 flex flex-col items-center justify-center relative overflow-hidden group">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
          <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4 w-full text-center border-b border-white/5 pb-2">
            Combat Efficiency
          </h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-zinc-800"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - combatRating / 100)}`}
                className={cn(
                  "transition-all duration-1000 ease-out",
                  combatRating >= 80
                    ? "text-green-500"
                    : combatRating >= 60
                      ? "text-blue-500"
                      : combatRating >= 40
                        ? "text-yellow-500"
                        : "text-red-500",
                )}
                strokeLinecap="butt"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-display font-bold text-white">
                {combatRating}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                RATING
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 w-full text-center">
            <div className="bg-white/5 rounded p-2 border border-white/5">
              <div className="text-[10px] text-zinc-500 font-mono uppercase">
                Win Rate
              </div>
              <div
                className={cn(
                  "text-sm font-bold",
                  profileStats.winRate >= 50
                    ? "text-green-400"
                    : "text-red-400",
                )}
              >
                {profileStats.winRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white/5 rounded p-2 border border-white/5">
              <div className="text-[10px] text-zinc-500 font-mono uppercase">
                ELO
              </div>
              <div className="text-sm font-bold text-yellow-400">
                {profileStats.elo ?? 1500}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Detailed Stats */}
      <div className="md:col-span-8 flex flex-col gap-4">
        {/* Performance Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Victories",
              value: profileStats.wins,
              color: "text-green-400",
              sub: "Confirmed",
            },
            {
              label: "Defeats",
              value: profileStats.losses,
              color: "text-red-400",
              sub: "Sustained",
            },
            {
              label: "Battles",
              value: profileStats.gamesPlayed,
              color: "text-white",
              sub: "Total",
            },
            {
              label: "Max Streak",
              value: profileStats.bestWinStreak || 0,
              color: "text-amber-400",
              sub: "Consecutive",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-zinc-900/80 border border-white/10 rounded-sm p-3 flex flex-col items-center justify-center hover:bg-zinc-800/80 transition-colors relative group"
            >
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
              <div className={cn("text-2xl font-mono font-bold", stat.color)}>
                {stat.value}
              </div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-1">
                {stat.label}
              </div>
              <div className="text-[9px] text-zinc-700">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Tactical Data Row */}
        <div className="bg-zinc-900/70 border border-white/10 rounded-sm p-4 relative group">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
            <Crosshair className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-display text-zinc-300 uppercase tracking-widest">
              Tactical Analysis
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono uppercase">
                <Flag className="w-3 h-3" /> Flags Captured
              </div>
              <div className="text-xl font-mono text-white">
                {profileStats.capturedFlags || 0}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono uppercase">
                <Swords className="w-3 h-3" /> Elimination
              </div>
              <div className="text-xl font-mono text-white">
                {profileStats.piecesEliminated || 0}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono uppercase">
                <Eye className="w-3 h-3" /> Intel Gathered
              </div>
              <div className="text-xl font-mono text-white">
                {profileStats.spiesRevealed || 0}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono uppercase">
                <Timer className="w-3 h-3" /> Field Time
              </div>
              <div className="text-xl font-mono text-white">
                {profileStats.totalPlayTime
                  ? formatTime(profileStats.totalPlayTime)
                  : "0m"}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Engagements */}
        <div className="flex-1 bg-zinc-900/70 border border-white/10 rounded-sm p-4 min-h-[200px] relative group">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-display text-zinc-300 uppercase tracking-widest">
                Recent Engagements
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-600">
              LAST 4 SORTIES
            </span>
          </div>

          <div className="space-y-2">
            {profileStats.recentGames && profileStats.recentGames.length > 0 ? (
              profileStats.recentGames
                .slice(0, 4)
                .map((game: any, index: number) => {
                  const isPlayer1 = game.player1Id === profileStats.userId;
                  const won =
                    (isPlayer1 && game.winner === "player1") ||
                    (!isPlayer1 && game.winner === "player2");
                  const opponent = isPlayer1
                    ? game.player2Username
                    : game.player1Username;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-1 h-8 rounded-full",
                            won ? "bg-green-500" : "bg-red-500",
                          )}
                        />
                        <div>
                          <div className="text-sm font-mono text-white group-hover:text-blue-300 transition-colors">
                            VS {opponent}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono uppercase">
                            {won ? "Victory" : "Defeat"}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] border-0",
                          won
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400",
                        )}
                      >
                        {won ? "+WIN" : "-LOSS"}
                      </Badge>
                    </div>
                  );
                })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                <Gamepad2 className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-mono uppercase">
                  No combat entries found
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
