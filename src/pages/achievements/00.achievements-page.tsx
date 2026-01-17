import { motion } from "framer-motion";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Trophy, Award, Flame, Star, Zap, Target } from "lucide-react";
import { AchievementsHeader } from "./01.achievements-header";
import { AchievementCard } from "./02.achievement-card";
import { useAutoAnimate } from "../../lib/useAutoAnimate";

export function AchievementsPage() {
  const categoryGridRef = useAutoAnimate();
  const unlockedGridRef = useAutoAnimate();
  const recentUnlocksRef = useAutoAnimate();
  const {
    data: achievements,
    isPending: isLoadingAchievements,
    error: achievementsError,
  } = useConvexQuery(api.achievements.getAllAchievements);

  if (isLoadingAchievements) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-yellow-500/20 border-t-yellow-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 bg-yellow-500/20 rounded-full animate-pulse" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (achievementsError) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="text-red-400/90 font-mono text-lg tracking-wide uppercase">
            System Error: Failed to load data
          </div>
          <div className="text-white/40 text-sm">
            Please try refreshing the page
          </div>
        </motion.div>
      </div>
    );
  }

  if (!achievements) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="text-white/40 text-lg font-mono">
            No achievement data found
          </div>
        </motion.div>
      </div>
    );
  }

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  const categoryGroups = {
    milestone: achievements.filter((a) => a.category === "milestone"),
    rank: achievements.filter((a) => a.category === "rank"),
    streak: achievements.filter((a) => a.category === "streak"),
    special: achievements.filter((a) => a.category === "special"),
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const CategorySection = ({
    title,
    achievements,
    icon: Icon,
  }: {
    title: string;
    achievements: any[];
    icon: any;
  }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="p-2 rounded bg-white/5 border border-white/5">
          <Icon className="w-5 h-5 text-yellow-500" />
        </div>
        <h3 className="text-xl font-display tracking-tight text-white">
          {title}
        </h3>
        <div className="ml-auto text-xs font-mono text-white/30 uppercase tracking-widest">
          {achievements.filter((a) => a.unlocked).length} /{" "}
          {achievements.length} UNLOCKED
        </div>
      </div>
      <div
        ref={categoryGridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Global decorative background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0)_0%,#000000_100%)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        <AchievementsHeader
          unlockedCount={unlockedAchievements.length}
          lockedCount={lockedAchievements.length}
          totalCount={achievements.length}
        />

        {/* Achievement Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="all" className="space-y-8">
            <div className="overflow-x-auto pb-2 scrollbar-hide">
              <TabsList className="bg-zinc-900/50 border border-white/10 p-1 flex w-full min-w-max rounded-lg backdrop-blur-md">
                <TabsTrigger
                  value="all"
                  className="flex-1 px-6 text-xs sm:text-xs font-mono uppercase tracking-wider data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 ring-0"
                >
                  All Modules
                </TabsTrigger>
                <div className="w-px h-4 bg-white/5 mx-1" />
                <TabsTrigger
                  value="unlocked"
                  className="flex-1 px-6 text-xs sm:text-xs font-mono uppercase tracking-wider data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-white/40 ring-0 data-[state=active]:border-emerald-500/30 data-[state=active]:border"
                >
                  Acquired
                </TabsTrigger>
                <div className="w-px h-4 bg-white/5 mx-1" />
                <TabsTrigger
                  value="milestone"
                  className="flex-1 px-6 text-xs sm:text-xs font-mono uppercase tracking-wider data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 text-white/40 ring-0 data-[state=active]:border-yellow-500/30 data-[state=active]:border"
                >
                  Milestones
                </TabsTrigger>
                <div className="w-px h-4 bg-white/5 mx-1" />
                <TabsTrigger
                  value="rank"
                  className="flex-1 px-6 text-xs sm:text-xs font-mono uppercase tracking-wider data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 text-white/40 ring-0 data-[state=active]:border-purple-500/30 data-[state=active]:border"
                >
                  Rank
                </TabsTrigger>
                <div className="w-px h-4 bg-white/5 mx-1" />
                <TabsTrigger
                  value="streak"
                  className="flex-1 px-6 text-xs sm:text-xs font-mono uppercase tracking-wider data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-white/40 ring-0 data-[state=active]:border-orange-500/30 data-[state=active]:border"
                >
                  Streaks
                </TabsTrigger>
                <div className="w-px h-4 bg-white/5 mx-1" />
                <TabsTrigger
                  value="special"
                  className="flex-1 px-6 text-xs sm:text-xs font-mono uppercase tracking-wider data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-white/40 ring-0 data-[state=active]:border-red-500/30 data-[state=active]:border"
                >
                  Special Ops
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="all"
              className="space-y-16 animate-in fade-in zoom-in-95 duration-500"
            >
              <CategorySection
                title="Milestone Protocols"
                achievements={categoryGroups.milestone}
                icon={Target}
              />
              <CategorySection
                title="Rank Designations"
                achievements={categoryGroups.rank}
                icon={Award}
              />
              <CategorySection
                title="Streak Records"
                achievements={categoryGroups.streak}
                icon={Flame}
              />
              <CategorySection
                title="Special Operations"
                achievements={categoryGroups.special}
                icon={Star}
              />
            </TabsContent>

            <TabsContent
              value="unlocked"
              className="animate-in fade-in zoom-in-95 duration-500"
            >
              {unlockedAchievements.length > 0 ? (
                <div
                  ref={unlockedGridRef}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {unlockedAchievements
                    .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
                    .map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-24 border border-dashed border-white/10 rounded-lg bg-white/5">
                  <div className="inline-flex items-center justify-center p-4 rounded-full bg-white/5 mb-4">
                    <Trophy className="w-8 h-8 opacity-20" />
                  </div>
                  <h3 className="text-xl font-display tracking-wide mb-2">
                    No Acquisitions Yet
                  </h3>
                  <p className="text-white/40 font-mono text-sm">
                    Complete objectives to unlock awards.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="milestone"
              className="animate-in fade-in zoom-in-95 duration-500"
            >
              <CategorySection
                title="Milestone Protocols"
                achievements={categoryGroups.milestone}
                icon={Target}
              />
            </TabsContent>

            <TabsContent
              value="rank"
              className="animate-in fade-in zoom-in-95 duration-500"
            >
              <CategorySection
                title="Rank Designations"
                achievements={categoryGroups.rank}
                icon={Award}
              />
            </TabsContent>

            <TabsContent
              value="streak"
              className="animate-in fade-in zoom-in-95 duration-500"
            >
              <CategorySection
                title="Streak Records"
                achievements={categoryGroups.streak}
                icon={Flame}
              />
            </TabsContent>

            <TabsContent
              value="special"
              className="animate-in fade-in zoom-in-95 duration-500"
            >
              <CategorySection
                title="Special Operations"
                achievements={categoryGroups.special}
                icon={Star}
              />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Recent Unlocks (Compact Feed) */}
        {unlockedAchievements.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="border-t border-white/10 pt-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-display tracking-wide text-white">
                Recent Activity Log
              </h2>
            </div>

            <div
              ref={recentUnlocksRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {unlockedAchievements
                .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
                .slice(0, 3)
                .map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-lg hover:border-white/10 transition-colors"
                  >
                    <div className="text-xl opacity-80">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-yellow-500/80 truncate mb-0.5">
                        {achievement.name}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">
                        {achievement.description}
                      </div>
                    </div>
                    <div className="text-[10px] text-white/20 font-mono whitespace-nowrap">
                      {formatDate(achievement.unlockedAt)}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
