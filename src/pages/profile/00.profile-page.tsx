import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { ProfileHeader } from "./01.profile-header";
import { AvatarSettings } from "./02.avatar-settings";
import { BattleStats } from "./03.battle-stats";
import { RecentGames } from "./04.recent-games";
import { PerformanceInsights } from "./05.performance-insights";
import { RankRoad } from "./06.rank-road";
import { PastSeasons } from "./07.past-seasons";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { PageHeader, SectionHeader } from "../../components/ui/page-header";
import { Skeleton } from "../../components/ui/skeleton";
import { fadeUp, stagger } from "../../lib/motion";

const route = getRouteApi("/profile");

function ProfileSearch({ currentUsername }: { currentUsername?: string }) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [debounced] = useDebounce(inputValue.trim(), 400);
  const { data: suggestions } = useConvexQuery(
    api.profiles.searchUsernames,
    debounced ? { q: debounced, limit: 8 } : "skip",
  );

  const go = (username: string) => {
    void navigate({
      to: "/profile",
      search: username && username !== currentUsername ? { u: username } : {},
    });
    setInputValue("");
    setOpen(false);
  };

  return (
    <div className="relative w-full sm:w-72">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder="Find a player"
        aria-label="Find a player by username"
        autoComplete="off"
        className="pl-9"
        onKeyDown={(e) => {
          if (e.key === "Enter" && inputValue.trim()) go(inputValue.trim());
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && inputValue.trim() && suggestions && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border-strong bg-popover p-1 shadow-lg">
          {suggestions.map((s: any) => (
            <li key={s.username}>
              <button
                type="button"
                className="flex h-10 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm text-foreground transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(s.username)}
              >
                <span className="truncate">{s.username}</span>
                <span className="shrink-0 text-xs text-foreground/70">
                  {s.rank}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile" className="space-y-8 sm:space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-full sm:w-72" />
      </div>
      <div className="grid overflow-hidden rounded-lg border border-border bg-card md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Skeleton className="h-64 rounded-none sm:h-80 md:h-auto md:min-h-[420px]" />
        <div className="space-y-4 p-5 sm:p-8">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-16 w-full max-w-md" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-lg sm:h-[100px]" />
          ))}
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2 py-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { signIn } = useAuthActions();
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const search = route.useSearch();
  const usernameParam = (search.u || "").trim();
  const navigate = useNavigate();

  // Own stats (the "My profile" view)
  const { data: ownStats, isPending: isLoadingOwn } = useConvexQuery(
    api.profiles.getProfileStats,
    {},
  );

  // Another player's stats, only when ?u= names someone else
  const { data: otherStats, isPending: isLoadingOther } = useConvexQuery(
    api.profiles.getProfileStatsByUsername,
    usernameParam ? { username: usernameParam } : "skip",
  );

  const isViewingOther =
    !!usernameParam && usernameParam !== ownStats?.username;
  const profileStats = isViewingOther ? otherStats : ownStats;
  const isLoading = isViewingOther ? isLoadingOther : isLoadingOwn;

  const wrapper = (children: React.ReactNode) => (
    <div className="w-full">
      {children}
    </div>
  );

  if (isLoading) {
    return wrapper(<ProfileSkeleton />);
  }

  if (!profileStats) {
    if (!isViewingOther) {
      return wrapper(
        <>
          <PageHeader title="Profile" />
          <EmptyState
            title="Sign in to see your profile"
            body="Your rank, stats and recent games are saved to your account."
            action={
              <Button onClick={() => void signIn("google")}>
                Sign in with Google
              </Button>
            }
          />
        </>,
      );
    }
    return wrapper(
      <>
        <PageHeader
          title="Profile"
          actions={<ProfileSearch currentUsername={ownStats?.username} />}
        />
        <EmptyState
          title={`No player named "${usernameParam}"`}
          body="Check the spelling, or search for another name."
          action={
            <Button
              variant="secondary"
              onClick={() => void navigate({ to: "/profile", search: {} })}
            >
              Back to your profile
            </Button>
          }
        />
      </>,
    );
  }

  return wrapper(
    <>
      <PageHeader
        title={isViewingOther ? "Player profile" : "Your profile"}
        actions={
          <>
            {isViewingOther && (
              <Button
                variant="secondary"
                onClick={() => void navigate({ to: "/profile", search: {} })}
              >
                Your profile
              </Button>
            )}
            <ProfileSearch currentUsername={ownStats?.username} />
          </>
        }
      />

      <div className="space-y-8 sm:space-y-10">
        <ProfileHeader
          profileStats={{
            ...profileStats,
            // Ensure userId is strictly an Id<"users"> or undefined to match props
            userId: profileStats.userId as any,
          }}
          onAvatarSettingsToggle={() => setShowAvatarUpload(!showAvatarUpload)}
          isAvatarSettingsOpen={showAvatarUpload}
          isOwnProfile={!isViewingOther}
        />

        {!isViewingOther && showAvatarUpload && (
          <AvatarSettings
            username={profileStats.username}
            currentAvatarUrl={profileStats.avatarUrl}
            rank={profileStats.rank}
            tier={profileStats.tier as "free" | "pro" | "pro_plus"}
            isDonor={profileStats.isDonor}
          />
        )}

        <RankRoad
          wins={profileStats.wins}
          rank={profileStats.rank}
          isOwnProfile={!isViewingOther}
        />

        <motion.div
          variants={stagger(0.06, 0.05)}
          initial="hidden"
          animate="show"
          className="space-y-8 sm:space-y-10"
        >
          <motion.section variants={fadeUp}>
            <SectionHeader
              title="Record"
              description={
                profileStats.gamesPlayed > 0
                  ? "Rating only changes in quick match games."
                  : isViewingOther
                    ? "This player hasn't finished a game yet."
                    : "Play your first game and your record starts here."
              }
            />
            <BattleStats profileStats={profileStats} />
          </motion.section>

          <div className="grid gap-8 lg:grid-cols-2">
            <motion.section variants={fadeUp} className="min-w-0">
              <SectionHeader title="Recent games" />
              <RecentGames
                recentGames={profileStats.recentGames}
                userId={profileStats.userId}
                isOwnProfile={!isViewingOther}
              />
            </motion.section>

            <motion.section variants={fadeUp} className="min-w-0">
              <SectionHeader title="Insights" />
              <PerformanceInsights profileStats={profileStats} />
            </motion.section>
          </div>

          {profileStats.pastSeasons.length > 0 && (
            <motion.div variants={fadeUp}>
              <PastSeasons
                seasons={profileStats.pastSeasons}
                isOwnProfile={!isViewingOther}
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </>,
  );
}
