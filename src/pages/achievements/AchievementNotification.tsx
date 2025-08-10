import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Medal, Target, Zap } from "lucide-react";
import { useConvexMutationWithQuery, useConvexQuery } from "@/lib/convex-query-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";


interface AchievementNotificationProps {
  userId?: string;
  onAchievementSeen?: (achievementId: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "milestone":
      return Trophy;
    case "streak":
      return Zap;
    case "rank":
      return Star;
    case "special":
      return Target;
    case "combat":
      return Medal;
    default:
      return Trophy;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "milestone":
      return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    case "streak":
      return "text-orange-400 bg-orange-500/20 border-orange-500/30";
    case "rank":
      return "text-purple-400 bg-purple-500/20 border-purple-500/30";
    case "special":
      return "text-blue-400 bg-blue-500/20 border-blue-500/30";
    case "combat":
      return "text-red-400 bg-red-500/20 border-red-500/30";
    default:
      return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
  }
};

export function AchievementNotification({ userId, onAchievementSeen }: AchievementNotificationProps) {
  const { data: recentAchievements, isPending: isLoadingAchievements, error: achievementsError } = useConvexQuery(
    api.achievements.getRecentAchievements, 
    { 
      userId: userId as any,
      hoursBack: 1 
    }
  );
  
  const markAsSeen = useConvexMutationWithQuery(api.achievements.markAchievementsAsSeen, {
    onError: (error) => {
      console.error("Failed to mark achievements as seen:", error);
      toast.error("Failed to update achievement status");
    }
  });
  
  const [shownAchievements, setShownAchievements] = useState<Set<string>>(new Set());
  const [visibleAchievement, setVisibleAchievement] = useState<any>(null);

  useEffect(() => {
    if (!recentAchievements || isLoadingAchievements) return;
    
    if (achievementsError) {
      console.error("Error loading achievements:", achievementsError);
      return;
    }

    // Find new achievements that haven't been shown yet
    const newAchievements = recentAchievements.filter(
      (achievement: any) => !achievement.seenAt && !shownAchievements.has(achievement.achievementId)
    );

    if (newAchievements.length > 0) {
      // Show the first new achievement
      const achievement = newAchievements[0];
      setVisibleAchievement(achievement);
      
      // Mark as shown locally
      setShownAchievements(prev => new Set([...prev, achievement.achievementId]));
      
      // Show toast notification
      toast.success(`🏆 Achievement Unlocked: ${achievement.name}`, {
        description: achievement.description,
        duration: 5000,
      });

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setVisibleAchievement(null);
        // Mark as seen in database
        markAsSeen.mutate({ achievementIds: [achievement.achievementId] });
        onAchievementSeen?.(achievement.achievementId);
      }, 5000);
    }
  }, [recentAchievements, shownAchievements, markAsSeen, onAchievementSeen, isLoadingAchievements, achievementsError]);

  const handleDismiss = () => {
    if (visibleAchievement) {
      setVisibleAchievement(null);
      markAsSeen.mutate({ achievementIds: [visibleAchievement.achievementId] });
      onAchievementSeen?.(visibleAchievement.achievementId);
    }
  };

  return (
    <AnimatePresence>
      {visibleAchievement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Card 
            className={`w-80 cursor-pointer hover:scale-105 transition-transform ${getCategoryColor(visibleAchievement.category)} backdrop-blur-xl border shadow-2xl`}
            onClick={handleDismiss}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="flex-shrink-0"
                >
                  {(() => {
                    const IconComponent = getCategoryIcon(visibleAchievement.category);
                    return <IconComponent className="h-8 w-8" />;
                  })()}
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{visibleAchievement.icon}</span>
                    <Badge variant="secondary" className="text-xs">
                      {visibleAchievement.category}
                    </Badge>
                  </div>
                  
                  <h3 className="font-bold text-lg text-white leading-tight">
                    {visibleAchievement.name}
                  </h3>
                  
                  <p className="text-sm text-white/70 mt-1 leading-relaxed">
                    {visibleAchievement.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-white/50">
                      Achievement Unlocked!
                    </span>
                    <span className="text-xs text-white/50">
                      Click to dismiss
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
