import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";

// Frame style configurations
const FRAME_STYLES: Record<string, { 
  ring: string; 
  glow?: string;
}> = {
  // Pro tier frames
  gold: {
    ring: "ring-2 ring-yellow-500 ring-offset-2 ring-offset-black/50",
    glow: "shadow-[0_0_12px_rgba(234,179,8,0.6)]",
  },
  silver: {
    ring: "ring-2 ring-gray-300 ring-offset-2 ring-offset-black/50",
    glow: "shadow-[0_0_10px_rgba(156,163,175,0.6)]",
  },
  bronze: {
    ring: "ring-2 ring-amber-700 ring-offset-2 ring-offset-black/50",
    glow: "shadow-[0_0_8px_rgba(180,83,9,0.6)]",
  },
  // Pro+ tier frames
  diamond: {
    ring: "ring-2 ring-cyan-300 ring-offset-2 ring-offset-black/50",
    glow: "shadow-[0_0_16px_rgba(34,211,238,0.6)]",
  },
  fire: {
    ring: "ring-2 ring-orange-500 ring-offset-2 ring-offset-black/50",
    glow: "shadow-[0_0_14px_rgba(249,115,22,0.6)]",
  },
  rainbow: {
    ring: "ring-2 ring-purple-500 ring-offset-2 ring-offset-black/50",
    glow: "shadow-[0_0_16px_rgba(168,85,247,0.6)]",
  },
  platinum: {
    ring: "ring-2 ring-slate-200 ring-offset-2 ring-offset-black/50",
    glow: "shadow-[0_0_14px_rgba(226,232,240,0.6)]",
  },
  cosmic: {
    ring: "ring-2 ring-indigo-400 ring-offset-2 ring-offset-black/50",
    glow: "shadow-[0_0_18px_rgba(129,140,248,0.6)]",
  },
  // Donor frames
  donor: {
    ring: "ring-2 ring-pink-500 ring-offset-2 ring-offset-black/50",
    glow: "shadow-[0_0_14px_rgba(236,72,153,0.6)]",
  },
  heart: {
    ring: "ring-2 ring-red-500 ring-offset-2 ring-offset-black/50",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.6)]",
  },
  supporter: {
    ring: "ring-2 ring-emerald-400 ring-offset-2 ring-offset-black/50",
    glow: "shadow-[0_0_12px_rgba(52,211,153,0.6)]",
  },
};

interface UserAvatarProps {
  username: string;
  avatarUrl?: string;
  className?: string;
  rank?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  frame?: string;
  noRing?: boolean;
}

export function UserAvatar({ 
  username, 
  avatarUrl, 
  className, 
  rank,
  size = "md",
  frame,
  noRing = false,
}: UserAvatarProps) {
  const getRankColor = (rank?: string) => {
    switch (rank) {
      case "General": return "from-yellow-500 to-amber-600";
      case "Colonel": return "from-purple-500 to-violet-600";
      case "Major": return "from-blue-500 to-indigo-600";
      case "Captain": return "from-green-500 to-emerald-600";
      case "Lieutenant": return "from-orange-500 to-red-600";
      case "Sergeant": return "from-red-500 to-pink-600";
      default: return "from-blue-500 to-purple-600";
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "xs": return "h-6 w-6 text-xs";
      case "sm": return "h-8 w-8 text-xs";
      case "md": return "h-10 w-10 text-sm";
      case "lg": return "h-12 w-12 text-base";
      case "xl": return "h-16 w-16 text-xl";
      default: return "h-10 w-10 text-sm";
    }
  };

  // Get frame styles if a valid frame is provided
  const frameStyle = frame && frame !== "none" ? FRAME_STYLES[frame] : null;

  return (
    <Avatar 
      className={cn(
        getSizeClasses(size), 
        "rounded-full",
        frameStyle ? [frameStyle.ring, frameStyle.glow] : !noRing && "ring-1 ring-white/20",
        className
      )}
    >
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt={`${username}'s avatar`}
          className="object-cover"
        />
      )}
      <AvatarFallback 
        className={cn(
          "font-semibold text-white",
          rank ? `bg-gradient-to-br ${getRankColor(rank)}` : "bg-gradient-to-br from-blue-500 to-purple-600"
        )}
      >
        {username.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
