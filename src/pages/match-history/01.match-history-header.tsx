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
      className="flex items-center gap-4 mb-6"
    >
      {/* Battle Chronicles Icon Section */}
      <motion.div
        initial={{ scale: 0, rotateY: -180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
        className="w-12 h-12 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
      >
        {/* Animated history scroll effect */}
        <motion.div
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-blue-500/10 rounded-xl"
        />
        <Calendar className="h-6 w-6 text-purple-400 relative z-10" />
      </motion.div>
      
      <div className="flex flex-col">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <h3 className="text-lg font-semibold text-white/90">Battle Chronicles</h3>
          <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            {totalMatches} battles
          </Badge>
        </motion.div>
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex items-center gap-2"
        >
          <div className="h-0.5 w-8 bg-gradient-to-r from-purple-500/60 to-blue-500/60 rounded-full"></div>
          <span className="text-xs text-white/50 font-mono">
            Victory and defeat records
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
