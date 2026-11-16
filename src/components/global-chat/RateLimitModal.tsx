"use client";

import { FixedDigits } from "@/components/ui/fixed-digits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingTime: number; // in seconds
}

export function RateLimitModal({
  isOpen,
  onClose,
  remainingTime,
}: RateLimitModalProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="z-[400] max-w-sm">
        <DialogHeader>
          <DialogTitle>Slow down</DialogTitle>
          <DialogDescription>
            You sent too many messages too quickly. Wait before sending another.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-white/[0.04] px-4 py-3">
          <p className="text-sm text-foreground/80">You can send again in</p>
          <p
            className="mt-1 text-3xl font-semibold tabular-nums text-gold-300"
            aria-live="polite"
          >
            <FixedDigits>{formatTime(remainingTime)}</FixedDigits>
          </p>
        </div>

        <p className="text-sm text-foreground/80">
          Repeated spam can lead to chat restrictions.
        </p>

        <DialogFooter>
          <Button onClick={onClose}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
