import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  avatarUrl?: string;
  className?: string;
  rank?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function UserAvatar({ 
  username, 
  avatarUrl, 
  className, 
  rank,
  size = "md" 
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
      case "sm": return "h-8 w-8 text-xs";
      case "md": return "h-10 w-10 text-sm";
      case "lg": return "h-12 w-12 text-base";
      case "xl": return "h-16 w-16 text-xl";
      default: return "h-10 w-10 text-sm";
    }
  };

  return (
    <Avatar className={cn(getSizeClasses(size), className)}>
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
