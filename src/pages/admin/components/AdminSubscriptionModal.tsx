import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Search, Loader2, X, Calendar, Terminal, Shield } from "lucide-react";
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
      toast.error("Please select a user");
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
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md p-0 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[80px] -z-10" />

        <DialogHeader className="p-6 border-b border-white/5 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 border border-white/10 rounded-sm">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-display tracking-tight uppercase">
                {isEdit ? "Update Contract" : "Initialize New Contract"}
              </DialogTitle>
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                <Terminal className="w-3 h-3" />
                <span>
                  Registry System: {isEdit ? "Modification" : "Insertion"}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Selection (Only for Create) */}
          {!isEdit && (
            <div className="space-y-3">
              <Label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Target Entity
              </Label>
              {selectedUser ? (
                <div className="flex items-center justify-between p-3 bg-zinc-900 border border-blue-500/30 rounded-sm group">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      username={selectedUser.username}
                      avatarUrl={selectedUser.avatarUrl}
                      size="sm"
                      className="ring-1 ring-white/10"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {selectedUser.username}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setUserId("");
                    }}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="SCANNING FOR USERS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-zinc-900 border-white/10 text-zinc-300 font-mono text-xs uppercase focus:border-blue-500/50 rounded-sm"
                  />
                  {searchQuery.length >= 2 &&
                    searchUsers &&
                    searchUsers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 shadow-2xl z-50 rounded-sm overflow-hidden">
                        {searchUsers.map((user) => (
                          <button
                            key={user.userId}
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setUserId(user.userId);
                              setSearchQuery("");
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                          >
                            <UserAvatar
                              username={user.username}
                              avatarUrl={user.avatarUrl}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {user.username}
                              </p>
                              <p className="text-[10px] font-mono text-zinc-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {isEdit && (
            <div className="space-y-3">
              <Label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Active Entity
              </Label>
              <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-white/10 rounded-sm">
                <UserAvatar
                  username={subscription.username ?? "Unknown"}
                  avatarUrl={subscription.avatarUrl}
                  size="sm"
                  className="ring-1 ring-white/10"
                />
                <div>
                  <p className="text-sm font-medium">{subscription.username}</p>
                  <p className="text-[10px] font-mono text-zinc-500">
                    {subscription.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Access Level
              </Label>
              <Select value={tier} onValueChange={(val: any) => setTier(val)}>
                <SelectTrigger className="bg-zinc-900 border-white/10 text-zinc-300 text-xs font-mono uppercase tracking-wider rounded-sm focus:ring-0 focus:border-blue-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white rounded-sm">
                  <SelectItem value="free">FREE</SelectItem>
                  <SelectItem value="pro">PRO</SelectItem>
                  <SelectItem value="pro_plus">PRO+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Operational Status
              </Label>
              <Select
                value={status}
                onValueChange={(val: any) => setStatus(val)}
              >
                <SelectTrigger className="bg-zinc-900 border-white/10 text-zinc-300 text-xs font-mono uppercase tracking-wider rounded-sm focus:ring-0 focus:border-blue-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white rounded-sm">
                  <SelectItem value="active">ACTIVE</SelectItem>
                  <SelectItem value="expired">EXPIRED</SelectItem>
                  <SelectItem value="grace_period">GRACE PERIOD</SelectItem>
                  <SelectItem value="canceled">CANCELED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">
              Termination Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="pl-10 bg-zinc-900 border-white/10 text-zinc-300 font-mono text-xs uppercase focus:border-blue-500/50 rounded-sm"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="p-6 bg-zinc-900/30 border-t border-white/5 sm:justify-between items-center gap-4">
          <p className="hidden sm:block text-[9px] font-mono text-zinc-500 max-w-[150px] leading-tight uppercase">
            All administrative overrides are logged and audited. Procedural
            integrity verified.
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none bg-transparent border-white/10 hover:bg-white/5 text-zinc-400 font-mono text-[10px] uppercase tracking-wider rounded-sm h-9"
            >
              Abort
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10px] uppercase tracking-widest rounded-sm h-9 px-6 min-w-[140px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEdit ? (
                "[ EXECUTE UPDATE ]"
              ) : (
                "[ COMMIT REGISTRATION ]"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
