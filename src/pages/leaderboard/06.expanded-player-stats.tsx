import { motion } from "framer-motion";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { UserAvatar } from "../../components/UserAvatar";
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
  Skull
} from "lucide-react";

interface ProfileStats {
  username: string;
  avatarUrl?: string;
  rank: string;
  createdAt: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
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
}

interface ExpandedPlayerStatsProps {
  profileStats: ProfileStats;
}

const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // For very recent dates (less than 30 days), show full date
  if (diffDays < 30) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
  // For older dates, show just month and year
  else {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }
};

const getRankColor = (rank: string) => {
  switch (rank) {
    case "General": return "from-yellow-500 to-amber-600";
    case "Colonel": return "from-purple-500 to-violet-600";
    case "Major": return "from-blue-500 to-indigo-600";
    case "Captain": return "from-green-500 to-emerald-600";
    case "Lieutenant": return "from-orange-500 to-red-600";
    case "Sergeant": return "from-red-500 to-pink-600";
    default: return "from-gray-500 to-gray-600";
  }
};

export function ExpandedPlayerStats({ profileStats }: ExpandedPlayerStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="mt-4 p-4 rounded-lg"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        {/* Left side - Avatar and Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <UserAvatar
            username={profileStats.username}
            avatarUrl={profileStats.avatarUrl}
            rank={profileStats.rank}
            size="md"
            className="ring-1 ring-white/20 flex-shrink-0"
          />

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-white truncate">{profileStats.username}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs px-2 py-0.5 bg-gradient-to-r ${getRankColor(profileStats.rank)} text-white border-0 font-medium`}>
                {profileStats.rank}
              </Badge>
              <div className="text-gray-500 text-xs">Member since {formatDate(profileStats.createdAt)}</div>
            </div>

            {profileStats.bio && (
              <p className="text-white/90 text-sm mt-1 whitespace-pre-wrap line-clamp-2">{profileStats.bio}</p>
            )}
          </div>
        </div>

        {/* Right side - Main Stats */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-6 sm:items-center w-full sm:w-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="text-xl font-bold text-green-400">{profileStats.wins}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Wins</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-xl font-bold text-red-400">{profileStats.losses}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Losses</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="text-xl font-bold text-blue-400">{profileStats.gamesPlayed}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Games</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="text-xl font-bold text-purple-400">{profileStats.winRate}%</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Win Rate</div>
          </motion.div>
        </div>
      </div>

      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Win Streak */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center bg-black/20 rounded-lg p-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div className="text-lg font-bold text-orange-400">{profileStats.winStreak || 0}</div>
          <div className="text-gray-500 text-xs">Streak</div>
          <div className="text-xs text-gray-600">Best: {profileStats.bestWinStreak || 0}</div>
        </motion.div>

        {/* Total Play Time */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center bg-black/20 rounded-lg p-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div className="text-lg font-bold text-blue-400">
            {profileStats.totalPlayTime ? formatTime(profileStats.totalPlayTime) : "0m"}
          </div>
          <div className="text-gray-500 text-xs">Total Time</div>
          <div className="text-xs text-gray-600">
            Avg: {profileStats.avgGameTime ? formatTime(profileStats.avgGameTime) : "0m"}
          </div>
        </motion.div>

        {/* Fastest Win */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center bg-black/20 rounded-lg p-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div className="text-lg font-bold text-yellow-400">
            {profileStats.fastestWin ? formatTime(profileStats.fastestWin) : "--"}
          </div>
          <div className="text-gray-500 text-xs">Fastest Win</div>
        </motion.div>

        {/* Longest Game */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center bg-black/20 rounded-lg p-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Timer className="w-4 h-4 text-white" />
          </div>
          <div className="text-lg font-bold text-purple-400">
            {profileStats.longestGame ? formatTime(profileStats.longestGame) : "--"}
          </div>
          <div className="text-gray-500 text-xs">Longest Game</div>
        </motion.div>
      </div>

      {/* Combat Stats */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Skull className="w-4 h-4 text-red-400" />
          <h4 className="text-sm font-bold text-white">Combat Statistics</h4>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center bg-black/20 rounded-lg p-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-1">
              <Flag className="w-3 h-3 text-white" />
            </div>
            <div className="text-sm font-bold text-green-400">{profileStats.capturedFlags || 0}</div>
            <div className="text-gray-500 text-xs">Flags</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center bg-black/20 rounded-lg p-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-1">
              <Swords className="w-3 h-3 text-white" />
            </div>
            <div className="text-sm font-bold text-red-400">{profileStats.piecesEliminated || 0}</div>
            <div className="text-gray-500 text-xs">Eliminated</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center bg-black/20 rounded-lg p-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-1">
              <Eye className="w-3 h-3 text-white" />
            </div>
            <div className="text-sm font-bold text-cyan-400">{profileStats.spiesRevealed || 0}</div>
            <div className="text-gray-500 text-xs">Spies</div>
          </motion.div>
        </div>
      </div>

      {/* Performance & Recent Games */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Performance Circle */}
        <div className="flex items-center justify-center">
          <div className="text-center bg-black/20 rounded-lg p-4">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  className="text-gray-700"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="3"
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
            <div className="text-gray-500 text-xs">Win Rate</div>
            <div className="text-xs text-gray-600 mt-1">Overall Performance</div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-black/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <Gamepad2 className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-white">Recent Games</h4>
          </div>

          {profileStats.recentGames && profileStats.recentGames.length > 0 ? (
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {profileStats.recentGames.slice(0, 4).map((game: any, index: number) => {
                const isPlayer1 = game.player1Id === profileStats.userId;
                const won = (isPlayer1 && game.winner === "player1") ||
                           (!isPlayer1 && game.winner === "player2");
                const opponent = isPlayer1 ? game.player2Username : game.player1Username;

                return (
                  <motion.div
                    key={game._id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between text-xs bg-black/30 rounded px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        won ? "bg-green-400" : "bg-red-400"
                      }`} />
                      <span className="text-white truncate">vs {opponent}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        won ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {won ? "WIN" : "LOSS"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-xs">
              <Gamepad2 className="w-6 h-6 mx-auto mb-2 opacity-50" />
              No recent games
            </div>
          )}
        </div>
      </div>

      {/* Rank Progress */}
      {profileStats.rank !== "General" && (
        <div className="pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Rank Progress</h3>
          </div>

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
              <span className="text-xs font-bold text-purple-400">
                {
                  profileStats.rank === "Colonel" ? 50 - profileStats.wins :
                  profileStats.rank === "Major" ? 30 - profileStats.wins :
                  profileStats.rank === "Captain" ? 20 - profileStats.wins :
                  profileStats.rank === "Lieutenant" ? 10 - profileStats.wins :
                  profileStats.rank === "Sergeant" ? 5 - profileStats.wins :
                  3 - profileStats.wins
                }
              </span>
              <div className="text-gray-500 text-xs">more wins needed</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
