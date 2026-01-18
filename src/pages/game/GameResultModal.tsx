import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  Clock,
  Medal,
  Zap,
  ExternalLink,
  Play,
  AlertTriangle,
  Shield,
  Skull,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/UserAvatar";
import { useSound } from "@/lib/SoundProvider";
import { useEffect } from "react";
import ConfettiBoom from "react-confetti-boom";

interface GameResult {
  winner: "player1" | "player2" | "draw";
  reason:
    | "flag_captured"
    | "flag_reached_base"
    | "timeout"
    | "surrender"
    | "elimination";
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
  avatarFrame?: string;
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
  player2Profile,
}: GameResultModalProps) {
  const isWinner =
    (isPlayer1 && result.winner === "player1") ||
    (!isPlayer1 && result.winner === "player2");
  const isDraw = result.winner === "draw";
  const { playSFX } = useSound();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getResultText = () => {
    if (isDraw) return "DRAW";
    return isWinner ? "VICTORY" : "DEFEAT";
  };

  const getMissionStatus = () => {
    if (isDraw) return "MISSION DRAWN";
    return isWinner ? "MISSION ACCOMPLISHED" : "MISSION FAILED";
  };

  const getReasonText = () => {
    if (isDraw) return "STALEMATE DETECTED";

    switch (result.reason) {
      case "flag_captured":
        return isWinner ? "ENEMY FLAG CAPTURED" : "FLAG CAPTURED";
      case "flag_reached_base":
        return isWinner ? "INFILTRATION SUCCESSFUL" : "BASE INFILTRATED";
      case "timeout":
        return isWinner ? "ENEMY TIME EXCEEDED" : "TIME LIMIT EXCEEDED";
      case "surrender":
        return isWinner ? "OPPONENT SURRENDERED" : "MISSION ABORTED";
      case "elimination":
        return isWinner ? "HOSTILES ELIMINATED" : "FORCES ELIMINATED";
      default:
        return "OPERATION ENDED";
    }
  };

  const getResultColor = () => {
    if (isDraw) return "text-amber-500";
    return isWinner ? "text-emerald-500" : "text-red-500";
  };

  // Play victory/lose SFX when modal opens
  useEffect(() => {
    if (isOpen && !isDraw) {
      if (isWinner) {
        playSFX("player-victory");
      } else {
        playSFX("player-lose");
      }
    }
  }, [isOpen, isWinner, isDraw, playSFX]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full bg-zinc-900 backdrop-blur-xl border border-white/10 p-0 overflow-hidden shadow-2xl [&>button]:hidden text-white rounded-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>Game Result</DialogTitle>
        </DialogHeader>

        {isWinner && (
          <ConfettiBoom
            mode="boom"
            particleCount={100}
            colors={["#10B981", "#34D399", "#059669", "#6EE7B7"]}
            shapeSize={12}
            launchSpeed={1.5}
            opacityDeltaMultiplier={2}
          />
        )}

        <div className="relative flex flex-col items-center">
          {/* Top Security Header */}
          <div className="w-full flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/40" />
              <span className="text-xs font-mono text-white/40 tracking-[0.2em]">
                AFTER_ACTION_REPORT
              </span>
            </div>
            <div className="hidden lg:block text-xs font-mono text-white/20">
              {gameId}
            </div>
          </div>

          <div className="w-full p-4 md:p-12 flex flex-col items-center relative overflow-hidden overflow-y-auto max-h-[80vh]">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Result Icon */}
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className={`w-12 h-12 md:w-24 md:h-24 mb-3 md:mb-6 rounded-xl md:rounded-2xl border-2 flex items-center justify-center relative ${
                isWinner
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : isDraw
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-red-500/50 bg-red-500/10"
              }`}
            >
              {isWinner ? (
                <Trophy className="w-12 h-12 text-emerald-500" />
              ) : isDraw ? (
                <AlertTriangle className="w-12 h-12 text-amber-500" />
              ) : (
                <Skull className="w-12 h-12 text-red-500" />
              )}

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-50" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-50" />
            </motion.div>

            {/* Status Text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-10"
            >
              <h1
                className={`text-3xl md:text-7xl font-black tracking-tighter mb-1 ${getResultColor()}`}
              >
                {getResultText()}
              </h1>
              <div className="flex items-center justify-center gap-2 md:gap-3">
                <div
                  className={`h-[1px] w-6 md:w-12 ${isWinner ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <p className="text-[10px] md:text-sm font-mono tracking-[0.1em] md:tracking-[0.2em] text-white/60 uppercase">
                  {getMissionStatus()}
                </p>
                <div
                  className={`h-[1px] w-6 md:w-12 ${isWinner ? "bg-emerald-500" : "bg-red-500"}`}
                />
              </div>
              <p className="mt-2 text-white/40 font-mono text-[10px] uppercase tracking-widest px-4">
                [{getReasonText()}]
              </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full grid grid-cols-3 gap-px bg-white/5 border border-white/10 rounded-sm overflow-hidden mb-4 md:mb-8"
            >
              <div className="bg-black/40 p-2 md:p-4 flex flex-col items-center justify-center text-center group hover:bg-zinc-800/40 transition-colors">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-400 mb-1 md:mb-2 opacity-70 group-hover:scale-110 transition-transform" />
                <div className="text-lg md:text-2xl font-mono font-bold text-white">
                  {formatDuration(result.duration)}
                </div>
                <div className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/40">
                  Duration
                </div>
              </div>
              <div className="bg-black/40 p-2 md:p-4 flex flex-col items-center justify-center text-center group hover:bg-zinc-800/40 transition-colors">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-400 mb-1 md:mb-2 opacity-70 group-hover:scale-110 transition-transform" />
                <div className="text-lg md:text-2xl font-mono font-bold text-white">
                  {result.moves}
                </div>
                <div className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/40">
                  Moves
                </div>
              </div>
              <div className="bg-black/40 p-2 md:p-4 flex flex-col items-center justify-center text-center group hover:bg-zinc-800/40 transition-colors">
                <Medal className="w-4 h-4 md:w-5 md:h-5 text-purple-400 mb-1 md:mb-2 opacity-70 group-hover:scale-110 transition-transform" />
                <div className="text-lg md:text-2xl font-mono font-bold text-white leading-none mt-1">
                  {profile.rank}
                </div>
                <div className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/40 mt-1">
                  Rank
                </div>
              </div>
            </motion.div>

            {/* Player Comparison */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full flex items-center justify-center gap-4 md:gap-8 mb-6 px-4"
            >
              {/* You */}
              <div className="flex items-center gap-2">
                <UserAvatar
                  username={
                    isPlayer1 ? result.player1Username : result.player2Username
                  }
                  avatarUrl={
                    isPlayer1
                      ? player1Profile?.avatarUrl
                      : player2Profile?.avatarUrl
                  }
                  className={`w-8 h-8 md:w-10 md:h-10 border-2 ${isWinner ? "border-emerald-500" : "border-red-500"}`}
                />
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-xs font-bold text-white">
                    YOU
                  </span>
                  <span
                    className={`text-[8px] md:text-[10px] font-mono ${isWinner ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {isWinner ? "+RATING" : "-RATING"}
                  </span>
                </div>
              </div>

              <div className="h-4 md:h-8 w-px bg-white/10" />

              {/* Opponent */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] md:text-xs font-bold text-white/70">
                    OPPONENT
                  </span>
                  <span className="text-[8px] md:text-[10px] font-mono text-white/40 truncate max-w-[80px] md:max-w-none">
                    {isPlayer1
                      ? result.player2Username
                      : result.player1Username}
                  </span>
                </div>
                <UserAvatar
                  username={
                    isPlayer1 ? result.player2Username : result.player1Username
                  }
                  avatarUrl={
                    isPlayer1
                      ? player2Profile?.avatarUrl
                      : player1Profile?.avatarUrl
                  }
                  className={`w-8 h-8 md:w-10 md:h-10 border-2 ${!isWinner ? "border-emerald-500" : "border-red-500"}`}
                />
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full"
            >
              <Button
                onClick={onCheckBoard}
                variant="outline"
                className="h-10 md:h-12 border-white/10 hover:bg-white/5 text-white bg-transparent font-mono text-[10px] md:text-xs tracking-wider rounded-sm"
              >
                <Target className="w-4 h-4 mr-2" />
                ANALYZE_BOARD
              </Button>

              {gameId && onViewReplay && (
                <Button
                  onClick={() => onViewReplay(gameId)}
                  variant="outline"
                  className="h-10 md:h-12 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 bg-blue-500/5 font-mono text-[10px] md:text-xs tracking-wider rounded-sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  REPLAY_MISSION
                </Button>
              )}

              <Button
                onClick={onReturnToLobby}
                className="h-10 md:h-12 bg-white text-black hover:bg-white/90 font-bold font-mono text-[10px] md:text-xs tracking-wider rounded-sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                RETURN_TO_BASE
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
