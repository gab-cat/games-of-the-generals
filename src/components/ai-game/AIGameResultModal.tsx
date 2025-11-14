import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Crown, Bot, Trophy, Target, Shield, Zap, Star, RotateCcw } from "lucide-react";
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
    if (isVictory) return <Crown className="h-12 w-12 text-yellow-400" />;
    if (isDefeat) return <Bot className="h-12 w-12 text-red-400" />;
    return <Trophy className="h-12 w-12 text-gray-400" />;
  };

  const getResultTitle = () => {
    if (isVictory) return "Victory!";
    if (isDefeat) return "AI Wins";
    return "Game Over";
  };

  const getResultDescription = () => {
    if (isVictory) return "Congratulations! You defeated the AI opponent.";
    if (isDefeat) return "The AI was too clever this time. Better luck next battle!";
    return "The game has ended.";
  };

  const getReasonDescription = () => {
    switch (gameEndReason) {
      case "flag_captured":
        return isVictory ? "You captured the AI's flag!" : "Your flag was captured by the AI.";
      case "flag_reached_base":
        return isVictory ? "Your flag reached the AI's back row!" : "The AI's flag reached your back row.";
      case "elimination":
        return "All enemy pieces have been eliminated.";
      case "timeout":
        return "The game timed out.";
      case "surrender":
        return "Game was surrendered.";
      default:
        return gameEndReason?.replace(/_/g, " ") || "Unknown reason";
    }
  };

  const getDifficultyIcon = () => {
    switch (difficulty) {
      case "easy": return <Star className="h-4 w-4" />;
      case "medium": return <Zap className="h-4 w-4" />;
      case "hard": return <Crown className="h-4 w-4" />;
    }
  };

  const getBehaviorIcon = () => {
    switch (behavior) {
      case "aggressive": return <Target className="h-4 w-4" />;
      case "defensive": return <Shield className="h-4 w-4" />;
      case "passive": return <Star className="h-4 w-4" />;
      case "balanced": return <Zap className="h-4 w-4" />;
    }
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
      <DialogContent className="sm:max-w-md border-white/10 bg-black/80 backdrop-blur-xl">
        {/* Confetti effect for victories */}
        {isVictory && (
          <ConfettiBoom
            mode="boom"
            particleCount={80}
            colors={['#FFD700', '#FFA500', '#FF6B35', '#F7931E', '#FFD700']}
            shapeSize={10}
            launchSpeed={1.2}
            opacityDeltaMultiplier={2.5}
          />
        )}

        {/* Fall effect for defeats */}
        {isDefeat && (
          <ConfettiBoom
            mode="fall"
            particleCount={50}
            colors={['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FEE2E2']}
            shapeSize={7}
            fadeOutHeight={0.8}
          />
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-6"
        >
          <DialogHeader>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center"
            >
              {getResultIcon()}
            </motion.div>
            <DialogTitle className={`text-2xl font-bold ${isVictory ? 'text-green-400' : isDefeat ? 'text-red-400' : 'text-gray-400'}`}>
              {getResultTitle()}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {getResultDescription()}
            </DialogDescription>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Game Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-white/90">{moveCount}</div>
                <div className="text-xs text-white/60">Moves</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white/90">
                  {getReasonDescription()}
                </div>
                <div className="text-xs text-white/60">Result</div>
              </div>
            </div>

            {/* AI Configuration */}
            <div className="space-y-2">
              <div className="text-sm text-white/60">Opponent Configuration:</div>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20">
                  {getDifficultyIcon()}
                  <span className="ml-1 capitalize">{difficulty}</span>
                </Badge>
                <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20">
                  {getBehaviorIcon()}
                  <span className="ml-1 capitalize">{behavior}</span>
                </Badge>
              </div>
            </div>
          </motion.div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-2 w-full"
            >
              <Button
                onClick={onPlayAgain}
                className="flex-1 bg-blue-600/80 hover:bg-blue-700/80 text-white border-0"
                size="lg"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Play Again
              </Button>
              <Button
                onClick={onReturnToLobby}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
                size="lg"
              >
                Return to Lobby
              </Button>
            </motion.div>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
