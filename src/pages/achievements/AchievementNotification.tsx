import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  useConvexMutationWithQuery,
  useConvexQuery,
} from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";

interface AchievementNotificationProps {
  userId?: string;
  onAchievementSeen?: (achievementId: string) => void;
}

export function AchievementNotification({
  userId,
  onAchievementSeen,
}: AchievementNotificationProps) {
  const {
    data: recentAchievements,
    isPending: isLoadingAchievements,
    error: achievementsError,
  } = useConvexQuery(api.achievements.getRecentAchievements, {
    userId: userId as any,
    hoursBack: 1,
  });

  const markAsSeen = useConvexMutationWithQuery(
    api.achievements.markAchievementsAsSeen,
    {
      onError: (error) => {
        console.error("Failed to mark achievements as seen:", error);
        toast.error("Failed to update achievement status");
      },
    },
  );

  const [shownAchievements, setShownAchievements] = useState<Set<string>>(
    new Set(),
  );
  const [visibleAchievement, setVisibleAchievement] = useState<any>(null);

  useEffect(() => {
    if (!recentAchievements || isLoadingAchievements) return;

    if (achievementsError) {
      console.error("Error loading achievements:", achievementsError);
      return;
    }

    // Find new achievements that haven't been shown yet
    const newAchievements = recentAchievements.filter(
      (achievement: any) =>
        !achievement.seenAt &&
        !shownAchievements.has(achievement.achievementId),
    );

    if (newAchievements.length > 0) {
      // Show the first new achievement
      const achievement = newAchievements[0];
      setVisibleAchievement(achievement);

      // Mark as shown locally
      setShownAchievements(
        (prev) => new Set([...prev, achievement.achievementId]),
      );

      // Show toast notification
      toast.success(`Achievement unlocked: ${achievement.name}`, {
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
  }, [
    recentAchievements,
    shownAchievements,
    markAsSeen,
    onAchievementSeen,
    isLoadingAchievements,
    achievementsError,
  ]);

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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:w-80"
        >
          <div
            className="relative cursor-pointer rounded-lg border border-gold-500/30 bg-card p-4 pr-12 shadow-lg transition-colors hover:border-gold-500/50"
            onClick={handleDismiss}
          >
            <button
              type="button"
              aria-label="Dismiss"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
            >
              <X className="size-4" />
            </button>
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-2xl leading-none">
                {visibleAchievement.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gold-400">
                  Achievement unlocked
                </p>
                <h3 className="mt-0.5 font-medium leading-tight text-foreground">
                  {visibleAchievement.name}
                </h3>
                <p className="mt-1 text-sm text-foreground/80">
                  {visibleAchievement.description}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
