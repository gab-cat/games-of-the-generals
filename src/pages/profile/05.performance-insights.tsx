import { motion } from "framer-motion";
import { Award } from "lucide-react";

interface PerformanceInsightsProps {
  profileStats: {
    winRate: number;
    gamesPlayed: number;
    wins: number;
    winStreak?: number;
    bestWinStreak?: number;
  };
}

export function PerformanceInsights({ profileStats }: PerformanceInsightsProps) {
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-gray-800/25 backdrop-blur-xl rounded-xl p-6 border border-white/5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-white">Performance</h3>
      </div>

      {/* Performance Metrics Grid */}
      <div className="space-y-4">
        {/* Win Rate Circle */}
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-2">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-700"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - profileStats.winRate / 100)}`}
                className="text-purple-400"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-purple-400">{profileStats.winRate}%</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">Win Rate</div>
        </div>

        {/* Performance Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Games Played</span>
              <span>{profileStats.gamesPlayed}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className="bg-blue-400 h-1 rounded-full" 
                style={{ width: `${Math.min((profileStats.gamesPlayed / 100) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Victories</span>
              <span>{profileStats.wins}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className="bg-green-400 h-1 rounded-full" 
                style={{ width: `${Math.min((profileStats.wins / 50) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Best Streak</span>
              <span>{profileStats.bestWinStreak || 0}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className="bg-orange-400 h-1 rounded-full" 
                style={{ width: `${Math.min(((profileStats.bestWinStreak || 0) / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="pt-3 border-t border-white/5">
          <div className="text-sm font-medium text-white mb-2">Quick Stats</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-gray-700/30 rounded">
              <div className="font-bold text-white">{Math.round(profileStats.wins / Math.max(profileStats.gamesPlayed, 1) * 100)}%</div>
              <div className="text-gray-500">Success</div>
            </div>
            <div className="text-center p-2 bg-gray-700/30 rounded">
              <div className="font-bold text-white">{profileStats.gamesPlayed}</div>
              <div className="text-gray-500">Experience</div>
            </div>
            <div className="text-center p-2 bg-gray-700/30 rounded">
              <div className="font-bold text-white">{profileStats.winStreak || 0}</div>
              <div className="text-gray-500">Current</div>
            </div>
            <div className="text-center p-2 bg-gray-700/30 rounded">
              <div className="font-bold text-white">{profileStats.bestWinStreak || 0}</div>
              <div className="text-gray-500">Record</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
