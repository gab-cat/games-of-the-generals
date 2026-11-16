"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function UpgradeDonationCTA() {
  const [isDismissed, setIsDismissed] = useState(true); // Start dismissed to avoid flash while checking localStorage
  const navigate = useNavigate();

  const STORAGE_KEY = "upgrade-cta-dismissed-until";
  const DISMISS_DURATION = 60 * 60 * 1000; // 1 hour in ms

  useEffect(() => {
    const checkDismissal = () => {
      const dismissedUntil = localStorage.getItem(STORAGE_KEY);
      if (dismissedUntil) {
        const expiry = parseInt(dismissedUntil, 10);
        if (Date.now() < expiry) {
          setIsDismissed(true);

          // Set a timer to show it again exactly when it expires
          const remaining = expiry - Date.now();
          const timer = setTimeout(() => {
            setIsDismissed(false);
          }, remaining);

          return () => clearTimeout(timer);
        }
      }
      setIsDismissed(false);
    };

    checkDismissal();
  }, []);

  // Check subscription status
  const { data: subscription } = useConvexQuery(
    api.subscriptions.getCurrentSubscription,
    {},
  );

  // Check donor status via profile
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile, {});

  // Guests get the "keep this account" prompt instead of this card.
  const { data: userSettings } = useConvexQuery(api.settings.getUserSettings);

  // Wait for data before determining eligibility to prevent flashing
  const isLoading =
    subscription === undefined ||
    profile === undefined ||
    userSettings === undefined;

  // Determine persistent eligibility (should this ever be shown to this user?)
  const tier = subscription?.tier || "free";
  const isDonor = profile?.isDonor || false;
  const isAnonymous = userSettings?.isAnonymous === true;
  const isEligible = !isLoading && tier === "free" && !isDonor && !isAnonymous;

  // Don't render if user is definitely not eligible (pro/donator)
  // We keep it mounted if still loading OR if eligible, so AnimatePresence can handle the transition
  if (!isLoading && !isEligible) {
    return null;
  }

  const handleUpgrade = () => {
    void navigate({
      to: "/pricing",
      search: { donation: undefined },
    });
  };

  const handleDonate = () => {
    void navigate({
      to: "/pricing",
      search: { donation: undefined },
      hash: "donate",
    });
  };

  const handleDismiss = () => {
    const expiry = Date.now() + DISMISS_DURATION;
    try {
      localStorage.setItem(STORAGE_KEY, expiry.toString());
    } catch {
      // Private mode: it just comes back on the next visit.
    }
    setIsDismissed(true);
  };

  return (
    <AnimatePresence>
      {isEligible && !isDismissed && (
        <motion.aside
          aria-label="Support the game"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          // Phones: sits above the bottom tab bar (h-16 plus the safe area).
          // Desktop: bottom left, clear of the Global chat button on the right.
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] left-3 right-3 z-30 lg:bottom-6 lg:left-6 lg:right-auto lg:w-[22rem]"
        >
          <div className="relative rounded-lg border border-border-strong bg-card p-4 pr-12">
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute right-1.5 top-1.5 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              aria-label="Dismiss for an hour"
            >
              <X className="size-4" />
            </button>

            <h3 className="font-display text-base font-semibold text-foreground">
              Enjoying the game?
            </h3>
            <p className="mt-1 text-sm text-foreground/80">
              Pro adds stronger AI and more saved replays. Donations pay for the
              servers.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                See plans
              </Button>
              <Button
                onClick={handleDonate}
                size="sm"
                variant="secondary"
                className="flex-1 sm:flex-none"
              >
                Donate
              </Button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
