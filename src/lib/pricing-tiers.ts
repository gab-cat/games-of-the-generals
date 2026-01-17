export interface PricingTier {
  name: string;
  description: string;
  price: string;
  period: string;
  color: string;
  features: string[];
  comingSoon?: string[];
  limitations: string[];
  buttonText: string;
  popular: boolean;
}

export const pricingTiers: PricingTier[] = [
  {
    name: "Standard", // Formerly Free
    description:
      "Everything you need to jump into the action and start playing.",
    price: "Free",
    period: "forever",
    color: "zinc",
    features: [
      "Full Multiplayer Access",
      "Practice against AI (MK-1)",
      "Watch any live match",
      "Global Chat Access",
      "Lifetime Service Record",
      "3 Saved Formation Slots",
      "Last Match Replay",
    ],
    limitations: [
      "Limited Custom Loadouts (2)",
      "Daily Match Limit (10)",
      "Basic Analytics",
      "Standard Matchmaking",
    ],
    buttonText: "Active",
    popular: false,
  },
  {
    name: "Pro",
    description:
      "Unlock the full experience with advanced tools and more storage.",
    price: "₱99",
    period: "month",
    color: "blue",
    features: [
      "All Standard Features",
      "Unlimited Custom Loadouts",
      "Up to 50 Matches per Day",
      "Smarter AI Opponents (MK-2)",
      "Custom Avatar & Frame Uploads",
      "Built-in Battle Analytics",
      "Priority Matchmaking",
      "Exclusive Profile Badges",
      "Detailed Career Stats",
      "Save 50 Match Replays",
      "Share your Loadouts",
    ],
    limitations: [],
    buttonText: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Pro+",
    description: "The ultimate tier for serious players and community leaders.",
    price: "₱199",
    period: "month",
    color: "amber",
    features: [
      "All Pro Features",
      "Unlimited Daily Matches",
      "Save 100 Match Replays",
      "Expert AI Training (MK-3)",
      "Deep Analytics Dashboard",
      "Direct Priority Support",
      "Early Access to New Features",
      "Advanced Meta-Game Insights",
    ],
    comingSoon: [
      "Tournament Hosting Tools",
      "AI Strategy Coaching",
      "Custom Board Themes",
    ],
    limitations: [],
    buttonText: "Go Pro+",
    popular: false,
  },
];
