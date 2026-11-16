import { useState } from "react";
import { motion } from "framer-motion";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { fadeUp, stagger } from "@/lib/motion";
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
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TierFilter = "all" | "free" | "pro" | "pro_plus";
type StatusFilter = "all" | "active" | "expired" | "grace_period" | "canceled";

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  grace_period: "Grace period",
  canceled: "Canceled",
};

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  active: "success",
  expired: "destructive",
  grace_period: "default",
  canceled: "outline",
};

function RowSkeleton() {
  return (
    <div className="grid grid-cols-12 items-center gap-4 border-b border-border px-4 py-3 last:border-0">
      <div className="col-span-12 flex items-center gap-3 md:col-span-4">
        <Skeleton className="size-8 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="col-span-2 hidden h-5 w-12 md:block" />
      <Skeleton className="col-span-2 hidden h-5 w-20 md:block" />
      <Skeleton className="col-span-2 hidden h-8 w-24 md:block" />
    </div>
  );
}

export function AdminSubscriptionsPage() {
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const subscriptions = subscriptionsData?.subscriptions ?? [];
  const hasFilters = tierFilter !== "all" || statusFilter !== "all";
  const deleting = subscriptions.find((s) => s._id === subscriptionToDelete);

  const handleDelete = async () => {
    if (!subscriptionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSubscription({
        subscriptionId: subscriptionToDelete as Id<"subscriptions">,
      });
      toast.success("Subscription removed");
      setSubscriptionToDelete(null);
    } catch {
      toast.error("Could not remove the subscription. Try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setTierFilter("all");
    setStatusFilter("all");
  };

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Pro and Pro+ plans. Edit a plan or remove it."
        actions={
          <Button
            onClick={() => {
              setSelectedSubscription(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            New subscription
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select
          value={tierFilter}
          onValueChange={(value) => setTierFilter(value as TierFilter)}
        >
          <SelectTrigger aria-label="Filter by plan" className="w-36">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="pro_plus">Pro+</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger aria-label="Filter by status" className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="grace_period">Grace period</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}

        {!isLoading ? (
          <span className="ml-auto text-sm text-foreground/80">
            <span className="tabular-nums">
              {subscriptions.length}
              {subscriptionsData?.hasMore ? "+" : ""}
            </span>{" "}
            {subscriptions.length === 1 && !subscriptionsData?.hasMore
              ? "subscription"
              : "subscriptions"}
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="hidden grid-cols-12 gap-4 border-b border-border bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-foreground/70 md:grid">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Valid until</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {isLoading ? (
          <div aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={
                hasFilters
                  ? "No subscriptions match these filters"
                  : "No subscriptions yet"
              }
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedSubscription(null);
                      setIsModalOpen(true);
                    }}
                  >
                    New subscription
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <motion.ul variants={stagger(0.015)} initial="hidden" animate="show">
            {subscriptions.map((sub) => (
              <motion.li
                key={sub._id}
                variants={fadeUp}
                className="grid grid-cols-12 items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-white/[0.03]"
              >
                <div className="col-span-12 flex min-w-0 items-center gap-3 md:col-span-4">
                  <UserAvatar
                    username={sub.username ?? "Unknown"}
                    avatarUrl={sub.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {sub.username ?? "Unknown user"}
                    </span>
                    <span className="block truncate text-xs text-foreground/70">
                      {sub.email ?? "No email"}
                    </span>
                  </div>
                </div>

                <div className="col-span-3 md:col-span-2">
                  <Badge
                    variant={
                      sub.tier === "pro_plus"
                        ? "default"
                        : sub.tier === "pro"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {TIER_LABEL[sub.tier] ?? sub.tier}
                  </Badge>
                </div>

                <div className="col-span-5 md:col-span-2">
                  <Badge variant={STATUS_VARIANT[sub.status] ?? "outline"}>
                    {STATUS_LABEL[sub.status] ?? sub.status}
                  </Badge>
                </div>

                <div className="col-span-4 flex flex-col md:col-span-2">
                  <span className="text-xs tabular-nums text-foreground">
                    {format(sub.expiresAt, "dd MMM yyyy")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(sub.expiresAt, { addSuffix: true })}
                  </span>
                </div>

                <div className="col-span-12 flex items-center gap-1 md:col-span-2 md:justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSubscription(sub);
                      setIsModalOpen(true);
                    }}
                    aria-label={`Edit subscription for ${sub.username ?? "user"}`}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSubscriptionToDelete(sub._id)}
                    aria-label={`Remove subscription for ${sub.username ?? "user"}`}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>

      {subscriptionsData?.hasMore ? (
        <p className="mt-3 text-sm text-foreground/80">
          Showing the first 50. Use the filters to narrow the list.
        </p>
      ) : null}

      <AdminSubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subscription={selectedSubscription}
      />

      <AlertDialog
        open={!!subscriptionToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setSubscriptionToDelete(null);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.username
                ? `${deleting.username} loses`
                : "The user loses"}{" "}
              all Pro access right away. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Removing
                </>
              ) : (
                "Remove subscription"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
