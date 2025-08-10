import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export function LeaderboardHeader() {
  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
        className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden flex-shrink-0"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl"
        />
        <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 relative z-10" />
      </motion.div>
      
      <div className="flex flex-col min-w-0">
        <motion.h3 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg font-semibold text-white/90"
        >
          Hall of Generals
        </motion.h3>
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex items-center gap-2"
        >
          <div className="h-0.5 w-6 sm:w-8 bg-gradient-to-r from-yellow-500/60 to-orange-500/60 rounded-full"></div>
          <span className="text-xs text-white/50 font-mono">
            Elite commanders ranked
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}