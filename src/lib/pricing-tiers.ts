/*
 * What each plan includes, as shown on the pricing and subscription pages and
 * in the search tags. Every line here must match what the backend enforces:
 * convex/featureGating.ts (TIER_LIMITS), convex/aiGame.ts (AI levels),
 * convex/customizations.ts (frames and username colours), convex/globalChat.ts
 * (message length), convex/matchmaking.ts (queue priority) and
 * convex/fileUpload.ts (avatar upload). Change the code first, then this.
 */
export interface PricingTier {
  name: "Standard" | "Pro" | "Pro+";
  price: string;
  /** Most important first: the pricing page shows the first six. */
  features: string[];
}

export const pricingTiers: PricingTier[] = [
  {
    name: "Standard",
    price: "Free",
    features: [
      "Ranked quick match and private lobbies",
      "Easy and medium AI",
      "10 private lobbies a day",
      "Watch live games",
      "Global chat",
      "2 setup presets",
      "Your full match history",
    ],
  },
  {
    name: "Pro",
    price: "₱99",
    features: [
      "Everything in Standard",
      "Hard AI",
      "50 private lobbies a day",
      "Upload your own avatar",
      "Gold, silver and bronze avatar frames",
      "50 saved replays",
      "Unlimited setup presets",
      "Username colour from the palette",
      "Matched first in quick match",
      "Chat messages up to 1,000 characters",
    ],
  },
  {
    name: "Pro+",
    price: "₱199",
    features: [
      "Everything in Pro",
      "Unlimited private lobbies",
      "100 saved replays",
      "5 more avatar frames",
      "Any username colour",
    ],
  },
];
