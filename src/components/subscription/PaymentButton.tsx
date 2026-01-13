"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";

interface PaymentButtonProps {
  tier: "pro" | "pro_plus";
  months?: number;
  className?: string;
  variant?: "default" | "gradient" | "outline";
  onSuccess?: () => void;
}

export function PaymentButton({
  tier,
  months = 1,
  className = "",
  variant = "gradient",
  onSuccess,
}: PaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const createPayment = useConvexAction(api.subscriptions.createPayMongoPayment);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      const result = await createPayment({
        tier,
        months,
      });

      // Redirect to PayMongo checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.error("Failed to get checkout URL");
        setIsProcessing(false);
      }
      
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create payment");
      setIsProcessing(false);
    }
  };

  // Calculate discounted price with progressive discounts
  // 3 months: 15% discount (pay 2.55 months)
  // 6 months: 20% discount (pay 4.8 months)
  // 12 months: 25% discount (pay 9 months)
  const getPrice = () => {
    const basePrice = tier === "pro" ? 99 : 199;
    
    let monthsToPay = months;
    if (months === 12) monthsToPay = 9;      // 25% discount
    else if (months === 6) monthsToPay = 4.8; // 20% discount
    else if (months === 3) monthsToPay = 2.55; // 15% discount
    
    return Math.round(basePrice * monthsToPay);
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handlePayment}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pay ₱{getPrice()}
        </>
      )}
    </Button>
  );
}
