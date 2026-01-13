"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentButton } from "./PaymentButton";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Calendar, Sparkles } from "lucide-react";

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
  const { data: subscription } = useConvexQuery(api.subscriptions.getCurrentSubscription, {});

  // Determine tier: use prop for upgrade mode, subscription for extend mode
  const subscriptionTier = subscription?.tier || "free";
  const tier = mode === "upgrade" ? (propTier || "pro") : (subscriptionTier === "pro" ? "pro" : subscriptionTier === "pro_plus" ? "pro_plus" : "pro");
  const tierValue = tier === "pro" ? "pro" : "pro_plus";
  const expiresAt = subscription?.expiresAt;

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
      return new Date(Date.now() + selectedMonths * 30 * 24 * 60 * 60 * 1000).getTime();
    } else {
      // For extends, extend from current expiry or now
      const baseDate = expiresAt && expiresAt > Date.now() ? expiresAt : Date.now();
      return new Date(baseDate + selectedMonths * 30 * 24 * 60 * 60 * 1000).getTime();
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
    if (selectedMonths === 12) monthsToPay = 9;      // 25% discount
    else if (selectedMonths === 6) monthsToPay = 4.8; // 20% discount
    else if (selectedMonths === 3) monthsToPay = 2.55; // 15% discount
    
    const discountedPrice = Math.round(basePrice * monthsToPay);
    const savings = originalPrice - discountedPrice;
    const discountPercent = selectedMonths > 1 && (selectedMonths === 12 || selectedMonths === 6 || selectedMonths === 3)
      ? (savings / originalPrice) * 100
      : 0;
    
    return { originalPrice, discountedPrice, savings, discountPercent, hasDiscount: discountPercent > 0 };
  };

  const priceInfo = calculatePrice();

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  const getTitle = () => {
    return mode === "upgrade" ? "Upgrade Subscription" : "Extend Subscription";
  };

  const getDescription = () => {
    return mode === "upgrade"
      ? "Select the number of months for your subscription. Discounts are automatically applied for longer periods."
      : "Add months to your subscription expiry date. You can pay multiple months in advance.";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-xl border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-light text-white">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-white/60 font-light">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <label className="block text-sm font-light text-white/70 mb-2">
              Number of months
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 6, 12].map((months) => {
                const hasDiscount = months === 12 || months === 6 || months === 3;
                return (
                  <button
                    key={months}
                    onClick={() => setSelectedMonths(months)}
                    className={`relative px-4 py-3 rounded-lg border transition-all duration-200 font-light ${
                      selectedMonths === months
                        ? "border-blue-500/50 bg-blue-500/20 text-blue-300"
                        : "border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    {months}
                    {hasDiscount && (
                      <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 border-green-500/30">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        Save
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-white/60" />
              <span className="text-sm font-light text-white/60">
                {mode === "upgrade" ? "Subscription Details" : "Expiry Details"}
              </span>
            </div>
            <div className="space-y-2">
              {mode === "extend" && expiresAt && (
                <div className="flex justify-between text-sm font-light text-white/70">
                  <span>Current expiry:</span>
                  <span>{formatDate(expiresAt)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-light text-white/70">
                <span>{mode === "upgrade" ? "Subscription starts:" : "New expiry:"}</span>
                <span>{formatDate(calculateNewExpiry())}</span>
              </div>
              {priceInfo.hasDiscount && (
                <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                  <span>Original price:</span>
                  <span className="line-through">₱{priceInfo.originalPrice.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-lg font-medium text-white mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span>Total:</span>
                  {priceInfo.hasDiscount && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      Save ₱{priceInfo.savings.toFixed(2)} ({priceInfo.discountPercent.toFixed(1)}%)
                    </Badge>
                  )}
                </div>
                <span className={priceInfo.hasDiscount ? "text-green-400" : ""}>
                  ₱{priceInfo.discountedPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-light"
          >
            Cancel
          </Button>
          <PaymentButton
            tier={tierValue}
            months={selectedMonths}
            variant="gradient"
            onSuccess={handleSuccess}
            className="font-light"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
