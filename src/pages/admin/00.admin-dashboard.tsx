import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Users,
  CreditCard,
  DollarSign,
  Gamepad2,
  Ticket,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Terminal,
} from "lucide-react";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
  variant?: "default" | "success" | "warning" | "danger" | "purple" | "blue";
  to?: string;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  to,
}: MetricCardProps) {
  const variants = {
    default: "border-white/10 shadow-[0_0_20px_-10px_rgba(255,255,255,0.1)]",
    success: "border-green-500/20 shadow-[0_0_20px_-10px_rgba(34,197,94,0.2)]",
    warning: "border-amber-500/20 shadow-[0_0_20px_-10px_rgba(245,158,11,0.2)]",
    danger: "border-red-500/20 shadow-[0_0_20px_-10px_rgba(239,68,68,0.2)]",
    purple: "border-purple-500/20 shadow-[0_0_20px_-10px_rgba(168,85,247,0.2)]",
    blue: "border-blue-500/20 shadow-[0_0_20px_-10px_rgba(59,130,246,0.2)]",
  };

  const iconColors = {
    default: "text-zinc-400 group-hover:text-white",
    success: "text-green-500 group-hover:text-green-400",
    warning: "text-amber-500 group-hover:text-amber-400",
    danger: "text-red-500 group-hover:text-red-400",
    purple: "text-purple-500 group-hover:text-purple-400",
    blue: "text-blue-500 group-hover:text-blue-400",
  };

  const Content = (
    <div
      className={cn(
        "relative p-5 rounded-sm border bg-zinc-900/40 backdrop-blur-sm group overflow-hidden transition-all duration-300 hover:bg-white/[0.02] h-full",
        variants[variant],
        to &&
          "cursor-pointer hover:border-white/20 hover:scale-[1.01] active:scale-[0.99]",
      )}
    >
      {/* Scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 pointer-events-none" />

      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20 group-hover:border-white/40 transition-colors" />
      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-white/20 group-hover:border-white/40 transition-colors" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-white/20 group-hover:border-white/40 transition-colors" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20 group-hover:border-white/40 transition-colors" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div
          className={cn(
            "p-2 rounded-sm bg-white/5 border border-white/5 transition-colors",
            iconColors[variant],
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border",
              trend.positive
                ? "text-green-400 border-green-500/20 bg-green-500/10"
                : "text-red-400 border-red-500/20 bg-red-500/10",
            )}
          >
            <TrendingUp
              className={cn("w-3 h-3", !trend.positive && "rotate-180")}
            />
            {trend.value}
          </div>
        )}
      </div>

      <div className="space-y-1 relative z-10">
        <h3 className="text-2xl font-mono font-bold text-white tracking-tight tabular-nums">
          {value}
        </h3>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-zinc-400 font-mono pt-1">{subtitle}</p>
        )}
        {to && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="p-1 rounded-sm bg-white/10 border border-white/10 text-white">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </div>
          </div>
        )}
        {to && (
          <div className="mt-4 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 flex items-center gap-2">
              Access Module <span className="text-lg leading-none">›</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {Content}
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      {Content}
    </motion.div>
  );
}

function TicketStatusCard({
  status,
  count,
  icon: Icon,
  color,
}: {
  status: string;
  count: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-sm bg-zinc-950/30 border border-white/5 hover:border-white/10 transition-colors group",
      )}
    >
      <div
        className={cn(
          "p-2 rounded-sm bg-opacity-10 border border-white/5",
          color.replace("text-", "bg-").replace("400", "500"),
        )}
      >
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div>
        <p className="text-lg font-bold font-mono text-white tabular-nums">
          {count}
        </p>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
          {status.replace("_", " ")}
        </p>
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

  const isLoading = statsLoading || gamesLoading || ticketsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-sm bg-zinc-900/40 animate-pulse border border-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (centavos: number) => {
    return `₱${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-1 h-8 bg-purple-500" />
        <div>
          <h2 className="text-2xl font-display font-medium text-white tracking-wide">
            Dashboard Overview
          </h2>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-widest">
            <Terminal className="w-3 h-3" />
            <span>System Status: Operational</span>
          </div>
        </div>
      </div>

      {/* Command Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={stats?.users.total ?? 0}
          icon={Users}
          variant="default"
          to="/admin/users"
        />
        <MetricCard
          title="Active Subs"
          value={stats?.subscriptions.activeTotal ?? 0}
          subtitle={`${stats?.subscriptions.pro ?? 0} Pro // ${stats?.subscriptions.proPlus ?? 0} Pro+`}
          icon={CreditCard}
          variant="purple"
          to="/admin/subscriptions"
        />
        <MetricCard
          title="Revenue (Mo)"
          value={formatCurrency(stats?.donations.thisMonthTotal ?? 0)}
          subtitle={`${stats?.donations.thisMonthCount ?? 0} donations processed`}
          icon={DollarSign}
          variant="success"
        />
        <MetricCard
          title="Active Operations"
          value={gamesToday?.finishedLast24h ?? 0}
          subtitle={`${gamesToday?.currentlyPlaying ?? 0} Live // ${gamesToday?.inSetup ?? 0} Prep`}
          icon={Gamepad2}
          variant="blue"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support Tickets Overview */}
        <Link to="/admin/tickets" className="block relative group">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative p-6 rounded-sm border border-white/5 bg-zinc-900/40 backdrop-blur-sm group-hover:bg-white/[0.02] transition-colors"
          >
            {/* Decorative corners */}
            <div className="absolute top-0 right-0 w-8 h-8">
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-amber-500/10 border border-amber-500/20">
                  <Ticket className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                    Support Tickets
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase">
                    {ticketOverview?.total ?? 0} Inbound Requests
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TicketStatusCard
                status="Open"
                count={ticketOverview?.byStatus.open ?? 0}
                icon={AlertTriangle}
                color="text-amber-400"
              />
              <TicketStatusCard
                status="In Progress"
                count={ticketOverview?.byStatus.in_progress ?? 0}
                icon={Clock}
                color="text-blue-400"
              />
              <TicketStatusCard
                status="Resolved"
                count={ticketOverview?.byStatus.resolved ?? 0}
                icon={CheckCircle2}
                color="text-green-400"
              />
              <TicketStatusCard
                status="Closed"
                count={ticketOverview?.byStatus.closed ?? 0}
                icon={XCircle}
                color="text-zinc-500"
              />
            </div>

            {/* Priority breakdown */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mb-3">
                Priority Distribution
              </p>
              <div className="flex gap-2">
                {[
                  { key: "urgent", label: "URGENT", color: "bg-red-500" },
                  { key: "high", label: "HIGH", color: "bg-orange-500" },
                  { key: "medium", label: "MED", color: "bg-yellow-500" },
                  { key: "low", label: "LOW", color: "bg-green-500" },
                ].map((priority) => (
                  <div
                    key={priority.key}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-zinc-950/50 border border-white/5"
                  >
                    <span
                      className={cn("w-1.5 h-1.5 rounded-full", priority.color)}
                    />
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      {ticketOverview?.byPriority[
                        priority.key as keyof typeof ticketOverview.byPriority
                      ] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Donations Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative p-6 rounded-sm border border-white/5 bg-zinc-900/40 backdrop-blur-sm"
        >
          {/* Decorative corners */}
          <div className="absolute top-0 right-0 w-8 h-8">
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-sm bg-green-500/10 border border-green-500/20">
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                  Revenue Stream
                </h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase">
                  All-time revenue
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-sm bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,197,94,0.05)_50%,transparent_75%)] bg-[size:250%_250%] animate-[gradient_3s_linear_infinite]" />
              <p className="text-[10px] text-green-400/60 font-mono uppercase tracking-widest mb-1">
                Total Accumulation
              </p>
              <p className="text-3xl font-mono font-bold text-green-400 tracking-tight">
                {formatCurrency(stats?.donations.allTimeTotal ?? 0)}
              </p>
              <p className="text-xs text-green-500/50 mt-2 font-mono">
                {stats?.donations.allTimeCount ?? 0} successful transactions
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-sm bg-zinc-950/30 border border-white/5">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">
                  Current Month
                </p>
                <p className="text-xl font-mono font-bold text-white">
                  {formatCurrency(stats?.donations.thisMonthTotal ?? 0)}
                </p>
              </div>
              <div className="p-4 rounded-sm bg-zinc-950/30 border border-white/5">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">
                  Volume
                </p>
                <p className="text-xl font-mono font-bold text-white">
                  {stats?.donations.thisMonthCount ?? 0}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
