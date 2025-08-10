import { motion } from "framer-motion";

export function LeaderboardLoading() {
  return (
    <div className="flex justify-center py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full"
      />
    </div>
  );
}
