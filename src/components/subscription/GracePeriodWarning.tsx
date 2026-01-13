"use client";

import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

interface GracePeriodWarningProps {
  className?: string;
}

export function GracePeriodWarning({ className = "" }: GracePeriodWarningProps) {
  const navigate = useNavigate();
  const { data: subscription } = useConvexQuery(api.subscriptions.getCurrentSubscription, {});

  if (!subscription || subscription.status !== "grace_period") {
    return null;
  }

  const expiresAt = subscription.expiresAt;
  const gracePeriodEndsAt = subscription.gracePeriodEndsAt;

  if (!gracePeriodEndsAt) {
    return null;
  }

  const hoursRemaining = Math.ceil((gracePeriodEndsAt - Date.now()) / (1000 * 60 * 60));

  return (
    <div
      className={`bg-amber-500/20 border border-amber-500/30 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-amber-300">Grace Period Active</span>
          </div>
          <p className="text-sm font-light text-amber-300/80 mb-3">
            Your subscription has expired but you're still in the 2-day grace period. 
            You have approximately {hoursRemaining} hour{hoursRemaining !== 1 ? "s" : ""} remaining before 
            premium features are locked.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/subscription" })}
            className="font-light border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
          >
            Renew Now
          </Button>
        </div>
      </div>
    </div>
  );
}
