"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, X, Heart, ArrowRight, Sparkles, Crown, Star, Gift, BadgeCheck, Zap, CheckCircle2 } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { toast } from "sonner";
import { useConvexAction } from "@convex-dev/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { SubscriptionPaymentModal } from "@/components/subscription/SubscriptionPaymentModal";

const route = getRouteApi("/pricing");


interface PricingPageProps {
  profile: any;
}

interface PricingTier {
  name: string;
  description: string;
  price: string;
  period: string;
  gradient: string;
  borderColor: string;
  accentColor: string;
  features: string[];
  comingSoon?: string[];
  limitations: string[];
  buttonText: string;
  buttonVariant: "outline" | "gradient";
  popular: boolean;
}

// Helper component for "Coming Soon" badge
const ComingSoonBadge = () => (
  <Badge variant="outline" className="ml-2 text-xs border-amber-500/30 bg-amber-500/10 text-amber-400/80">
    <Clock className="w-3 h-3 mr-1" />
    Coming Soon
  </Badge>
);


const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    description: "Perfect for casual players - all core gameplay is free",
    price: "Free",
    period: "forever",
    gradient: "from-gray-600/20 to-gray-800/20",
    borderColor: "border-gray-500/20",
    accentColor: "text-gray-400",
    features: [
      "Full multiplayer gameplay (vs players worldwide)",
      "AI opponents (Easy, Medium difficulty)",
      "Spectator mode (watch live games)",
      "Global chat participation",
      "Basic profile with stats tracking",
      "Access to default setup presets (3 built-in formations)",
      "Basic achievements system",
      "Standard avatar selection (limited set)",
      "Last 1 AI game replay saved",
    ],
    limitations: [
      "Only 2 custom setup presets",
      "10 private lobby matches per day",
      "Basic AI opponents only",
      "Limited avatar customization",
      "No game analysis features",
      "Standard matchmaking priority",
    ],
    buttonText: "Current Plan",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    description: "For dedicated players who want enhanced features",
    price: "₱99",
    period: "month",
    gradient: "from-blue-600/20 to-purple-600/20",
    borderColor: "border-blue-500/30",
    accentColor: "text-blue-400",
    features: [
      "All Free Features",
      "Unlimited custom setup presets",
      "50 private lobby matches per day",
      "Advanced AI opponents (Hard difficulty + custom behaviors)",
      "Enhanced avatar customization (upload custom avatars, premium frames)",
      "Game analysis tools (move history, basic statistics)",
      "Priority matchmaking (faster lobby matching)",
      "Extended chat features (longer messages, custom username colors)",
      "Advanced statistics (detailed win/loss breakdowns, performance metrics)",
      "Custom lobby settings (time limits, spectator limits, custom rules)",
      "Profile customization (custom bio, rank badges, profile themes)",
      "Setup Preset Sharing (share your custom formations with community)",
      "Game Replays (save and replay your last 50 games)",
      "Advanced Achievements (exclusive Pro-tier achievements)",
      "Enhanced Notifications (customizable push notification settings)",
    ],
    limitations: [],
    buttonText: "Upgrade to Pro",
    buttonVariant: "gradient" as const,
    popular: true,
  },
  {
    name: "Pro+",
    description: "For competitive players and content creators",
    price: "₱199",
    period: "month",
    gradient: "from-yellow-500/20 to-orange-600/20",
    borderColor: "border-yellow-500/30",
    accentColor: "text-yellow-400",
    features: [
      "All Pro Features",
      "Unlimited private lobby matches",
      "100 game replays saved",
      "Custom Game Modes (create custom rule variations)",
      "Elite AI Opponents (multiple AI personalities, adaptive difficulty)",
      "Advanced Statistics Dashboard (comprehensive analytics, trends)",
      "Priority Support (faster response times)",
      "Exclusive Elite Achievements (prestigious rewards)",
      "Content Creation Tools (streaming overlays, game highlights)",
      "Advanced Moderation Tools (if you become a community moderator)",
      "Beta Feature Access (early access to new features)",
      "Advanced Analytics (opponent analysis, meta-game insights)",
    ],
    comingSoon: [
      "Tournament Mode (create and join tournaments)",
      "Advanced Game Analysis (AI-powered move suggestions, opening analysis)",
      "Custom Board Themes",
      "Custom Piece Sets",
    ],
    limitations: [],
    buttonText: "Upgrade to Pro+",
    buttonVariant: "gradient" as const,
    popular: false,
  },
];

