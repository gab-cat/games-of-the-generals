import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Trophy,
  Target,
  Shield,
  Zap,
  RotateCcw,
  Skull,
  Swords,
  Brain,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSound } from "../../lib/SoundProvider";
import ConfettiBoom from "react-confetti-boom";

interface AIGameResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: "player1" | "player2" | null;
  gameEndReason: string | null;
  difficulty: "easy" | "medium" | "hard";
  behavior: "aggressive" | "defensive" | "passive" | "balanced";
  moveCount: number;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export function AIGameResultModal({
  isOpen,
  onClose,
  winner,
  gameEndReason,
  difficulty,
  behavior,
  moveCount,
  onPlayAgain,
  onReturnToLobby,
}: AIGameResultModalProps) {
  const isVictory = winner === "player1";
  const isDefeat = winner === "player2";
  const { playSFX } = useSound();

  const getResultIcon = () => {
    if (isVictory) return <Trophy className="h-10 w-10 text-emerald-500" />;
    if (isDefeat) return <Skull className="h-10 w-10 text-red-500" />;
    return <Trophy className="h-10 w-10 text-gray-400" />;
  };

  const getResultTitle = () => {
    if (isVictory) return "VICTORY";
    if (isDefeat) return "DEFEAT";
    return "DRAW";
  };

  const getMissionStatus = () => {
    if (isVictory) return "MISSION ACCOMPLISHED";
    if (isDefeat) return "MISSION FAILED";
    return "MISSION ENDED";
  };

  const getReasonDescription = () => {
    if (!winner) return "STALEMATE DETECTED";
    if (!gameEndReason) return "OPERATION ENDED";

    switch (gameEndReason) {
      case "flag_captured":
        return isVictory ? "ENEMY FLAG CAPTURED" : "FLAG CAPTURED";
      case "flag_reached_base":
        return isVictory ? "INFILTRATION SUCCESSFUL" : "BASE INFILTRATED";
      case "elimination":
        return isVictory ? "HOSTILES ELIMINATED" : "FORCES ELIMINATED";
      case "timeout":
        return isVictory ? "ENEMY TIME EXCEEDED" : "TIME LIMIT EXCEEDED";
      case "surrender":
        return isVictory ? "OPPONENT SURRENDERED" : "MISSION ABORTED";
      default:
        return gameEndReason.replace(/_/g, " ").toUpperCase();
    }
  };

  const getResultColor = () => {
    if (isVictory) return "text-emerald-500";
    if (isDefeat) return "text-red-500";
    return "text-white";
  };

  // Play victory/lose SFX when modal opens
  React.useEffect(() => {
    if (isOpen && winner) {
      if (isVictory) {
        playSFX("player-victory");
      } else if (isDefeat) {
        playSFX("player-lose");
      }
    }
  }, [isOpen, winner, isVictory, isDefeat, playSFX]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full bg-zinc-950 backdrop-blur-xl border border-white/10 p-0 overflow-hidden shadow-2xl text-white sm:max-w-2xl rounded-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>Game Result</DialogTitle>
          <DialogDescription>
            Match analysis against AI Opponent
          </DialogDescription>
        </DialogHeader>

        {isVictory && (
          <ConfettiBoom
            mode="boom"
            particleCount={80}
            colors={["#10B981", "#34D399", "#059669", "#6EE7B7"]}
            shapeSize={10}
            launchSpeed={1.2}
            opacityDeltaMultiplier={2.5}
          />
        )}

        <div className="relative flex flex-col items-center">
          {/* Top Security Header */}
          <div className="w-full flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/40" />
              <span className="text-xs font-mono text-white/40 tracking-[0.2em]">
                COMBAT_SIMULATION_REPORT
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] h-5 border-white/10 bg-white/5 text-white/60 font-mono rounded-sm"
              >
                AI_SIMULATION
              </Badge>
            </div>
          </div>

          <div className="w-full p-8 md:p-10 flex flex-col items-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />

            {/* Result Icon */}
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className={`w-20 h-20 mb-6 rounded-2xl border-2 flex items-center justify-center relative ${
                isVictory
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : isDefeat
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-white/10 bg-white/5"
              }`}
            >
              {getResultIcon()}
            </motion.div>

            {/* Status Text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1
                className={`text-5xl font-black tracking-tighter mb-2 ${getResultColor()}`}
              >
                {getResultTitle()}
              </h1>
              <div className="flex items-center justify-center gap-3">
                <div
                  className={`h-[1px] w-8 ${isVictory ? "bg-emerald-500" : isDefeat ? "bg-red-500" : "bg-white/20"}`}
                />
                <p className="text-xs font-mono tracking-[0.2em] text-white/60 uppercase">
                  {getMissionStatus()}
                </p>
                <div
                  className={`h-[1px] w-8 ${isVictory ? "bg-emerald-500" : isDefeat ? "bg-red-500" : "bg-white/20"}`}
                />
              </div>
              <p className="mt-3 text-white/40 font-mono text-[10px] uppercase tracking-widest">
                [{getReasonDescription()}]
              </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/10 rounded-sm overflow-hidden mb-8"
            >
              <div className="bg-black/40 p-3 flex flex-col items-center justify-center text-center">
                <Zap className="w-4 h-4 text-blue-400 mb-2 opacity-70" />
                <div className="text-lg font-mono font-bold text-white">
                  {moveCount}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-white/40">
                  Moves
                </div>
              </div>
              <div className="bg-black/40 p-3 flex flex-col items-center justify-center text-center">
                <Target className="w-4 h-4 text-amber-400 mb-2 opacity-70" />
                <div className="text-lg font-mono font-bold text-white">
                  N/A
                </div>
                <div className="text-[9px] uppercase tracking-widest text-white/40">
                  Score
                </div>
              </div>
              <div className="bg-black/40 p-3 flex flex-col items-center justify-center text-center">
                <Swords className="w-4 h-4 text-red-400 mb-2 opacity-70" />
                <div className="text-lg font-mono font-bold text-white uppercase">
                  {difficulty}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-white/40">
                  Difficulty
                </div>
              </div>
              <div className="bg-black/40 p-3 flex flex-col items-center justify-center text-center">
                <Brain className="w-4 h-4 text-purple-400 mb-2 opacity-70" />
                <div className="text-lg font-mono font-bold text-white uppercase">
                  {behavior}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-white/40">
                  AI Logic
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 w-full justify-center"
            >
              <Button
                onClick={onPlayAgain}
                className="h-10 bg-white text-black hover:bg-white/90 font-bold font-mono text-xs tracking-wider flex-1 max-w-xs rounded-sm"
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                REINITIATE_SIM
              </Button>
              <Button
                onClick={onReturnToLobby}
                variant="outline"
                className="h-10 border-white/10 hover:bg-white/5 text-white bg-transparent font-mono text-xs tracking-wider flex-1 max-w-xs rounded-sm"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                RETURN_TO_LOBBY
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
