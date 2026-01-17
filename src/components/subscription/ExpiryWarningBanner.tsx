"use client";

import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { AlertTriangle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

interface ExpiryWarningBannerProps {
  className?: string;
  dismissible?: boolean;
}

export function ExpiryWarningBanner({ className = "", dismissible = true }: ExpiryWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { data: subscription } = useConvexQuery(api.subscriptions.getCurrentSubscription, {});

  if (dismissed || !subscription || subscription.tier === "free") {
    return null;
  }

  const daysUntilExpiry = subscription.daysUntilExpiry;
  const status = subscription.status;

  // Show banner if:
  // 1. Subscription is expiring soon (7 days or less)
  // 2. Subscription is in grace period
  // 3. Subscription is expired
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
        bgColor: "bg-red-500/20",
        borderColor: "border-red-500/30",
        textColor: "text-red-300",
        icon: AlertTriangle,
        message: "Your subscription has expired. Renew now to restore access to premium features.",
        actionText: "Renew Now",
      };
    }
    if (status === "grace_period") {
      return {
        bgColor: "bg-amber-500/20",
        borderColor: "border-amber-500/30",
        textColor: "text-amber-300",
        icon: Clock,
        message: "Your subscription has expired but you're in a 2-day grace period. Renew now to continue access.",
        actionText: "Renew Now",
      };
    }
    if (daysUntilExpiry !== null && daysUntilExpiry <= 1) {
      return {
        bgColor: "bg-red-500/20",
        borderColor: "border-red-500/30",
        textColor: "text-red-300",
        icon: AlertTriangle,
        message: "Your subscription expires today. Renew now to avoid losing access.",
        actionText: "Renew Now",
      };
    }
    if (daysUntilExpiry !== null && daysUntilExpiry <= 3) {
      return {
        bgColor: "bg-amber-500/20",
        borderColor: "border-amber-500/30",
        textColor: "text-amber-300",
        icon: Clock,
        message: `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}. Renew now to continue access.`,
        actionText: "Renew Now",
      };
    }
    return {
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/30",
      textColor: "text-yellow-300",
      icon: Clock,
      message: `Your subscription expires in ${daysUntilExpiry} days. Consider renewing to avoid interruption.`,
      actionText: "View Subscription",
    };
  };

  const content = getBannerContent();
  const Icon = content.icon;

  return (
    <div
      className={`${content.bgColor} ${content.borderColor} border rounded-lg p-4 flex items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <Icon className={`w-5 h-5 ${content.textColor} flex-shrink-0`} />
        <p className={`text-sm font-light ${content.textColor} flex-1`}>{content.message}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/subscription", search: { subscription: undefined} })}
          className="font-light"
        >
          {content.actionText}
        </Button>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-white/60 hover:text-white"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
