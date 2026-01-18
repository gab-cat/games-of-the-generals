"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Heart,
  ArrowRight,
  Sparkles,
  Crown,
  Star,
  CheckCircle2,
  Shield,
  Target,
  Terminal,
  Activity,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { toast } from "sonner";
import { useNavigate, getRouteApi } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { cn } from "@/lib/utils";
import { SubscriptionPaymentModal } from "@/components/subscription/SubscriptionPaymentModal";
import { DonationPaymentModal } from "@/components/subscription/DonationPaymentModal";

const route = getRouteApi("/pricing");

interface PricingPageProps {
  profile: any;
}

import { pricingTiers } from "@/lib/pricing-tiers";

const comparisonFeatures = [
  {
    category: "Operational Capabilities",
    items: [
      {
        name: "Daily Missions (Matches)",
        standard: "10/Day",
        pro: "50/Day",
        proPlus: "Unlimited",
      },
      {
        name: "AI Difficulty Access",
        standard: "Basic (MK-1)",
        pro: "Advanced (MK-2)",
        proPlus: "Elite (MK-3)",
      },
      {
        name: "Replay Storage Buffer",
        standard: "1 Game",
        pro: "50 Games",
        proPlus: "100 Games",
      },
      {
        name: "Custom Loadout Slots",
        standard: "2 Slots",
        pro: "Unlimited",
        proPlus: "Unlimited",
      },
    ],
  },
  {
    category: "Tactical Intelligence",
    items: [
      { name: "Battle Analytics", standard: false, pro: true, proPlus: true },
      {
        name: "Move History Analysis",
        standard: false,
        pro: true,
        proPlus: true,
      },
      {
        name: "Meta-Game Insights",
        standard: false,
        pro: false,
        proPlus: true,
      },
    ],
  },
  {
    category: "Social protocols",
    items: [
      {
        name: "Custom Avatar Upload",
        standard: false,
        pro: true,
        proPlus: true,
      },
      {
        name: "Squad Formation Share",
        standard: false,
        pro: true,
        proPlus: true,
      },
      { name: "Priority Queue", standard: false, pro: true, proPlus: true },
      {
        name: "Tournament Hosting",
        standard: false,
        pro: false,
        proPlus: "Coming Soon",
      },
    ],
  },
];

const faqs = [
  {
    q: "Can I cancel my subscription anytime?",
    a: "Of course. You're in total control of your account. You can cancel through your dashboard whenever you like, and you'll keep your features until the end of your billing cycle.",
  },
  {
    q: "Is my payment information safe?",
    a: "Absolutely. We use industry-standard encryption through Stripe and PayMongo. We never even see your credit card details, let alone store them.",
  },
  {
    q: "Will I lose my rank if I downgrade?",
    a: "Not at all. Your match history, rank, and achievements are yours forever. You'll just lose access to the premium features until you decide to upgrade again.",
  },
  {
    q: "Can I upgrade my plan later?",
    a: "Definitely! If you're on Pro and want to go Pro+, you can upgrade instantly. We'll even prorate the cost so you only pay the difference for the remaining time.",
  },
];

