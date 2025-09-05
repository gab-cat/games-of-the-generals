"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
interface PricingPageProps {
  profile: any;
}

const pricingTiers = [
  {
    name: "Recruit",
    description: "Perfect for casual players and newcomers",
    price: "Free",
    period: "forever",
    gradient: "from-gray-600/20 to-gray-800/20",
    borderColor: "border-gray-500/20",
    accentColor: "text-gray-400",
    features: [
      "Full access to all game modes (vs AI, multiplayer, spectating)",
      "Basic AI opponents (Easy, Medium difficulty)",
      "Standard game lobbies (public only)",
      "Global chat participation",
      "Basic profile with stats tracking",
      "Access to default setup presets (3 built-in formations)",
      "Basic achievements system",
      "Standard avatar selection (limited set)",
    ],
    limitations: [
      "Only 2 custom setup presets",
      "No private lobbies",
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
    name: "Officer",
    description: "For dedicated players who want enhanced features",
    price: "$4.99",
    period: "month",
    gradient: "from-blue-600/20 to-purple-600/20",
    borderColor: "border-blue-500/30",
    accentColor: "text-blue-400",
    features: [
      "All Free Features",
      "Unlimited custom setup presets",
      "Private lobbies with custom settings",
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
    name: "General",
    description: "For competitive players and content creators",
    price: "$9.99",
    period: "month",
    gradient: "from-yellow-500/20 to-orange-600/20",
    borderColor: "border-yellow-500/30",
    accentColor: "text-yellow-400",
    features: [
      "All Pro Features",
      "Tournament Mode (create and join tournaments)",
      "Advanced Game Analysis (AI-powered move suggestions, opening analysis)",
      "Unlimited Game Replays (save all your games forever)",
      "Custom Game Modes (create custom rule variations)",
      "Elite AI Opponents (multiple AI personalities, adaptive difficulty)",
      "Advanced Statistics Dashboard (comprehensive analytics, trends)",
      "Priority Support (faster response times)",
      "Exclusive Elite Achievements (prestigious rewards)",
      "Custom Themes (board themes, piece designs, UI themes)",
      "Advanced Social Features (friend lists, custom chat rooms)",
      "Tournament Hosting (create public tournaments with prizes)",
      "Content Creation Tools (streaming overlays, game highlights)",
      "Advanced Moderation Tools (if you become a community moderator)",
      "Beta Feature Access (early access to new features)",
      "Custom Piece Sets (themed piece designs)",
      "Advanced Analytics (opponent analysis, meta-game insights)",
    ],
    limitations: [],
    buttonText: "Upgrade to Elite",
    buttonVariant: "gradient" as const,
    popular: false,
  },
];

export function PricingPage({ profile: _profile }: PricingPageProps) {
  const handleUpgrade = (tier: string) => {
    // TODO: Implement subscription upgrade logic
    console.log(`Upgrading to ${tier} tier`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-light text-white mb-8 tracking-tight"
          >
            Choose Your
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-medium"
            >
              {" "}Battle Plan
            </motion.span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl text-white/60 max-w-2xl mx-auto font-light"
          >
            Unlock advanced features and dominate the battlefield
          </motion.p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
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
              className="relative group"
            >
              {tier.popular && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.15 }}
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10"
                >
                  <Badge variant="default" className="px-3 py-1 text-xs font-medium">
                    Most Popular
                  </Badge>
                </motion.div>
              )}
              
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full"
              >
                <Card className={`h-full bg-black/30 backdrop-blur-xl border ${tier.borderColor} ${
                  tier.popular ? 'ring-1 ring-blue-500/30' : ''
                } transition-all duration-500 hover:border-white/20 hover:bg-black/40`}>
                  <CardHeader className="text-center pb-6 pt-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
                      className="mb-6"
                    >
                      <div className={`w-2 h-2 mx-auto rounded-full bg-gradient-to-r ${tier.gradient} mb-4`} />
                      <CardTitle className={`text-3xl font-light ${tier.accentColor} tracking-wide`}>
                        {tier.name}
                      </CardTitle>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 + index * 0.15 }}
                      className="mb-6"
                    >
                      <CardDescription className="text-white/60 text-sm font-light leading-relaxed">
                        {tier.description}
                      </CardDescription>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.8 + index * 0.15 }}
                      className="mb-2"
                    >
                      <span className="text-5xl font-light text-white">{tier.price}</span>
                      <span className="text-white/40 ml-2 text-sm font-light">/{tier.period}</span>
                    </motion.div>
                  </CardHeader>

                <CardContent className="px-8 pb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 + index * 0.15 }}
                    className="space-y-6"
                  >
                    <div>
                      <ul className="space-y-3">
                        {tier.features.slice(0, 6).map((feature, featureIndex) => (
                          <motion.li 
                            key={featureIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ 
                              duration: 0.4, 
                              delay: 1.2 + index * 0.15 + featureIndex * 0.05 
                            }}
                            className="flex items-start gap-3 text-white/70 text-sm font-light"
                          >
                            <div className="w-1 h-1 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                            <span className="leading-relaxed">{feature}</span>
                          </motion.li>
                        ))}
                        {tier.features.length > 6 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 1.5 + index * 0.15 }}
                            className="text-white/50 text-xs font-light pt-2"
                          >
                            +{tier.features.length - 6} more features
                          </motion.div>
                        )}
                      </ul>
                    </div>

                    {tier.limitations.length > 0 && (
                      <div className="pt-4 border-t border-white/10">
                        <ul className="space-y-2">
                          {tier.limitations.slice(0, 3).map((limitation, limitationIndex) => (
                            <motion.li 
                              key={limitationIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ 
                                duration: 0.4, 
                                delay: 1.4 + index * 0.15 + limitationIndex * 0.05 
                              }}
                              className="flex items-start gap-3 text-white/40 text-sm font-light"
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

                <CardFooter className="px-8 pb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.6 + index * 0.15 }}
                    className="w-full"
                  >
                    <Button
                      variant={tier.buttonVariant}
                      className="w-full h-12 font-light tracking-wide transition-all duration-300 hover:scale-105"
                      onClick={() => handleUpgrade(tier.name)}
                      disabled={tier.name === "Recruit"}
                    >
                      {tier.buttonText}
                    </Button>
                  </motion.div>
                </CardFooter>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-2xl font-light text-white text-center mb-12"
          >
            Complete Feature Comparison
          </motion.h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-white/70">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-6 px-4 font-light text-white/80">Feature</th>
                  <th className="text-center py-6 px-4 font-light text-white/80">Recruit</th>
                  <th className="text-center py-6 px-4 font-light text-white/80">Officer</th>
                  <th className="text-center py-6 px-4 font-light text-white/80">General</th>
                </tr>
              </thead>
              <tbody>
                {/* Core Game Features */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-medium text-white/90 text-sm uppercase tracking-wider">
                    Core Game Features
                  </td>
                </tr>
                {[
                  { feature: "Multiplayer Games", recruit: "✓", officer: "✓", general: "✓" },
                  { feature: "AI Opponents (Easy/Medium)", recruit: "✓", officer: "✓", general: "✓" },
                  { feature: "AI Opponents (Hard)", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Custom AI Behaviors", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Spectator Mode", recruit: "✓", officer: "✓", general: "✓" },
                  { feature: "Game Replays", recruit: "—", officer: "50 games", general: "Unlimited" },
                  { feature: "Custom Game Modes", recruit: "—", officer: "—", general: "✓" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.recruit === "✓" ? "text-green-400" : row.recruit === "—" ? "text-white/30" : "text-white/70"}>
                        {row.recruit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.officer === "✓" ? "text-green-400" : row.officer === "—" ? "text-white/30" : "text-blue-400"}>
                        {row.officer}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.general === "✓" ? "text-green-400" : row.general === "—" ? "text-white/30" : "text-yellow-400"}>
                        {row.general}
                      </span>
                    </td>
                  </motion.tr>
                ))}

                {/* Setup & Customization */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-medium text-white/90 text-sm uppercase tracking-wider">
                    Setup & Customization
                  </td>
                </tr>
                {[
                  { feature: "Default Setup Presets", recruit: "3 presets", officer: "3 presets", general: "3 presets" },
                  { feature: "Custom Setup Presets", recruit: "2 presets", officer: "Unlimited", general: "Unlimited" },
                  { feature: "Setup Preset Sharing", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Custom Avatar Upload", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Premium Avatar Frames", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Custom Board Themes", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Custom Piece Sets", recruit: "—", officer: "—", general: "✓" },
                  { feature: "UI Theme Customization", recruit: "—", officer: "—", general: "✓" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index + 7}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + (index + 7) * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.recruit === "✓" ? "text-green-400" : row.recruit === "—" ? "text-white/30" : "text-white/70"}>
                        {row.recruit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.officer === "✓" ? "text-green-400" : row.officer === "—" ? "text-white/30" : "text-blue-400"}>
                        {row.officer}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.general === "✓" ? "text-green-400" : row.general === "—" ? "text-white/30" : "text-yellow-400"}>
                        {row.general}
                      </span>
                    </td>
                  </motion.tr>
                ))}

                {/* Lobby & Social Features */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-medium text-white/90 text-sm uppercase tracking-wider">
                    Lobby & Social Features
                  </td>
                </tr>
                {[
                  { feature: "Public Lobbies", recruit: "✓", officer: "✓", general: "✓" },
                  { feature: "Private Lobbies", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Custom Lobby Settings", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Spectator Limits", recruit: "Unlimited", officer: "Custom", general: "Custom" },
                  { feature: "Global Chat", recruit: "✓", officer: "✓", general: "✓" },
                  { feature: "Extended Chat Features", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Custom Username Colors", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Friend Lists", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Custom Chat Rooms", recruit: "—", officer: "—", general: "✓" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index + 15}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + (index + 15) * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.recruit === "✓" ? "text-green-400" : row.recruit === "—" ? "text-white/30" : "text-white/70"}>
                        {row.recruit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.officer === "✓" ? "text-green-400" : row.officer === "—" ? "text-white/30" : "text-blue-400"}>
                        {row.officer}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.general === "✓" ? "text-green-400" : row.general === "—" ? "text-white/30" : "text-yellow-400"}>
                        {row.general}
                      </span>
                    </td>
                  </motion.tr>
                ))}

                {/* Analytics & Statistics */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-medium text-white/90 text-sm uppercase tracking-wider">
                    Analytics & Statistics
                  </td>
                </tr>
                {[
                  { feature: "Basic Statistics", recruit: "✓", officer: "✓", general: "✓" },
                  { feature: "Advanced Statistics", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Game Analysis Tools", recruit: "—", officer: "Basic", general: "Advanced" },
                  { feature: "Move History", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "AI Move Suggestions", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Opening Analysis", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Opponent Analysis", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Meta-game Insights", recruit: "—", officer: "—", general: "✓" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index + 24}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + (index + 24) * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.recruit === "✓" ? "text-green-400" : row.recruit === "—" ? "text-white/30" : "text-white/70"}>
                        {row.recruit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.officer === "✓" ? "text-green-400" : row.officer === "—" ? "text-white/30" : "text-blue-400"}>
                        {row.officer}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.general === "✓" ? "text-green-400" : row.general === "—" ? "text-white/30" : "text-yellow-400"}>
                        {row.general}
                      </span>
                    </td>
                  </motion.tr>
                ))}

                {/* Tournament & Competitive */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-medium text-white/90 text-sm uppercase tracking-wider">
                    Tournament & Competitive
                  </td>
                </tr>
                {[
                  { feature: "Tournament Mode", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Tournament Hosting", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Tournament Prizes", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Priority Matchmaking", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Ranked Seasons", recruit: "—", officer: "—", general: "✓" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index + 32}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + (index + 32) * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.recruit === "✓" ? "text-green-400" : row.recruit === "—" ? "text-white/30" : "text-white/70"}>
                        {row.recruit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.officer === "✓" ? "text-green-400" : row.officer === "—" ? "text-white/30" : "text-blue-400"}>
                        {row.officer}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.general === "✓" ? "text-green-400" : row.general === "—" ? "text-white/30" : "text-yellow-400"}>
                        {row.general}
                      </span>
                    </td>
                  </motion.tr>
                ))}

                {/* Support & Premium Features */}
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="py-4 px-4 font-medium text-white/90 text-sm uppercase tracking-wider">
                    Support & Premium Features
                  </td>
                </tr>
                {[
                  { feature: "Standard Support", recruit: "✓", officer: "✓", general: "✓" },
                  { feature: "Priority Support", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Enhanced Notifications", recruit: "—", officer: "✓", general: "✓" },
                  { feature: "Beta Feature Access", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Content Creation Tools", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Streaming Overlays", recruit: "—", officer: "—", general: "✓" },
                  { feature: "Advanced Moderation Tools", recruit: "—", officer: "—", general: "✓" },
                ].map((row, index) => (
                  <motion.tr 
                    key={index + 37}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 + (index + 37) * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 font-light">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.recruit === "✓" ? "text-green-400" : row.recruit === "—" ? "text-white/30" : "text-white/70"}>
                        {row.recruit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.officer === "✓" ? "text-green-400" : row.officer === "—" ? "text-white/30" : "text-blue-400"}>
                        {row.officer}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-light">
                      <span className={row.general === "✓" ? "text-green-400" : row.general === "—" ? "text-white/30" : "text-yellow-400"}>
                        {row.general}
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
            className="text-2xl font-light text-white mb-12"
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
      </div>
    </div>
  );
}
