import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { pluralDays } from "./plan-copy";

interface ExpiryCountdownProps {
  className?: string;
}

export function ExpiryCountdown({ className = "" }: ExpiryCountdownProps) {
  const { data: subscription } = useConvexQuery(
    api.subscriptions.getCurrentSubscription,
    {},
  );

  if (
    !subscription ||
    !subscription.expiresAt ||
    subscription.tier === "free"
  ) {
    return null;
  }

  const daysUntilExpiry = subscription.daysUntilExpiry;

  if (daysUntilExpiry === null || daysUntilExpiry < 0) {
    return null;
  }

  const tone =
    daysUntilExpiry <= 1
      ? "text-red-400"
      : daysUntilExpiry <= 7
        ? "text-gold-300"
        : "text-foreground";

  return (
    <div className={cn("flex items-center gap-2 text-sm", tone, className)}>
      <Clock className="size-4" />
      <span>
        {daysUntilExpiry === 0
          ? "Expires today"
          : daysUntilExpiry === 1
            ? "Expires tomorrow"
            : `${pluralDays(daysUntilExpiry)} left`}
      </span>
    </div>
  );
}
