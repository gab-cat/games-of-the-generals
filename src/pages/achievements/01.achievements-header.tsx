import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Progress } from "../../components/ui/progress";

interface AchievementsHeaderProps {
  unlockedCount: number;
  lockedCount: number;
  totalCount: number;
}

export function AchievementsHeader({ unlockedCount, lockedCount, totalCount }: AchievementsHeaderProps) {
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-center space-y-4"
    >
      <div className="flex items-center justify-center gap-3">
        <Trophy className="w-8 h-8 text-yellow-400" />
        <h1 className="text-4xl font-bold text-white">Achievements</h1>
      </div>
      <p className="text-gray-400">Track your progress and unlock rewards</p>
      
      {/* Stats */}
      <div className="flex justify-center gap-8 pt-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{unlockedCount}</div>
          <div className="text-sm text-gray-400">Unlocked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">{lockedCount}</div>
          <div className="text-sm text-gray-400">Locked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{completionPercentage}%</div>
          <div className="text-sm text-gray-400">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto">
        <Progress value={completionPercentage} className="h-2" />
      </div>
    </motion.div>
  );
}
