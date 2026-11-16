import React from "react";
import { Crown, Shield, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export type UserBadgeType = "pro" | "pro_plus" | "donor";

interface UserBadgeProps {
  type: UserBadgeType;
  size?: "xs" | "sm" | "md";
  className?: string;
  showText?: boolean;
}

const CONFIG = {
  pro: {
    icon: Shield,
    label: "Pro",
    tooltip: "Pro subscriber",
    tone: "border-border-strong bg-white/[0.06] text-foreground",
  },
  pro_plus: {
    icon: Crown,
    label: "Pro+",
    tooltip: "Pro+ subscriber",
    tone: "border-gold-500/30 bg-gold-500/10 text-gold-300",
  },
  donor: {
    icon: Heart,
    label: "Donor",
    tooltip: "Donor",
    tone: "border-red-500/30 bg-red-500/10 text-red-300",
  },
} as const;

const SIZE_CLASSES = {
  xs: "h-4 px-1 text-[10px]",
  sm: "h-[18px] px-1 text-[11px]",
  md: "h-5 px-1.5 text-xs",
} as const;

const ICON_CLASSES = {
  xs: "size-2.5",
  sm: "size-3",
  md: "size-3.5",
} as const;

export const UserBadge: React.FC<UserBadgeProps> = ({
  type,
  size = "sm",
  className,
  showText = false,
}) => {
  const config = CONFIG[type];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded border font-medium leading-none",
              config.tone,
              SIZE_CLASSES[size],
              className,
            )}
            aria-label={config.tooltip}
          >
            <Icon className={cn("shrink-0", ICON_CLASSES[size])} />
            {showText && <span>{config.label}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>{config.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
