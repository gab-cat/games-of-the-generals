import { motion } from "framer-motion";
import { Badge } from "../../components/ui/badge";
import { UserAvatar } from "../../components/UserAvatar";
import { UserNameWithBadge } from "../../components/UserNameWithBadge";
import { UserBadge } from "../../components/UserBadge";
import { Settings, Ban, VolumeX, Shield, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import {
  useConvexMutationWithQuery,
  useConvexQueryWithOptions,
} from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { MessageModerationMenu } from "../../components/global-chat/MessageModerationMenu";
import { Id } from "../../../convex/_generated/dataModel";
import { useConvexAuth } from "convex/react";

interface ProfileStats {
  username: string;
  avatarUrl?: string;
  rank: string;
  createdAt: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  elo: number;
  bio?: string;
  userId?: Id<"users">;
  tier?: "free" | "pro" | "pro_plus";
  isDonor?: boolean;
  usernameColor?: string;
  avatarFrame?: string;
}

interface ProfileHeaderProps {
  profileStats: ProfileStats;
  onAvatarSettingsToggle: () => void;
  isOwnProfile?: boolean;
}

export function ProfileHeader({
  profileStats,
  onAvatarSettingsToggle,
  isOwnProfile = true,
}: ProfileHeaderProps) {
  const { isAuthenticated } = useConvexAuth();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(profileStats.bio || "");
  const updateBio = useConvexMutationWithQuery(api.profiles.updateBio, {
    onSuccess: () => {
      setIsEditingBio(false);
    },
  });

  const { data: adminRole } = useConvexQueryWithOptions(
    api.globalChat.getUserAdminRole,
    isAuthenticated && !isOwnProfile ? {} : "skip",
    { staleTime: 300000, gcTime: 600000 },
  );

  useEffect(() => {
    setBioValue(profileStats.bio || "");
  }, [profileStats.bio]);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "General":
        return "from-yellow-500 to-amber-600";
      case "Colonel":
        return "from-purple-500 to-violet-600";
      case "Major":
        return "from-blue-500 to-indigo-600";
      case "Captain":
        return "from-green-500 to-emerald-600";
      case "Lieutenant":
        return "from-orange-500 to-red-600";
      case "Sergeant":
        return "from-red-500 to-pink-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getProgressToNextRank = (rank: string, wins: number) => {
    if (rank === "Colonel") return Math.min((wins / 50) * 100, 100);
    if (rank === "Major") return Math.min((wins / 30) * 100, 100);
    if (rank === "Captain") return Math.min((wins / 20) * 100, 100);
    if (rank === "Lieutenant") return Math.min((wins / 10) * 100, 100);
    if (rank === "Sergeant") return Math.min((wins / 5) * 100, 100);
    return Math.min((wins / 3) * 100, 100);
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="rounded-sm border border-white/10 bg-zinc-900/60 backdrop-blur-md overflow-hidden flex flex-col relative group/rail"
    >
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20" />
      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-white/20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-white/20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20" />

      {/* Rail Decor: Top Status Bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-blue-500/50" />

      <div className="p-6 flex flex-col items-center text-center relative z-10">
        {/* 1. Avatar Section */}
        <div className="relative mb-4 group">
          <div className="absolute -inset-6 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative p-2 rounded-full border border-white/10 bg-black/40 shadow-2xl">
            <UserAvatar
              username={profileStats.username}
              avatarUrl={profileStats.avatarUrl}
              rank={profileStats.rank}
              size="xl"
              frame={profileStats.avatarFrame}
              className="w-32 h-32"
            />
          </div>
          {/* Level Badge Overlay */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black border border-white/20 px-3 py-1 rounded-sm text-[10px] font-mono font-bold tracking-widest text-white shadow-lg z-20">
            LVL.{profileStats.rank === "General" ? "100" : "50"}
          </div>

          {isOwnProfile && (
            <button
              onClick={onAvatarSettingsToggle}
              className="absolute top-0 right-0 bg-zinc-900 border border-white/20 rounded-full p-2 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all text-zinc-400 shadow-lg z-20"
              title="Edit Identity"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Identity Block */}
        <div className="space-y-3 mb-6 w-full px-2">
          <div className="flex justify-center w-full">
            <UserNameWithBadge
              username={profileStats.username}
              tier={profileStats.tier}
              isDonor={profileStats.isDonor}
              usernameColor={profileStats.usernameColor}
              showBadges={false}
              size="lg"
              className="justify-center text-xl sm:text-2xl font-display tracking-tight flex-wrap break-words text-center w-full leading-tight [&>span]:truncate-0 [&>span]:whitespace-normal"
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 bg-gradient-to-r ${getRankColor(profileStats.rank)} text-white border-white/10 font-mono tracking-wider shadow-sm uppercase rounded-sm`}
            >
              {profileStats.rank}
            </Badge>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {new Date(profileStats.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Badges Row (Moved below General/Date) */}
          {(profileStats.tier !== "free" || profileStats.isDonor) && (
            <div className="flex items-center justify-center gap-2 pt-1">
              {(profileStats.tier === "pro" ||
                profileStats.tier === "pro_plus") && (
                <UserBadge type={profileStats.tier} size="sm" showText={true} />
              )}
              {profileStats.isDonor && (
                <UserBadge type="donor" size="sm" showText={true} />
              )}
            </div>
          )}
        </div>

        {/* 3. Rank Progression */}
        <div className="w-full mb-6">
          <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">
            <span>Clearance Progress</span>
            <span>
              {Math.round(
                getProgressToNextRank(profileStats.rank, profileStats.wins),
              )}
              %
            </span>
          </div>
          <div className="h-1.5 w-full bg-black/40 rounded-sm overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${getProgressToNextRank(profileStats.rank, profileStats.wins)}%`,
              }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-600 to-purple-500"
            />
          </div>
        </div>

        {/* 4. Bio Section */}
        <div className="w-full bg-black/20 rounded-sm border border-white/5 p-4 text-left relative overflow-hidden group/bio">
          <div className="absolute top-0 left-0 w-0.5 h-full bg-white/10 group-hover/bio:bg-blue-500/50 transition-colors" />
          <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest block mb-2">
            Service Record / Bio
          </span>

          {isOwnProfile && isEditingBio ? (
            <div className="space-y-2">
              <textarea
                value={bioValue}
                onChange={(e) => setBioValue(e.target.value)}
                placeholder="ENTER_OPERATIVE_BIO..."
                className="w-full min-h-[100px] rounded-sm bg-black/40 border border-blue-500/30 text-white p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500/50 font-mono placeholder:text-zinc-700 resize-none"
                maxLength={280}
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 w-full font-mono uppercase rounded-sm"
                  onClick={() =>
                    updateBio.mutate({ bio: bioValue.trim() || undefined })
                  }
                  disabled={updateBio.isPending}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] hover:bg-white/10 text-zinc-500 w-full font-mono uppercase rounded-sm"
                  onClick={() => {
                    setIsEditingBio(false);
                    setBioValue(profileStats.bio || "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="group/editbio relative min-h-[40px]">
              <p className="text-zinc-400 text-xs leading-relaxed font-mono">
                {bioValue || "// NO DATA FILED"}
              </p>
              {isOwnProfile && (
                <button
                  className="absolute right-0 top-0 text-[10px] text-zinc-600 hover:text-blue-400 opacity-0 group-hover/editbio:opacity-100 transition-opacity font-mono uppercase tracking-wider"
                  onClick={() => setIsEditingBio(true)}
                >
                  [EDIT]
                </button>
              )}
            </div>
          )}
        </div>

        {/* Moderation */}
        {isAuthenticated &&
          !isOwnProfile &&
          adminRole &&
          (adminRole === "admin" || adminRole === "moderator") &&
          profileStats.userId && (
            <div className="w-full mt-4 border-t border-white/5 pt-4">
              <div className="flex justify-center">
                <MessageModerationMenu
                  messageId="profile-moderation"
                  userId={profileStats.userId}
                  username={profileStats.username}
                  size="sm"
                  showText={true}
                  text="ADMIN_PROTOCOLS"
                />
              </div>
            </div>
          )}
      </div>

      <div className="mt-auto p-3 text-center border-t border-white/5 bg-black/20">
        <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em] select-none">
          ID: {profileStats.userId?.slice(0, 12) || "UNKNOWN"}
        </div>
      </div>
    </motion.div>
  );
}
