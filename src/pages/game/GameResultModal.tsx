import { motion } from "framer-motion";
import { Trophy, Target, Clock, Sword, Crown, Medal, Zap, ExternalLink, Play } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import Squares from "@/components/backgrounds/Squares/Squares";



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
  onCheckBoard: () => void;
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
  onCheckBoard,
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
      <DialogContent className="max-w-2xl max-h-[90vh] bg-black/20 backdrop-blur-xl border border-white/10 shadow-xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Game Result</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 pb-2"
        >
          {/* Main Result Header */}
          <div className={`text-center py-6 px-6 rounded-2xl backdrop-blur-sm border ${getBgGradient()} relative overflow-hidden`}>
            {/* Animated Squares Background */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-20">
              <Squares
                direction="diagonal"
                speed={0.3}
                borderColor="rgba(255, 255, 255, 0.1)"
                squareSize={20}
                hoverFillColor="rgba(99, 102, 241, 0.1)"
              />
            </div>

            {/* Content overlay */}
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4"
              >
                {getResultIcon()}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className={`text-3xl font-bold ${getResultColor()} mb-2 tracking-tight`}>
                  {getResultText()}
                </h2>
                <p className="text-white/60 text-base">
                  {getReasonText()}
                </p>
              </motion.div>

              {/* Subtle celebration for winners */}
              {isWinner && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-2 right-2 text-yellow-400/60"
                >
                  ✨
                </motion.div>
              )}
            </div>
          </div>

          {/* Match Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-blue-400" />
              <h3 className="text-lg font-semibold text-white/90">Battle Summary</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 ${
                isWinner && !isDraw
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-white/5 border-white/10'
              }`}>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    username={isPlayer1 ? result.player1Username : result.player2Username}
                    avatarUrl={isPlayer1 ? player1Profile?.avatarUrl : player2Profile?.avatarUrl}
                    rank={isPlayer1 ? player1Profile?.rank : player2Profile?.rank}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-white/90 text-sm">
                      {isPlayer1 ? result.player1Username : result.player2Username}
                    </div>
                    <Badge
                      variant={isWinner && !isDraw ? "default" : "secondary"}
                      className={`text-xs px-2 py-0 ${
                        isWinner && !isDraw
                          ? 'bg-green-500/20 text-green-200 border-green-400/30'
                          : 'bg-white/10 text-white/70 border-white/20'
                      }`}
                    >
                      You
                    </Badge>
                  </div>
                  {isWinner && !isDraw && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 ${
                !isWinner && !isDraw
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-white/5 border-white/10'
              }`}>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    username={isPlayer1 ? result.player2Username : result.player1Username}
                    avatarUrl={isPlayer1 ? player2Profile?.avatarUrl : player1Profile?.avatarUrl}
                    rank={isPlayer1 ? player2Profile?.rank : player1Profile?.rank}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-white/90 text-sm">
                      {isPlayer1 ? result.player2Username : result.player1Username}
                    </div>
                    <Badge
                      variant={!isWinner && !isDraw ? "default" : "secondary"}
                      className={`text-xs px-2 py-0 ${
                        !isWinner && !isDraw
                          ? 'bg-red-500/20 text-red-200 border-red-400/30'
                          : 'bg-white/10 text-white/70 border-white/20'
                      }`}
                    >
                      Opponent
                    </Badge>
                  </div>
                  {!isWinner && !isDraw && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Game Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              <Clock className="h-4 w-4 text-blue-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-white/90">{formatDuration(result.duration)}</div>
              <div className="text-xs text-white/60">Duration</div>
            </div>

            <div className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              <Zap className="h-4 w-4 text-orange-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-white/90">{result.moves}</div>
              <div className="text-xs text-white/60">Moves</div>
            </div>

            <div className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              <Medal className="h-4 w-4 text-purple-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-white/90">{profile.rank}</div>
              <div className="text-xs text-white/60">Rank</div>
            </div>
          </div>

          {/* Campaign Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-white/70">Campaign:</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-green-400 font-semibold">{profile.wins}</div>
                <div className="text-xs text-white/60">W</div>
              </div>
              <div className="text-center">
                <div className="text-red-400 font-semibold">{profile.losses}</div>
                <div className="text-xs text-white/60">L</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-semibold">
                  {profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0}%
                </div>
                <div className="text-xs text-white/60">WR</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              onClick={onCheckBoard}
              variant="outline"
              size="sm"
              className="flex-1 max-w-xs rounded-lg border border-white/30 text-white/90 hover:bg-white/10 backdrop-blur-sm transition-colors"
            >
              <Target className="h-4 w-4 mr-2" />
              Check Board
            </Button>

            {gameId && onViewReplay && (
              <Button
                onClick={() => onViewReplay(gameId)}
                variant="secondary"
                size="sm"
                className="flex-1 max-w-xs rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 backdrop-blur-sm transition-colors"
              >
                <Play className="h-4 w-4 mr-2" />
                View Replay
              </Button>
            )}

            <Button
              onClick={onReturnToLobby}
              size="sm"
              className="flex-1 max-w-xs rounded-lg bg-white text-black hover:bg-white/90 font-semibold"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Back to Lobby
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
