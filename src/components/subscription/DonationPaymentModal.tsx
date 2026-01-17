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
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Heart, Loader2, CreditCard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DonationPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DonationPaymentModal({
  open,
  onOpenChange,
  onSuccess,
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
      toast.error("Invalid funding amount.");
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
        toast.error("Failed to establish secure payment channel.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Donation error:", error);
      toast.error("Transaction failed. System busy.");
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border border-pink-500/20 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-medium text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Funding Transfer
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-mono text-xs">
            Voluntary contribution to maintain operational status.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Amount Selection Grid */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
              Select Amount (PHP)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {donationAmounts.map((amount) => {
                const isSelected = selectedAmount === amount;
                return (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center py-3 px-1 rounded-md border transition-all duration-200 group",
                      isSelected
                        ? "border-pink-500 bg-pink-500/10 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300",
                    )}
                  >
                    <span className="text-sm font-bold font-mono">
                      ₱{amount}
                    </span>
                  </button>
                );
              })}

              {/* Custom Amount Input integration in grid if space permits or separate */}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-zinc-500 font-mono text-xs">₱</span>
            </div>
            <input
              type="number"
              placeholder="CUSTOM_AMOUNT"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className={cn(
                "w-full pl-8 pr-4 py-3 bg-zinc-900/50 border rounded-md text-white text-sm font-mono placeholder:text-zinc-600 outline-none transition-all",
                customAmount
                  ? "border-pink-500/50 focus:border-pink-500"
                  : "border-zinc-800 focus:border-zinc-700",
              )}
            />
          </div>

          {/* Impact Note */}
          <div className="space-y-2">
            <div className="p-3 bg-pink-500/5 border border-pink-500/10 rounded-lg flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-pink-500/70 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-pink-200/60 font-mono leading-relaxed">
                Contributions directly support server costs and development.
                Receive <span className="text-pink-400">Donor Status</span> and
                exclusive cosmetic protocols.
              </p>
            </div>

            {isBelowThreshold && (
              <div className="p-2 border border-yellow-500/20 bg-yellow-500/5 rounded flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <Loader2 className="w-3 h-3 text-yellow-500/70 mt-0.5 flex-shrink-0 animate-pulse" />
                <p className="text-[9px] text-yellow-200/50 font-mono leading-tight">
                  <span className="text-yellow-500/80">WARNING:</span>{" "}
                  CONTRIBUTIONS BELOW ₱50 DO NOT ACTIVATE DONOR STATUS.
                </p>
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
            CANCEL
          </Button>
          <Button
            onClick={handleDonate}
            disabled={(!selectedAmount && !customAmount) || isProcessing}
            className="bg-pink-600 hover:bg-pink-500 text-white font-mono uppercase tracking-wider min-w-[140px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                PROCESSING
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                CONTRIBUTE
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
