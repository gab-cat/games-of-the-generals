"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaymentButton } from "./PaymentButton";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLongDate, formatPeso } from "./plan-copy";

interface SubscriptionPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "extend" | "upgrade";
  tier?: "pro" | "pro_plus"; // Required for upgrade mode
  onSuccess?: () => void;
}

const DURATIONS: { months: number; discount: number }[] = [
  { months: 1, discount: 0 },
  { months: 3, discount: 15 },
  { months: 6, discount: 20 },
  { months: 12, discount: 25 },
];

export function SubscriptionPaymentModal({
  open,
  onOpenChange,
  mode,
  tier: propTier,
  onSuccess,
}: SubscriptionPaymentModalProps) {
  const [selectedMonths, setSelectedMonths] = useState(1);
  const { data: subscription } = useConvexQuery(
    api.subscriptions.getCurrentSubscription,
    {},
  );

  // Determine tier: use prop for upgrade mode, subscription for extend mode
  const subscriptionTier = subscription?.tier || "free";
  const tier =
    mode === "upgrade"
      ? propTier || "pro"
      : subscriptionTier === "pro"
        ? "pro"
        : subscriptionTier === "pro_plus"
          ? "pro_plus"
          : "pro";
  const tierValue = tier === "pro" ? "pro" : "pro_plus";
  const tierName = tierValue === "pro" ? "Pro" : "Pro+";
  const expiresAt = subscription?.expiresAt;

  // For extend mode, hide if user is on free tier
  if (mode === "extend" && subscriptionTier === "free") {
    return null;
  }

  const calculateNewExpiry = () => {
    if (mode === "upgrade") {
      // For upgrades, start from now
      return new Date(
        Date.now() + selectedMonths * 30 * 24 * 60 * 60 * 1000,
      ).getTime();
    } else {
      // For extends, extend from current expiry or now
      const baseDate =
        expiresAt && expiresAt > Date.now() ? expiresAt : Date.now();
      return new Date(
        baseDate + selectedMonths * 30 * 24 * 60 * 60 * 1000,
      ).getTime();
    }
  };

  // Calculate discounted price with new progressive discount structure
  // 3 months: 15% discount (pay 2.55 months)
  // 6 months: 20% discount (pay 4.8 months)
  // 12 months: 25% discount (pay 9 months)
  const calculatePrice = () => {
    const basePrice = tierValue === "pro" ? 99 : 199;
    const originalPrice = basePrice * selectedMonths;

    let monthsToPay = selectedMonths;
    if (selectedMonths === 12)
      monthsToPay = 9; // 25% discount
    else if (selectedMonths === 6)
      monthsToPay = 4.8; // 20% discount
    else if (selectedMonths === 3) monthsToPay = 2.55; // 15% discount

    const discountedPrice = Math.round(basePrice * monthsToPay);
    const savings = originalPrice - discountedPrice;
    const discountPercent =
      selectedMonths > 1 &&
      (selectedMonths === 12 || selectedMonths === 6 || selectedMonths === 3)
        ? (savings / originalPrice) * 100
        : 0;

    return {
      originalPrice,
      discountedPrice,
      savings,
      discountPercent,
      hasDiscount: discountPercent > 0,
    };
  };

  const priceInfo = calculatePrice();

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  const hasActivePlan =
    subscriptionTier !== "free" && !!expiresAt && expiresAt > Date.now();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "upgrade" ? `Get ${tierName}` : `Extend ${tierName}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "upgrade"
              ? "Choose how many months to pay for. Longer plans cost less per month."
              : "Add months to your plan. The new months start after your current expiry date."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-foreground">
              Months
            </legend>
            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              role="radiogroup"
            >
              {DURATIONS.map(({ months, discount }) => {
                const isSelected = selectedMonths === months;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    key={months}
                    onClick={() => setSelectedMonths(months)}
                    className={cn(
                      "flex min-h-[3.5rem] flex-col items-center justify-center rounded-md border px-2 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]",
                      isSelected
                        ? "border-gold-500/60 bg-gold-500/10 text-foreground"
                        : "border-border bg-white/[0.04] text-foreground hover:border-border-strong hover:bg-white/[0.08]",
                    )}
                  >
                    <span className="text-base font-semibold tabular-nums">
                      {months}
                    </span>
                    <span className="text-xs text-foreground/80">
                      {discount
                        ? `${discount}% off`
                        : months === 1
                          ? "month"
                          : "months"}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <dl className="space-y-2 rounded-md border border-border bg-white/[0.02] p-4 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-foreground/80">
                {tierName}, {selectedMonths}{" "}
                {selectedMonths === 1 ? "month" : "months"}
              </dt>
              <dd className="text-lg font-semibold tabular-nums text-foreground">
                {formatPeso(priceInfo.discountedPrice)}
              </dd>
            </div>
            {priceInfo.hasDiscount && (
              <div className="flex items-baseline justify-between gap-4 text-xs">
                <dt className="text-foreground/80">You save</dt>
                <dd className="tabular-nums text-emerald-400">
                  {formatPeso(priceInfo.savings)}
                  <span className="ml-2 text-foreground/60 line-through">
                    {formatPeso(priceInfo.originalPrice)}
                  </span>
                </dd>
              </div>
            )}
            {mode === "extend" && expiresAt && (
              <div className="flex justify-between gap-4 border-t border-border pt-2 text-xs">
                <dt className="text-foreground/80">Now expires</dt>
                <dd className="text-foreground">{formatLongDate(expiresAt)}</dd>
              </div>
            )}
            <div
              className={cn(
                "flex justify-between gap-4 text-xs",
                mode === "upgrade" && "border-t border-border pt-2",
              )}
            >
              <dt className="text-foreground/80">New expiry</dt>
              <dd className="font-medium text-gold-300">
                {formatLongDate(calculateNewExpiry())}
              </dd>
            </div>
          </dl>

          {mode === "upgrade" && hasActivePlan && (
            <div className="flex items-start gap-2 rounded-md border border-gold-500/30 bg-gold-500/10 p-3 text-xs text-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold-300" />
              <p>
                You already have a plan until {formatLongDate(expiresAt)}. The
                new plan starts now and replaces that date.
              </p>
            </div>
          )}

          <p className="text-xs text-foreground/70">
            You pay on the PayMongo checkout page. We never see your card
            details.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <PaymentButton
            tier={tierValue}
            months={selectedMonths}
            variant="default"
            onSuccess={handleSuccess}
            className="sm:min-w-[160px]"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
