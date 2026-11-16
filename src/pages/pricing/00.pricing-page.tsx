"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { Check, ChevronRight, Minus } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { toast } from "sonner";
import { Link, useNavigate, getRouteApi } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { SubscriptionPaymentModal } from "@/components/subscription/SubscriptionPaymentModal";
import { DonationPaymentModal } from "@/components/subscription/DonationPaymentModal";
import { plainFeature } from "@/components/subscription/plan-copy";
import { pricingTiers } from "@/lib/pricing-tiers";

const route = getRouteApi("/pricing");

interface PricingPageProps {
  profile: any;
}

// Short plan summaries. Prices, features and limits come from pricing-tiers.
const TIER_SUMMARY: Record<string, string> = {
  Standard: "Full multiplayer and the basic AI.",
  Pro: "More AI levels, more replays and unlimited loadouts.",
  "Pro+": "Everything in Pro, plus unlimited matches and the strongest AI.",
};

type Cell = string | boolean;
const comparisonFeatures: {
  category: string;
  items: { name: string; standard: Cell; pro: Cell; proPlus: Cell }[];
}[] = [
  {
    category: "Play",
    items: [
      {
        name: "Matches per day",
        standard: "10",
        pro: "50",
        proPlus: "Unlimited",
      },
      {
        name: "AI level",
        standard: "Basic",
        pro: "Advanced",
        proPlus: "Expert",
      },
      { name: "Saved replays", standard: "1", pro: "50", proPlus: "100" },
      {
        name: "Loadout slots",
        standard: "2",
        pro: "Unlimited",
        proPlus: "Unlimited",
      },
    ],
  },
  {
    category: "Analysis",
    items: [
      { name: "Battle analytics", standard: false, pro: true, proPlus: true },
      {
        name: "Move history analysis",
        standard: false,
        pro: true,
        proPlus: true,
      },
      {
        name: "Meta-game insights",
        standard: false,
        pro: false,
        proPlus: true,
      },
    ],
  },
  {
    category: "Profile and community",
    items: [
      {
        name: "Custom avatar upload",
        standard: false,
        pro: true,
        proPlus: true,
      },
      { name: "Share loadouts", standard: false, pro: true, proPlus: true },
      { name: "Priority queue", standard: false, pro: true, proPlus: true },
      {
        name: "Tournament hosting",
        standard: false,
        pro: false,
        proPlus: "Coming soon",
      },
    ],
  },
];

const faqs = [
  {
    q: "Does my plan renew by itself?",
    a: "No. You pay for the months you pick and keep your features until the plan expires. When it is close to ending, extend it from the Subscription page.",
  },
  {
    q: "Is my payment information safe?",
    a: "Payments run on PayMongo's checkout page. We never see or store your card details.",
  },
  {
    q: "Will I lose my rank if my plan ends?",
    a: "No. Your match history, rank and achievements stay. You lose the Pro features until you renew.",
  },
  {
    q: "Can I switch from Pro to Pro+?",
    a: "Yes. Pick Pro+ on this page. The new plan starts when the payment goes through and replaces the days left on your current plan.",
  },
];

