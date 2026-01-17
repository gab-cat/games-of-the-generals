import { motion } from "framer-motion";
import {
  PieChart as PieChartIcon,
  Target,
  BarChart2,
  Cpu,
  Zap,
  Activity,
} from "lucide-react";

interface PerformanceInsightsProps {
  profileStats: {
    wins: number;
    losses: number;
    gamesPlayed: number;
    winRate: number;
    elo: number;
    rank: string;
    totalPlayTime?: number;
    avgGameTime?: number;
  };
}

export function PerformanceInsights({
  profileStats,
}: PerformanceInsightsProps) {
  // Mock data for "Role Performance"
  const rolePerformance = [
    { role: "Commander", val: 85, color: "bg-blue-500", text: "text-blue-400" },
    { role: "Attacker", val: 62, color: "bg-red-500", text: "text-red-400" },
    {
      role: "Defender",
      val: 78,
      color: "bg-green-500",
      text: "text-green-400",
    },
  ];

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Col: Win Rate Visualization */}
      <div className="bg-black/20 rounded-sm border border-white/5 p-6 flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50" />

        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20" />
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-white/20" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-white/20" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20" />

        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 w-full text-center">
          Efficiency Rating
        </h3>

        <div className="relative w-40 h-40">
          <svg
            viewBox="0 0 36 36"
            className="w-full h-full transform -rotate-90"
          >
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#1f2937"
              strokeWidth="2"
            />
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: profileStats.winRate / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray="100, 100"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono text-white drop-shadow-md">
              {profileStats.winRate}%
            </span>
          </div>
        </div>

        <div className="flex gap-8 mt-8 w-full justify-center">
          <div className="text-center">
            <span className="block text-[10px] text-green-500/60 font-mono uppercase">
              Wins
            </span>
            <span className="block text-xl text-green-400 font-mono font-bold">
              {profileStats.wins}
            </span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] text-zinc-500 font-mono uppercase">
              Total
            </span>
            <span className="block text-xl text-white font-mono font-bold">
              {profileStats.gamesPlayed}
            </span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] text-red-500/60 font-mono uppercase">
              Losses
            </span>
            <span className="block text-xl text-red-400 font-mono font-bold">
              {profileStats.losses}
            </span>
          </div>
        </div>
      </div>

      {/* Right Col: Detailed Metrics */}
      <div className="space-y-6 flex flex-col">
        {/* Role Performance */}
        <div className="bg-black/20 rounded-sm border border-white/5 p-5 flex-1 relative overflow-hidden">
          {/* Corner Accents */}
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-white/20" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-white/20" />

          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              Class Proficiency (Sim)
            </span>
          </div>
          <div className="space-y-4">
            {rolePerformance.map((item, i) => (
              <div key={item.role} className="group/bar">
                <div className="flex justify-between text-[10px] font-mono uppercase mb-1">
                  <span className="text-zinc-500 group-hover/bar:text-white transition-colors">
                    {item.role}
                  </span>
                  <span className={item.text}>{item.val}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Diag Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "APM Ratio",
              val: "N/A",
              icon: Zap,
              color: "text-yellow-400",
            },
            {
              label: "Accuracy",
              val: "High",
              icon: Target,
              color: "text-cyan-400",
            },
            {
              label: "Load",
              val: "Normal",
              icon: Cpu,
              color: "text-emerald-400",
            },
            {
              label: "Threat",
              val: "Low",
              icon: Activity,
              color: "text-rose-400",
            },
          ].map((insight) => (
            <div
              key={insight.label}
              className="p-3 bg-black/20 rounded-sm border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <insight.icon
                  className={`w-3.5 h-3.5 ${insight.color} opacity-70`}
                />
                <span className="text-[10px] text-zinc-500 font-mono uppercase">
                  {insight.label}
                </span>
              </div>
              <span className={`text-xs font-mono font-bold ${insight.color}`}>
                {insight.val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
