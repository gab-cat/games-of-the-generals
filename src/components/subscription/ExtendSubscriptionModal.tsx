"use client";

import { SubscriptionPaymentModal } from "./SubscriptionPaymentModal";

interface ExtendSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/** Kept for old imports. The extend flow lives in SubscriptionPaymentModal. */
export function ExtendSubscriptionModal({
  open,
  onOpenChange,
  onSuccess,
}: ExtendSubscriptionModalProps) {
  return (
    <SubscriptionPaymentModal
      open={open}
      onOpenChange={onOpenChange}
      mode="extend"
      onSuccess={onSuccess}
    />
  );
}
