import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface LeaderboardErrorProps {
  hasError: boolean;
}

export function LeaderboardError({ hasError }: LeaderboardErrorProps) {
  if (hasError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Trophy className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Failed to load leaderboard</p>
        <p className="text-sm text-white/40">Please try refreshing the page</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <Trophy className="h-12 w-12 text-white/40 mx-auto mb-4" />
      <p className="text-white/60">No commanders ranked yet.</p>
      <p className="text-sm text-white/40">Be the first to claim your position!</p>
    </motion.div>
  );
}
