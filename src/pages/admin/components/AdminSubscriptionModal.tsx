import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/UserAvatar";
import { Search, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Subscription {
  _id: Id<"subscriptions">;
  userId: Id<"users">;
  tier: "free" | "pro" | "pro_plus";
  status: "active" | "expired" | "grace_period" | "canceled";
  expiresAt: number;
  username?: string;
  avatarUrl?: string;
  email?: string;
}

interface AdminSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription | null; // If null, we are in "Create" mode
}

export function AdminSubscriptionModal({
  isOpen,
  onClose,
  subscription,
}: AdminSubscriptionModalProps) {
  const isEdit = !!subscription;
  const [userId, setUserId] = useState<Id<"users"> | "">(
    subscription?.userId ?? "",
  );
  const [tier, setTier] = useState<"free" | "pro" | "pro_plus">(
    subscription?.tier ?? "free",
  );
  const [status, setStatus] = useState<
    "active" | "expired" | "grace_period" | "canceled"
  >(subscription?.status ?? "active");
  const [expiresAt, setExpiresAt] = useState<string>(
    subscription?.expiresAt
      ? format(subscription.expiresAt, "yyyy-MM-dd")
      : format(new Date().setMonth(new Date().getMonth() + 1), "yyyy-MM-dd"),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    userId: Id<"users">;
    username: string;
    avatarUrl?: string;
    email?: string;
  } | null>(null);

  const searchUsers = useQuery(api.adminDashboard.searchUsersForSubscription, {
    search: searchQuery,
  });

  const createSubscription = useMutation(
    api.adminDashboard.adminCreateSubscription,
  );
  const updateSubscription = useMutation(
    api.adminDashboard.adminUpdateSubscription,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subscription) {
      setUserId(subscription.userId);
      setTier(subscription.tier);
      setStatus(subscription.status);
      setExpiresAt(format(subscription.expiresAt, "yyyy-MM-dd"));
    } else {
      setUserId("");
      setTier("free");
      setStatus("active");
      setExpiresAt(
        format(new Date().setMonth(new Date().getMonth() + 1), "yyyy-MM-dd"),
      );
      setSelectedUser(null);
      setSearchQuery("");
    }
  }, [subscription, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Choose a user first");
      return;
    }

    setIsSubmitting(true);
    try {
      const expiryTimestamp = new Date(expiresAt).getTime();

      if (isEdit && subscription) {
        await updateSubscription({
          subscriptionId: subscription._id,
          tier,
          status,
          expiresAt: expiryTimestamp,
        });
        toast.success("Subscription updated successfully");
      } else {
        await createSubscription({
          userId: userId as Id<"users">,
          tier,
          status,
          expiresAt: expiryTimestamp,
        });
        toast.success("Subscription created successfully");
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Could not save the subscription. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit subscription" : "New subscription"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Changes apply to the user right away."
              : "Choose a user, then set the plan, status and end date."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="sub-user-search">User</Label>
              {selectedUser ? (
                <div className="flex items-center justify-between rounded-md border border-gold-500/30 bg-gold-500/10 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      username={selectedUser.username}
                      avatarUrl={selectedUser.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {selectedUser.username}
                      </p>
                      <p className="truncate text-xs text-foreground/70">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Choose a different user"
                    onClick={() => {
                      setSelectedUser(null);
                      setUserId("");
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="sub-user-search"
                    placeholder="Search by username"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchQuery.length >= 2 &&
                    searchUsers &&
                    searchUsers.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border-strong bg-card shadow-lg">
                        {searchUsers.map((user) => (
                          <li key={user.userId}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(user);
                                setUserId(user.userId);
                                setSearchQuery("");
                              }}
                              className="flex min-h-12 w-full items-center gap-3 border-b border-border p-3 text-left transition-colors last:border-0 hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none"
                            >
                              <UserAvatar
                                username={user.username}
                                avatarUrl={user.avatarUrl}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {user.username}
                                </p>
                                <p className="truncate text-xs text-foreground/70">
                                  {user.email}
                                </p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  {searchQuery.length >= 2 &&
                    searchUsers &&
                    searchUsers.length === 0 && (
                      <p className="mt-2 text-sm text-foreground/80">
                        No users match "{searchQuery}".
                      </p>
                    )}
                </div>
              )}
            </div>
          )}

          {isEdit && subscription && (
            <div className="space-y-2">
              <Label>User</Label>
              <div className="flex items-center gap-3 rounded-md border border-border bg-white/[0.03] p-3">
                <UserAvatar
                  username={subscription.username ?? "Unknown"}
                  avatarUrl={subscription.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {subscription.username}
                  </p>
                  <p className="truncate text-xs text-foreground/70">
                    {subscription.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={tier} onValueChange={(val: any) => setTier(val)}>
                <SelectTrigger aria-label="Plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="pro_plus">Pro+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(val: any) => setStatus(val)}
              >
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="grace_period">Grace period</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-expires">Valid until</Label>
            <Input
              id="sub-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className=""
            />
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!isEdit && !userId)}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create subscription"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
