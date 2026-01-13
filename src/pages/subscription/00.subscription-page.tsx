"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Clock, Crown, Zap, ArrowRight, Calendar, CreditCard, History, Heart, Sparkles, CheckCircle2, Infinity, Star, Gift, Users, Gamepad2, BarChart3, TrendingUp } from "lucide-react";
import { SubscriptionPaymentModal } from "@/components/subscription/SubscriptionPaymentModal";
import { useSearch } from "@tanstack/react-router";

export function SubscriptionPage() {
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const search = useSearch({ from: "/subscription" });

  // Get subscription data
  const { data: subscription } = useConvexQuery(api.subscriptions.getCurrentSubscription, {});
  const { data: usage } = useConvexQuery(api.subscriptions.getSubscriptionUsage, {});
  const { data: paymentHistory } = useConvexQuery(api.subscriptions.getPaymentHistory, {
    paginationOpts: { numItems: 10 },
  });
  const { data: donationHistory } = useConvexQuery(api.subscriptions.getDonationHistory, {
    paginationOpts: { numItems: 10 },
  });
  const { data: notifications } = useConvexQuery(api.subscriptions.getExpiryNotifications, {});
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile, {});

  const tier = subscription?.tier || "free";
  const status = subscription?.status || "active";
  const expiresAt = subscription?.expiresAt;
  const daysUntilExpiry = subscription?.daysUntilExpiry;

  // Handle subscription success query parameter
  useEffect(() => {
    if (search.subscription === "success") {
      setSuccessModalOpen(true);
      // Clean up URL by removing query parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("subscription");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [search.subscription]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case "grace_period":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Grace Period</Badge>;
      case "expired":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>;
      case "canceled":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Canceled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-light text-white mb-2">
            Subscription Management
          </h1>
          <p className="text-white/60 font-light">
            Manage your subscription and view usage statistics
          </p>
        </motion.div>

        {/* Free Tier Upgrade Section */}
        {tier === "free" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-6 mb-8"
          >
            {/* Upgrade Header */}
            <div className="text-center">
              <Badge className="px-4 py-1.5 text-sm border-blue-500/30 bg-blue-500/10 text-blue-300/90 font-light mb-4">
                <Sparkles className="w-3 h-3 mr-1.5 inline" />
                Unlock Premium Features
              </Badge>
              <h2 className="text-2xl md:text-3xl font-display font-light text-white mb-3">
                Ready to Level Up?
              </h2>
              <p className="text-white/60 font-light max-w-2xl mx-auto">
                Upgrade to Pro or Pro+ to unlock unlimited presets, advanced AI opponents, priority matchmaking, and much more.
              </p>
            </div>

            {/* Upgrade Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pro Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="h-full bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-blue-500/10 backdrop-blur-xl border border-blue-500/30 hover:border-blue-500/50 transition-all duration-500">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-2xl font-display font-light text-white flex items-center gap-2">
                        <Crown className="w-5 h-5 text-blue-400" />
                        Pro Plan
                      </CardTitle>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Most Popular</Badge>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-display font-light text-white">₱99</span>
                      <span className="text-white/40 text-sm font-light">/month</span>
                    </div>
                    <CardDescription className="text-white/70 font-light">
                      Perfect for dedicated players who want enhanced features
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {[
                        "Unlimited custom setup presets",
                        "50 private lobby matches per day",
                        "Advanced AI opponents (Hard difficulty)",
                        "Enhanced avatar customization",
                        "Game analysis tools",
                        "Priority matchmaking",
                        "50 game replays saved",
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-white/80 text-sm font-light">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="gradient"
                      className="w-full mt-4"
                      onClick={() => {
                        window.location.href = "/pricing";
                      }}
                    >
                      Upgrade to Pro
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pro+ Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="h-full bg-gradient-to-br from-yellow-500/20 via-orange-600/20 to-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-500">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-2xl font-display font-light text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        Pro+ Plan
                      </CardTitle>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Premium</Badge>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-display font-light text-white">₱199</span>
                      <span className="text-white/40 text-sm font-light">/month</span>
                    </div>
                    <CardDescription className="text-white/70 font-light">
                      For competitive players and content creators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {[
                        "All Pro Features",
                        <span key="unlimited" className="flex items-center gap-1">
                          <Infinity className="w-3 h-3" />
                          Unlimited private lobbies
                        </span>,
                        "100 game replays saved",
                        "Custom Game Modes",
                        "Elite AI Opponents",
                        "Advanced Statistics Dashboard",
                        "Priority Support",
                        "Beta Feature Access",
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 text-white/80 text-sm font-light">
                          <CheckCircle2 className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span>{typeof feature === "string" ? feature : feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="gradient"
                      className="w-full mt-4"
                      onClick={() => {
                        window.location.href = "/pricing";
                      }}
                    >
                      Upgrade to Pro+
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Current Subscription Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={tier === "free" 
            ? "bg-gradient-to-br from-gray-600/20 via-gray-700/20 to-gray-800/20 backdrop-blur-xl border border-gray-500/30"
            : tier === "pro"
            ? "relative overflow-hidden bg-gradient-to-br from-blue-600/30 via-indigo-600/25 to-purple-600/30 backdrop-blur-xl border border-blue-400/40 shadow-lg shadow-blue-500/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/10 before:via-transparent before:to-purple-500/10 before:pointer-events-none"
            : "relative overflow-hidden bg-gradient-to-br from-amber-500/30 via-orange-500/25 to-yellow-500/30 backdrop-blur-xl border border-amber-400/40 shadow-lg shadow-amber-500/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-amber-500/10 before:via-transparent before:to-yellow-500/10 before:pointer-events-none"
          }>
            {tier !== "free" && (
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            )}
            <CardHeader className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {tier === "free" ? (
                      <div className="p-2 rounded-lg bg-gray-500/20 border border-gray-500/30">
                        <Gamepad2 className="w-6 h-6 text-gray-400" />
                      </div>
                    ) : tier === "pro" ? (
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-400/50 shadow-lg relative overflow-hidden group hover:border-blue-300/60 transition-all duration-300">
                        <Crown className="w-6 h-6 text-blue-300 group-hover:text-blue-200 transition-colors duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/30 to-yellow-500/30 border border-amber-400/50 shadow-lg relative overflow-hidden group hover:border-amber-300/60 transition-all duration-300">
                        <Star className="w-6 h-6 text-yellow-300 group-hover:text-yellow-200 transition-colors duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-3xl font-display font-light text-white flex items-center gap-2">
                        {getTierDisplayName(tier)} Plan
                        {tier === "pro" && (
                          <Badge className="ml-2 bg-blue-500/30 text-blue-200 border-blue-400/50 text-xs px-2 py-0.5">
                            Most Popular
                          </Badge>
                        )}
                        {tier === "pro_plus" && (
                          <Badge className="ml-2 bg-gradient-to-r from-amber-500/40 to-yellow-500/40 text-yellow-200 border-amber-400/50 text-xs px-2 py-0.5">
                            Premium
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="mt-1">
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </div>
                  {tier !== "free" && (
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className={`text-5xl font-display font-light ${tier === "pro" ? "text-blue-200" : "text-yellow-200"}`}>
                        ₱{tier === "pro" ? "99" : "199"}
                      </span>
                      <span className="text-white/50 text-sm font-light">/month</span>
                    </div>
                  )}
                </div>
                {tier === "free" && (
                  <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                    Forever Free
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative">
              {/* Premium Features Highlight (for paid tiers) */}
              {tier !== "free" && (
                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className={`w-5 h-5 ${tier === "pro" ? "text-blue-400" : "text-yellow-400"}`} />
                    <h3 className="text-lg font-display font-light text-white">Premium Benefits</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(tier === "pro" ? [
                      { icon: Infinity, text: "Unlimited presets", color: "text-blue-400" },
                      { icon: Zap, text: "Priority matchmaking", color: "text-purple-400" },
                      { icon: BarChart3, text: "Game analysis tools", color: "text-pink-400" },
                      { icon: Crown, text: "Advanced AI opponents", color: "text-blue-300" },
                    ] : [
                      { icon: Infinity, text: "Unlimited everything", color: "text-yellow-400" },
                      { icon: Star, text: "Elite AI opponents", color: "text-amber-400" },
                      { icon: TrendingUp, text: "Advanced analytics", color: "text-orange-400" },
                      { icon: Gift, text: "Beta feature access", color: "text-yellow-300" },
                    ]).map((benefit, index) => {
                      const IconComponent = benefit.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + index * 0.05 }}
                          className="flex items-center gap-2 text-white/90 text-sm font-light bg-white/5 rounded-lg p-2 border border-white/10"
                        >
                          <IconComponent className={`w-4 h-4 ${benefit.color} flex-shrink-0`} />
                          <span>{benefit.text}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Donor Status (if user is a donor) */}
              {profile?.isDonor && (
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-pink-500/10 border-pink-400/30">
                  <div className="p-2 rounded-lg bg-pink-500/20">
                    <Heart className="w-5 h-5 text-pink-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-xs font-light text-white/60">Donor Status</div>
                      <Badge className="bg-pink-500/20 text-pink-300 border-pink-400/30 text-xs px-2 py-0.5">
                        <Crown className="w-3 h-3 mr-1 inline" />
                        Donor
                      </Badge>
                    </div>
                    <div className="font-medium text-white">
                      Total Donated: {formatCurrency(profile.totalDonated || 0)}
                    </div>
                  </div>
                </div>
              )}

              {/* Expiry Information (for paid tiers) */}
              {expiresAt && (
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${tier === "pro" ? "bg-blue-500/10 border-blue-400/30" : "bg-amber-500/10 border-amber-400/30"}`}>
                  <div className={`p-2 rounded-lg ${tier === "pro" ? "bg-blue-500/20" : "bg-amber-500/20"}`}>
                    <Calendar className={`w-5 h-5 ${tier === "pro" ? "text-blue-300" : "text-yellow-300"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-light text-white/60 mb-1">Subscription Expires</div>
                    <div className="font-medium text-white">
                      {formatDate(expiresAt)}
                      {daysUntilExpiry !== null && daysUntilExpiry !== undefined && daysUntilExpiry > 0 && (
                        <span className={`ml-2 text-sm font-light ${tier === "pro" ? "text-blue-300/80" : "text-yellow-300/80"}`}>
                          ({daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""} remaining)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status Warnings */}
              {status === "grace_period" && (
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Grace Period Active</span>
                  </div>
                  <p className="text-amber-300/80 text-sm mt-2 font-light">
                    Your subscription has expired but you're still in the 2-day grace period. 
                    Renew now to continue access to premium features.
                  </p>
                </div>
              )}

              {status === "expired" && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Subscription Expired</span>
                  </div>
                  <p className="text-red-300/80 text-sm mt-2 font-light">
                    Your subscription has expired. Renew now to restore access to premium features.
                  </p>
                </div>
              )}

              {/* Usage Statistics - Merged into card */}
              {usage && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <Zap className={`w-5 h-5 ${tier === "pro" ? "text-blue-400" : tier === "pro_plus" ? "text-yellow-400" : "text-blue-400"}`} />
                    <h3 className="text-lg font-display font-light text-white">Today's Usage</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`rounded-lg p-4 border ${
                        tier === "pro" 
                          ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-400/30" 
                          : tier === "pro_plus"
                          ? "bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-400/30"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-1.5 rounded ${tier === "pro" ? "bg-blue-500/20" : tier === "pro_plus" ? "bg-amber-500/20" : "bg-white/10"}`}>
                          <Users className={`w-4 h-4 ${tier === "pro" ? "text-blue-300" : tier === "pro_plus" ? "text-yellow-300" : "text-blue-400"}`} />
                        </div>
                        <div className="text-sm font-light text-white/70">Private Lobbies</div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-display font-light ${tier === "pro" ? "text-blue-200" : tier === "pro_plus" ? "text-yellow-200" : "text-white"}`}>
                          {usage.privateLobbiesCreated}
                        </span>
                        <span className="text-white/50 text-sm font-light">
                          {tier === "free" && "/ 10"}
                          {tier === "pro" && "/ 50"}
                          {tier === "pro_plus" && (
                            <span className="flex items-center gap-1">
                              <Infinity className="w-3 h-3" />
                              Unlimited
                            </span>
                          )}
                        </span>
                      </div>
                      {tier === "free" && (
                        <div className="text-xs text-white/50 font-light mt-2">
                          {10 - usage.privateLobbiesCreated} remaining today
                        </div>
                      )}
                      {tier !== "free" && (
                        <div className={`text-xs font-light mt-2 ${tier === "pro" ? "text-blue-300/70" : "text-yellow-300/70"}`}>
                          {tier === "pro" && `${50 - usage.privateLobbiesCreated} remaining today`}
                          {tier === "pro_plus" && "No limits"}
                        </div>
                      )}
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`rounded-lg p-4 border ${
                        tier === "pro" 
                          ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/30" 
                          : tier === "pro_plus"
                          ? "bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-400/30"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-1.5 rounded ${tier === "pro" ? "bg-purple-500/20" : tier === "pro_plus" ? "bg-orange-500/20" : "bg-white/10"}`}>
                          <BarChart3 className={`w-4 h-4 ${tier === "pro" ? "text-purple-300" : tier === "pro_plus" ? "text-orange-300" : "text-purple-400"}`} />
                        </div>
                        <div className="text-sm font-light text-white/70">AI Replays Saved</div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-display font-light ${tier === "pro" ? "text-purple-200" : tier === "pro_plus" ? "text-orange-200" : "text-white"}`}>
                          {usage.aiReplaysSaved}
                        </span>
                        <span className="text-white/50 text-sm font-light">
                          {tier === "free" && "/ 1"}
                          {tier === "pro" && "/ 50"}
                          {tier === "pro_plus" && "/ 100"}
                        </span>
                      </div>
                      {tier === "free" && (
                        <div className="text-xs text-white/50 font-light mt-2">
                          {usage.aiReplaysSaved >= 1 ? "Limit reached" : "1 replay available"}
                        </div>
                      )}
                      {tier !== "free" && (
                        <div className={`text-xs font-light mt-2 ${tier === "pro" ? "text-purple-300/70" : "text-orange-300/70"}`}>
                          {tier === "pro" && `${50 - usage.aiReplaysSaved} slots remaining`}
                          {tier === "pro_plus" && `${100 - usage.aiReplaysSaved} slots remaining`}
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Free Tier Benefits Section */}
              {tier === "free" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-display font-light text-white">What's Included</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { icon: Users, text: "Full multiplayer gameplay", color: "text-blue-400" },
                      { icon: Gamepad2, text: "AI opponents (Easy, Medium)", color: "text-purple-400" },
                      { icon: BarChart3, text: "Basic profile & stats", color: "text-pink-400" },
                      { icon: TrendingUp, text: "2 custom setup presets", color: "text-blue-400" },
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-white/80 text-sm font-light">
                        <benefit.icon className={`w-4 h-4 ${benefit.color} flex-shrink-0`} />
                        <span>{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="gradient"
                      className="w-full"
                      onClick={() => {
                        window.location.href = "/pricing";
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upgrade to Unlock More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Extend Button (for paid tiers) */}
              {tier !== "free" && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="gradient"
                    className={`w-full h-12 text-base font-light ${
                      tier === "pro" 
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400" 
                        : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                    } shadow-lg`}
                    onClick={() => setExtendDialogOpen(true)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Extend Subscription
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expiry Notifications */}
        {notifications && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-xl font-display font-light text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/30"
                    >
                      <div className="text-sm font-light text-amber-300">
                        {notification.type === "expiry_warning_7d" && "Your subscription expires in 7 days"}
                        {notification.type === "expiry_warning_3d" && "Your subscription expires in 3 days"}
                        {notification.type === "expiry_warning_1d" && "Your subscription expires tomorrow"}
                        {notification.type === "expiry_today" && "Your subscription expires today"}
                        {notification.type === "expired" && "Your subscription has expired"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Payment History */}
        {paymentHistory && paymentHistory.page && paymentHistory.page.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-display font-light text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentHistory.page.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div>
                        <div className="font-medium text-white">
                          {getTierDisplayName(payment.tier)} - {payment.months} month{payment.months > 1 ? "s" : ""}
                        </div>
                        <div className="text-sm font-light text-white/60">
                          {formatDate(payment.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">{formatCurrency(payment.amount)}</div>
                        <Badge
                          className={
                            payment.status === "succeeded"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : payment.status === "pending"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Donation History */}
        {donationHistory && donationHistory.page && donationHistory.page.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-display font-light text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  Donation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {donationHistory.page.map((donation) => (
                    <div
                      key={donation._id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div>
                        <div className="font-medium text-white">
                          Donation
                          {donation.donorPerks && donation.donorPerks.length > 0 && (
                            <span className="ml-2 text-sm font-light text-pink-400">
                              ({donation.donorPerks.join(", ")})
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-light text-white/60">
                          {formatDate(donation.createdAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">{formatCurrency(donation.amount)}</div>
                        <Badge
                          className={
                            donation.status === "succeeded"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : donation.status === "pending"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }
                        >
                          {donation.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Extend Subscription Modal */}
        <SubscriptionPaymentModal
          open={extendDialogOpen}
          onOpenChange={setExtendDialogOpen}
          mode="extend"
          onSuccess={() => {
            // Subscription extended successfully
          }}
        />

        {/* Thank You Modal */}
        <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
          <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-xl border border-green-500/30">
            <DialogHeader>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30"
              >
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </motion.div>
              <DialogTitle className="text-2xl font-display font-light text-white text-center">
                Thank You for Your Purchase!
              </DialogTitle>
              <DialogDescription className="text-white/60 font-light text-center">
                Your subscription has been successfully activated. You now have access to all premium features.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                <div className="text-white/80 text-sm font-light">
                  <div className="font-medium text-white mb-2">What's Next:</div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span>Enjoy all premium features immediately</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span>Unlimited custom setup presets</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>Priority matchmaking and advanced AI</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-pink-400" />
                      <span>Access to game analysis tools</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="gradient"
                onClick={() => setSuccessModalOpen(false)}
                className="w-full font-light"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
