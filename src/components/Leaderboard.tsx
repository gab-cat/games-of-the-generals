import { useConvexQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Target } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { UserAvatar } from "./UserAvatar";

export function Leaderboard() {
  const { data: leaderboard, isPending: isLoadingLeaderboard, error: leaderboardError } = useConvexQuery(
    api.profiles.getLeaderboard, 
    { 
      limit: 15, // Load top 15 instead of 50 for better performance
      offset: 0 
    }
  );

  if (isLoadingLeaderboard) {
    return (
      <div className="flex justify-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (leaderboardError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Trophy className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Failed to load leaderboard</p>
        <p className="text-sm text-white/40">Please try refreshing the page</p>
      </motion.div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Trophy className="h-12 w-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60">No commanders ranked yet.</p>
        <p className="text-sm text-white/40">Be the first to claim your position!</p>
      </motion.div>
    );
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Trophy className="h-5 w-5 text-orange-500" />;
      default:
        return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 shadow-lg shadow-yellow-500/10";
      case 2:
        return "bg-gray-400/20 backdrop-blur-sm border border-gray-400/30 shadow-lg shadow-gray-400/10";
      case 3:
        return "bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 shadow-lg shadow-orange-500/10";
      default:
        return "bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg";
    }
  };

  return (
    <div className="space-y-4">
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center gap-4 mb-6"
      >
        {/* Hall of Generals Icon Section */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
          className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
        >
          {/* Animated crown glow */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl"
          />
          <Trophy className="h-6 w-6 text-yellow-400 relative z-10" />
        </motion.div>
        
        <div className="flex flex-col">
          <motion.h3 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-semibold text-white/90"
          >
            Hall of Generals
          </motion.h3>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <div className="h-0.5 w-8 bg-gradient-to-r from-yellow-500/60 to-orange-500/60 rounded-full"></div>
            <span className="text-xs text-white/50 font-mono">
              Elite commanders ranked
            </span>
          </motion.div>
        </div>
      </motion.div>
      
      <div className="space-y-3">
        {leaderboard.map((player, index) => (
          <motion.div
            key={player._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${getRankColor(player.position)} hover:bg-white/10 transition-all duration-200`}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[60px]">
                    {getRankIcon(player.position)}
                    <span className="font-bold text-lg text-white/90">#{player.position}</span>
                  </div>
                  
                  <UserAvatar 
                    username={player.username}
                    avatarUrl={player.avatarUrl}
                    rank={player.rank}
                    size="md"
                    className="ring-2 ring-white/20"
                  />
                  
                  <div>
                    <h4 className="font-semibold text-lg text-white/90">{player.username}</h4>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit bg-blue-500/20 text-blue-300 border-blue-500/30">
                      <Target className="h-3 w-3" />
                      {player.rank}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-400">{player.wins}</div>
                    <div className="text-xs text-white/60">Wins</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-400">{player.losses}</div>
                    <div className="text-xs text-white/60">Losses</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white/90">{player.gamesPlayed}</div>
                    <div className="text-xs text-white/60">Battles</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${
                      player.winRate >= 70 
                        ? 'text-green-400' 
                        : player.winRate >= 50 
                        ? 'text-yellow-400' 
                        : 'text-red-400'
                    }`}>
                      {player.winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-white/60">Win Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