export function PricingPage({ profile: _profile }: PricingPageProps) {
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [thankYouModalOpen, setThankYouModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"pro" | "pro_plus" | null>(null);

  const search = route.useSearch();

  // Get current subscription status
  const { data: subscription } = useConvexQuery(api.subscriptions.getCurrentSubscription, {});

  // Payment actions
  const createDonation = useConvexAction(api.subscriptions.createPayMongoDonation);

  // Handle donation success query parameter
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
    const tierLower = tier.toLowerCase();
    if (tierLower === "free") {
      toast.info("You are already on the Free tier");
      return;
    }

    const tierValue = tierLower === "pro" ? "pro" : "pro_plus";
    setSelectedTier(tierValue);
    setUpgradeModalOpen(true);
  };

  const handleDonate = async () => {
    const amount = selectedAmount || (customAmount ? parseFloat(customAmount) : null);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid donation amount");
      return;
    }

    try {
      setPaymentProcessing(true);
      
      // Create donation checkout session
      const result = await createDonation({
        amount,
      });

      // Redirect to PayMongo checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.error("Failed to get checkout URL");
        setPaymentProcessing(false);
      }
      
    } catch (error) {
      console.error("Donation error:", error);
      toast.error("Failed to process donation. Please try again.");
      setPaymentProcessing(false);
    }
  };

  const donationAmounts = [50, 100, 200, 500, 1000];

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 md:mb-24"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block mb-6"
          >
            <Badge variant="outline" className="px-4 py-1.5 text-sm border-blue-500/30 bg-blue-500/10 text-blue-300/90 font-light">
              Pricing Plans
            </Badge>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-display font-light text-white mb-6 tracking-tight leading-tight"
          >
            Choose Your
            <br />
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-display font-medium inline-block mt-2"
            >
              Battle Plan
            </motion.span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-lg text-white/70 max-w-3xl mx-auto font-light leading-relaxed mb-4"
          >
            Core gameplay is free for everyone. Upgrade to unlock advanced features and dominate the battlefield.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/50 font-light"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400/60" />
              <span>No credit card required</span>
            </div>
            <div className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400/60" />
              <span>Cancel anytime</span>
            </div>
            <div className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400/60" />
              <span>All core features free</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-20 items-start">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.15,
                ease: "easeOut"
              }}
              className="relative group flex flex-col h-full"
            >
              {tier.popular && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.15 }}
                  className="absolute -top-3 left-0 right-0 flex justify-center z-10"
                >
                  <Badge variant="default" className="px-3 py-1 text-xs font-medium whitespace-nowrap">
                    Most Popular
                  </Badge>
                </motion.div>
              )}
              
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full flex flex-col"
              >
                <Card className={`h-full flex flex-col bg-black/30 backdrop-blur-xl border ${tier.borderColor} ${
                  tier.popular ? 'ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10' : ''
                } transition-all duration-500 hover:border-white/30 hover:bg-black/40 hover:shadow-xl`}>
                  <CardHeader className={`text-center pb-6 flex-shrink-0 ${tier.popular ? 'pt-12' : 'pt-8'}`}>
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
                      >
                        <div className={`w-2 h-2 mx-auto rounded-full bg-gradient-to-r ${tier.gradient} mb-4`} />
                        <CardTitle className={`text-3xl font-display font-light ${tier.accentColor} tracking-wide`}>
                          {tier.name}
                        </CardTitle>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 + index * 0.15 }}
                      >
                        <CardDescription className="text-white/60 text-sm font-light leading-relaxed">
                          {tier.description}
                        </CardDescription>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.8 + index * 0.15 }}
                        className="relative"
                      >
                        <span className="text-5xl font-display font-light text-white">{tier.price}</span>
                        <span className="text-white/40 ml-2 text-sm font-light">/{tier.period}</span>
                        {tier.name !== "Free" && (
                          <div className="mt-2">
                            <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30 font-light">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Save up to 25% with multi-month plans
                            </Badge>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </CardHeader>

                <CardContent className="px-6 md:px-8 pb-4 flex-1 flex flex-col min-h-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 + index * 0.15 }}
                    className="space-y-6 flex-1"
                  >
                    <div>
                      <h4 className="text-white/90 text-xs font-display font-medium uppercase tracking-wider mb-4">Included Features</h4>
                      <ul className="space-y-3">
                        {tier.features.slice(0, 8).map((feature, featureIndex) => (
                          <motion.li 
                            key={featureIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ 
                              duration: 0.4, 
                              delay: 1.2 + index * 0.15 + featureIndex * 0.05 
                            }}
                            className="flex items-start gap-3 text-white/80 text-sm font-light"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400/60 mt-2 flex-shrink-0" />
                            <span className="leading-relaxed flex-1">{feature}</span>
                          </motion.li>
                        ))}
                        {tier.features.length > 8 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 1.6 + index * 0.15 }}
                            className="text-white/50 text-xs font-light pt-2 pl-5"
                          >
                            +{tier.features.length - 8} more features
                          </motion.div>
                        )}
                      </ul>
                    </div>

                    {tier.comingSoon && tier.comingSoon.length > 0 && (
                      <div className="pt-4 border-t border-amber-500/20">
                        <h4 className="text-amber-400/80 text-xs font-display font-medium uppercase tracking-wider mb-4">Coming Soon</h4>
                        <ul className="space-y-3">
                          {tier.comingSoon.map((feature, featureIndex) => (
                            <motion.li 
                              key={featureIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ 
                                duration: 0.4, 
                                delay: 1.4 + index * 0.15 + featureIndex * 0.05 
                              }}
                              className="flex items-start gap-3 text-white/60 text-sm font-light"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40 mt-2 flex-shrink-0" />
                              <span className="leading-relaxed flex items-center">
                                {feature}
                                <ComingSoonBadge />
                              </span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tier.limitations.length > 0 && (
                      <div className="pt-4 border-t border-white/10">
                        <h4 className="text-white/60 text-xs font-display font-medium uppercase tracking-wider mb-4">Limitations</h4>
                        <ul className="space-y-2">
                          {tier.limitations.map((limitation, limitationIndex) => (
                            <motion.li 
                              key={limitationIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ 
                                duration: 0.4, 
                                delay: 1.4 + index * 0.15 + limitationIndex * 0.05 
                              }}
                              className="flex items-start gap-3 text-white/50 text-sm font-light"
                            >
                              <div className="w-1 h-1 rounded-full bg-white/20 mt-2 flex-shrink-0" />
                              <span className="leading-relaxed">{limitation}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                </CardContent>

                <CardFooter className="px-6 md:px-8 pt-0 pb-6 flex-shrink-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 + index * 0.15 }}
                    className="w-full"
                  >
                    {(() => {
                      const currentTier = subscription?.tier || "free";
                      const tierName = tier.name.toLowerCase().replace(" ", "_");
                      const isCurrentTier = 
                        (tierName === "free" && currentTier === "free") ||
                        (tierName === "pro" && currentTier === "pro") ||
                        (tierName === "pro+" && currentTier === "pro_plus");
                      
                      const expiresAt = subscription?.expiresAt;
                      const daysUntilExpiry = expiresAt 
                        ? Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
                        : null;
                      
                      return (
                        <div className="w-full space-y-2">
                          {isCurrentTier && expiresAt && (
                            <div className="text-xs text-white/60 text-center">
                              {daysUntilExpiry !== null && daysUntilExpiry > 0 ? (
                                <span>Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}</span>
                              ) : daysUntilExpiry === 0 ? (
                                <span className="text-amber-400">Expires today</span>
                              ) : (
                                <span className="text-red-400">Expired</span>
                              )}
                            </div>
                          )}
                          <Button
                            variant={tier.buttonVariant}
                            className="w-full h-12 font-light tracking-wide transition-all duration-300 hover:scale-105"
                            onClick={() => {
                              void handleUpgrade(tier.name);
                            }}
                            disabled={tier.name === "Free" || paymentProcessing}
                          >
                            {isCurrentTier ? (
                              "Current Plan"
                            ) : paymentProcessing ? (
                              "Processing..."
                            ) : (
                              <>
                                {tier.buttonText}
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })()}
                  </motion.div>
                </CardFooter>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Discount Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mb-12"
        >
          <Card id="donate" className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-green-500/30">
            <CardContent className="p-6 md:p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <h2 className="text-2xl md:text-3xl font-display font-light text-white">
                    Save More with Multi-Month Plans
                  </h2>
                </div>
                <p className="text-white/60 text-sm font-light max-w-2xl mx-auto">
                  Extend your subscription for longer periods and enjoy significant savings. Discounts are automatically applied when you extend your subscription.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[
                  { months: 3, discount: "15%", savings: "Pay for 2.55 months", pro: "₱252.45", proPlus: "₱507.45" },
                  { months: 6, discount: "20%", savings: "Pay for 4.8 months", pro: "₱475.20", proPlus: "₱955.20" },
                  { months: 12, discount: "25%", savings: "Pay for 9 months", pro: "₱891", proPlus: "₱1,791" },
                ].map((plan, index) => (
                  <motion.div
                    key={plan.months}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-green-500/30 transition-all duration-300"
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          {plan.discount} OFF
                        </Badge>
                      </div>
                      <div className="text-2xl font-display font-light text-white mb-1">
                        {plan.months} Month{plan.months > 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-white/60 font-light mb-3">
                        {plan.savings}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between text-white/80">
                          <span className="font-light">Pro:</span>
                          <span className="font-medium text-green-400">{plan.pro}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/80">
                          <span className="font-light">Pro+:</span>
                          <span className="font-medium text-green-400">{plan.proPlus}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-white/50 text-xs font-light">
                  Discounts are automatically applied when extending your subscription. Visit your subscription page after upgrading to extend and save.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Donate Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-pink-500/30 hover:border-pink-500/50 transition-all duration-500">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                    <Badge variant="outline" className="px-3 py-1 text-xs border-pink-500/40 bg-pink-500/20 text-pink-300/90 font-light">
                      <Heart className="w-3 h-3 mr-1.5 inline" />
                      Support the Game
                    </Badge>
                  </div>
                  
                  <h2 className="text-xl md:text-2xl font-display font-light text-white mb-2">
                    Donate & Get Exclusive Perks
                  </h2>
                  
                  <p className="text-white/60 text-sm font-light leading-relaxed mb-2">
                    Your donations help keep the servers running. Donors receive exclusive perks.
                  </p>
                  
                  <p className="text-white/70 text-sm font-light leading-relaxed mb-4">
                    As a donor, you can request new features or get priority support.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {[
                      { icon: Crown, text: "Donor Frame", color: "text-yellow-400" },
                      { icon: Sparkles, text: "Donor Badge", color: "text-pink-400" },
                      { icon: Star, text: "Custom Color", color: "text-blue-400" },
                      { icon: BadgeCheck, text: "Recognition", color: "text-purple-400" },
                      { icon: Zap, text: "Priority Support", color: "text-amber-400" },
                      { icon: Gift, text: "Early Access", color: "text-green-400" },
                    ].map((perk, index) => (
                      <div key={index} className="flex items-center gap-2 text-white/70">
                        <div className={`${perk.color} flex-shrink-0`}>
                          <perk.icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-light">{perk.text}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="gradient"
                    className="w-full md:w-auto px-6 h-10 text-sm font-light tracking-wide transition-all duration-300 hover:scale-105"
                    onClick={() => setDonateDialogOpen(true)}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Donate Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 flex items-center justify-center border border-pink-500/30">
                    <Heart className="w-10 h-10 md:w-12 md:h-12 text-pink-400/60" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Donation Dialog */}
        <Dialog open={donateDialogOpen} onOpenChange={setDonateDialogOpen}>
          <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-xl border border-white/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-light text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                Support the Game
              </DialogTitle>
              <DialogDescription className="text-white/60 font-light">
                Choose your donation amount. All donors receive exclusive perks and recognition.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {donationAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    className={`px-4 py-3 rounded-lg border transition-all duration-200 font-light ${
                      selectedAmount === amount
                        ? "border-pink-500/50 bg-pink-500/20 text-pink-300"
                        : "border-white/20 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    ₱{amount}
                  </button>
                ))}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-light text-white/70 mb-2">
                  Or enter custom amount
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="₱0"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 font-light"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDonateDialogOpen(false);
                  setSelectedAmount(null);
                  setCustomAmount("");
                }}
                className="font-light"
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={() => {
                  void handleDonate();
                }}
                disabled={!selectedAmount && !customAmount}
                className="font-light"
              >
                <Heart className="w-4 h-4 mr-2" />
                Donate ₱{selectedAmount || customAmount || "0"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Thank You Modal */}
        <Dialog open={thankYouModalOpen} onOpenChange={setThankYouModalOpen}>
          <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-xl border border-pink-500/30">
            <DialogHeader>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/30"
              >
                <CheckCircle2 className="w-8 h-8 text-pink-400" />
              </motion.div>
              <DialogTitle className="text-2xl font-display font-light text-white text-center">
                Thank You for Your Donation!
              </DialogTitle>
              <DialogDescription className="text-white/60 font-light text-center">
                Your generous support helps keep the game running and enables us to continue improving the experience for all players.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4 space-y-3">
                <div className="text-white/80 text-sm font-light">
                  <div className="font-medium text-white mb-2">As a donor, you receive:</div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span>Exclusive Donor Frame</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <span>Donor Badge</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-blue-400" />
                      <span>Custom Username Color</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-purple-400" />
                      <span>Recognition in the Community</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Priority Support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-green-400" />
                      <span>Early Access to New Features</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="gradient"
                onClick={() => setThankYouModalOpen(false)}
                className="w-full font-light"
              >
                <Heart className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-display font-light text-white mb-3">
              Complete Feature Comparison
            </h2>
            <p className="text-sm text-white/50 font-light">
              Compare all features across tiers at a glance
            </p>
          </motion.div>
          
          <div className="mb-4 flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="text-xs border-green-500/30 bg-green-500/10 text-green-400/80">
              ✓ Available
            </Badge>
            <Badge variant="outline" className="text-xs border-amber-500/30 bg-amber-500/10 text-amber-400/80">
              <Clock className="w-3 h-3 mr-1 inline" />
              Coming Soon
            </Badge>
            <Badge variant="outline" className="text-xs border-white/10 bg-white/5 text-white/40">
              <X className="w-3 h-3 mr-1 inline" />
              Not Available
            </Badge>
          </div>
          
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-white/70 min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-6 px-4 font-display font-light text-white/80 sticky left-0 bg-black/20 backdrop-blur-sm">Feature</th>
                  <th className="text-center py-6 px-4 font-display font-light text-white/80">Free</th>
                  <th className="text-center py-6 px-4 font-display font-light text-white/80">Pro</th>
                  <th className="text-center py-6 px-4 font-display font-light text-white/80">Pro+</th>
                </tr>
              </thead>
              <tbody>
                {/* Core Game Features */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-display font-medium text-white/90 text-sm uppercase tracking-wider">
                    Core Game Features
                  </td>
                </tr>
                {[
                  { feature: "Multiplayer Games", free: "✓", pro: "✓", proPlus: "✓" },
                  { feature: "AI Opponents (Easy/Medium)", free: "✓", pro: "✓", proPlus: "✓" },
                  { feature: "AI Opponents (Hard)", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "Custom AI Behaviors", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "Spectator Mode", free: "✓", pro: "✓", proPlus: "✓" },
                  { feature: "AI Game Replays", free: "1 saved", pro: "50 saved", proPlus: "100 saved" },
                  { feature: "Custom Game Modes", free: "—", pro: "—", proPlus: "✓" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light sticky left-0 bg-black/20 backdrop-blur-sm">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.free === "✓" ? "text-green-400" : row.free === "—" ? "text-white/30" : "text-white/70"}>
                        {row.free}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.pro === "✓" ? "text-green-400" : row.pro === "—" ? "text-white/30" : "text-blue-400"}>
                        {row.pro}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.proPlus === "✓" ? "text-green-400" : row.proPlus === "—" ? "text-white/30" : "text-yellow-400"}>
                        {row.proPlus}
                      </span>
                    </td>
                  </motion.tr>
                ))}

                {/* Setup & Customization */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-display font-medium text-white/90 text-sm uppercase tracking-wider">
                    Setup & Customization
                  </td>
                </tr>
                {[
                  { feature: "Default Setup Presets", free: "3 presets", pro: "3 presets", proPlus: "3 presets" },
                  { feature: "Custom Setup Presets", free: "2 presets", pro: "Unlimited", proPlus: "Unlimited" },
                  { feature: "Setup Preset Sharing", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "Custom Avatar Upload", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "Premium Avatar Frames", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "Custom Board Themes", free: "—", pro: "—", proPlus: "Coming Soon" },
                  { feature: "Custom Piece Sets", free: "—", pro: "—", proPlus: "Coming Soon" },
                  { feature: "UI Theme Customization", free: "—", pro: "—", proPlus: "—" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index + 7}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + (index + 7) * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light sticky left-0 bg-black/20 backdrop-blur-sm">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.free === "✓" ? "text-green-400" : row.free === "—" ? "text-white/30" : row.free === "Coming Soon" ? "text-amber-400" : "text-white/70"}>
                        {row.free}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.pro === "✓" ? "text-green-400" : row.pro === "—" ? "text-white/30" : row.pro === "Coming Soon" ? "text-amber-400" : "text-blue-400"}>
                        {row.pro}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.proPlus === "✓" ? "text-green-400" : row.proPlus === "—" ? "text-white/30" : row.proPlus === "Coming Soon" ? "text-amber-400" : "text-yellow-400"}>
                        {row.proPlus}
                      </span>
                    </td>
                  </motion.tr>
                ))}

                {/* Lobby & Social Features */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-display font-medium text-white/90 text-sm uppercase tracking-wider">
                    Lobby & Social Features
                  </td>
                </tr>
                {[
                  { feature: "Public Lobbies", free: "✓", pro: "✓", proPlus: "✓" },
                  { feature: "Private Lobbies", free: "10/day", pro: "50/day", proPlus: "Unlimited" },
                  { feature: "Custom Lobby Settings", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "Spectator Limits", free: "Unlimited", pro: "Custom", proPlus: "Custom" },
                  { feature: "Global Chat", free: "✓", pro: "✓", proPlus: "✓" },
                  { feature: "Extended Chat Features", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "Custom Username Colors", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "Friend Lists", free: "Not Available", pro: "Not Available", proPlus: "Not Available" },
                  { feature: "Custom Chat Rooms", free: "Not Available", pro: "Not Available", proPlus: "Not Available" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index + 15}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + (index + 15) * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light sticky left-0 bg-black/20 backdrop-blur-sm">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.free === "✓" ? "text-green-400" : row.free === "—" ? "text-white/30" : row.free === "Not Available" ? "text-white/20" : "text-white/70"}>
                        {row.free}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.pro === "✓" ? "text-green-400" : row.pro === "—" ? "text-white/30" : row.pro === "Not Available" ? "text-white/20" : "text-blue-400"}>
                        {row.pro}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.proPlus === "✓" ? "text-green-400" : row.proPlus === "—" ? "text-white/30" : row.proPlus === "Not Available" ? "text-white/20" : "text-yellow-400"}>
                        {row.proPlus}
                      </span>
                    </td>
                  </motion.tr>
                ))}

                {/* Analytics & Statistics */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-display font-medium text-white/90 text-sm uppercase tracking-wider">
                    Analytics & Statistics
                  </td>
                </tr>
                {[
                  { feature: "Basic Statistics", free: "✓", pro: "✓", proPlus: "✓" },
                  { feature: "Advanced Statistics", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "Game Analysis Tools", free: "—", pro: "Basic", proPlus: "Advanced" },
                  { feature: "Move History", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "AI Move Suggestions", free: "—", pro: "—", proPlus: "Coming Soon" },
                  { feature: "Opening Analysis", free: "—", pro: "—", proPlus: "Coming Soon" },
                  { feature: "Opponent Analysis", free: "—", pro: "—", proPlus: "✓" },
                  { feature: "Meta-game Insights", free: "—", pro: "—", proPlus: "✓" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index + 24}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + (index + 24) * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light sticky left-0 bg-black/20 backdrop-blur-sm">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.free === "✓" ? "text-green-400" : row.free === "—" ? "text-white/30" : row.free === "Coming Soon" ? "text-amber-400" : "text-white/70"}>
                        {row.free}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.pro === "✓" ? "text-green-400" : row.pro === "—" ? "text-white/30" : row.pro === "Coming Soon" ? "text-amber-400" : "text-blue-400"}>
                        {row.pro}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.proPlus === "✓" ? "text-green-400" : row.proPlus === "—" ? "text-white/30" : row.proPlus === "Coming Soon" ? "text-amber-400" : "text-yellow-400"}>
                        {row.proPlus}
                      </span>
                    </td>
                  </motion.tr>
                ))}

                {/* Tournament & Competitive */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-display font-medium text-white/90 text-sm uppercase tracking-wider">
                    Tournament & Competitive
                  </td>
                </tr>
                {[
                  { feature: "Tournament Mode", free: "—", pro: "—", proPlus: "Coming Soon" },
                  { feature: "Tournament Hosting", free: "—", pro: "—", proPlus: "Coming Soon" },
                  { feature: "Tournament Prizes", free: "—", pro: "—", proPlus: "Coming Soon" },
                  { feature: "Priority Matchmaking", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "Ranked Seasons", free: "—", pro: "—", proPlus: "—" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index + 32}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + (index + 32) * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light sticky left-0 bg-black/20 backdrop-blur-sm">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.free === "✓" ? "text-green-400" : row.free === "—" ? "text-white/30" : row.free === "Coming Soon" ? "text-amber-400" : "text-white/70"}>
                        {row.free}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.pro === "✓" ? "text-green-400" : row.pro === "—" ? "text-white/30" : row.pro === "Coming Soon" ? "text-amber-400" : "text-blue-400"}>
                        {row.pro}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.proPlus === "✓" ? "text-green-400" : row.proPlus === "—" ? "text-white/30" : row.proPlus === "Coming Soon" ? "text-amber-400" : "text-yellow-400"}>
                        {row.proPlus}
                      </span>
                    </td>
                  </motion.tr>
                ))}

                {/* Support & Premium Features */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-display font-medium text-white/90 text-sm uppercase tracking-wider">
                    Support & Premium Features
                  </td>
                </tr>
                {[
                  { feature: "Standard Support", free: "✓", pro: "✓", proPlus: "✓" },
                  { feature: "Priority Support", free: "—", pro: "—", proPlus: "✓" },
                  { feature: "Enhanced Notifications", free: "—", pro: "✓", proPlus: "✓" },
                  { feature: "Beta Feature Access", free: "—", pro: "—", proPlus: "✓" },
                  { feature: "Content Creation Tools", free: "—", pro: "—", proPlus: "✓" },
                  { feature: "Streaming Overlays", free: "—", pro: "—", proPlus: "✓" },
                  { feature: "Advanced Moderation Tools", free: "—", pro: "—", proPlus: "✓" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index + 37}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + (index + 37) * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light sticky left-0 bg-black/20 backdrop-blur-sm">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.free === "✓" ? "text-green-400" : row.free === "—" ? "text-white/30" : "text-white/70"}>
                        {row.free}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.pro === "✓" ? "text-green-400" : row.pro === "—" ? "text-white/30" : "text-blue-400"}>
                        {row.pro}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.proPlus === "✓" ? "text-green-400" : row.proPlus === "—" ? "text-white/30" : "text-yellow-400"}>
                        {row.proPlus}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-2xl md:text-3xl font-display font-light text-white mb-12"
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                question: "Can I cancel anytime?",
                answer: "Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period."
              },
              {
                question: "Do you offer annual discounts?",
                answer: "Yes! Annual subscriptions come with a 20% discount. Save money while enjoying uninterrupted gameplay."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and other secure payment methods through our payment processor."
              },
              {
                question: "Can I upgrade or downgrade my plan?",
                answer: "Absolutely! You can upgrade or downgrade your subscription at any time. Changes take effect immediately."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                <h3 className="text-white font-light mb-3 text-left">{faq.question}</h3>
                <p className="text-white/60 text-sm font-light leading-relaxed text-left">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Upgrade Subscription Modal */}
        {selectedTier && (
          <SubscriptionPaymentModal
            open={upgradeModalOpen}
            onOpenChange={(open) => {
              setUpgradeModalOpen(open);
              if (!open) setSelectedTier(null);
            }}
            mode="upgrade"
            tier={selectedTier}
            onSuccess={() => {
              toast.success("Redirecting to checkout...");
            }}
          />
        )}
      </div>
    </div>
  );
}
