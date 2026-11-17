"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SectionHeader } from "@/components/ui/page-header";
import { Check, ChevronRight, Minus } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { Link, useNavigate, getRouteApi } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { cn } from "@/lib/utils";
import { easeOut, fadeUp, riseIn, stagger } from "@/lib/motion";
import { SubscriptionPaymentModal } from "@/components/subscription/SubscriptionPaymentModal";
import { DonationPaymentModal } from "@/components/subscription/DonationPaymentModal";
import { plainFeature } from "@/components/subscription/plan-copy";
import { pricingTiers } from "@/lib/pricing-tiers";
import { Painting, Sticker, type Crop } from "@/components/season/art";
import {
  formatCentavos,
  PLAN_TERMS,
  quotePlan,
  type PaidTier,
  type PlanMonths,
} from "../../../convex/lib/planPricing";

const route = getRouteApi("/pricing");

interface PricingPageProps {
  profile: any;
}

type PlanKey = "free" | PaidTier;

/** The three posters. Prices, features and limits come from pricing-tiers. */
const PLANS: {
  key: PlanKey;
  name: string;
  summary: string;
  art: Crop;
}[] = [
  {
    key: "free",
    name: "Standard",
    summary: "Full multiplayer and the basic AI.",
    art: "pricingStandard",
  },
  {
    key: "pro",
    name: "Pro",
    summary: "Stronger AI, 50 saved replays and unlimited loadouts.",
    art: "pricingPro",
  },
  {
    key: "pro_plus",
    name: "Pro+",
    summary: "Everything in Pro, unlimited matches and the strongest AI.",
    art: "pricingProPlus",
  },
];

const FEATURES_SHOWN = 6;

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
  return <span className="text-xs text-foreground sm:text-sm">{value}</span>;
}

function expiryLabel(days: number) {
  if (days > 1) return `Expires in ${days} days`;
  if (days === 1) return "Expires tomorrow";
  if (days === 0) return "Expires today";
  return "Expired";
}

