import { motion } from "framer-motion";
import { Target, Trophy, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { Id } from "../../../convex/_generated/dataModel";
import Squares from "../../components/backgrounds/Squares/Squares";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
  elo?: number;
}

interface LobbyHeaderProps {
  profile: Profile;
}

export function LobbyHeader({ profile }: LobbyHeaderProps) {
  const winRate = profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0;

  return (
    <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 relative overflow-hidden">
      {/* Animated Squares Background */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-20">
        <Squares
          direction="diagonal"
          speed={0.3}
          squareSize={40}
          borderColor="rgba(255,255,255,0.08)"
        />
      </div>
      <CardHeader className="p-4 sm:p-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-0">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
          >
            {/* Stats Icon Section */}
            <motion.div
              initial={{ scale: 0, rotateY: -180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
              className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden mx-auto sm:mx-0 flex-shrink-0"
            >
              {/* Animated background pattern */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl"
              />
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 relative z-10" />
            </motion.div>
            
            <div className="flex flex-col text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <Badge variant="secondary" className="flex items-center justify-center gap-1 bg-blue-500/20 text-blue-300 border-blue-500/30 w-fit mx-auto sm:mx-0">
                  <Trophy className="h-4 w-4" />
                  {profile.rank}
                </Badge>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="hidden sm:block h-px w-12 bg-gradient-to-r from-blue-500/60 to-purple-500/60"
                />
              </div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <CardTitle className="text-lg sm:text-xl font-bold text-white/90">Commander Profile</CardTitle>
                <p className="text-xs sm:text-xs text-white/60 mt-1">Battle Statistics & Performance</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 text-center"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-xl sm:text-2xl font-bold text-green-400">{profile.wins}</div>
              <div className="text-xs text-white/60">Wins</div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-xl sm:text-2xl font-bold text-red-400">{profile.losses}</div>
              <div className="text-xs text-white/60">Losses</div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="text-xl sm:text-2xl font-bold text-white/90">{profile.gamesPlayed}</div>
              <div className="text-xs text-white/60">Games</div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="text-xl sm:text-2xl font-bold text-blue-400">{winRate}%</div>
              <div className="text-xs text-white/60">Win Rate</div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <div className="text-xl sm:text-2xl font-bold text-yellow-400">{profile.elo ?? 1500}</div>
              <div className="text-xs text-white/60 flex text-center justify-center items-center gap-1">
                ELO
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-white/40 hover:text-white/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs bg-black/20 backdrop-blur-sm text-white">
                      <p className="text-xs">
                        ELO rating is calculated only from Quick Match games, as matchmaking ensures fair skill-based pairings.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </CardHeader>
    </Card>
  );
}
