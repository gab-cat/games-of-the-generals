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
    description: "Basic clearance level. Access to core simulation features.",
    price: "Free",
    period: "forever",
    color: "zinc",
    features: [
      "Global Multiplayer Access",
      "Basic AI Targets (MK-1)",
      "Spectator Link Capability",
      "Comms Channel Access",
      "Basic Service Record",
      "Std. Formation Slots (3)",
      "Replay Buffer (1 Game)",
    ],
    limitations: [
      "Limited Custom Loadouts (2)",
      "Daily Lobby Cap (10)",
      "No Advanced Telemetry",
      "Standard Priority Queue",
    ],
    buttonText: "Current Status",
    popular: false,
  },
  {
    name: "Pro",
    description: "Officer clearance. Enhanced tactical capabilities and customization.",
    price: "₱99",
    period: "month",
    color: "blue",
    features: [
      "All Standard Protocols",
      "Unlimited Custom Loadouts",
      "Private Lobby Cap (50/Day)",
      "Advanced AI Targets (MK-2)",
      "Custom Avatar/Frame Upload",
      "Battle Analysis Tools",
      "Priority Matchmaking Queue",
      "Extended Comms Features",
      "Advanced Combat Stats",
      "Replay Buffer (50 Games)",
      "Shared Loadout Network",
    ],
    limitations: [],
    buttonText: "Request Upgrade",
    popular: true,
  },
  {
    name: "Pro+",
    description: "General clearance. Elite tools for content ops and command.",
    price: "₱199",
    period: "month",
    color: "amber",
    features: [
      "All Pro Protocols",
      "Unlimited Private Lobbies",
      "Replay Buffer (100 Games)",
      "Elite AI Targets (MK-3)",
      "Command Dashboard (Analytics)",
      "Priority Dispatch Support",
      "Content Ops Tools",
      "Beta Protocol Access",
      "Meta-Game Insights",
    ],
    comingSoon: [
      "Tournament Command Center",
      "AI Strategy Assistant",
      "Custom Field Themes",
    ],
    limitations: [],
    buttonText: "Request Upgrade",
    popular: false,
  },
];
