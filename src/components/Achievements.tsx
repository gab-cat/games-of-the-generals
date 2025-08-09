"use client";

import { motion } from "framer-motion";
import { useConvexQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Trophy, Award, Lock, CheckCircle } from "lucide-react";

export function Achievements() {
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

  const AchievementCard = ({ achievement }: { achievement: any }) => (
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
      {/* Header */}
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
            <div className="text-2xl font-bold text-yellow-400">{unlockedAchievements.length}</div>
            <div className="text-sm text-gray-400">Unlocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{lockedAchievements.length}</div>
            <div className="text-sm text-gray-400">Locked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
            </div>
            <div className="text-sm text-gray-400">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <Progress 
            value={(unlockedAchievements.length / achievements.length) * 100} 
            className="h-2"
          />
        </div>
      </motion.div>

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
