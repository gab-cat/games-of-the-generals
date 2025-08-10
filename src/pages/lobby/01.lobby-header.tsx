import { motion } from "framer-motion";
import { Target, Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Id } from "../../../convex/_generated/dataModel";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
}

interface LobbyHeaderProps {
  profile: Profile;
}

export function LobbyHeader({ profile }: LobbyHeaderProps) {
  const winRate = profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0;

  return (
    <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4"
          >
            {/* Stats Icon Section */}
            <motion.div
              initial={{ scale: 0, rotateY: -180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
            >
              {/* Animated background pattern */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl"
              />
              <Target className="h-8 w-8 text-blue-400 relative z-10" />
            </motion.div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="flex items-center gap-1 bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <Trophy className="h-4 w-4" />
                  {profile.rank}
                </Badge>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="h-px w-12 bg-gradient-to-r from-blue-500/60 to-purple-500/60"
                />
              </div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <CardTitle className="text-xl font-bold text-white/90">Commander Profile</CardTitle>
                <p className="text-sm text-white/60 mt-1">Battle Statistics & Performance</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-4 gap-6 text-center"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-2xl font-bold text-green-400">{profile.wins}</div>
              <div className="text-xs text-white/60">Wins</div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-2xl font-bold text-red-400">{profile.losses}</div>
              <div className="text-xs text-white/60">Losses</div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="text-2xl font-bold text-white/90">{profile.gamesPlayed}</div>
              <div className="text-xs text-white/60">Games</div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="text-2xl font-bold text-blue-400">{winRate}%</div>
              <div className="text-xs text-white/60">Win Rate</div>
            </motion.div>
          </motion.div>
        </div>
      </CardHeader>
    </Card>
  );
}
