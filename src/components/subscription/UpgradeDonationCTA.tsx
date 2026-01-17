"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { X, Crown, Heart, Zap, PlayCircle, Users } from "lucide-react";

export function UpgradeDonationCTA() {
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  // Check subscription status
  const { data: subscription } = useConvexQuery(api.subscriptions.getCurrentSubscription, {});
  
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
      search: { donation: undefined }
    });
  };

  const handleDonate = () => {
    void navigate({ 
      to: "/pricing",
      search: { donation: undefined },
      hash: "#donate"
    });
  };

  const handleDismiss = () => {
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
          className="fixed bottom-0 left-0 right-0 z-50 px-3 sm:px-4 pointer-events-none"
        >
          <motion.div
            className="max-w-3xl mx-auto pointer-events-auto"
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-black/50 via-slate-900/50 to-black/50 backdrop-blur-xl shadow-lg">
              {/* Subtle accent gradient */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/40 via-purple-500/30 to-blue-500/40" />
              
              <div className="relative p-3 sm:p-4">
                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-200 group"
                  aria-label="Dismiss"
                >
                  <X className="w-3 h-3 text-white/60 group-hover:text-white/80 transition-colors" />
                </button>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pr-7 sm:pr-8">
                  {/* Left content */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20">
                        <Heart className="w-3.5 h-3.5 text-blue-400/80 flex-shrink-0" />
                      </div>
                      <h3 className="text-sm sm:text-base font-display font-light text-white leading-tight">
                        Help Keep the Server Alive
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70 font-light">
                      <span className="flex items-center gap-1.5">
                        <PlayCircle className="w-3 h-3 text-blue-400/70" />
                        Game replays
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-purple-400/70" />
                        Advanced AI
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-pink-400/70" />
                        Unlimited private lobbies
                      </span>
                    </div>
                    <p className="text-xs text-white/50 font-light leading-snug">
                      Upgrade or donate to remove this banner and help keep this project alive ❤️
                    </p>
                  </div>

                  {/* Right actions */}
                  <div className="flex flex-row gap-2 w-full sm:w-auto flex-shrink-0">
                    <Button
                      variant="outline"
                      onClick={handleUpgrade}
                      size="sm"
                      className="font-light font-mono px-4 py-2 h-auto text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      <Crown className="w-3.5 h-3.5 mr-1.5" />
                      Upgrade
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleDonate}
                      size="sm"
                      className="font-light font-mono px-4 py-2 h-auto text-xs sm:text-sm flex-1 sm:flex-none border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 hover:border-pink-500/40"
                    >
                      <Heart className="w-3.5 h-3.5 mr-1.5 text-pink-400/80" />
                      Donate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
