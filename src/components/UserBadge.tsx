import React from "react";
import { Crown, Star, Heart } from "lucide-react";
import { motion } from "framer-motion";
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

export const UserBadge: React.FC<UserBadgeProps> = ({
  type,
  size = "sm",
  className,
  showText = false,
}) => {
  const config = {
    pro: {
      icon: Crown,
      label: "PRO",
      gradient: "from-blue-500/20 via-indigo-500/20 to-purple-500/20",
      border: "border-blue-400/30",
      text: "text-blue-300",
      iconColor: "text-blue-400",
      tooltip: "Pro Subscriber",
    },
    pro_plus: {
      icon: Star,
      label: "PRO+",
      gradient: "from-amber-500/20 via-orange-500/20 to-yellow-500/20",
      border: "border-amber-400/30",
      text: "text-amber-300",
      iconColor: "text-amber-400",
      tooltip: "Pro+ Subscriber",
    },
    donor: {
      icon: Heart,
      label: "DONOR",
      gradient: "from-pink-500/20 via-rose-500/20 to-pink-500/20",
      border: "border-pink-400/30",
      text: "text-pink-300",
      iconColor: "text-pink-400",
      tooltip: "Donor",
    },
  }[type];

  const sizeClasses = {
    xs: "px-0.5 py-0 h-3.5 text-[8px]",
    sm: "px-1 py-0.5 h-4 text-[9px]",
    md: "px-1.5 py-0.5 h-5 text-xs",
  }[size];

  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className={cn(
              "inline-flex items-center gap-0.5 rounded border backdrop-blur-md shadow-sm",
              config.gradient,
              config.border,
              sizeClasses,
              className
            )}
          >
            <Icon className={cn("flex-shrink-0", 
              size === "xs" ? "w-2.5 h-2.5" : size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5",
              config.iconColor
            )} />
            {showText && (
              <span className={cn("font-bold tracking-wider", config.text)}>
                {config.label}
              </span>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="bg-black/80 backdrop-blur-xl border-white/10 text-white text-[10px] py-1 px-2">
          {config.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
