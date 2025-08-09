"use client";

import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Award, 
  Calendar,
  Gamepad2,
  Zap,
  Timer,
  Flag,
  Star,
  Crown,
  Swords,
  Medal,
  Flame
} from "lucide-react";

export function Profile() {
  const profileStats = useQuery(api.profiles.getProfileStats);

  if (!profileStats) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case "General": return <Crown className="w-6 h-6 text-yellow-400" />;
      case "Colonel": return <Star className="w-6 h-6 text-purple-400" />;
      case "Major": return <Award className="w-6 h-6 text-blue-400" />;
      case "Captain": return <Trophy className="w-6 h-6 text-green-400" />;
      case "Lieutenant": return <Target className="w-6 h-6 text-orange-400" />;
      case "Sergeant": return <Swords className="w-6 h-6 text-red-400" />;
      default: return <Medal className="w-6 h-6 text-gray-400" />;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden flex items-start justify-center p-6">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        {/* Compact Hero Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gray-800/30 backdrop-blur-xl rounded-xl border border-white/5 p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            {/* Left side - Avatar and Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-16 h-16 bg-gradient-to-br ${getRankColor(profileStats.rank)} rounded-full flex items-center justify-center text-white text-xl font-bold ring-1 ring-white/20 shadow-lg`}>
                  {profileStats.username.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 bg-gray-900/90 backdrop-blur-sm rounded-full p-1.5 ring-1 ring-white/20">
                  <div className="w-4 h-4 text-white">
                    {getRankIcon(profileStats.rank)}
                  </div>
                </div>
              </div>
            
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {profileStats.username}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs px-2 py-0.5 bg-gradient-to-r ${getRankColor(profileStats.rank)} text-white border-0 font-medium`}>
                  {profileStats.rank}
                </Badge>
                <div className="text-gray-500 text-xs">Member since {formatDate(profileStats.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Right side - Main Stats */}
          <div className="flex gap-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-green-400">{profileStats.wins}</div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">Wins</div>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-red-400">{profileStats.losses}</div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">Losses</div>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-blue-400">{profileStats.gamesPlayed}</div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">Games</div>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-purple-400">{profileStats.winRate}%</div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">Win Rate</div>
            </motion.div>
          </div>
        </div>
        </motion.div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Battle Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/25 backdrop-blur-xl rounded-xl p-6 border border-white/5"
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

          {/* Middle Column - Recent Games */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/25 backdrop-blur-xl rounded-xl p-6 border border-white/5 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">Recent Battles</h3>
            </div>
            
            <div className="h-full overflow-y-auto pr-2" style={{ maxHeight: 'calc(100% - 3rem)' }}>
              {profileStats.recentGames && profileStats.recentGames.length > 0 ? (
                <div className="space-y-2">
                  {profileStats.recentGames.map((game) => {
                    const isPlayer1 = game.player1Id === profileStats.userId;
                    const won = (isPlayer1 && game.winner === "player1") || 
                               (!isPlayer1 && game.winner === "player2");
                    const opponent = isPlayer1 ? game.player2Username : game.player1Username;

                    return (
                      <div
                        key={game._id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                          won 
                            ? "bg-green-500/5 border-green-500/20" 
                            : "bg-red-500/5 border-red-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            won ? "bg-green-400" : "bg-red-400"
                          }`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-white text-sm font-medium truncate">vs {opponent}</div>
                            <div className="text-xs text-gray-500">
                              {game.finishedAt ? formatDate(game.finishedAt) : "Unknown"}
                            </div>
                          </div>
                        </div>
                        <div className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                          won 
                            ? "bg-green-500/10 text-green-400" 
                            : "bg-red-500/10 text-red-400"
                        }`}>
                          {won ? "W" : "L"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
                  <Gamepad2 className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No recent battles</p>
                  <p className="text-xs text-gray-600">Start playing!</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Performance Charts/Insights */}
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
        </div>
      </div>
    </div>
  );
}
