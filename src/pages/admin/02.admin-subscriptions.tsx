import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/UserAvatar";
import { formatDistanceToNow, format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminSubscriptionModal } from "./components/AdminSubscriptionModal";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  Trash2,
  Plus,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Terminal,
  XCircle,
} from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TierFilter = "all" | "free" | "pro" | "pro_plus";
type StatusFilter = "all" | "active" | "expired" | "grace_period" | "canceled";

export function AdminSubscriptionsPage() {
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<
    string | null
  >(null);

  const deleteSubscription = useMutation(
    api.adminDashboard.adminDeleteSubscription,
  );

  const { data: subscriptionsData, isLoading } = useConvexQuery(
    api.adminDashboard.getAllSubscriptions,
    {
      limit: 50,
      tierFilter:
        tierFilter === "all"
          ? undefined
          : (tierFilter as "free" | "pro" | "pro_plus"),
      statusFilter:
        statusFilter === "all"
          ? undefined
          : (statusFilter as
              | "active"
              | "expired"
              | "grace_period"
              | "canceled"),
    },
  );

  const getTierBadge = (tier: string) => {
    const styles = {
      free: "bg-white/5 text-zinc-500 border-white/10",
      pro: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      pro_plus: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };

    return (
      <span
        className={cn(
          "px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase border tracking-wider",
          styles[tier as keyof typeof styles],
        )}
      >
        {tier === "pro_plus" ? "Pro+" : tier}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: {
        icon: CheckCircle2,
        color: "bg-green-500/10 text-green-400 border-green-500/30",
      },
      expired: {
        icon: XCircle,
        color: "bg-red-500/10 text-red-400 border-red-500/30",
      },
      grace_period: {
        icon: Clock,
        color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      },
      canceled: {
        icon: AlertTriangle,
        color: "bg-white/5 text-zinc-500 border-white/10",
      },
    };

    const { icon: Icon, color } =
      config[status as keyof typeof config] || config.canceled;

    return (
      <span
        className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase border tracking-wider",
          color,
        )}
      >
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </span>
    );
  };

  const handleDelete = async () => {
    if (!subscriptionToDelete) return;

    try {
      await deleteSubscription({
        subscriptionId: subscriptionToDelete as any,
      });
      toast.success("Contract terminated successfully");
      setSubscriptionToDelete(null);
    } catch {
      toast.error("Failed to terminate contract");
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="p-3 bg-zinc-900 border border-white/10 rounded-sm hover:bg-zinc-800 hover:border-white/20 transition-all cursor-pointer group/back"
          >
            <CreditCard className="w-6 h-6 text-zinc-400 group-hover/back:text-white transition-colors" />
          </Link>
          <div>
            <h2 className="text-2xl font-display font-medium text-white tracking-wide">
              Active Contracts
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">
              <Terminal className="w-3 h-3" />
              <span>Subscription Database: Secure</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/40 border border-white/10 rounded-sm">
            <Filter className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Filters
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={tierFilter}
              onValueChange={(value) => setTierFilter(value as TierFilter)}
            >
              <SelectTrigger className="w-28 bg-zinc-900/40 border-white/10 text-zinc-300 text-xs font-mono uppercase tracking-wider rounded-sm h-8 focus:ring-0 focus:ring-offset-0 focus:border-blue-500/50">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10 text-zinc-300 rounded-sm">
                <SelectItem value="all">ALL TIERS</SelectItem>
                <SelectItem value="free">FREE</SelectItem>
                <SelectItem value="pro">PRO</SelectItem>
                <SelectItem value="pro_plus">PRO+</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-32 bg-zinc-900/40 border-white/10 text-zinc-300 text-xs font-mono uppercase tracking-wider rounded-sm h-8 focus:ring-0 focus:ring-offset-0 focus:border-blue-500/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10 text-zinc-300 rounded-sm">
                <SelectItem value="all">ALL STATUS</SelectItem>
                <SelectItem value="active">ACTIVE</SelectItem>
                <SelectItem value="expired">EXPIRED</SelectItem>
                <SelectItem value="grace_period">GRACE PERIOD</SelectItem>
                <SelectItem value="canceled">CANCELED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => {
              setSelectedSubscription(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10px] uppercase tracking-widest rounded-sm h-8 px-4"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />[ NEW CONTRACT ]
          </Button>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="relative rounded-sm border border-white/5 bg-zinc-900/20 backdrop-blur-sm overflow-hidden">
        {/* Decorative corners */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20" />

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 bg-zinc-950/50">
          <div className="col-span-5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Entity
          </div>
          <div className="col-span-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Level
          </div>
          <div className="col-span-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Status
          </div>
          <div className="col-span-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden md:block">
            Valid Until
          </div>
          <div className="col-span-1 text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden lg:block text-right pr-4">
            Actions
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto" />
            <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest animate-pulse">
              Retrieving Contracts...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading &&
          (!subscriptionsData?.subscriptions ||
            subscriptionsData.subscriptions.length === 0) && (
            <div className="p-12 text-center border-b border-white/5">
              <div className="w-16 h-16 bg-zinc-900 rounded-sm border border-white/5 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-zinc-500 font-mono text-sm">
                No contracts located matching specified parameters
              </p>
            </div>
          )}

        {/* Subscription Rows */}
        <div className="divide-y divide-white/5">
          {!isLoading &&
            subscriptionsData?.subscriptions.map((sub, index) => (
              <motion.div
                key={sub._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.01 }}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors items-center group relative"
              >
                {/* Hover indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* User Info */}
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <UserAvatar
                    username={sub.username ?? "Unknown"}
                    avatarUrl={sub.avatarUrl}
                    size="sm"
                    className="ring-1 ring-white/10 group-hover:ring-white/20 transition-all rounded-sm"
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors truncate block font-display">
                      {sub.username ?? "Unknown User"}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600 truncate block opacity-70">
                      {sub.email ?? "No data"}
                    </span>
                  </div>
                </div>

                {/* Tier */}
                <div className="col-span-2">{getTierBadge(sub.tier)}</div>

                {/* Status */}
                <div className="col-span-2">{getStatusBadge(sub.status)}</div>

                {/* Expires */}
                <div className="col-span-2 hidden md:flex flex-col">
                  <span className="text-xs font-mono text-zinc-300">
                    {format(sub.expiresAt, "dd MMM yyyy")}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase">
                    {formatDistanceToNow(sub.expiresAt, { addSuffix: true })}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1 pr-2">
                  <button
                    onClick={() => {
                      setSelectedSubscription(sub);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-sm transition-all"
                    title="Edit Contract"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSubscriptionToDelete(sub._id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-sm transition-all"
                    title="Terminate Contract"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Admin Subscription Modal */}
      <AdminSubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subscription={selectedSubscription}
      />

      {/* Termination Confirmation */}
      <AlertDialog
        open={!!subscriptionToDelete}
        onOpenChange={(open) => !open && setSubscriptionToDelete(null)}
      >
        <AlertDialogContent className="bg-zinc-950 border-white/10 text-white max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-sm">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl font-display tracking-tight uppercase text-red-400">
                Terminate Contract?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-zinc-400 font-mono text-xs uppercase leading-relaxed">
              WARNING: This action will immediately revoke all premium access
              for the associated entity. This procedure is irreversible and will
              be logged in the high-clearance audit registry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-3 sm:justify-end">
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 text-zinc-400 font-mono text-[10px] uppercase tracking-wider rounded-sm h-9">
              Abort Deletion
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="mt-0 bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] uppercase tracking-widest rounded-sm h-9 px-6"
            >
              [ CONFIRM TERMINATION ]
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Load More */}
      {subscriptionsData?.hasMore && (
        <div className="flex justify-center pt-4">
          <button className="px-6 py-2 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/20 rounded-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500/20">
            [ Load Additional Contracts ]
          </button>
        </div>
      )}
    </div>
  );
}
