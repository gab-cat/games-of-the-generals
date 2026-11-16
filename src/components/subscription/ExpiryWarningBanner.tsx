"use client";

import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { AlertTriangle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { pluralDays } from "./plan-copy";

interface ExpiryWarningBannerProps {
  className?: string;
  dismissible?: boolean;
}

export function ExpiryWarningBanner({
  className = "",
  dismissible = true,
}: ExpiryWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { data: subscription } = useConvexQuery(
    api.subscriptions.getCurrentSubscription,
    {},
  );

  if (dismissed || !subscription || subscription.tier === "free") {
    return null;
  }

  const daysUntilExpiry = subscription.daysUntilExpiry;
  const status = subscription.status;

  // Show the banner when the plan:
  // 1. expires in 7 days or less
  // 2. is in its grace period
  // 3. has expired
  const shouldShow =
    (daysUntilExpiry !== null && daysUntilExpiry <= 7) ||
    status === "grace_period" ||
    status === "expired";

  if (!shouldShow) {
    return null;
  }

  const getBannerContent = () => {
    if (status === "expired") {
      return {
        tone: "danger" as const,
        icon: AlertTriangle,
        message: "Your plan has expired. Renew to get your Pro features back.",
        actionText: "Renew",
      };
    }
    if (status === "grace_period") {
      return {
        tone: "danger" as const,
        icon: Clock,
        message:
          "Your plan has expired. You have a 2-day grace period to renew before Pro features lock.",
        actionText: "Renew",
      };
    }
    if (daysUntilExpiry !== null && daysUntilExpiry <= 1) {
      return {
        tone: "danger" as const,
        icon: AlertTriangle,
        message:
          daysUntilExpiry === 0
            ? "Your plan expires today. Renew to keep your Pro features."
            : "Your plan expires tomorrow. Renew to keep your Pro features.",
        actionText: "Renew",
      };
    }
    if (daysUntilExpiry !== null && daysUntilExpiry <= 3) {
      return {
        tone: "gold" as const,
        icon: Clock,
        message: `Your plan expires in ${pluralDays(daysUntilExpiry)}. Renew to keep your Pro features.`,
        actionText: "Renew",
      };
    }
    return {
      tone: "neutral" as const,
      icon: Clock,
      message: `Your plan expires in ${daysUntilExpiry} days.`,
      actionText: "View plan",
    };
  };

  const content = getBannerContent();
  const Icon = content.icon;

  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border p-3 sm:p-4",
        content.tone === "danger" && "border-red-500/30 bg-red-500/10",
        content.tone === "gold" && "border-gold-500/30 bg-gold-500/10",
        content.tone === "neutral" && "border-border bg-card",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 size-4 shrink-0",
            content.tone === "danger"
              ? "text-red-400"
              : content.tone === "gold"
                ? "text-gold-300"
                : "text-foreground",
          )}
        />
        <p className="text-sm text-foreground">{content.message}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            navigate({
              to: "/subscription",
              search: { subscription: undefined },
            })
          }
        >
          {content.actionText}
        </Button>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
          >
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}