export function PricingPage({ profile: _profile }: PricingPageProps) {
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);
  const [thankYouModalOpen, setThankYouModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"pro" | "pro_plus" | null>(
    null,
  );

  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();

  const search = route.useSearch();

  // Get current subscription status
  const { data: subscription } = useConvexQuery(
    api.subscriptions.getCurrentSubscription,
    {},
  );

  // Handle donation/upgrade success query parameter
  useEffect(() => {
    if (search.donation === "success") {
      setThankYouModalOpen(true);
      // Clean up URL by removing query parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("donation");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [search.donation]);

  const handleUpgrade = (tier: string) => {
    if (!isAuthenticated) {
      navigate({ to: "/auth" });
      return;
    }
    const tierLower = tier.toLowerCase();
    if (tierLower === "standard") {
      // Formerly Free
      toast.info("Standard clearance is already active.");
      return;
    }

    const tierValue = tierLower === "pro" ? "pro" : "pro_plus";
    setSelectedTier(tierValue);
    setUpgradeModalOpen(true);
  };

  const handleDonateOpen = () => {
    if (!isAuthenticated) {
      navigate({ to: "/auth" });
      return;
    }
    setDonateDialogOpen(true);
  };

  return (
    <div className="min-h-screen py-10 px-2 sm:px-6 relative overflow-hidden font-sans text-zinc-300">
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-16 md:mb-20 space-y-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="flex items-center gap-3 text-blue-400/60 font-mono text-xs tracking-[0.2em] uppercase bg-blue-500/5 border border-blue-500/10 px-3 py-1 rounded-full">
              <Terminal className="w-3.5 h-3.5" />
              <span>Choosing Your Path</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-medium text-white tracking-tight"
          >
            Unlock the Full <span className="text-zinc-600">Experience</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-sm max-w-2xl mx-auto leading-relaxed font-mono"
          >
            The core game is always free. Upgrade your account to unlock
            advanced features, better AI training, and more ways to customize
            your game.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-20 items-start">
          {pricingTiers.map((tier, index) => {
            const isBlue = tier.color === "blue";
            const isAmber = tier.color === "amber";

            const borderClass = isBlue
              ? "border-blue-500/30"
              : isAmber
                ? "border-amber-500/30"
                : "border-zinc-800";
            const bgClass = isBlue
              ? "bg-blue-500/5"
              : isAmber
                ? "bg-amber-500/5"
                : "bg-zinc-900/40";
            const textClass = isBlue
              ? "text-blue-400"
              : isAmber
                ? "text-amber-400"
                : "text-zinc-400";

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group h-full"
              >
                <div
                  className={cn(
                    "group relative h-full flex flex-col p-6 rounded-sm border backdrop-blur-sm transition-all duration-300",
                    borderClass,
                    bgClass,
                    tier.popular &&
                      "ring-1 ring-blue-500/20 shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]",
                  )}
                >
                  {/* Tactical Decor */}
                  <div className="absolute top-0 right-0 p-3 opacity-30">
                    {isBlue ? (
                      <Target className="w-12 h-12 text-blue-500" />
                    ) : isAmber ? (
                      <Crown className="w-12 h-12 text-amber-500" />
                    ) : (
                      <Shield className="w-12 h-12 text-zinc-500" />
                    )}
                  </div>

                  {tier.popular && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-500 text-[#050505] text-[10px] font-bold font-mono uppercase tracking-wider rounded-sm">
                      Best Value
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6 space-y-2 relative z-10">
                    <h3
                      className={cn(
                        "font-display text-2xl font-bold tracking-wide text-white",
                      )}
                    >
                      {tier.name}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono min-h-[40px]">
                      {tier.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-8 p-4 bg-[#050505]/50 rounded-sm border border-white/5 relative overflow-hidden group-hover:border-white/10 transition-colors">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-3xl font-mono font-bold tracking-tight",
                          textClass,
                        )}
                      >
                        {tier.price}
                      </span>
                      <span className="text-zinc-600 font-mono text-xs uppercase">
                        /{tier.period}
                      </span>
                    </div>
                    {tier.name !== "Standard" && (
                      <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-zinc-600" />
                        Multi-month discounts available
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="flex-1 space-y-6 mb-8">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-3 border-b border-zinc-800 pb-1">
                        Capabilities
                      </div>
                      <ul className="space-y-3">
                        {tier.features.slice(0, 8).map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-xs text-zinc-300"
                          >
                            <div
                              className={cn(
                                "w-1 h-1 rounded-full mt-1.5",
                                isBlue
                                  ? "bg-blue-500"
                                  : isAmber
                                    ? "bg-amber-500"
                                    : "bg-zinc-500",
                              )}
                            />
                            <span className="font-light">{feature}</span>
                          </li>
                        ))}
                        {tier.features.length > 8 && (
                          <li className="text-[10px] text-zinc-500 pl-4 py-1 italic">
                            + {tier.features.length - 8} additional protocols
                          </li>
                        )}
                      </ul>
                    </div>

                    {tier.comingSoon && tier.comingSoon.length > 0 && (
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-amber-500/50 mb-3 border-b border-amber-500/10 pb-1 pt-2">
                          In Development
                        </div>
                        <ul className="space-y-3">
                          {tier.comingSoon.map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-3 text-xs text-zinc-400/70"
                            >
                              <div className="w-1 h-1 rounded-full mt-1.5 bg-amber-500/40" />
                              <div className="flex flex-col gap-0.5">
                                <span>{feature}</span>
                                <span className="text-[9px] text-amber-500/60 font-mono uppercase">
                                  Pending Deployment
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {(() => {
                    const currentTier = subscription?.tier || "free";
                    const tierName = tier.name.toLowerCase();
                    const isCurrentTier =
                      (tierName === "standard" && currentTier === "free") ||
                      (tierName === "pro" && currentTier === "pro") ||
                      (tierName === "pro+" && currentTier === "pro_plus");

                    const expiresAt = subscription?.expiresAt;
                    const daysUntilExpiry = expiresAt
                      ? Math.ceil(
                          (expiresAt - Date.now()) / (1000 * 60 * 60 * 24),
                        )
                      : null;

                    return (
                      <div className="w-full space-y-3 z-10 relative">
                        {isCurrentTier && expiresAt && (
                          <div className="text-[10px] font-mono text-center bg-zinc-900/50 py-1 rounded-sm border border-white/5">
                            {daysUntilExpiry !== null && daysUntilExpiry > 0 ? (
                              <span className="text-zinc-400">
                                LICENSE EXP: {daysUntilExpiry} DAY(S)
                              </span>
                            ) : daysUntilExpiry === 0 ? (
                              <span className="text-amber-500 animate-pulse">
                                EXPIRING TODAY
                              </span>
                            ) : (
                              <span className="text-red-500">
                                LICENSE EXPIRED
                              </span>
                            )}
                          </div>
                        )}

                        <Button
                          variant={isCurrentTier ? "outline" : "default"}
                          className={cn(
                            "w-full h-10 font-mono text-xs uppercase tracking-wider transition-all duration-300",
                            isCurrentTier
                              ? "bg-transparent border-white/10 text-white/40 hover:bg-white/5 cursor-default"
                              : isBlue
                                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] border-0"
                                : isAmber
                                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_20px_rgba(217,119,6,0.5)] border-0"
                                  : "bg-white text-black hover:bg-zinc-200",
                          )}
                          onClick={() => void handleUpgrade(tier.name)}
                          disabled={isCurrentTier}
                        >
                          {isCurrentTier ? "ACTIVE" : tier.buttonText}
                        </Button>
                      </div>
                    );
                  })()}

                  {/* Corner Brackets */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Support & Discounts (Moved & Updated) */}
        <div className="grid md:grid-cols-12 gap-6 mb-24">
          {/* Discount Module */}
          <motion.div
            className="group md:col-span-12 lg:col-span-7 bg-zinc-900/40 border border-green-500/20 rounded-sm p-6 md:p-8 backdrop-blur-md relative overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50" />
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-sm border border-green-500/20">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-white">
                    Save with Multi-Month Plans
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Get up to 25% off when you commit to a longer plan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { term: "3 Months", discount: "15%", saved: "Save 15%" },
                  { term: "6 Months", discount: "20%", saved: "Save 20%" },
                  { term: "12 Months", discount: "25%", saved: "Best Value" },
                ].map((plan, i) => (
                  <div
                    key={i}
                    className="bg-black/40 border border-white/5 p-3 rounded-sm text-center hover:border-green-500/30 transition-colors"
                  >
                    <div className="text-green-400 font-bold text-lg">
                      {plan.discount}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">
                      OFF
                    </div>
                    <div className="w-full h-px bg-white/5 my-2" />
                    <div className="text-xs text-white">{plan.term}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:10px_10px]" />
          </motion.div>

          {/* Donation Module */}
          <motion.div
            className="group md:col-span-12 lg:col-span-5 bg-zinc-900/40 border border-pink-500/20 rounded-sm p-6 md:p-8 backdrop-blur-md relative overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
            <div className="absolute top-0 right-0 w-1 h-full bg-pink-500/50" />
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/10 rounded-sm border border-pink-500/20">
                  <Heart className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-white">
                    Support the Developer
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Help us keep the servers running.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Voluntary contributions maintain server uptime and active
                  development cycles.
                </p>

                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-mono text-zinc-500">
                    Includes Benefits:
                  </div>
                  <ul className="space-y-1">
                    {[
                      "Exclusive Donor Badge",
                      "Custom Username Color",
                      "Premium Profile Frame",
                    ].map((benefit, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-xs text-zinc-300"
                      >
                        <Star className="w-3 h-3 text-pink-500" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={handleDonateOpen}
                  className="w-full bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] mt-2"
                >
                  To Donation Page
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="mb-24">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="h-px bg-zinc-800 w-12" />
            <h2 className="text-xl font-display text-white tracking-wide">
              Tactical Feature Comparison
            </h2>
            <div className="h-px bg-zinc-800 w-12" />
          </div>

          <div className="bg-zinc-900/40 border border-white/5 rounded-sm overflow-hidden backdrop-blur-sm relative group">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 group-hover:border-white/20 transition-colors" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 group-hover:border-white/20 transition-colors" />
            <div className="grid grid-cols-4 bg-black/40 border-b border-white/5 p-4 text-xs font-mono uppercase tracking-wider text-zinc-500">
              <div>Feature Comparison</div>
              <div className="text-center font-bold text-zinc-400">
                Standard
              </div>
              <div className="text-center font-bold text-blue-400">Pro</div>
              <div className="text-center font-bold text-amber-500">Pro+</div>
            </div>

            {comparisonFeatures.map((section, idx) => (
              <div key={idx}>
                <div className="px-4 py-2 bg-zinc-950/50 border-y border-white/5 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                  {section.category}
                </div>
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 p-4 border-b border-white/5 text-sm hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <div className="text-zinc-300 font-light">{item.name}</div>

                    <div className="text-center text-zinc-500">
                      {typeof item.standard === "boolean" ? (
                        item.standard ? (
                          <CheckCircle2 className="w-4 h-4 mx-auto text-zinc-500" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 mx-auto" />
                        )
                      ) : (
                        <span className="font-mono text-xs">
                          {item.standard}
                        </span>
                      )}
                    </div>

                    <div className="text-center">
                      {typeof item.pro === "boolean" ? (
                        item.pro ? (
                          <CheckCircle2 className="w-4 h-4 mx-auto text-blue-500" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 mx-auto" />
                        )
                      ) : (
                        <span className="font-mono text-xs text-blue-400">
                          {item.pro}
                        </span>
                      )}
                    </div>

                    <div className="text-center">
                      {typeof item.proPlus === "boolean" ? (
                        item.proPlus ? (
                          <CheckCircle2 className="w-4 h-4 mx-auto text-amber-500" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 mx-auto" />
                        )
                      ) : (
                        <span className="font-mono text-xs text-amber-500 tracking-tight">
                          {item.proPlus}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Dialog (Replaced) */}
        <SubscriptionPaymentModal
          open={upgradeModalOpen}
          onOpenChange={setUpgradeModalOpen}
          mode="upgrade"
          tier={selectedTier || "pro"}
          onSuccess={() => {}}
        />

        {/* Tactical Briefing (FAQs) */}
        <div className="max-w-3xl mx-auto mb-24">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="p-2 bg-blue-500/10 rounded-sm border border-blue-500/20">
              <Terminal className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-display text-white tracking-wide">
              Got Questions? We Have Answers.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="group bg-zinc-900/40 border border-white/5 rounded-sm overflow-hidden hover:border-blue-500/30 transition-all duration-300"
              >
                <details className="w-full">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <span className="font-mono text-sm text-zinc-300 group-hover:text-white transition-colors">
                      <span className="text-blue-500 mr-2">#{i + 1} //</span>
                      {faq.q}
                    </span>
                    <div className="text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 transform group-open:rotate-90 transition-transform" />
                    </div>
                  </summary>
                  <div className="px-4 pb-4 pl-10">
                    <p className="text-sm text-zinc-400 font-light leading-relaxed border-l-2 border-blue-500/20 pl-4">
                      <span className="text-[10px] text-zinc-600 font-mono uppercase block mb-1">
                        The Details:
                      </span>
                      {faq.a}
                    </p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Donation Modal (Unified) */}
      <DonationPaymentModal
        open={donateDialogOpen}
        onOpenChange={setDonateDialogOpen}
      />

      {/* Success Modal for Donation - kept simple or can be integrated into page state */}
      <Dialog open={thankYouModalOpen} onOpenChange={setThankYouModalOpen}>
        <DialogContent className="bg-zinc-950 border border-green-500/20">
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-display text-white">
              You're Awesome!
            </h2>
            <p className="text-zinc-400 text-sm max-w-xs">
              Thank you for supporting the game! Your contribution helps us keep
              things running and growing. Check your profile for your new
              rewards!
            </p>
            <Button
              onClick={() => setThankYouModalOpen(false)}
              className="bg-zinc-800 text-white hover:bg-zinc-700 w-full"
            >
              DISMISS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
