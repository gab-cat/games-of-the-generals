import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { ProfileHeader } from "./01.profile-header";
import { AvatarSettings } from "./02.avatar-settings";
import { BattleStats } from "./03.battle-stats";
import { RecentGames } from "./04.recent-games";
import { PerformanceInsights } from "./05.performance-insights";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useState as useReactState } from "react";
import { useDebounce } from "use-debounce";
import { User } from "lucide-react";

const route = getRouteApi("/profile");

export function ProfilePage() {
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const search = route.useSearch();
  const usernameParam = (search.u || "").trim();
  const navigate = useNavigate();

  // Username search + suggestions
  const [inputValue, setInputValue] = useReactState(usernameParam);
  const [debounced] = useDebounce(inputValue, 500);
  const { data: suggestions } = useConvexQuery(api.profiles.searchUsernames, { q: debounced, limit: 20 });

  // Load current user's stats
  const { data: ownStats, isPending: isLoadingOwn, error: ownError } = useConvexQuery(
    api.profiles.getProfileStats
  );

  // Load other user's stats by username when provided
  const { data: otherStats, isPending: isLoadingOther, error: otherError } = useConvexQuery(
    api.profiles.getProfileStatsByUsername,
    { username: usernameParam }
  );

  const isViewingOther = !!usernameParam;
  const profileStats = useMemo(() => (isViewingOther ? otherStats : ownStats), [isViewingOther, otherStats, ownStats]);
  const isLoadingStats = isViewingOther ? isLoadingOther : isLoadingOwn;
  const statsError = isViewingOther ? otherError : ownError;

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
          <div className="text-white/60 text-lg">{isViewingOther ? "User not found" : "No profile data available"}</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-start justify-center p-6 px-0">

      <div className="relative z-10 w-full max-w-7xl">
        {/* Username search with suggestions */}
        <div className="mb-4 px-4">
          <div className="relative max-w-md">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search username"
              className="pl-9 bg-white/10 border-white/20 text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const u = inputValue.trim();
                  void navigate({ to: "/profile", search: u ? { u } : {} });
                  setInputValue("");
                }
              }}
            />
            <User className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <Button
              variant="gradient"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-3"
              onClick={() => {
                const u = inputValue.trim();
                void navigate({ to: "/profile", search: u ? { u } : {} });
                setInputValue("");
              }}
              disabled={!inputValue.trim()}
            >
              View
            </Button>
            {suggestions && suggestions.length > 0 && inputValue.trim() && (
              <div className="absolute left-0 right-0 mt-2 rounded-lg border border-white/10 bg-black/80 backdrop-blur-md shadow-xl z-50 max-h-64 overflow-y-auto">
                {suggestions.map((s: any) => (
                  <button
                    key={s.username}
                    className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2"
                    onClick={() => {
                      void navigate({ to: "/profile", search: { u: s.username } });
                      setInputValue("");
                    }}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                      {/* Simple avatar placeholder; actual avatar shown in header */}
                      <span className="text-xs text-white/70">@</span>
                    </div>
                    <span className="text-white text-sm">{s.username}</span>
                    <span className="text-xs text-white/50 ml-auto">{s.rank}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <ProfileHeader
          profileStats={{
            ...profileStats,
            userId: isViewingOther ? otherStats?.userId : ownStats?.userId
          }}
          onAvatarSettingsToggle={() => setShowAvatarUpload(!showAvatarUpload)}
          isOwnProfile={!isViewingOther}
        />

        {/* Avatar Upload Section */}
        {(!isViewingOther && showAvatarUpload) && (
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
