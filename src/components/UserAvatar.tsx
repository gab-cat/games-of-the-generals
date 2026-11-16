import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";

// Frame styles are cosmetic perks players choose, so they keep their own
// colour. They are flat rings only: no glow.
const FRAME_STYLES: Record<string, string> = {
  // Pro tier frames
  gold: "ring-2 ring-yellow-500 ring-offset-2 ring-offset-background",
  silver: "ring-2 ring-gray-300 ring-offset-2 ring-offset-background",
  bronze: "ring-2 ring-amber-700 ring-offset-2 ring-offset-background",
  // Pro+ tier frames
  diamond: "ring-2 ring-cyan-300 ring-offset-2 ring-offset-background",
  fire: "ring-2 ring-orange-500 ring-offset-2 ring-offset-background",
  rainbow: "ring-2 ring-purple-500 ring-offset-2 ring-offset-background",
  platinum: "ring-2 ring-slate-200 ring-offset-2 ring-offset-background",
  cosmic: "ring-2 ring-indigo-400 ring-offset-2 ring-offset-background",
  // Donor frames
  donor: "ring-2 ring-pink-500 ring-offset-2 ring-offset-background",
  heart: "ring-2 ring-red-500 ring-offset-2 ring-offset-background",
  supporter: "ring-2 ring-emerald-400 ring-offset-2 ring-offset-background",
};

const DEFAULT_AVATAR_COUNT = 10;

/**
 * Players without a picture get one of the built-in avatars, picked from
 * their username so the same player always looks the same and a list of
 * players isn't a column of identical faces.
 */
export function defaultAvatarFor(username: string): string {
  let hash = 0;
  for (const ch of username.toLowerCase()) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return `/defaults/avatar-${(hash % DEFAULT_AVATAR_COUNT) + 1}.webp`;
}

interface UserAvatarProps {
  username: string;
  avatarUrl?: string;
  className?: string;
  /** Kept so existing call sites compile. The avatar no longer tints by rank. */
  rank?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  frame?: string;
  noRing?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

export function UserAvatar({
  username,
  avatarUrl,
  className,
  size = "md",
  frame,
  noRing = false,
}: UserAvatarProps) {
  const frameClass = frame && frame !== "none" ? FRAME_STYLES[frame] : null;

  return (
    <Avatar
      className={cn(
        SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
        "rounded-full",
        frameClass ?? (!noRing && "ring-1 ring-white/15"),
        className,
      )}
    >
      {avatarUrl && (
        <AvatarImage
          src={avatarUrl}
          alt={`${username}'s avatar`}
          className="object-cover"
        />
      )}
      <AvatarFallback className="bg-raised font-semibold text-foreground">
        <img src={defaultAvatarFor(username)} alt="" />
      </AvatarFallback>
    </Avatar>
  );
}