/** 1, 3, 6 or 12 months. Every poster's price follows it. */
function TermPicker({
  value,
  onChange,
}: {
  value: PlanMonths;
  onChange: (months: PlanMonths) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Pay for"
      className="grid w-full grid-cols-4 gap-1 rounded-lg border border-border bg-card p-1 sm:w-auto"
    >
      {PLAN_TERMS.map(({ months, discountPercent }) => {
        const selected = value === months;
        return (
          <button
            key={months}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(months)}
            className={cn(
              "relative flex min-h-12 flex-col items-center justify-center whitespace-nowrap rounded-md px-1 py-1.5 text-center transition-colors sm:min-w-[6.5rem] sm:px-4",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]",
              selected
                ? "text-primary-foreground"
                : "text-foreground hover:bg-white/[0.06]",
            )}
          >
            {selected && (
              <motion.span
                layoutId="term-highlight"
                aria-hidden="true"
                className="absolute inset-0 rounded-md bg-primary"
                transition={{ duration: 0.3, ease: easeOut }}
              />
            )}
            <span className="relative text-[13px] font-semibold leading-tight sm:text-sm">
              {months} {months === 1 ? "month" : "months"}
            </span>
            <span
              className={cn(
                "relative text-xs leading-tight",
                selected
                  ? "text-primary-foreground/80"
                  : discountPercent
                    ? "text-emerald-400"
                    : "text-foreground/70",
              )}
            >
              {discountPercent ? `${discountPercent}% off` : "List price"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The big price on a poster. Rolls when the term changes. */
function PosterPrice({ plan, months }: { plan: PlanKey; months: PlanMonths }) {
  if (plan === "free") {
    return (
      <div>
        <div className="text-6xl font-bold leading-none tracking-[-0.04em] text-white sm:text-7xl">
          Free
        </div>
        <p className="mt-2 text-sm text-white/85">No card, no limit on time.</p>
      </div>
    );
  }
  const quote = quotePlan(plan, months);
  return (
    <div aria-live="polite">
      <div className="flex items-end gap-2 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={quote.perMonthCentavos}
            initial={{ y: "70%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-70%", opacity: 0 }}
            transition={{ duration: 0.28, ease: easeOut }}
            className="text-6xl font-bold leading-none tracking-[-0.04em] text-white sm:text-7xl"
          >
            {formatCentavos(Math.round(quote.perMonthCentavos / 100) * 100)}
          </motion.span>
        </AnimatePresence>
        <span className="pb-1 text-base font-medium text-white/85">
          a month
        </span>
      </div>
      <p className="mt-2 text-sm text-white/85">
        {months === 1 ? (
          "Pay one month at a time."
        ) : (
          <>
            {formatCentavos(quote.totalCentavos)} for {months} months.{" "}
            <span className="font-medium text-emerald-300">
              You save {formatCentavos(quote.savingsCentavos)}.
            </span>
          </>
        )}
      </p>
    </div>
  );
}

export function PricingPage({ profile: _profile }: PricingPageProps) {
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);
  const [thankYouModalOpen, setThankYouModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PaidTier>("pro");
  const [months, setMonths] = useState<PlanMonths>(1);

  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();
  const search = route.useSearch();

  const { data: subscription } = useConvexQuery(
    api.subscriptions.getCurrentSubscription,
    isAuthenticated ? {} : "skip",
  );

  // Back from PayMongo: say thanks, then drop the query parameter.
  useEffect(() => {
    if (search.donation === "success") {
      setThankYouModalOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("donation");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [search.donation]);

  const handleUpgrade = (tier: PaidTier) => {
    if (!isAuthenticated) {
      void navigate({ to: "/auth" });
      return;
    }
    setSelectedTier(tier);
    setUpgradeModalOpen(true);
  };

  const handleDonateOpen = () => {
    if (!isAuthenticated) {
      void navigate({ to: "/auth" });
      return;
    }
    setDonateDialogOpen(true);
  };

  // Signed out, nobody has a plan yet; don't mark Standard as theirs.
  const currentTier: PlanKey | null = isAuthenticated
    ? (subscription?.tier ?? null)
    : null;
  const expiresAt = subscription?.expiresAt;
  const daysUntilExpiry = expiresAt
    ? Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // The one gold button: Pro, or Pro+ when Pro is already the current plan.
  const primary: PlanKey = currentTier === "pro" ? "pro_plus" : "pro";

  return (
    <div className="w-full space-y-12 sm:space-y-16">
      <div className="space-y-5 sm:space-y-6">
        <motion.header
          {...riseIn}
          className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="min-w-0 space-y-2">
            <h1 className="font-display text-4xl font-bold leading-none tracking-[-0.03em] text-foreground sm:text-7xl">
              Pick your plan
            </h1>
            <p className="max-w-xl text-base text-foreground/90">
              Playing is free. Pro and Pro+ add stronger AI and more saved
              replays. You pay once for the months you pick, and nothing renews
              by itself.
            </p>
          </div>
          <TermPicker value={months} onChange={setMonths} />
        </motion.header>

        {/* Plans: three posters, each its own painting */}
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          animate="show"
          className="grid items-stretch gap-3 lg:grid-cols-3 lg:gap-4"
        >
          {PLANS.map((plan) => {
            const tier = pricingTiers.find((t) => t.name === plan.name);
            const features = tier?.features ?? [];
            // "and 1 more" is worse than the one line it hides.
            const shown =
              features.length > FEATURES_SHOWN + 1
                ? features.slice(0, FEATURES_SHOWN)
                : features;
            const more = features.length - shown.length;
            const current = currentTier === plan.key;
            const isPrimary = !current && plan.key === primary;
            const isPaid = plan.key !== "free";

            return (
              <motion.article
                key={plan.key}
                variants={fadeUp}
                aria-label={plan.name}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-colors",
                  isPrimary || current
                    ? "border-gold-500/60"
                    : "border-border hover:border-border-strong",
                )}
              >
                <Painting
                  crop={plan.art}
                  fade="bottom"
                  className="h-[280px] sm:h-[360px]"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-transparent"
                  />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-5">
                    <h2 className="text-2xl font-bold leading-none tracking-[-0.02em] text-white drop-shadow sm:text-3xl">
                      {plan.name}
                    </h2>
                    {current ? (
                      <span className="rounded border border-white/30 bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                        Your plan
                      </span>
                    ) : null}
                  </div>
                  {plan.key === "pro" && !current && (
                    <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
                      <Sticker rotate={6} delay={0.6} className="text-sm">
                        Most chosen
                      </Sticker>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <PosterPrice plan={plan.key} months={months} />
                  </div>
                </Painting>

                <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
                  <p className="text-sm text-foreground">{plan.summary}</p>

                  <div className="space-y-2">
                    {current && isPaid ? (
                      <>
                        <Button asChild variant="secondary" className="w-full">
                          <Link
                            to="/subscription"
                            search={{ subscription: undefined }}
                          >
                            Manage plan
                          </Link>
                        </Button>
                        {daysUntilExpiry !== null && (
                          <p
                            className={cn(
                              "text-center text-xs",
                              daysUntilExpiry <= 0
                                ? "text-red-400"
                                : "text-foreground/80",
                            )}
                          >
                            {expiryLabel(daysUntilExpiry)}
                          </p>
                        )}
                      </>
                    ) : isPaid ? (
                      <Button
                        variant={isPrimary ? "default" : "secondary"}
                        className="w-full"
                        onClick={() => handleUpgrade(plan.key as PaidTier)}
                      >
                        Get {plan.name}
                        {months > 1 ? ` for ${months} months` : ""}
                      </Button>
                    ) : !isAuthenticated ? (
                      <Button asChild variant="secondary" className="w-full">
                        <Link to="/auth">Play free</Link>
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full" disabled>
                        {current ? "Your plan" : "Included in your plan"}
                      </Button>
                    )}
                  </div>

                  <ul className="flex-1 space-y-2 border-t border-border pt-4">
                    {shown.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-gold-400" />
                        {plainFeature(feature)}
                      </li>
                    ))}
                    {more > 0 && (
                      <li className="pl-6 text-sm">
                        <a
                          href="#compare"
                          className="rounded text-foreground/80 underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                        >
                          and {more} more in the table
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>

      {/* Donate: a wide band with its own painting */}
      <motion.section
        id="donate"
        aria-labelledby="donate-title"
        {...riseIn}
        className="scroll-mt-24 overflow-hidden rounded-lg border border-border"
      >
        <Painting
          crop="support"
          fade="left"
          zoomIn={false}
          className="min-h-[300px] sm:min-h-[280px]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent sm:hidden"
          />
          <div className="relative flex min-h-[300px] max-w-lg flex-col justify-end gap-3 p-5 sm:min-h-[280px] sm:justify-center sm:p-8">
            <h2
              id="donate-title"
              className="text-4xl font-bold leading-none tracking-[-0.03em] text-white sm:text-5xl"
            >
              Donate
            </h2>
            <p className="text-sm text-white/90 sm:text-base">
              Donations pay for the servers and new features. Give ₱50 or more
              for a donor badge, a custom name colour and a profile frame.
            </p>
            <div>
              <Button onClick={handleDonateOpen} className="min-w-32">
                Donate
              </Button>
            </div>
          </div>
        </Painting>
      </motion.section>

      {/* Comparison */}
      <section id="compare" className="scroll-mt-24">
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

      {/* Questions */}
      <section className="mx-auto max-w-3xl pb-4">
        <SectionHeader title="Questions" as="h2" />
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

      <SubscriptionPaymentModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        mode="upgrade"
        tier={selectedTier}
        initialMonths={months}
      />

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
