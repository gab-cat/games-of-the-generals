"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { X, Crown, Heart, Zap, PlayCircle, Users } from "lucide-react";

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

  // Wait for data before determining eligibility to prevent flashing
  const isLoading = subscription === undefined || profile === undefined;

  // Determine persistent eligibility (should this ever be shown to this user?)
  const tier = subscription?.tier || "free";
  const isDonor = profile?.isDonor || false;
  const isEligible = !isLoading && tier === "free" && !isDonor;

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
      hash: "#donate",
    });
  };

  const handleDismiss = () => {
    const expiry = Date.now() + DISMISS_DURATION;
    localStorage.setItem(STORAGE_KEY, expiry.toString());
    setIsDismissed(true);
  };

  return (
    <AnimatePresence>
      {isEligible && !isDismissed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          }}
          className="fixed bottom-0 left-0 right-0 z-50 p-2 pointer-events-none flex justify-center"
        >
          <motion.div
            className="w-full max-w-3xl pointer-events-auto"
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/90 backdrop-blur-md shadow-2xl">
              <div className="relative p-2 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
                {/* Close Button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Left: Content */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h3 className="text-base font-display font-medium text-white flex items-center justify-center sm:justify-start gap-2">
                    <span className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Heart className="w-3.5 h-3.5" />
                    </span>
                    Enjoying Games of Generals?
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Your support helps keep the servers running and independent.
                    Upgrade to unlock exclusive features or consider making a
                    small donation.
                  </p>
                  <div className="flex font-mono flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-xs text-zinc-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <PlayCircle className="w-3 h-3 text-zinc-400" />
                      Replay Storage
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-zinc-400" />
                      Advanced AI
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-zinc-400" />
                      Unlimited Lobbies
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleUpgrade}
                    size="sm"
                    variant="outline"
                    className="flex-1 font-mono sm:flex-none border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-9 font-normal"
                  >
                    <Crown className="w-3.5 h-3.5 mr-2" />
                    Upgrade
                  </Button>
                  <Button
                    onClick={handleDonate}
                    size="sm"
                    className="flex-1 font-mono sm:flex-none bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-900/20 h-9 font-normal border-0"
                  >
                    <Heart className="w-3.5 h-3.5 mr-2 fill-current" />
                    Donate
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
