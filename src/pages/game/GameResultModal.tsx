import { motion } from "framer-motion";
import { Trophy, Target, Clock, Sword, Crown, Medal, Zap, ExternalLink, X, Play } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DialogHeader } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/UserAvatar";
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog";
import { Badge } from "@/components/ui/badge";



interface GameResult {
  winner: "player1" | "player2" | "draw";
  reason: "flag_captured" | "flag_reached_base" | "timeout" | "surrender" | "elimination";
  duration: number; // in seconds
  moves: number;
  player1Username: string;
  player2Username: string;
}

interface Profile {
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
}

interface GameResultModalProps {
  result: GameResult;
  profile: Profile & { avatarUrl?: string };
  isPlayer1: boolean;
  isOpen: boolean;
  onClose: () => void;
  onReturnToLobby: () => void;
  gameId: Id<"games">;
  onViewReplay: (gameId: Id<"games">) => void;
  player1Profile?: (Profile & { avatarUrl?: string }) | null;
  player2Profile?: (Profile & { avatarUrl?: string }) | null;
}

export function GameResultModal({ 
  result, 
  profile, 
  isPlayer1, 
  isOpen, 
  onClose, 
  onReturnToLobby,
  gameId,
  onViewReplay,
  player1Profile,
  player2Profile
}: GameResultModalProps) {
  const isWinner = (isPlayer1 && result.winner === "player1") || (!isPlayer1 && result.winner === "player2");
  const isDraw = result.winner === "draw";

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getResultText = () => {
    if (isDraw) return "Battle Ended in Draw";
    return isWinner ? "Victory Achieved!" : "Defeat...";
  };

  const getResultIcon = () => {
    if (isDraw) return <Target className="h-8 w-8 text-yellow-500" />;
    if (isWinner) return <Crown className="h-8 w-8 text-yellow-500" />;
    return <Sword className="h-8 w-8 text-red-500" />;
  };

  const getReasonText = () => {
    switch (result.reason) {
      case "flag_captured":
        return "Flag Captured";
      case "flag_reached_base":
        return "Flag Reached Enemy Base";
      case "timeout":
        return "Time Expired";
      case "surrender":
        return "Surrender";
      case "elimination":
        return "All Pieces Eliminated";
      default:
        return "Game Over";
    }
  };

  const getResultColor = () => {
    if (isDraw) return "text-yellow-400";
    return isWinner ? "text-green-400" : "text-red-400";
  };

  const getBgGradient = () => {
    if (isDraw) return "bg-gradient-to-br from-yellow-500/10 via-orange-500/20 to-yellow-500/20 border-yellow-500/30 shadow-lg shadow-yellow-500/10";
    return isWinner 
      ? "bg-gradient-to-br from-green-500/10 via-emerald-500/20 to-green-500/20 border-green-500/30 shadow-lg shadow-green-500/10" 
      : "bg-gradient-to-br from-red-500/10 via-pink-500/20 to-red-500/20 border-red-500/30 shadow-lg shadow-red-500/10";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border border-white/10 bg-gray-600/10 backdrop-blur-xl shadow-2xl shadow-black/20">
        <DialogHeader className="relative">
          <DialogTitle className="sr-only">Game Result</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 py-4"
        >
          {/* Main Result Header */}
          <Card className={`backdrop-blur-xl border ${getBgGradient()}`}>
            <CardContent className="text-center py-6 relative overflow-hidden rounded-xl">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4"
              >
                {getResultIcon()}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className={`text-4xl font-bold ${getResultColor()} mb-2`}>
                  {getResultText()}
                </h2>
                <p className="text-white/60">
                  {getReasonText()}
                </p>
              </motion.div>

              {/* Celebration Effects */}
              {isWinner && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                >
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: -20, opacity: 1, scale: 0 }}
                      animate={{
                        y: [0, 100, 200],
                        opacity: [1, 1, 0],
                        scale: [0, 1, 0.5],
                        rotate: [0, 180, 360]
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1,
                        ease: "easeOut"
                      }}
                      className="absolute text-yellow-400 text-sm"
                      style={{
                        left: `${Math.random() * 100}%`,
                      }}
                    >
                      ⭐
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Match Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white/90">
                  <Trophy className="h-5 w-5 text-blue-400" />
                  Battle Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar 
                        username={isPlayer1 ? result.player1Username : result.player2Username}
                        avatarUrl={isPlayer1 ? player1Profile?.avatarUrl : player2Profile?.avatarUrl}
                        rank={isPlayer1 ? player1Profile?.rank : player2Profile?.rank}
                        size="md"
                      />
                      <div>
                        <div className="font-semibold text-white/90">
                          {isPlayer1 ? result.player1Username : result.player2Username}
                        </div>
                        <Badge 
                          variant={isWinner && !isDraw ? "default" : "secondary"}
                          className={`text-xs ${isWinner && !isDraw ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-white/10 text-white/70 border-white/20'}`}
                        >
                          {profile.username} (You)
                        </Badge>
                      </div>
                    </div>
                    {isWinner && !isDraw && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Crown className="h-5 w-5 text-yellow-500" />
                      </motion.div>
                    )}
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar 
                        username={isPlayer1 ? result.player2Username : result.player1Username}
                        avatarUrl={isPlayer1 ? player2Profile?.avatarUrl : player1Profile?.avatarUrl}
                        rank={isPlayer1 ? player2Profile?.rank : player1Profile?.rank}
                        size="md"
                      />
                      <div>
                        <div className="font-semibold text-white/90">
                          {isPlayer1 ? result.player2Username : result.player1Username}
                        </div>
                        <Badge 
                          variant={!isWinner && !isDraw ? "default" : "secondary"}
                          className={`text-xs ${!isWinner && !isDraw ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-white/10 text-white/70 border-white/20'}`}
                        >
                          Opponent
                        </Badge>
                      </div>
                    </div>
                    {!isWinner && !isDraw && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Crown className="h-5 w-5 text-yellow-500" />
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Game Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-3"
          >
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-black/20 backdrop-blur-xl border border-blue-500/30 hover:border-blue-500/50 transition-colors shadow-lg shadow-blue-500/10">
                <CardContent className="p-4 text-center">
                  <div className="p-2 bg-blue-500/20 backdrop-blur-sm rounded-lg w-fit mx-auto mb-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="text-lg font-bold mb-1 text-white/90">{formatDuration(result.duration)}</div>
                  <div className="text-xs text-white/60">Duration</div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-black/20 backdrop-blur-xl border border-orange-500/30 hover:border-orange-500/50 transition-colors shadow-lg shadow-orange-500/10">
                <CardContent className="p-4 text-center">
                  <div className="p-2 bg-orange-500/20 backdrop-blur-sm rounded-lg w-fit mx-auto mb-2">
                    <Zap className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="text-lg font-bold mb-1 text-white/90">{result.moves}</div>
                  <div className="text-xs text-white/60">Moves</div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-black/20 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/50 transition-colors shadow-lg shadow-purple-500/10">
                <CardContent className="p-4 text-center">
                  <div className="p-2 bg-purple-500/20 backdrop-blur-sm rounded-lg w-fit mx-auto mb-2">
                    <Medal className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="text-lg font-bold mb-1 text-white/90">{profile.rank}</div>
                  <div className="text-xs text-white/60">Rank</div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Updated Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-white/90">
                  <Target className="h-5 w-5 text-blue-400" />
                  Your Campaign Record
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 rounded-lg bg-green-500/20 backdrop-blur-sm border border-green-500/30 hover:border-green-500/50 transition-colors shadow-lg shadow-green-500/10"
                  >
                    <div className="text-lg font-bold text-green-400 mb-1">{profile.wins}</div>
                    <div className="text-xs text-white/60">Wins</div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-500/30 hover:border-red-500/50 transition-colors shadow-lg shadow-red-500/10"
                  >
                    <div className="text-lg font-bold text-red-400 mb-1">{profile.losses}</div>
                    <div className="text-xs text-white/60">Losses</div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 rounded-lg bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 transition-colors shadow-lg shadow-blue-500/10"
                  >
                    <div className="text-lg font-bold text-blue-400 mb-1">{profile.gamesPlayed}</div>
                    <div className="text-xs text-white/60">Total</div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 rounded-lg bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 hover:border-purple-500/50 transition-colors shadow-lg shadow-purple-500/10"
                  >
                    <div className="text-lg font-bold text-purple-400 mb-1">
                      {profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0}%
                    </div>
                    <div className="text-xs text-white/60">Win Rate</div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-3 justify-between"
          >
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
            >
              <X className="h-4 w-4 mr-2" />
              Close & Review Board
            </Button>
            {gameId && onViewReplay && (
              <Button 
                onClick={() => onViewReplay(gameId)}
                variant="secondary"
                className="flex-1 rounded-full bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30"
              >
                <Play className="h-4 w-4 mr-2" />
                View Replay
              </Button>
            )}
            <Button 
              onClick={onReturnToLobby}
              className="flex-1 text-black"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Return to Lobby
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
