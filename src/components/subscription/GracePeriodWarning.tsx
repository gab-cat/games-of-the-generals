"use client";

import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface GracePeriodWarningProps {
  className?: string;
}

export function GracePeriodWarning({
  className = "",
}: GracePeriodWarningProps) {
  const navigate = useNavigate();
  const { data: subscription } = useConvexQuery(
    api.subscriptions.getCurrentSubscription,
    {},
  );

  if (!subscription || subscription.status !== "grace_period") {
    return null;
  }

  const gracePeriodEndsAt = subscription.gracePeriodEndsAt;

  if (!gracePeriodEndsAt) {
    return null;
  }

  const deltaMs = gracePeriodEndsAt - Date.now();
  const hoursRemaining = Math.max(0, Math.ceil(deltaMs / (1000 * 60 * 60)));

  const message =
    deltaMs <= 0
      ? "Your plan and its grace period have ended. Renew to get your Pro features back."
      : deltaMs < 1000 * 60 * 60
        ? "Your plan has expired and the grace period ends in less than an hour. Renew to keep your Pro features."
        : `Your plan has expired. Pro features lock in about ${hoursRemaining} ${hoursRemaining === 1 ? "hour" : "hours"}.`;

  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border border-red-500/30 bg-red-500/10 p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {deltaMs <= 0 ? "Grace period ended" : "Grace period"}
          </p>
          <p className="mt-1 text-sm text-foreground/80">{message}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() =>
              navigate({
                to: "/subscription",
                search: { subscription: undefined },
              })
            }
          >
            Renew
          </Button>
        </div>
      </div>
    </div>
  );
}
