import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import {
  Crown,
  Zap,
  CreditCard,
  Heart,
  CheckCircle2,
  Star,
  Terminal,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { SubscriptionPaymentModal } from "@/components/subscription/SubscriptionPaymentModal";
import { DonationPaymentModal } from "@/components/subscription/DonationPaymentModal";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { pricingTiers } from "@/lib/pricing-tiers";

export function SubscriptionPage() {
  const navigate = useNavigate();
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  // Donation State
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);

  const search = useSearch({ from: "/subscription" });

  // Get subscription data
  const { data: subscription } = useConvexQuery(
    api.subscriptions.getCurrentSubscription,
    {},
  );
  const { data: usage } = useConvexQuery(
    api.subscriptions.getSubscriptionUsage,
    {},
  );
  const { data: paymentHistory } = useConvexQuery(
    api.subscriptions.getPaymentHistory,
    {
      paginationOpts: { numItems: 10 },
    },
  );
  const { data: donationHistory } = useConvexQuery(
    api.subscriptions.getDonationHistory,
    {
      paginationOpts: { numItems: 10 },
    },
  );
  const { data: notifications } = useConvexQuery(
    api.subscriptions.getExpiryNotifications,
    {},
  );
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile, {});

  const tier = subscription?.tier || "free";
  const status = subscription?.status || "active";
  const expiresAt = subscription?.expiresAt;
  const daysUntilExpiry = subscription?.daysUntilExpiry;

  // Handle subscription success query parameter
  useEffect(() => {
    if (search.subscription === "success") {
      setSuccessModalOpen(true);
      navigate({
        to: "/subscription",
        search: (prev: any) => ({ ...prev, subscription: undefined }),
        replace: true,
      });
    }
  }, [search.subscription]);

  // Merge and sort transactions (Payments + Donations)
  const transactions = useMemo(() => {
    const payments =
      paymentHistory?.page.map((p) => ({
        ...p,
        type: "subscription" as const,
      })) || [];
    const donations =
      donationHistory?.page.map((d) => ({ ...d, type: "donation" as const })) ||
      [];

    return [...payments, ...donations].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }, [paymentHistory, donationHistory]);

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₱${(amount / 100).toFixed(2)}`;
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case "free":
        return "Free";
      case "pro":
        return "Pro";
      case "pro_plus":
        return "Pro+";
      default:
        return tier;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen text-white selection:bg-blue-500/30 font-sans p-4 sm:p-6"
    >
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none select-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto rounded-sm overflow-hidden min-h-[calc(100vh-3rem)]">
        {/* Header Section */}
        <div className="mb-12 md:mb-16 space-y-4 px-2 md:px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "circOut" }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-3 text-blue-400/60 font-mono text-xs tracking-[0.2em] uppercase">
              <Terminal className="w-4 h-4" />
              <span>System Ready</span>
              <span className="w-px h-3 bg-blue-500/30" />
              <span>License Management</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-medium text-white tracking-tight leading-none">
              Subscription <span className="text-white/20">Status</span>
            </h1>
            <p className="max-w-xl text-white/50 text-sm leading-relaxed font-light">
              Manage your combat clearance and view active operational licenses.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-2 md:px-4 pb-12">
          {/* LEFT COLUMN: Main Content */}
          <div className="lg:col-span-8 space-y-12">
            {/* Current License Card */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-white/10 flex-1" />
                <h2 className="font-mono text-xs uppercase tracking-widest text-white/40">
                  Phase 1 // Active License
                </h2>
                <div className="h-px bg-white/10 w-8" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "group relative overflow-hidden rounded-sm border backdrop-blur-sm p-6 md:p-8 transition-all duration-500",
                  tier === "pro"
                    ? "bg-blue-500/5 border-blue-500/20"
                    : tier === "pro_plus"
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-white/5 border-white/10",
                )}
              >
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
                {/* Scanline or gradient overlay */}
                {tier !== "free" && (
                  <div
                    className={cn(
                      "absolute inset-0 opacity-10 pointer-events-none bg-[size:100%_4px]",
                      "bg-gradient-to-br from-transparent to-transparent", // Fallback
                      tier === "pro" && "from-blue-500/0 via-blue-500/20",
                      tier === "pro_plus" &&
                        "from-amber-500/0 via-amber-500/20",
                    )}
                  />
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono uppercase tracking-widest px-3 py-1 bg-transparent",
                          tier === "pro"
                            ? "text-blue-400 border-blue-500/30"
                            : tier === "pro_plus"
                              ? "text-amber-400 border-amber-500/30"
                              : "text-white/40 border-white/20",
                        )}
                      >
                        {status === "active"
                          ? "Active"
                          : status === "grace_period"
                            ? "Grace Period"
                            : "Inactive"}
                      </Badge>
                      {daysUntilExpiry !== undefined &&
                        daysUntilExpiry !== null && (
                          <span className="font-mono text-xs text-white/40">
                            Expires in {daysUntilExpiry} days
                          </span>
                        )}
                    </div>
                    <h3 className="text-3xl md:text-5xl font-display font-medium text-white tracking-tight">
                      {getTierDisplayName(tier)}{" "}
                      <span className="text-white/20">Plan</span>
                    </h3>
                    {tier !== "free" && (
                      <div className="flex items-center gap-2 text-sm text-white/60 font-mono">
                        <CreditCard className="w-4 h-4" />
                        <span>Renews on {formatDate(expiresAt as number)}</span>
                      </div>
                    )}
                  </div>

                  {tier !== "free" && (
                    <div className="flex flex-shrink-0">
                      <Button
                        onClick={() => setExtendDialogOpen(true)}
                        className={cn(
                          "font-mono text-xs uppercase tracking-wider h-12 px-8 rounded-lg border bg-transparent hover:bg-white/5 transition-all",
                          tier === "pro"
                            ? "border-blue-500/50 text-blue-400 hover:text-blue-300"
                            : "border-amber-500/50 text-amber-400 hover:text-amber-300",
                        )}
                      >
                        Extend License
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </section>

            {/* Donor Status & CTA */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-white/10 flex-1" />
                <h2 className="font-mono text-xs uppercase tracking-widest text-pink-500/40">
                  Phase 1B // Supporter Status
                </h2>
                <div className="h-px bg-white/10 w-8" />
              </div>

              {profile?.isDonor ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative overflow-hidden rounded-sm border border-pink-500/20 bg-pink-900/5 backdrop-blur-sm p-6 md:p-8"
                >
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[size:100%_4px] bg-gradient-to-br from-pink-500/0 via-pink-500/20 to-transparent" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <span className="font-mono text-xs text-pink-500 uppercase tracking-widest">
                          Distinguished Service
                        </span>
                      </div>
                      <h3 className="text-2xl font-display font-medium text-white">
                        Top Supporter
                      </h3>
                      <p className="text-sm text-pink-200/60 font-mono">
                        Total Contribution:{" "}
                        {formatCurrency(profile.totalDonated || 0)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => setDonateDialogOpen(true)}
                        className="bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 border border-pink-500/30 font-mono text-xs uppercase tracking-widest"
                      >
                        Add Contribution
                      </Button>
                      <div className="p-4 rounded-full bg-pink-500/10 border border-pink-500/20">
                        <Crown className="w-8 h-8 text-pink-400" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  className="group relative overflow-hidden rounded-sm border border-dashed border-pink-500/20 bg-pink-900/5 hover:bg-pink-900/10 transition-all duration-300 p-6 md:p-8"
                >
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-pink-500/70" />
                          <span className="font-mono text-xs text-pink-500/70 uppercase tracking-widest">
                            Volunteer Opportunity
                          </span>
                        </div>
                        <h3 className="text-2xl font-display font-medium text-white">
                          Become a Supporter
                        </h3>
                        <p className="text-sm text-pink-200/60 font-mono max-w-lg">
                          Direct contributions sustain server operations and
                          accelerate feature deployment.
                        </p>
                      </div>

                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          "Exclusive Supporter Badge",
                          "Profile Recognition",
                          "Direct Dev Support",
                        ].map((item, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-xs font-mono text-pink-300/60"
                          >
                            <div className="p-0.5 rounded-full bg-pink-500/20 text-pink-400">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            </div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-shrink-0">
                      <Button
                        onClick={() => setDonateDialogOpen(true)}
                        className="h-12 px-8 bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(219,39,119,0.3)] hover:shadow-[0_0_30px_rgba(219,39,119,0.5)] transition-all"
                      >
                        Initialize Donation
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </section>

            {/* Upgrade Options OR Active Capabilities */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-white/10 flex-1" />
                <h2 className="font-mono text-xs uppercase tracking-widest text-white/40">
                  Phase 2 //{" "}
                  {tier === "free"
                    ? "Upgrade Options"
                    : "Operational Capabilities"}
                </h2>
                <div className="h-px bg-white/10 w-8" />
              </div>

              {tier === "free" && (
                /* FREE USER: Show Upgrade Options */
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Pro Card */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="group relative overflow-hidden rounded-sm border border-blue-500/20 bg-blue-900/5 hover:bg-blue-900/10 transition-all duration-300 p-6 md:p-8"
                  >
                    {/* Decorative corners */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-blue-500/20 group-hover:border-blue-500/40 transition-colors" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-blue-500/20 group-hover:border-blue-500/40 transition-colors" />
                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                      <Crown className="w-12 h-12 text-blue-500" />
                    </div>

                    <div className="space-y-4 relative z-10">
                      <div className="space-y-1">
                        <h3 className="text-xl font-display font-bold text-white tracking-wide">
                          PRO AGENT
                        </h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-mono text-blue-400">
                            ₱99
                          </span>
                          <span className="text-xs text-blue-400/50 uppercase font-mono">
                            / Month
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-3 py-4">
                        {[
                          "Advance AI Access (Hard)",
                          "50 Daily Private Lobbies",
                          "Priority Matchmaking",
                          "50 Saved Replays",
                        ].map((feat, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm text-blue-100/70"
                          >
                            <CheckCircle2 className="w-4 h-4 text-blue-500/50 mt-0.5 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-widest"
                        onClick={() =>
                          navigate({
                            to: "/pricing",
                            search: { donation: undefined },
                          })
                        }
                      >
                        Initialize Upgrade
                      </Button>
                    </div>

                    {/* Tech Corners */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-blue-500/30" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-blue-500/30" />
                  </motion.div>

                  {/* Pro+ Card */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="group relative overflow-hidden rounded-sm border border-amber-500/20 bg-amber-900/5 hover:bg-amber-900/10 transition-all duration-300 p-6 md:p-8"
                  >
                    {/* Decorative corners */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/20 group-hover:border-amber-500/40 transition-colors" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500/20 group-hover:border-amber-500/40 transition-colors" />
                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                      <Star className="w-12 h-12 text-amber-500" />
                    </div>

                    <div className="space-y-4 relative z-10">
                      <div className="space-y-1">
                        <h3 className="text-xl font-display font-bold text-white tracking-wide">
                          ELITE COMMANDER
                        </h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-mono text-amber-400">
                            ₱199
                          </span>
                          <span className="text-xs text-amber-400/50 uppercase font-mono">
                            / Month
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-3 py-4">
                        {[
                          "Everything in PRO",
                          "Unlimited Private Lobbies",
                          "Elite AI Access (Expert)",
                          "100 Saved Replays",
                        ].map((feat, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm text-amber-100/70"
                          >
                            <CheckCircle2 className="w-4 h-4 text-amber-500/50 mt-0.5 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-500 text-black font-mono text-xs uppercase tracking-widest font-bold"
                        onClick={() =>
                          navigate({
                            to: "/pricing",
                            search: { donation: undefined },
                          })
                        }
                      >
                        Initialize Upgrade
                      </Button>
                    </div>

                    {/* Tech Corners */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/30" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500/30" />
                  </motion.div>
                </div>
              )}
              {/* PAID USER: Show Active Capabilities via Feature Grid */}
              {tier !== "free" &&
                (() => {
                  const currentTierData = pricingTiers.find(
                    (t) =>
                      (tier === "pro" && t.name === "Pro") ||
                      (tier === "pro_plus" && t.name === "Pro+"),
                  );

                  if (!currentTierData) return null;

                  return (
                    <div
                      className={cn(
                        "group relative overflow-hidden rounded-sm border p-6 md:p-8 backdrop-blur-sm",
                        tier === "pro"
                          ? "bg-blue-900/5 border-blue-500/10"
                          : "bg-amber-900/5 border-amber-500/10",
                      )}
                    >
                      {/* Decorative corners */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
                      <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-lg border",
                              tier === "pro"
                                ? "bg-blue-500/10 border-blue-500/20"
                                : "bg-amber-500/10 border-amber-500/20",
                            )}
                          >
                            <Zap
                              className={cn(
                                "w-5 h-5",
                                tier === "pro"
                                  ? "text-blue-400"
                                  : "text-amber-400",
                              )}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-display font-medium text-white">
                              Tactical Modules
                            </h3>
                            <p className="text-xs text-white/40 font-mono">
                              ACTIVE_PROTOCOLS:{" "}
                              {currentTierData.features.length}
                            </p>
                          </div>
                        </div>
                        <div className="text-right hidden md:block">
                          <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
                            Authorization Level
                          </div>
                          <div
                            className={cn(
                              "font-bold text-sm uppercase",
                              tier === "pro"
                                ? "text-blue-400"
                                : "text-amber-400",
                            )}
                          >
                            Class {tier === "pro" ? "Officer" : "General"}
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                        {currentTierData.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3 group">
                            <div
                              className={cn(
                                "mt-0.5 p-0.5 rounded-full border opacity-50 group-hover:opacity-100 transition-opacity",
                                tier === "pro"
                                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-400",
                              )}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                            <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors font-light">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/40">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3 h-3" />
                          <span>
                            SYSTEM_STATUS:{" "}
                            <span className="text-green-500">OPERATIONAL</span>
                          </span>
                        </div>
                        <span>
                          LICENSE_ID:{" "}
                          {subscription?._id?.slice(-8).toUpperCase() ||
                            "UNKNOWN"}
                        </span>
                      </div>
                    </div>
                  );
                })()}
            </section>
          </div>

          {/* RIGHT COLUMN: Usage & Logs */}
          <div className="lg:col-span-4 space-y-6">
            {/* Usage Stats Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="group p-6 border border-white/10 bg-white/5 rounded-sm backdrop-blur-md relative overflow-hidden"
            >
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
              {/* Scanline */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-20 pointer-events-none" />

              <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                System Diagnostics
              </h3>

              {usage && (
                <div className="space-y-6">
                  {/* Private Lobbies */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-white/60 font-mono">
                        LOBBY CREATION
                      </span>
                      <span
                        className={cn(
                          "text-xs font-mono",
                          tier === "pro_plus" ? "text-amber-400" : "text-white",
                        )}
                      >
                        {tier === "pro_plus"
                          ? "UNLIMITED"
                          : `${usage.privateLobbiesCreated} / ${tier === "pro" ? 50 : 10}`}
                      </span>
                    </div>
                    {tier !== "pro_plus" && (
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            tier === "pro" ? "bg-blue-500" : "bg-white/50",
                          )}
                          style={{
                            width: `${Math.min(100, (usage.privateLobbiesCreated / (tier === "pro" ? 50 : 10)) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Replays */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-white/60 font-mono">
                        REPLAY STORAGE
                      </span>
                      <span className="text-xs font-mono text-white">
                        {usage.aiReplaysSaved} /{" "}
                        {tier === "pro_plus" ? 100 : tier === "pro" ? 50 : 1}
                      </span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          tier === "pro_plus"
                            ? "bg-amber-500"
                            : tier === "pro"
                              ? "bg-blue-500"
                              : "bg-white/50",
                        )}
                        style={{
                          width: `${Math.min(100, (usage.aiReplaysSaved / (tier === "pro_plus" ? 100 : tier === "pro" ? 50 : 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Notifications Panel */}
            {notifications && notifications.length > 0 && (
              <div className="p-4 border border-amber-500/30 bg-amber-500/10 rounded-sm">
                <div className="flex items-center gap-2 mb-3 text-amber-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-widest">
                    Alerts
                  </span>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className="text-xs text-amber-200/80 font-mono leading-relaxed"
                    >
                      {n.type === "expiry_warning_7d" &&
                        ">> WARNING: License exp. in 7 days."}
                      {n.type === "expiry_warning_3d" &&
                        ">> WARNING: License exp. in 3 days."}
                      {n.type === "expiry_warning_1d" &&
                        ">> URGENT: License exp. tomorrow."}
                      {n.type === "expiry_today" &&
                        ">> CRITICAL: License exp. TODAY."}
                      {n.type === "expired" && ">> ERROR: License Expired."}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simplified History - "Logs" aesthetic */}
            <div className="border-l border-white/10 pl-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
                  Transaction Logs
                </p>
                <span className="text-[9px] text-white/20 font-mono">
                  LAST 10 ENTRIES
                </span>
              </div>

              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="flex justify-between items-start text-xs font-mono"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white/60 flex items-center gap-2">
                        {tx.type === "donation" ? (
                          <Heart className="w-3 h-3 text-pink-500/70" />
                        ) : (
                          <CreditCard className="w-3 h-3 text-blue-500/70" />
                        )}
                        {tx.type === "donation" ? "DONATION_RX" : `LICENSE_UPG`}
                      </span>
                      <span
                        className={cn(
                          "uppercase font-bold tracking-tight",
                          tx.status === "succeeded"
                            ? "text-green-500"
                            : tx.status === "pending"
                              ? "text-amber-500"
                              : "text-red-500",
                        )}
                      >
                        [{tx.status}] {formatCurrency(tx.amount)}
                      </span>
                    </div>
                    <span className="text-white/30">
                      {new Date(tx.createdAt).toLocaleDateString(undefined, {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <span className="text-xs text-white/20 font-mono italic">
                    No transaction data found.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionPaymentModal
        open={extendDialogOpen}
        onOpenChange={setExtendDialogOpen}
        mode="extend"
        onSuccess={() => {}}
      />

      {/* Donation Dialog (Unified) */}
      <DonationPaymentModal
        open={donateDialogOpen}
        onOpenChange={setDonateDialogOpen}
      />

      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-xl border border-green-500/30">
          <DialogHeader>
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <DialogTitle className="text-xl font-display text-white text-center tracking-wide">
              AUTHORIZATION COMPLETE
            </DialogTitle>
            <DialogDescription className="text-white/60 font-mono text-xs text-center">
              License usage rights have been updated.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400/80 font-mono text-xs leading-relaxed text-center">
                {">>"} ALL SYSTEMS NOMINAL.
                <br />
                {">>"} PREMIUM FEATURES UNLOCKED.
                <br />
                {">>"} REPLAY STORAGE EXPANDED.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-green-600 hover:bg-green-500 text-black font-mono text-xs uppercase tracking-widest font-bold"
              onClick={() => setSuccessModalOpen(false)}
            >
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
