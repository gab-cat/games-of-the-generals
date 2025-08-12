import { motion } from "framer-motion";
import { Progress } from "../../components/ui/progress";
import { 
  Flame, 
  Clock, 
  Zap, 
  Timer, 
  Flag, 
  Swords, 
  Target, 
  TrendingUp, 
  Crown 
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
  };
}

export function BattleStats({ profileStats }: BattleStatsProps) {
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-white/10 bg-black/30 p-6 mb-6"
    >
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-400" />
        Battle Stats
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Win Streak */}
        <div className="text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div className="text-lg font-bold text-orange-400">{profileStats.winStreak || 0}</div>
          <div className="text-gray-500 text-xs">Streak</div>
          <div className="text-xs text-gray-600">Best: {profileStats.bestWinStreak || 0}</div>
        </div>

        {/* Play Time */}
        <div className="text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="text-lg font-bold text-blue-400">
            {profileStats.totalPlayTime ? formatTime(profileStats.totalPlayTime) : "0m"}
          </div>
          <div className="text-gray-500 text-xs">Total</div>
          <div className="text-xs text-gray-600">
            Avg: {profileStats.avgGameTime ? formatTime(profileStats.avgGameTime) : "0m"}
          </div>
        </div>

        {/* Fastest Win */}
        <div className="text-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${
            profileStats.fastestWin 
              ? "bg-gradient-to-br from-yellow-500 to-orange-600" 
              : "bg-gray-700"
          }`}>
            <Zap className={`w-5 h-5 ${profileStats.fastestWin ? "text-white" : "text-gray-500"}`} />
          </div>
          <div className={`text-lg font-bold ${profileStats.fastestWin ? "text-yellow-400" : "text-gray-500"}`}>
            {profileStats.fastestWin ? formatTime(profileStats.fastestWin) : "--"}
          </div>
          <div className="text-gray-500 text-xs">Fastest</div>
        </div>

        {/* Longest Game */}
        <div className="text-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${
            profileStats.longestGame 
              ? "bg-gradient-to-br from-purple-500 to-pink-600" 
              : "bg-gray-700"
          }`}>
            <Timer className={`w-5 h-5 ${profileStats.longestGame ? "text-white" : "text-gray-500"}`} />
          </div>
          <div className={`text-lg font-bold ${profileStats.longestGame ? "text-purple-400" : "text-gray-500"}`}>
            {profileStats.longestGame ? formatTime(profileStats.longestGame) : "--"}
          </div>
          <div className="text-gray-500 text-xs">Longest</div>
        </div>
      </div>

      {/* Combat Stats - Compact */}
      {((profileStats.capturedFlags || 0) > 0 || (profileStats.piecesEliminated || 0) > 0 || (profileStats.spiesRevealed || 0) > 0) && (
        <div className="pt-3 border-t border-white/5">
          <div className="text-sm font-medium text-white mb-2">Combat</div>
          <div className="space-y-2">
            {(profileStats.capturedFlags || 0) > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-red-400">
                  <Flag className="w-3 h-3" />
                  <span>Flags</span>
                </div>
                <span className="font-bold text-red-400">{profileStats.capturedFlags}</span>
              </div>
            )}
            
            {(profileStats.piecesEliminated || 0) > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-orange-400">
                  <Swords className="w-3 h-3" />
                  <span>Eliminated</span>
                </div>
                <span className="font-bold text-orange-400">{profileStats.piecesEliminated}</span>
              </div>
            )}
            
            {(profileStats.spiesRevealed || 0) > 0 && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-cyan-400">
                  <Target className="w-3 h-3" />
                  <span>Spies</span>
                </div>
                <span className="font-bold text-cyan-400">{profileStats.spiesRevealed}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rank Progress */}
      <div className="pt-4 border-t border-white/5 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Rank Progress</h3>
        </div>

        {profileStats.rank !== "General" ? (
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                Next: <span className="text-purple-400 font-medium">
                  {
                    profileStats.wins >= 30 ? "General" :
                    profileStats.wins >= 20 ? "Colonel" :
                    profileStats.wins >= 10 ? "Major" :
                    profileStats.wins >= 5 ? "Captain" :
                    profileStats.wins >= 3 ? "Lieutenant" : "Sergeant"
                  }
                </span>
              </div>
            </div>

            <Progress 
              value={
                profileStats.rank === "Colonel" ? (profileStats.wins / 50) * 100 :
                profileStats.rank === "Major" ? (profileStats.wins / 30) * 100 :
                profileStats.rank === "Captain" ? (profileStats.wins / 20) * 100 :
                profileStats.rank === "Lieutenant" ? (profileStats.wins / 10) * 100 :
                profileStats.rank === "Sergeant" ? (profileStats.wins / 5) * 100 :
                (profileStats.wins / 3) * 100
              }
              className="h-1.5 bg-gray-700"
            />
            <div className="text-center">
              <span className="text-sm font-bold text-purple-400">
                {
                  profileStats.rank === "Colonel" ? 50 - profileStats.wins :
                  profileStats.rank === "Major" ? 30 - profileStats.wins :
                  profileStats.rank === "Captain" ? 20 - profileStats.wins :
                  profileStats.rank === "Lieutenant" ? 10 - profileStats.wins :
                  profileStats.rank === "Sergeant" ? 5 - profileStats.wins :
                  3 - profileStats.wins
                }
              </span>
              <div className="text-gray-500 text-xs">more wins</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-sm font-bold text-yellow-400">Max Rank!</div>
            <div className="text-gray-500 text-xs">Excellence achieved</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
