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
import { Badge } from "@/components/ui/badge";
import { PaymentButton } from "./PaymentButton";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { AlertTriangle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "extend" | "upgrade";
  tier?: "pro" | "pro_plus"; // Required for upgrade mode
  onSuccess?: () => void;
}

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
  const expiresAt = subscription?.expiresAt;

  const isBlue = tierValue === "pro";

  // For extend mode, hide if user is on free tier
  if (mode === "extend" && subscriptionTier === "free") {
    return null;
  }

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  const getTitle = () => {
    return mode === "upgrade"
      ? "Secure Clearance Upgrade"
      : "Extend Operational License";
  };

  const getDescription = () => {
    return mode === "upgrade"
      ? "Select contract duration. Multi-cycle commitments receive funding allocation discounts."
      : "Extend license validity period. Advance payment ensures uninterrupted tactical access.";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md bg-zinc-950 border backdrop-blur-xl",
          isBlue ? "border-blue-500/20" : "border-amber-500/20",
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-medium text-white flex items-center gap-2">
            <Shield
              className={cn(
                "w-5 h-5",
                isBlue ? "text-blue-500" : "text-amber-500",
              )}
            />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-mono text-xs">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Active Plan Header */}
          <div
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border",
              isBlue
                ? "bg-blue-900/10 border-blue-500/20"
                : "bg-amber-900/10 border-amber-500/20",
            )}
          >
            <div className="flex flex-col">
              <span
                className={cn(
                  "font-bold uppercase tracking-wider text-sm",
                  isBlue ? "text-blue-400" : "text-amber-400",
                )}
              >
                {tierValue === "pro" ? "Officer Class" : "General Class"}
              </span>
              <span className="text-zinc-400 text-xs font-mono">
                {tierValue === "pro" ? "Pro Clearance" : "Pro+ Clearance"}
              </span>
            </div>
            <div className="text-right">
              <div className="text-xl text-white font-mono font-bold">
                ₱{priceInfo.discountedPrice.toLocaleString()}
              </div>
              {priceInfo.hasDiscount && (
                <div className="flex gap-2 items-center justify-end text-[10px] font-mono">
                  <span className="text-zinc-500 line-through">
                    ₱{priceInfo.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-green-400 bg-green-500/10 px-1 rounded">
                    SAVE ₱{priceInfo.savings.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
              Contract Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 6, 12].map((months) => {
                const isSelected = selectedMonths === months;
                const hasDiscount =
                  months === 12 || months === 6 || months === 3;

                return (
                  <button
                    key={months}
                    onClick={() => setSelectedMonths(months)}
                    className={cn(
                      "relative flex flex-col items-center justify-center py-3 px-1 rounded-md border transition-all duration-200",
                      isSelected
                        ? isBlue
                          ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                          : "border-amber-500 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300",
                    )}
                  >
                    <span className="text-sm font-bold">{months}</span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      Mo{months > 1 ? "s" : ""}
                    </span>

                    {hasDiscount && (
                      <div className="absolute -top-2 -right-1">
                        <Badge
                          variant="secondary"
                          className="px-1 py-0 h-4 text-[9px] bg-green-500/20 text-green-400 border-green-500/30"
                        >
                          {months === 3
                            ? "-15%"
                            : months === 6
                              ? "-20%"
                              : "-25%"}
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warning for tier upgrades with remaining time */}
          {mode === "upgrade" &&
            subscriptionTier !== "free" &&
            expiresAt &&
            expiresAt > Date.now() && (
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-500/80 font-mono leading-relaxed">
                  <span className="font-bold">NOTICE:</span> Active license
                  detected. Current expiration date ({formatDate(expiresAt)})
                  will be overwritten upon upgrade activation.
                </p>
              </div>
            )}

          <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-white/5 space-y-1">
            <div className="flex justify-between">
              <span>NEW_EXPIRY_DATE:</span>
              <span className={cn(isBlue ? "text-blue-400" : "text-amber-400")}>
                {formatDate(calculateNewExpiry())}
              </span>
            </div>
            {mode === "extend" && expiresAt && (
              <div className="flex justify-between text-zinc-600">
                <span>CURRENT_EXPIRY:</span>
                <span>{formatDate(expiresAt)}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-zinc-500 font-mono hover:text-white"
          >
            ABORT
          </Button>
          <PaymentButton
            tier={tierValue}
            months={selectedMonths}
            variant="default"
            onSuccess={handleSuccess}
            className={cn(
              "min-w-[140px] font-mono text-xs font-bold uppercase tracking-wider text-white",
              isBlue
                ? "bg-blue-600 hover:bg-blue-500"
                : "bg-amber-600 hover:bg-amber-500",
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
