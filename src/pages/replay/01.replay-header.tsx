import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

interface ReplayHeaderProps {
  onBack: () => void;
  onReset: () => void;
  showAllPieces: boolean;
  onTogglePieceVisibility: () => void;
  gameStatus: string;
  result?: string;
}

export function ReplayHeader({ 
  onBack, 
  onReset, 
  showAllPieces, 
  onTogglePieceVisibility,
  gameStatus,
  result 
}: ReplayHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
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
            Back
          </Button>
        </motion.div>

        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30"
          >
            <RotateCcw className="w-5 h-5 text-purple-400" />
          </motion.div>

          <div>
            <h1 className="text-xl font-bold text-white/90">Game Replay</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="outline" 
                className="bg-purple-500/20 text-purple-300 border-purple-500/30"
              >
                {gameStatus}
              </Badge>
              {result && (
                <Badge 
                  variant="outline" 
                  className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                >
                  {result}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={onTogglePieceVisibility}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
        >
          {showAllPieces ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide Pieces
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Show All Pieces
            </>
          )}
        </Button>

        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
