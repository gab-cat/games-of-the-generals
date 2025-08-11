import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { Badge } from "../../components/ui/badge";

interface MatchHistoryHeaderProps {
  totalMatches: number;
}

export function MatchHistoryHeader({ totalMatches }: MatchHistoryHeaderProps) {
  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex items-center gap-2 sm:gap-4"
    >
      {/* Battle Chronicles Icon Section */}
      <motion.div
        initial={{ scale: 0, rotateY: -180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
        className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden flex-shrink-0"
      >
        {/* Animated history scroll effect */}
        <motion.div
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-blue-500/10 rounded-xl"
        />
        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 relative z-10" />
      </motion.div>
      
      <div className="flex flex-col min-w-0 flex-1">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <h3 className="text-base sm:text-lg font-semibold text-white/90 truncate">Battle Chronicles</h3>
          {totalMatches > 0 && (
            <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs sm:text-sm">
              {totalMatches} on page
            </Badge>
          )}
        </motion.div>
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex items-center gap-2 mt-1"
        >
          <div className="h-0.5 w-6 sm:w-8 bg-gradient-to-r from-purple-500/60 to-blue-500/60 rounded-full"></div>
          <span className="text-xs text-white/50 font-mono hidden sm:inline">
            Victory and defeat records
          </span>
          <span className="text-xs text-white/50 font-mono sm:hidden">
            Battle history
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
