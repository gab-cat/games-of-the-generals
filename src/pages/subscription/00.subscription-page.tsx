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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Check } from "lucide-react";
import { SubscriptionPaymentModal } from "@/components/subscription/SubscriptionPaymentModal";
import { DonationPaymentModal } from "@/components/subscription/DonationPaymentModal";
import {
  formatLongDate,
  pluralDays,
  plainFeature,
} from "@/components/subscription/plan-copy";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { pricingTiers } from "@/lib/pricing-tiers";
import { fadeUp, stagger } from "@/lib/motion";

const formatCurrency = (amount: number) => `₱${(amount / 100).toFixed(2)}`;

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

export function SubscriptionPage() {
  const navigate = useNavigate();
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
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
  const gracePeriodEndsAt = subscription?.gracePeriodEndsAt;

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

  const historyLoading =
    paymentHistory === undefined || donationHistory === undefined;

  const goToPricing = () =>
    navigate({ to: "/pricing", search: { donation: undefined } });

  const isPaid = tier !== "free";
  const statusBadge =
    status === "active" ? (
      <Badge variant="success">Active</Badge>
    ) : status === "grace_period" ? (
      <Badge>Grace period</Badge>
    ) : status === "expired" || status === "canceled" ? (
      <Badge variant="destructive">
        {status === "canceled" ? "Cancelled" : "Expired"}
      </Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );

  const expiryLine = (() => {
    if (!isPaid) return "Free for as long as you like.";
    if (status === "grace_period") {
      return gracePeriodEndsAt
        ? `Your plan expired. Renew by ${formatLongDate(gracePeriodEndsAt)} or Pro features lock.`
        : "Your plan expired. Renew soon or Pro features lock.";
    }
    if (status === "expired") {
      return "Your plan expired. Renew to get your Pro features back.";
    }
    if (daysUntilExpiry === 0)
      return `Expires today, ${formatLongDate(expiresAt)}.`;
    if (daysUntilExpiry != null && daysUntilExpiry > 0) {
      return `Expires on ${formatLongDate(expiresAt)}, in ${pluralDays(daysUntilExpiry)}.`;
    }
    return `Expires on ${formatLongDate(expiresAt)}.`;
  })();

  const lobbyLimit = tier === "pro" ? 50 : 10;
  const replayLimit = tier === "pro_plus" ? 100 : tier === "pro" ? 50 : 1;

  const currentTierData = pricingTiers.find(
    (t) =>
      (tier === "pro" && t.name === "Pro") ||
      (tier === "pro_plus" && t.name === "Pro+"),
  );

  const upgradeCards = [
    {
      key: "pro",
      name: "Pro",
      price: 99,
      features: [
        "Hard AI",
        "50 private lobbies a day",
        "Priority matchmaking",
        "50 saved replays",
      ],
      primary: true,
    },
    {
      key: "pro_plus",
      name: "Pro+",
      price: 199,
      features: [
        "Everything in Pro",
        "Unlimited private lobbies",
        "100 saved replays",
        "5 more avatar frames",
      ],
      primary: false,
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Subscription"
        description="Your plan, what you have used and your payments."
      />

      <motion.div
        variants={stagger(0.05)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8"
      >
        <div className="space-y-6 lg:col-span-8 lg:space-y-8">
          {/* Current plan */}
          <motion.section variants={fadeUp} aria-labelledby="current-plan">
            <Card>
              <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      Your plan
                    </span>
                    {subscription === undefined ? (
                      <Skeleton className="h-5 w-16" />
                    ) : (
                      statusBadge
                    )}
                  </div>
                  {subscription === undefined ? (
                    <Skeleton className="h-9 w-32" />
                  ) : (
                    <h2
                      id="current-plan"
                      className="font-display text-3xl font-semibold text-foreground sm:text-4xl"
                    >
                      {getTierDisplayName(tier)}
                    </h2>
                  )}
                  {subscription === undefined ? (
                    <Skeleton className="h-4 w-64 max-w-full" />
                  ) : (
                    <p className="text-sm text-foreground/80">{expiryLine}</p>
                  )}
                </div>

                {isPaid ? (
                  <Button
                    size="lg"
                    onClick={() => setExtendDialogOpen(true)}
                    className="shrink-0"
                  >
                    {status === "active" ? "Extend plan" : "Renew plan"}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </motion.section>

          {/* Plans (free) or what is included (paid) */}
          <motion.section variants={fadeUp}>
            {tier === "free" ? (
              <>
                <SectionHeader
                  title="Get more from your account"
                  description="Plans last the months you pay for and do not renew on their own."
                />
                <div className="grid gap-4 md:grid-cols-2">
                  {upgradeCards.map((card) => (
                    <Card
                      key={card.key}
                      className={cn(card.primary && "border-gold-500/40")}
                    >
                      <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-6">
                        <div>
                          <h3 className="font-display text-2xl font-semibold text-foreground">
                            {card.name}
                          </h3>
                          <p className="mt-1 text-foreground">
                            <span className="text-2xl font-semibold tabular-nums">
                              ₱{card.price}
                            </span>{" "}
                            <span className="text-sm text-foreground/80">
                              a month
                            </span>
                          </p>
                        </div>
                        <ul className="flex-1 space-y-2">
                          {card.features.map((feat) => (
                            <li
                              key={feat}
                              className="flex items-start gap-2 text-sm text-foreground"
                            >
                              <Check className="mt-0.5 size-4 shrink-0 text-gold-400" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                        <Button
                          variant={card.primary ? "default" : "secondary"}
                          onClick={goToPricing}
                          className="w-full"
                        >
                          Choose {card.name}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : currentTierData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Included in {getTierDisplayName(tier)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {currentTierData.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-gold-400" />
                        {plainFeature(feature)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </motion.section>

          {/* Supporter */}
          <motion.section variants={fadeUp} id="donate">
            <Card>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                {profile?.isDonor ? (
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground sm:text-lg">
                      Thank you for donating
                    </h2>
                    <p className="mt-1 text-sm text-foreground/80">
                      You have donated{" "}
                      <span className="tabular-nums">
                        {formatCurrency(profile.totalDonated || 0)}
                      </span>{" "}
                      in total. Your donor badge shows on your profile.
                    </p>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground sm:text-lg">
                      Donate
                    </h2>
                    <p className="mt-1 text-sm text-foreground/80">
                      Donations pay for servers and development. Give ₱50 or
                      more to get a donor badge, a custom name colour and a
                      profile frame.
                    </p>
                  </div>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setDonateDialogOpen(true)}
                  className="shrink-0"
                >
                  {profile?.isDonor ? "Donate again" : "Donate"}
                </Button>
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* Right column: usage, alerts, payments */}
        <div className="space-y-6 lg:col-span-4">
          <motion.section variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {!usage ? (
                  <div className="space-y-5" aria-busy="true">
                    {[0, 1].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <UsageRow
                      label="Private lobbies"
                      used={usage.privateLobbiesCreated}
                      limit={tier === "pro_plus" ? null : lobbyLimit}
                    />
                    <UsageRow
                      label="Saved replays"
                      used={usage.aiReplaysSaved}
                      limit={replayLimit}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {notifications && notifications.length > 0 && (
            <motion.section
              variants={fadeUp}
              className="rounded-lg border border-gold-500/30 bg-gold-500/10 p-4"
            >
              <h2 className="text-sm font-semibold text-foreground">Notices</h2>
              <ul className="mt-2 space-y-1.5">
                {notifications.map((n) => (
                  <li key={n._id} className="text-sm text-foreground">
                    {n.type === "expiry_warning_7d" &&
                      "Your plan expires in 7 days."}
                    {n.type === "expiry_warning_3d" &&
                      "Your plan expires in 3 days."}
                    {n.type === "expiry_warning_1d" &&
                      "Your plan expires tomorrow."}
                    {n.type === "expiry_today" && "Your plan expires today."}
                    {n.type === "expired" && "Your plan has expired."}
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          <motion.section variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="space-y-4" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex justify-between gap-4">
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-4 w-14" />
                      </div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-sm text-foreground/80">No payments yet.</p>
                ) : (
                  <ul className="max-h-80 space-y-4 overflow-y-auto">
                    {transactions.map((tx) => (
                      <li
                        key={tx._id}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="text-foreground">
                            {tx.type === "donation"
                              ? "Donation"
                              : "Plan payment"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString(
                              undefined,
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="tabular-nums text-foreground">
                            {formatCurrency(tx.amount)}
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              tx.status === "succeeded"
                                ? "text-emerald-400"
                                : tx.status === "pending"
                                  ? "text-gold-300"
                                  : "text-red-400",
                            )}
                          >
                            {tx.status === "succeeded"
                              ? "Paid"
                              : tx.status === "pending"
                                ? "Pending"
                                : "Failed"}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </motion.div>

      <SubscriptionPaymentModal
        open={extendDialogOpen}
        onOpenChange={setExtendDialogOpen}
        mode="extend"
        onSuccess={() => {}}
      />

      <DonationPaymentModal
        open={donateDialogOpen}
        onOpenChange={setDonateDialogOpen}
      />

      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment received</DialogTitle>
            <DialogDescription>
              Your plan is updated. Pro features and extra replay space are
              available now.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessModalOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UsageRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  const full = limit !== null && used >= limit;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums text-foreground">
          {limit === null ? `${used}, no limit` : `${used} of ${limit}`}
        </span>
      </div>
      {limit !== null && (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-white/[0.1]"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              full ? "bg-red-400" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