function CompareCell({ value, tone }: { value: Cell; tone?: "gold" }) {
  if (typeof value === "boolean") {
    return value ? (
      <>
        <Check
          className={cn(
            "mx-auto size-4",
            tone === "gold" ? "text-gold-400" : "text-foreground",
          )}
          aria-hidden
        />
        <span className="sr-only">Included</span>
      </>
    ) : (
      <>
        <Minus className="mx-auto size-4 text-foreground/40" aria-hidden />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return (
    <span className="text-xs tabular-nums text-foreground sm:text-sm">
      {value}
    </span>
  );
}

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
      toast.info("You are already on the free plan.");
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

  const currentTier = subscription?.tier || "free";
  const expiresAt = subscription?.expiresAt;
  const daysUntilExpiry = expiresAt
    ? Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isCurrent = (name: string) => {
    const n = name.toLowerCase();
    return (
      (n === "standard" && currentTier === "free") ||
      (n === "pro" && currentTier === "pro") ||
      (n === "pro+" && currentTier === "pro_plus")
    );
  };

  // The one gold button: Pro, or Pro+ when Pro is already the current plan.
  const primaryName = currentTier === "pro" ? "Pro+" : "Pro";

  return (
    <div className="w-full">
      <PageHeader
        title="Pricing"
        description="Playing is free. Pro and Pro+ add stronger AI, more saved replays and profile options. Pay for the months you want, with no automatic renewal."
      />

      {/* Plans */}
      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        className="mb-12 grid items-stretch gap-4 lg:grid-cols-3 lg:gap-6"
      >
        {pricingTiers.map((tier) => {
          const current = isCurrent(tier.name);
          const isPaidTier = tier.name !== "Standard";
          const isPrimary = !current && tier.name === primaryName;
          const features = tier.features.slice(0, 8);
          const more = tier.features.length - features.length;

          return (
            <motion.div key={tier.name} variants={fadeUp} className="h-full">
              <Card
                className={cn(
                  "flex h-full flex-col",
                  (current || isPrimary) && "border-gold-500/40",
                )}
              >
                <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-2xl font-semibold text-foreground">
                        {tier.name}
                      </h2>
                      {current ? (
                        <Badge>Your plan</Badge>
                      ) : tier.popular ? (
                        <Badge variant="secondary">Most chosen</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-foreground/80">
                      {TIER_SUMMARY[tier.name] ?? tier.description}
                    </p>
                  </div>

                  <div>
                    <p className="text-foreground">
                      <span className="text-3xl font-semibold tabular-nums">
                        {tier.price}
                      </span>{" "}
                      {isPaidTier && (
                        <span className="text-sm text-foreground/80">
                          a month
                        </span>
                      )}
                    </p>
                    {isPaidTier && (
                      <p className="mt-1 text-xs text-foreground/70">
                        Pay for 3, 6 or 12 months and save up to 25%.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {current && isPaidTier ? (
                      <>
                        <Button asChild variant="secondary" className="w-full">
                          <Link
                            to="/subscription"
                            search={{ subscription: undefined }}
                          >
                            Manage plan
                          </Link>
                        </Button>
                        {expiresAt && (
                          <p
                            className={cn(
                              "text-center text-xs",
                              daysUntilExpiry !== null && daysUntilExpiry <= 0
                                ? "text-red-400"
                                : "text-foreground/80",
                            )}
                          >
                            {daysUntilExpiry !== null && daysUntilExpiry > 1
                              ? `Expires in ${daysUntilExpiry} days`
                              : daysUntilExpiry === 1
                                ? "Expires tomorrow"
                                : daysUntilExpiry === 0
                                  ? "Expires today"
                                  : "Expired"}
                          </p>
                        )}
                      </>
                    ) : (
                      <Button
                        variant={isPrimary ? "default" : "secondary"}
                        className="w-full"
                        onClick={() => handleUpgrade(tier.name)}
                        disabled={current}
                      >
                        {current
                          ? "Current plan"
                          : isPaidTier
                            ? `Get ${tier.name}`
                            : "Free plan"}
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 border-t border-border pt-4">
                    <ul className="space-y-2">
                      {features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-foreground"
                        >
                          <Check className="mt-0.5 size-4 shrink-0 text-gold-400" />
                          {plainFeature(feature)}
                        </li>
                      ))}
                      {more > 0 && (
                        <li className="pl-6 text-sm text-foreground/80">
                          and {more} more, see the table below
                        </li>
                      )}
                    </ul>

                    {tier.comingSoon && tier.comingSoon.length > 0 && (
                      <div className="mt-4">
                        <div className="text-[13px] font-medium text-foreground">
                          Coming later
                        </div>
                        <ul className="mt-2 space-y-1.5">
                          {tier.comingSoon.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-2 text-sm text-foreground/80"
                            >
                              <Minus className="mt-0.5 size-4 shrink-0 text-foreground/40" />
                              {plainFeature(feature)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Discounts and donations */}
      <div className="mb-12 grid gap-4 lg:grid-cols-12 lg:gap-6">
        <Card className="lg:col-span-7">
          <CardContent className="p-5 sm:p-6">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Longer plans cost less
            </h2>
            <p className="mt-1 text-sm text-foreground/80">
              The discount applies to the whole payment when you pick the
              months.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { term: "3 months", discount: "15%" },
                { term: "6 months", discount: "20%" },
                { term: "12 months", discount: "25%" },
              ].map((plan) => (
                <div
                  key={plan.term}
                  className="rounded-md border border-border bg-white/[0.02] p-3 text-center"
                >
                  <div className="text-xl font-semibold tabular-nums text-emerald-400">
                    {plan.discount} off
                  </div>
                  <div className="mt-1 text-sm text-foreground">
                    {plan.term}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card id="donate" className="lg:col-span-5">
          <CardContent className="flex h-full flex-col gap-3 p-5 sm:p-6">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Donate
            </h2>
            <p className="text-sm text-foreground/80">
              Donations pay for servers and development. Give ₱50 or more to get
              a donor badge, a custom name colour and a profile frame.
            </p>
            <div className="mt-auto">
              <Button variant="secondary" onClick={handleDonateOpen}>
                Donate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison */}
      <section className="mb-12">
        <SectionHeader title="Compare plans" as="h2" />
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center border-b border-border bg-white/[0.03] px-3 py-3 text-xs font-semibold text-foreground sm:px-4 sm:text-sm">
            <div>Feature</div>
            <div className="text-center">Standard</div>
            <div className="text-center">Pro</div>
            <div className="text-center">Pro+</div>
          </div>

          {comparisonFeatures.map((section) => (
            <div key={section.category}>
              <div className="border-b border-border bg-white/[0.02] px-3 py-2 text-[13px] font-medium text-foreground sm:px-4">
                {section.category}
              </div>
              {section.items.map((item) => (
                <div
                  key={item.name}
                  className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center gap-1 border-b border-border px-3 py-3 text-sm last:border-b-0 hover:bg-white/[0.02] sm:px-4"
                >
                  <div className="pr-2 text-foreground">{item.name}</div>
                  <div className="text-center">
                    <CompareCell value={item.standard} />
                  </div>
                  <div className="text-center">
                    <CompareCell value={item.pro} />
                  </div>
                  <div className="text-center">
                    <CompareCell value={item.proPlus} tone="gold" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <SubscriptionPaymentModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        mode="upgrade"
        tier={selectedTier || "pro"}
        onSuccess={() => {}}
      />

      {/* Questions */}
      <section className="mx-auto mb-12 max-w-3xl">
        <SectionHeader title="Questions" />
        <div className="space-y-2">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-lg border border-border bg-card transition-colors open:border-border-strong hover:border-border-strong"
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 [&::-webkit-details-marker]:hidden">
                {faq.q}
                <ChevronRight className="size-4 shrink-0 text-foreground/70 transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-4 pb-4 text-sm text-foreground/80">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <DonationPaymentModal
        open={donateDialogOpen}
        onOpenChange={setDonateDialogOpen}
      />

      <Dialog open={thankYouModalOpen} onOpenChange={setThankYouModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thank you</DialogTitle>
            <DialogDescription>
              Your payment went through. Your new badge, plan or frame will show
              on your profile in a moment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setThankYouModalOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
