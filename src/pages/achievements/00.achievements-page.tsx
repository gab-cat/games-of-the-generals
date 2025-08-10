import { motion } from "framer-motion";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Trophy, Award, CheckCircle } from "lucide-react";
import { AchievementsHeader } from "./01.achievements-header";
import { AchievementCard } from "./02.achievement-card";

export function AchievementsPage() {
  const { data: achievements, isPending: isLoadingAchievements, error: achievementsError } = useConvexQuery(
    api.achievements.getAllAchievements
  );

  if (isLoadingAchievements) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"
        />
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
          <div className="text-red-400 text-lg">Failed to load achievements</div>
          <div className="text-white/60 text-sm">Please try refreshing the page</div>
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
          <div className="text-white/60 text-lg">No achievements available</div>
        </motion.div>
      </div>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);
  
  const categoryGroups = {
    milestone: achievements.filter(a => a.category === "milestone"),
    rank: achievements.filter(a => a.category === "rank"),
    streak: achievements.filter(a => a.category === "streak"),
    special: achievements.filter(a => a.category === "special"),
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString();
  };

  const CategorySection = ({ title, achievements }: { title: string; achievements: any[] }) => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
        <Award className="w-5 h-5 text-yellow-400" />
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
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
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-800/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">
              All
            </TabsTrigger>
            <TabsTrigger value="unlocked" className="data-[state=active]:bg-green-600">
              Unlocked
            </TabsTrigger>
            <TabsTrigger value="milestone" className="data-[state=active]:bg-purple-600">
              Milestone
            </TabsTrigger>
            <TabsTrigger value="rank" className="data-[state=active]:bg-yellow-600">
              Rank
            </TabsTrigger>
            <TabsTrigger value="streak" className="data-[state=active]:bg-orange-600">
              Streak
            </TabsTrigger>
            <TabsTrigger value="special" className="data-[state=active]:bg-red-600">
              Special
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            <CategorySection title="Milestone Achievements" achievements={categoryGroups.milestone} />
            <CategorySection title="Rank Achievements" achievements={categoryGroups.rank} />
            <CategorySection title="Streak Achievements" achievements={categoryGroups.streak} />
            <CategorySection title="Special Achievements" achievements={categoryGroups.special} />
          </TabsContent>

          <TabsContent value="unlocked" className="space-y-6">
            {unlockedAchievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unlockedAchievements
                  .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
                  .map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No achievements unlocked yet</h3>
                <p>Start playing to unlock your first achievement!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="milestone">
            <CategorySection title="Milestone Achievements" achievements={categoryGroups.milestone} />
          </TabsContent>

          <TabsContent value="rank">
            <CategorySection title="Rank Achievements" achievements={categoryGroups.rank} />
          </TabsContent>

          <TabsContent value="streak">
            <CategorySection title="Streak Achievements" achievements={categoryGroups.streak} />
          </TabsContent>

          <TabsContent value="special">
            <CategorySection title="Special Achievements" achievements={categoryGroups.special} />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Recent Unlocks */}
      {unlockedAchievements.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Recent Unlocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unlockedAchievements
                  .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
                  .slice(0, 5)
                  .map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg"
                    >
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-yellow-400">{achievement.name}</div>
                        <div className="text-sm text-gray-400">{achievement.description}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(achievement.unlockedAt)}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
