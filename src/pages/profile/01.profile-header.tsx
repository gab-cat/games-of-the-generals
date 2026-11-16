import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Textarea } from "../../components/ui/textarea";
import { UserAvatar } from "../../components/UserAvatar";
import { UserBadge } from "../../components/UserBadge";
import { Button } from "../../components/ui/button";
import {
  useConvexMutationWithQuery,
  useConvexQueryWithOptions,
} from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { MessageModerationMenu } from "../../components/global-chat/MessageModerationMenu";
import { Id } from "../../../convex/_generated/dataModel";
import { useConvexAuth } from "convex/react";
import { formatDate } from "../match-history/format";
import {
  CHEVRON,
  Duotone,
  EASE,
  Grain,
  Insignia,
  toPlayerRank,
} from "@/components/season/art";

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
  isAvatarSettingsOpen?: boolean;
  isOwnProfile?: boolean;
}

/**
 * The service record: the player's avatar inside the box-art chevron over a
 * blue print of the march painting, their rank's insignia, and their name at
 * poster size. Bio and moderation live here too.
 */
export function ProfileHeader({
  profileStats,
  onAvatarSettingsToggle,
  isAvatarSettingsOpen = false,
  isOwnProfile = true,
}: ProfileHeaderProps) {
  const { isAuthenticated } = useConvexAuth();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(profileStats.bio || "");
  const updateBio = useConvexMutationWithQuery(api.profiles.updateBio, {
    onSuccess: () => {
      setIsEditingBio(false);
      toast.success("Bio saved");
    },
    onError: () => {
      toast.error("Couldn't save your bio. Try again.");
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

  const rank = toPlayerRank(profileStats.rank, profileStats.wins);
  const hasBadges =
    profileStats.tier === "pro" ||
    profileStats.tier === "pro_plus" ||
    profileStats.isDonor;
  const canModerate =
    isAuthenticated &&
    !isOwnProfile &&
    (adminRole === "admin" || adminRole === "moderator") &&
    !!profileStats.userId;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      aria-label={`${profileStats.username}'s record`}
      className="grid overflow-hidden rounded-lg border border-border bg-card md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      {/* Portrait in the box-art chevron, charging in from the left */}
      <motion.div
        initial={{ x: "-40%" }}
        animate={{ x: "0%" }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
        className="relative h-64 sm:h-80 md:h-auto md:min-h-[420px]"
        style={{ clipPath: CHEVRON.rightFlat }}
      >
        <Duotone crop="march" tone="blue" className="absolute inset-0" />
        <Grain opacity={0.22} />
        <div className="absolute left-[44%] top-1/2 -translate-x-1/2 -translate-y-1/2">
          <UserAvatar
            username={profileStats.username}
            avatarUrl={profileStats.avatarUrl}
            frame={profileStats.avatarFrame}
            noRing
            className="h-40 w-40 border-4 border-[#f6f1e7] text-4xl sm:h-56 sm:w-56"
          />
        </div>
      </motion.div>

      <div className="relative flex flex-col justify-between gap-8 overflow-hidden p-5 sm:p-8">
        {/* The insignia again at poster size, as a quiet print behind the name */}
        <Insignia
          rank={rank}
          className="pointer-events-none absolute -bottom-6 -right-6 h-44 text-gold-500/[0.07] sm:h-64"
        />

        <div className="relative min-w-0 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: 0.35 }}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gold-400"
          >
            <Insignia rank={rank} className="h-10 sm:h-14" />
            <span className="text-2xl font-semibold text-foreground sm:text-3xl">
              {rank}
            </span>
            {hasBadges && (
              <span className="flex flex-wrap items-center gap-2">
                {(profileStats.tier === "pro" ||
                  profileStats.tier === "pro_plus") && (
                  <UserBadge type={profileStats.tier} size="md" showText />
                )}
                {profileStats.isDonor && (
                  <UserBadge type="donor" size="md" showText />
                )}
              </span>
            )}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.25 }}
            className="text-[40px] font-bold leading-[0.95] tracking-[-0.04em] text-foreground [overflow-wrap:anywhere] sm:text-7xl"
            style={
              profileStats.usernameColor
                ? { color: profileStats.usernameColor }
                : undefined
            }
          >
            {profileStats.username}
          </motion.h2>
          <p className="text-sm text-foreground/80">
            Member since {formatDate(profileStats.createdAt)}
          </p>

          {/* Bio */}
          {isOwnProfile && isEditingBio ? (
            <div className="max-w-xl space-y-2">
              <Textarea
                value={bioValue}
                onChange={(e) => setBioValue(e.target.value)}
                placeholder="Write a short bio"
                className="min-h-[100px] resize-none"
                maxLength={280}
                aria-label="Bio"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {bioValue.length}/280
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingBio(false);
                      setBioValue(profileStats.bio || "");
                    }}
                    disabled={updateBio.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      updateBio.mutate({ bio: bioValue.trim() || undefined })
                    }
                    disabled={updateBio.isPending}
                  >
                    {updateBio.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="max-w-xl whitespace-pre-wrap break-words text-base text-foreground/90">
              {profileStats.bio ||
                (isOwnProfile
                  ? "You haven't written a bio yet."
                  : "This player hasn't written a bio.")}
            </p>
          )}
        </div>

        {(isOwnProfile || canModerate) && !isEditingBio && (
          <div className="relative flex flex-wrap gap-2">
            {isOwnProfile && (
              <>
                <Button
                  variant="secondary"
                  onClick={onAvatarSettingsToggle}
                  aria-expanded={isAvatarSettingsOpen}
                >
                  {isAvatarSettingsOpen ? "Close avatar settings" : "Change avatar"}
                </Button>
                <Button variant="ghost" onClick={() => setIsEditingBio(true)}>
                  {profileStats.bio ? "Edit bio" : "Write a bio"}
                </Button>
              </>
            )}
            {canModerate && profileStats.userId && (
              <MessageModerationMenu
                messageId="profile-moderation"
                userId={profileStats.userId}
                username={profileStats.username}
                size="sm"
                showText={true}
                text="Moderate"
              />
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
}
