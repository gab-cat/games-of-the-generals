import React from "react";
import { cn } from "@/lib/utils";
import { UserBadge } from "./UserBadge";
import { type Doc } from "../../convex/_generated/dataModel";

interface UserNameWithBadgeProps {
  username: string;
  tier?: "free" | "pro" | "pro_plus";
  isDonor?: boolean;
  usernameColor?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  showBadges?: boolean;
}

export const UserNameWithBadge: React.FC<UserNameWithBadgeProps> = ({
  username,
  tier,
  isDonor,
  usernameColor,
  size = "sm",
  className,
  onClick,
  showBadges = true,
}) => {
  const textSize = {
    xs: "text-[10px]",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  const badgeSize = (size === "lg" ? "md" : size === "xs" ? "xs" : "sm") as "xs" | "sm" | "md";

  return (
    <div 
      className={cn("inline-flex items-center gap-1.5 min-w-0 max-w-full", className)}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <span
        className={cn(
          "font-medium truncate transition-opacity",
          textSize,
          onClick && "cursor-pointer hover:opacity-80 active:opacity-70",
          !usernameColor && "text-white"
        )}
        style={usernameColor ? { color: usernameColor } : undefined}
      >
        {username}
      </span>

      {showBadges && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {(tier === "pro" || tier === "pro_plus") && (
            <UserBadge type={tier} size={badgeSize} />
          )}
          {isDonor && (
            <UserBadge type="donor" size={badgeSize} />
          )}
        </div>
      )}
    </div>
  );
};
