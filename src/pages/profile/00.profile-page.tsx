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
import { useState as useReactState } from "react";
import { useDebounce } from "use-debounce";
import {
  Terminal,
  LayoutDashboard,
  ScrollText,
  PieChart,
  ShieldAlert,
  LogIn,
  UserX,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { useAuthActions } from "@convex-dev/auth/react";
import { UserNameWithBadge } from "../../components/UserNameWithBadge";

const route = getRouteApi("/profile");

export function ProfilePage() {
  const { signIn } = useAuthActions();
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const search = route.useSearch();
  const usernameParam = (search.u || "").trim();
  const navigate = useNavigate();

  // Username search + suggestions
  const [inputValue, setInputValue] = useReactState(usernameParam);
  const [debounced] = useDebounce(inputValue, 500);
  const { data: suggestions } = useConvexQuery(api.profiles.searchUsernames, {
    q: debounced,
    limit: 20,
  });

  // Fetch Own Stats (Always tried unless skipped explicitly, but we want it for 'My Profile' view)
  const { data: ownStats, isPending: isLoadingOwn } = useConvexQuery(
    api.profiles.getProfileStats,
    {},
  );

  // Fetch Other Stats (Only if username parameter is present)
  // FIX: Use getProfileStatsByUsername instead of getProfileStats
  const { data: otherStats, isPending: isLoadingOther } = useConvexQuery(
    api.profiles.getProfileStatsByUsername,
    usernameParam ? { username: usernameParam } : "skip", // Hook handles "skip" to disable query
  );

  const isViewingOther =
    !!usernameParam && usernameParam !== ownStats?.username;
  const profileStats = isViewingOther ? otherStats : ownStats;
  const isLoading = isViewingOther ? isLoadingOther : isLoadingOwn;

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-mono text-zinc-500 gap-4">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span className="animate-pulse tracking-widest uppercase text-xs">
          Accessing Database...
        </span>
      </div>
    );
  }

  // Not Found / Access Denied State
  if (!profileStats) {
    if (!isViewingOther) {
      // Case: Trying to view own profile but not logged in (or profile missing)
      return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
          <div className="relative z-10 font-mono text-center space-y-6 max-w-md border border-white/10 bg-zinc-900/50 backdrop-blur-xl p-10 rounded-2xl">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-4">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl text-white font-bold tracking-tight uppercase mb-2">
                Access Restricted
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Operative credentials required. Please authenticate to view your
                service record.
              </p>
            </div>
            <Button
              onClick={() => void signIn("google")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono uppercase tracking-widest text-xs h-10"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Authenticate
            </Button>
          </div>
        </div>
      );
    } else {
      // Case: Trying to view another user that doesn't exist
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center space-y-4 font-mono">
            <div className="inline-flex p-3 rounded-full bg-zinc-900 border border-white/10 text-zinc-500">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg text-zinc-300 uppercase tracking-widest">
                Target Not Found
              </h2>
              <div className="text-zinc-600 text-xs mt-1">
                User <span className="text-white">"{usernameParam}"</span> does
                not exist in the database.
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/profile" })}
              className="text-blue-400 hover:text-blue-300 text-xs uppercase hover:bg-transparent"
            >
              Return to Base
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen relativefont-sans text-zinc-300 selection:bg-blue-500/30 selection:text-blue-200">
      {/* 1. GLOBAL AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none select-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent opacity-40" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT RAIL: IDENTITY CARD (Sticky) */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-8 space-y-6">
              <ProfileHeader
                profileStats={{
                  ...profileStats,
                  // Ensure userId is strictly an Id<"users"> or undefined to match props
                  userId: profileStats.userId as any,
                }}
                onAvatarSettingsToggle={() =>
                  setShowAvatarUpload(!showAvatarUpload)
                }
                isOwnProfile={!isViewingOther}
              />

              {/* Avatar Upload Panel (Inline in rail) */}
              {!isViewingOther && showAvatarUpload && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <AvatarSettings
                    username={profileStats.username}
                    currentAvatarUrl={profileStats.avatarUrl}
                    rank={profileStats.rank}
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* RIGHT CONTENT STREAM */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/40 backdrop-blur-md p-4 rounded-sm border border-white/5 border-l-2 border-l-blue-500/50">
              <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs uppercase tracking-widest shrink-0 flex-wrap">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <span>ACCESSING OPERATIVE FILE:</span>
                <UserNameWithBadge
                  username={profileStats.username}
                  tier={profileStats.tier}
                  isDonor={profileStats.isDonor}
                  usernameColor={profileStats.usernameColor}
                  showBadges={true}
                  size="sm"
                  className="font-bold text-white whitespace-nowrap"
                />
              </div>

              {/* Search Input */}
              <div className="relative w-full max-w-sm group">
                <div className="absolute -inset-px bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-sm blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative flex items-center">
                  <Terminal className="absolute left-3 w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="SEARCH DATABASE..."
                    className="pl-10 bg-black/60 border-white/10 text-white font-mono text-xs tracking-wider focus:border-blue-500/40 focus:bg-black/80 h-10 transition-all rounded-sm placeholder:text-zinc-700"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const u = inputValue.trim();
                        void navigate({
                          to: "/profile",
                          search: u ? { u } : {},
                        });
                        setInputValue("");
                      }
                    }}
                  />
                </div>
                {/* Suggestions Dropdown */}
                {suggestions && suggestions.length > 0 && inputValue.trim() && (
                  <div className="absolute left-0 right-0 mt-2 rounded-sm border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
                    {suggestions.map((s: any) => (
                      <button
                        key={s.username}
                        className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center justify-between gap-3 transition-colors border-b border-white/5 last:border-0 group/item"
                        onClick={() => {
                          void navigate({
                            to: "/profile",
                            search: { u: s.username },
                          });
                          setInputValue("");
                        }}
                      >
                        <span className="text-xs text-zinc-300 font-mono group-hover/item:text-blue-400">
                          @{s.username}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono uppercase">
                          {s.rank}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs Interface */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-zinc-900/60 border border-white/5 p-1 rounded-sm backdrop-blur-md w-full sm:w-auto inline-flex">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2 px-6 font-mono uppercase text-xs tracking-wider data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/30 border border-transparent transition-all rounded-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="missions"
                  className="flex items-center gap-2 px-6 font-mono uppercase text-xs tracking-wider data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:border-green-500/30 border border-transparent transition-all rounded-sm"
                >
                  <ScrollText className="w-4 h-4" />
                  Missions
                </TabsTrigger>
                <TabsTrigger
                  value="intel"
                  className="flex items-center gap-2 px-6 font-mono uppercase text-xs tracking-wider data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/30 border border-transparent transition-all rounded-sm"
                >
                  <PieChart className="w-4 h-4" />
                  Intel
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="overview"
                className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {/* ELO Alert */}
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 flex items-start gap-3">
                  <div className="p-1 bg-yellow-500/10 rounded text-yellow-500 mt-0.5">
                    <Terminal className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-yellow-200/70 font-mono leading-relaxed">
                    <span className="text-yellow-500 font-bold uppercase mr-1">
                      System Advisory:
                    </span>
                    ELO rating is derived exclusively from Quick Match
                    operations to ensure fair combat ranking.
                  </p>
                </div>
                <BattleStats profileStats={profileStats} />
              </TabsContent>

              <TabsContent
                value="missions"
                className="mt-0 h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <RecentGames
                  recentGames={profileStats.recentGames}
                  userId={profileStats.userId}
                />
              </TabsContent>

              <TabsContent
                value="intel"
                className="mt-0 h-[500px] animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <PerformanceInsights profileStats={profileStats} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
