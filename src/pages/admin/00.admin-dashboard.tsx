import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { Stat } from "@/components/ui/stat";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const formatCurrency = (centavos: number) =>
  `₱${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const panel = "rounded-lg border border-border bg-card p-4 sm:p-5";
const linkPanel = cn(
  panel,
  "block transition-colors hover:border-border-strong hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.99]",
);

const PRIORITIES = [
  { key: "urgent", label: "Urgent", dot: "bg-red-400" },
  { key: "high", label: "High", dot: "bg-gold-400" },
  { key: "medium", label: "Medium", dot: "bg-foreground/60" },
  { key: "low", label: "Low", dot: "bg-emerald-400" },
] as const;

function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="mt-3 h-5 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={panel}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-7 w-24" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useConvexQuery(
    api.adminDashboard.getDashboardStats,
    {},
  );
  const { data: gamesToday, isLoading: gamesLoading } = useConvexQuery(
    api.adminDashboard.getGamesToday,
    {},
  );
  const { data: ticketOverview, isLoading: ticketsLoading } = useConvexQuery(
    api.adminDashboard.getTicketOverview,
    {},
  );

  if (statsLoading || gamesLoading || ticketsLoading) {
    return <DashboardSkeleton />;
  }

  const ticketStatuses = [
    { label: "Open", value: ticketOverview?.byStatus.open ?? 0, tone: "gold" },
    {
      label: "In progress",
      value: ticketOverview?.byStatus.in_progress ?? 0,
      tone: "default",
    },
    {
      label: "Resolved",
      value: ticketOverview?.byStatus.resolved ?? 0,
      tone: "win",
    },
    {
      label: "Closed",
      value: ticketOverview?.byStatus.closed ?? 0,
      tone: "default",
    },
  ] as const;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Users, subscriptions, games and support at a glance."
      />

      <motion.div
        variants={stagger()}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <motion.div variants={fadeUp}>
          <Link to="/admin/users" className={cn(linkPanel, "h-full")}>
            <Stat
              label="Users"
              value={(stats?.users.total ?? 0).toLocaleString()}
              hint="View all users"
              size="lg"
            />
          </Link>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Link to="/admin/subscriptions" className={cn(linkPanel, "h-full")}>
            <Stat
              label="Active subscriptions"
              value={(stats?.subscriptions.activeTotal ?? 0).toLocaleString()}
              hint={`${stats?.subscriptions.pro ?? 0} Pro, ${stats?.subscriptions.proPlus ?? 0} Pro+`}
              size="lg"
            />
          </Link>
        </motion.div>
        <motion.div variants={fadeUp} className={cn(panel, "h-full")}>
          <Stat
            label="Donations this month"
            value={formatCurrency(stats?.donations.thisMonthTotal ?? 0)}
            hint={`${stats?.donations.thisMonthCount ?? 0} payments`}
            tone="win"
            size="lg"
          />
        </motion.div>
        <motion.div variants={fadeUp} className={cn(panel, "h-full")}>
          <Stat
            label="Games finished, last 24 hours"
            value={(gamesToday?.finishedLast24h ?? 0).toLocaleString()}
            hint={`${gamesToday?.currentlyPlaying ?? 0} playing now, ${gamesToday?.inSetup ?? 0} in setup`}
            size="lg"
          />
        </motion.div>
      </motion.div>

      <motion.div
        variants={stagger(0.06, 0.1)}
        initial="hidden"
        animate="show"
        className="mt-6 grid gap-4 sm:mt-8 lg:grid-cols-2"
      >
        <motion.section variants={fadeUp} className={panel}>
          <SectionHeader
            title="Support tickets"
            description={`${ticketOverview?.total ?? 0} in total`}
            actions={
              <Button asChild variant="secondary" size="sm">
                <Link to="/admin/tickets">Open tickets</Link>
              </Button>
            }
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ticketStatuses.map((s) => (
              <Stat
                key={s.label}
                label={s.label}
                value={s.value}
                tone={s.tone}
              />
            ))}
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-xs text-foreground/70">Priority</p>
            <ul className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
                <li
                  key={p.key}
                  className="flex items-center gap-2 rounded border border-border px-2.5 py-1.5 text-xs text-foreground"
                >
                  <span className={cn("size-1.5 rounded-full", p.dot)} />
                  {p.label}
                  <span className="tabular-nums">
                    {ticketOverview?.byPriority[p.key] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        <motion.section variants={fadeUp} className={panel}>
          <SectionHeader
            title="Donations"
            description="Successful payments only"
          />
          <Stat
            label="All time"
            value={formatCurrency(stats?.donations.allTimeTotal ?? 0)}
            hint={`${stats?.donations.allTimeCount ?? 0} payments`}
            tone="win"
            size="lg"
          />
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
            <Stat
              label="This month"
              value={formatCurrency(stats?.donations.thisMonthTotal ?? 0)}
            />
            <Stat
              label="Payments this month"
              value={stats?.donations.thisMonthCount ?? 0}
            />
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
