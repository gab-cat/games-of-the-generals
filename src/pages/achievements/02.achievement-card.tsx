import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Lock, CheckCircle } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
}

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`${
        achievement.unlocked 
          ? "bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30" 
          : "bg-gray-800/30 border-gray-700"
      } transition-all duration-200`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`text-4xl ${achievement.unlocked ? "opacity-100" : "opacity-30"}`}>
              {achievement.icon}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${
                  achievement.unlocked ? "text-yellow-400" : "text-gray-400"
                }`}>
                  {achievement.name}
                </h3>
                {achievement.unlocked ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <p className={`text-sm ${
                achievement.unlocked ? "text-gray-300" : "text-gray-500"
              }`}>
                {achievement.description}
              </p>
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="text-xs text-yellow-400">
                  Unlocked on {formatDate(achievement.unlockedAt)}
                </div>
              )}
              {achievement.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Progress</span>
                    <span>{achievement.progress}%</span>
                  </div>
                  <Progress value={achievement.progress} className="h-1" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
