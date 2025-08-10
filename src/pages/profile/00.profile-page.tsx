import { useState } from "react";
import { motion } from "framer-motion";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { ProfileHeader } from "./01.profile-header";
import { AvatarSettings } from "./02.avatar-settings";
import { BattleStats } from "./03.battle-stats";
import { RecentGames } from "./04.recent-games";
import { PerformanceInsights } from "./05.performance-insights";

export function ProfilePage() {
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  
  const { data: profileStats, isPending: isLoadingStats, error: statsError } = useConvexQuery(
    api.profiles.getProfileStats
  );

  if (isLoadingStats) {
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

  if (statsError) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="text-red-400 text-lg">Failed to load profile stats</div>
          <div className="text-white/60 text-sm">Please try refreshing the page</div>
        </motion.div>
      </div>
    );
  }

  if (!profileStats) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="text-white/60 text-lg">No profile data available</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden flex items-start justify-center p-6">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        <ProfileHeader 
          profileStats={profileStats}
          onAvatarSettingsToggle={() => setShowAvatarUpload(!showAvatarUpload)}
        />

        {/* Avatar Upload Section */}
        {showAvatarUpload && (
          <AvatarSettings
            username={profileStats.username}
            currentAvatarUrl={profileStats.avatarUrl}
            rank={profileStats.rank}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BattleStats profileStats={profileStats} />
          <RecentGames recentGames={profileStats.recentGames} userId={profileStats.userId} />
          <PerformanceInsights profileStats={profileStats} />
        </div>
      </div>
    </div>
  );
}
