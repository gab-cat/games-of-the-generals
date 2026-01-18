import {
  Flame,
  Clock,
  Zap,
  Flag,
  Swords,
  Target,
  TrendingUp,
} from "lucide-react";

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
    rank: string;
    elo: number;
  };
}

export function BattleStats({ profileStats }: BattleStatsProps) {
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* ELO Rating */}
        <div className="p-4 rounded-sm border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <TrendingUp className="w-8 h-8 text-yellow-500 -rotate-12" />
          </div>
          <span className="text-[10px] text-yellow-500/60 font-mono uppercase tracking-widest block mb-1">
            Combat Rating
          </span>
          <div className="text-3xl font-mono font-bold text-yellow-400 tracking-tighter">
            {profileStats.elo ?? 1500}
          </div>
        </div>

        {/* Win Streak */}
        <div className="p-4 rounded-sm border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
          <span className="text-[10px] text-orange-500/60 font-mono uppercase tracking-widest block mb-1">
            Streak
          </span>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-mono font-bold text-orange-400 tracking-tighter">
              {profileStats.winStreak || 0}
            </div>
            <div className="text-[9px] text-orange-500/50 font-mono uppercase">
              (Best: {profileStats.bestWinStreak || 0})
            </div>
          </div>
        </div>

        {/* Play Time */}
        <div className="p-4 rounded-sm border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
          <span className="text-[10px] text-blue-500/60 font-mono uppercase tracking-widest block mb-1">
            Field Time
          </span>
          <div className="text-2xl font-mono font-bold text-blue-400 tracking-tighter">
            {profileStats.totalPlayTime
              ? formatTime(profileStats.totalPlayTime)
              : "0m"}
          </div>
          <div className="text-[9px] text-blue-400/40 font-mono mt-0.5">
            Avg:{" "}
            {profileStats.avgGameTime
              ? formatTime(profileStats.avgGameTime)
              : "0m"}
          </div>
        </div>

        {/* Fastest Win */}
        <div className="p-4 rounded-sm border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <Zap className="w-8 h-8 text-green-500" />
          </div>
          <span className="text-[10px] text-green-500/60 font-mono uppercase tracking-widest block mb-1">
            Quickest Op
          </span>
          <div className="text-2xl font-mono font-bold text-green-400 tracking-tighter">
            {profileStats.fastestWin
              ? formatTime(profileStats.fastestWin)
              : "--"}
          </div>
        </div>
      </div>

      {/* 2. Combat Efficiency Logs */}
      <div className="rounded-sm border border-white/5 bg-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Swords className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
            Combat Efficiency Log
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-black/20 p-3 rounded-sm border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="w-3.5 h-3.5 text-red-500/70" />
              <span className="text-xs text-zinc-400">Flags Captured</span>
            </div>
            <span className="font-mono font-bold text-white">
              {profileStats.capturedFlags || 0}
            </span>
          </div>
          <div className="bg-black/20 p-3 rounded-sm border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="w-3.5 h-3.5 text-orange-500/70" />
              <span className="text-xs text-zinc-400">Enemies Eliminated</span>
            </div>
            <span className="font-mono font-bold text-white">
              {profileStats.piecesEliminated || 0}
            </span>
          </div>
          <div className="bg-black/20 p-3 rounded-sm border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-cyan-500/70" />
              <span className="text-xs text-zinc-400">Spies Identified</span>
            </div>
            <span className="font-mono font-bold text-white">
              {profileStats.spiesRevealed || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
