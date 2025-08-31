import { motion } from "framer-motion";
import { Badge } from "../../components/ui/badge";
import { UserAvatar } from "../../components/UserAvatar";
import { Settings, Ban, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { useConvexMutationWithQuery, useConvexQueryWithOptions } from "../../lib/convex-query-hooks";
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
  bio?: string;
  userId?: Id<"users">;
}

interface ProfileHeaderProps {
  profileStats: ProfileStats;
  onAvatarSettingsToggle: () => void;
  isOwnProfile?: boolean;
}

export function ProfileHeader({ profileStats, onAvatarSettingsToggle, isOwnProfile = true }: ProfileHeaderProps) {
  const { isAuthenticated } = useConvexAuth();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(profileStats.bio || "");
  const updateBio = useConvexMutationWithQuery(api.profiles.updateBio, {
    onSuccess: () => {
      setIsEditingBio(false);
    },
  });

  // Check if current user is admin/moderator
  const { data: adminRole } = useConvexQueryWithOptions(
    api.globalChat.getUserAdminRole,
    isAuthenticated && !isOwnProfile ? {} : "skip", // Only check admin status when authenticated and viewing others' profiles
    {
      staleTime: 300000, // 5 minutes - admin status doesn't change often
      gcTime: 600000, // 10 minutes cache
    }
  );

  // Get user's moderation status (ban/mute)
  const { data: moderationStatus } = useConvexQueryWithOptions(
    api.globalChat.getUserModerationStatus,
    profileStats.userId ? { userId: profileStats.userId } : "skip",
    {
      staleTime: 60000, // 1 minute - moderation status can change
      gcTime: 300000, // 5 minutes cache
    }
  );

  // Debug logging (remove in production)
  console.log("Profile Header Debug:", {
    isAuthenticated,
    isOwnProfile,
    adminRole,
    userId: profileStats.userId,
    username: profileStats.username,
    moderationStatus
  });

  useEffect(() => {
    setBioValue(profileStats.bio || "");
  }, [profileStats.bio]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // For very recent dates (less than 30 days), show full date
    if (diffDays < 30) {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
    // For older dates, show just month and year
    else {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const formatRemainingTime = (expiresAt: number) => {
    const now = Date.now();
    const remainingMs = expiresAt - now;

    if (remainingMs <= 0) return "Expired";

    const seconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "General": return "from-yellow-500 to-amber-600";
      case "Colonel": return "from-purple-500 to-violet-600";
      case "Major": return "from-blue-500 to-indigo-600";
      case "Captain": return "from-green-500 to-emerald-600";
      case "Lieutenant": return "from-orange-500 to-red-600";
      case "Sergeant": return "from-red-500 to-pink-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="rounded-xl border border-white/10 bg-black/30 p-4 sm:p-6 mb-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side - Avatar and Info */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="relative">
            <UserAvatar
              username={profileStats.username}
              avatarUrl={profileStats.avatarUrl}
              rank={profileStats.rank}
              size="xl"
              className="ring-1 ring-white/20 shadow-lg"
            />
            {isOwnProfile && (
              <button
                onClick={onAvatarSettingsToggle}
                className="absolute -bottom-0.5 -right-0.5 bg-gray-900/90 backdrop-blur-sm rounded-full p-1.5 ring-1 ring-white/20 hover:bg-gray-800/90 transition-colors"
                title="Change avatar"
              >
                <Settings className="w-4 h-4 text-white" />
              </button>
            )}

          </div>
        
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              {profileStats.username}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs px-2 py-0.5 bg-gradient-to-r ${getRankColor(profileStats.rank)} text-white border-0 font-medium`}>
                {profileStats.rank}
              </Badge>

              {/* Moderation Status Badges */}
              {moderationStatus?.banStatus && (
                <Badge variant="destructive" className="text-xs px-2 py-0.5 bg-red-600/20 border-red-500/50 text-red-300 border font-medium">
                  <Ban className="w-3 h-3 mr-1" />
                  Banned {moderationStatus.banStatus.expiresAt ? `for ${formatRemainingTime(moderationStatus.banStatus.expiresAt)}` : 'permanently'}
                </Badge>
              )}

              {moderationStatus?.muteStatus && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-orange-600/20 border-orange-500/50 text-orange-300 border font-medium">
                  <VolumeX className="w-3 h-3 mr-1" />
                  Muted for {formatRemainingTime(moderationStatus.muteStatus.mutedUntil)}
                </Badge>
              )}

              <div className="text-gray-500 text-xs">Member since {formatDate(profileStats.createdAt)}</div>

              {/* Moderation Menu for Admins/Moderators */}
              {isAuthenticated && !isOwnProfile && adminRole && (adminRole === "admin" || adminRole === "moderator") && profileStats.userId && (
                <MessageModerationMenu
                  messageId="profile-moderation"
                  userId={profileStats.userId}
                  username={profileStats.username}
                  size="md"
                  showText={true}
                  text="Actions"
                />
              )}
            </div>

            {/* Bio inline below name/date */}
            <div className="mt-4 text-xs text-white/50">
              {isOwnProfile ? (
                isEditingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioValue}
                      onChange={(e) => setBioValue(e.target.value)}
                      placeholder="Tell others about yourself"
                      className="w-full min-h-20 rounded-lg bg-white/10 border border-white/20 text-white p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                      maxLength={280}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="gradient"
                        size="sm"
                        onClick={() => updateBio.mutate({ bio: bioValue.trim() || undefined })}
                        disabled={updateBio.isPending}
                      >
                        {updateBio.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
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
                  <div className="group">
                    {bioValue ? (
                      <p className="text-white/90 text-sm whitespace-pre-wrap">{bioValue}</p>
                    ) : (
                      <p className="text-white/40 text-sm italic">Add a short bio...</p>
                    )}
                    <button
                      className="mt-1 text-xs text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setIsEditingBio(true)}
                    >
                      Edit
                    </button>
                  </div>
                )
              ) : profileStats.bio ? (
                <p className="text-white/90 text-sm whitespace-pre-wrap">{profileStats.bio}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right side - Main Stats */}
        <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-8 sm:items-center w-full sm:w-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center sm:text-right"
          >
            <div className="text-2xl font-bold text-green-400">{profileStats.wins}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Wins</div>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center sm:text-right"
          >
            <div className="text-2xl font-bold text-red-400">{profileStats.losses}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Losses</div>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center sm:text-right"
          >
            <div className="text-2xl font-bold text-blue-400">{profileStats.gamesPlayed}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Games</div>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center sm:text-right"
          >
            <div className="text-2xl font-bold text-purple-400">{profileStats.winRate}%</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Win Rate</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
