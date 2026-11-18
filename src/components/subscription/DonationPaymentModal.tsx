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
import { Input } from "@/components/ui/input";
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DonationPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Switch to the direct QR Ph flow (QrDonationDialog). */
  onChooseQr?: () => void;
}

export function DonationPaymentModal({
  open,
  onOpenChange,
  onSuccess,
  onChooseQr,
}: DonationPaymentModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const createDonation = useConvexAction(
    api.subscriptions.createPayMongoDonation,
  );

  const donationAmounts = [50, 100, 200, 500, 1000];

  const currentAmount =
    selectedAmount || (customAmount ? parseFloat(customAmount) : 0);
  const isBelowThreshold = currentAmount > 0 && currentAmount < 50;

  const handleDonate = async () => {
    const amount =
      selectedAmount || (customAmount ? parseFloat(customAmount) : null);

    if (!amount || amount <= 0) {
      toast.error("Choose or enter an amount first.");
      return;
    }

    try {
      setIsProcessing(true);

      const result = await createDonation({
        amount,
      });

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        onSuccess?.();
      } else {
        toast.error("The payment page did not open. Try again.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Donation error:", error);
      toast.error("Could not start the donation. Try again in a moment.");
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Donate</DialogTitle>
          <DialogDescription>
            Donations pay for servers and development. Give ₱50 or more to get a
            donor badge, a custom name colour and a profile frame.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-foreground">
              Amount in pesos
            </legend>
            <div className="grid grid-cols-3 gap-2" role="radiogroup">
              {donationAmounts.map((amount) => {
                const isSelected = selectedAmount === amount;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-md border text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]",
                      isSelected
                        ? "border-gold-500/60 bg-gold-500/10 text-foreground"
                        : "border-border bg-white/[0.04] text-foreground hover:border-border-strong hover:bg-white/[0.08]",
                    )}
                  >
                    ₱{amount}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label
              htmlFor="donation-custom"
              className="block text-[13px] font-medium text-foreground"
            >
              Or enter another amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-foreground/70">
                ₱
              </span>
              <Input
                id="donation-custom"
                type="number"
                inputMode="decimal"
                min={1}
                placeholder="0"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="pl-7 tabular-nums"
                aria-invalid={isBelowThreshold}
                aria-describedby={
                  isBelowThreshold ? "donation-warning" : undefined
                }
              />
            </div>
            {isBelowThreshold && (
              <p
                id="donation-warning"
                role="status"
                className="text-xs text-gold-300"
              >
                Under ₱50 does not give you the donor badge. You can still
                donate this amount.
              </p>
            )}
          </div>

          <p className="text-xs text-foreground/70">
            You pay on the PayMongo checkout page.
            {onChooseQr && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={onChooseQr}
                  className="rounded-sm text-gold-300 underline underline-offset-4 transition-colors hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                >
                  Scan our QR Ph code instead
                </button>
              </>
            )}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDonate}
            disabled={(!selectedAmount && !customAmount) || isProcessing}
            className="sm:min-w-[160px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" />
                Opening payment page
              </>
            ) : currentAmount > 0 ? (
              `Donate ₱${currentAmount.toLocaleString()}`
            ) : (
              "Donate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
