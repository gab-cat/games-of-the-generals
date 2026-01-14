

import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Clock } from "lucide-react";

interface ExpiryCountdownProps {
  className?: string;
}

export function ExpiryCountdown({ className = "" }: ExpiryCountdownProps) {
  const { data: subscription } = useConvexQuery(api.subscriptions.getCurrentSubscription, {});

  if (!subscription || !subscription.expiresAt || subscription.tier === "free") {
    return null;
  }

  const daysUntilExpiry = subscription.daysUntilExpiry;

  if (daysUntilExpiry === null || daysUntilExpiry < 0) {
    return null;
  }

  const getColorClass = () => {
    if (daysUntilExpiry <= 1) return "text-red-400";
    if (daysUntilExpiry <= 3) return "text-amber-400";
    if (daysUntilExpiry <= 7) return "text-yellow-400";
    return "text-white/60";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className={`w-4 h-4 ${getColorClass()}`} />
      <span className={`text-sm font-light ${getColorClass()}`}>
        {daysUntilExpiry === 0
          ? "Expires today"
          : daysUntilExpiry === 1
          ? "Expires tomorrow"
          : `${daysUntilExpiry} days remaining`}
      </span>
    </div>
  );
}
