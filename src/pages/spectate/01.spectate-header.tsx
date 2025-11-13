import { motion } from "framer-motion";
import { Eye, Users, Clock, ArrowLeft, Copy } from "lucide-react";
import { CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import Squares from "../../components/backgrounds/Squares/Squares";

interface SpectateHeaderProps {
  spectatorCount: number;
  gameStatus: string;
  timeRemaining: string;
  gameId: string;
  onBack: () => void;
}

export function SpectateHeader({ 
  spectatorCount, 
  gameStatus, 
  timeRemaining, 
  gameId, 
  onBack 
}: SpectateHeaderProps) {
  const copyGameId = () => {
    void navigator.clipboard.writeText(gameId);
    toast.success("Game ID copied to clipboard!");
  };

  return (
    <div className="flex items-center justify-between relative overflow-hidden">
      {/* Animated Squares Background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <Squares
          direction="right"
          speed={0.6}
          squareSize={40}
          borderColor="rgba(255,255,255,0.1)"
        />
      </div>

      <div className="flex items-center justify-between relative z-10 w-full">
      <div className="flex items-center gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>
        </motion.div>

        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-500/30"
          >
            <Eye className="w-5 h-5 text-blue-400" />
          </motion.div>

          <div>
            <CardTitle className="text-xl font-bold text-white/90">Spectating Game</CardTitle>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="outline" 
                className="bg-green-500/20 text-green-300 border-green-500/30"
              >
                {gameStatus}
              </Badge>
              <Badge 
                variant="outline" 
                className="bg-blue-500/20 text-blue-300 border-blue-500/30"
              >
                <Users className="w-3 h-3 mr-1" />
                {spectatorCount} watching
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-white/80">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{timeRemaining}</span>
        </div>

        <Button
          onClick={copyGameId}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Game ID
        </Button>
      </div>
    </div>
    </div>
  );
}
