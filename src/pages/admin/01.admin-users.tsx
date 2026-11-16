import { useState } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { fadeUp, stagger } from "@/lib/motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { UserAvatar } from "@/components/UserAvatar";
import { formatDistanceToNow } from "date-fns";

const PAGE_SIZE = 50;

function TierBadge({ tier }: { tier?: string | null }) {
  if (!tier || tier === "free") {
    return <Badge variant="outline">Free</Badge>;
  }
  return (
    <Badge variant={tier === "pro_plus" ? "default" : "secondary"}>
      {tier === "pro_plus" ? "Pro+" : "Pro"}
    </Badge>
  );
}

function RowSkeleton() {
  return (
    <div className="grid grid-cols-12 items-center gap-4 border-b border-border px-4 py-3 last:border-0">
      <div className="col-span-12 flex items-center gap-3 sm:col-span-5">
        <Skeleton className="size-8 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <Skeleton className="col-span-2 hidden h-4 w-16 sm:block" />
      <Skeleton className="col-span-2 hidden h-5 w-16 sm:block" />
      <Skeleton className="col-span-3 hidden h-4 w-24 sm:block" />
    </div>
  );
}

export function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const search = searchQuery.trim();

  const { data: usersData, isLoading } = useConvexQuery(
    api.adminDashboard.getAllUsers,
    { search: searchQuery || undefined, limit: PAGE_SIZE },
  );

  const users = usersData?.users ?? [];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Search by username. Showing the first 50 matches."
        actions={
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search users"
              placeholder="Search by username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-10"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        }
      />

      <div className="mb-3 flex min-h-6 flex-wrap items-center gap-2 text-sm text-foreground/80">
        {search ? (
          <Badge variant="outline" className="gap-1.5">
            Username: <span className="">{search}</span>
          </Badge>
        ) : null}
        {!isLoading ? (
          <span className="tabular-nums">
            {users.length}
            {usersData?.hasMore ? "+" : ""}
            <span className="font-sans">
              {" "}
              {users.length === 1 && !usersData?.hasMore ? "user" : "users"}
            </span>
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-12 gap-4 border-b border-border bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-foreground/70">
          <div className="col-span-12 sm:col-span-5">User</div>
          <div className="col-span-2 hidden sm:block">Games, wins</div>
          <div className="col-span-2 hidden sm:block">Plan</div>
          <div className="col-span-3 hidden sm:block">Joined</div>
        </div>

        {isLoading ? (
          <div aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={search ? `No users match "${search}"` : "No users yet"}
              body={
                search ? "Check the spelling or try a shorter name." : undefined
              }
              action={
                search ? (
                  <Button
                    variant="secondary"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <motion.ul variants={stagger(0.015)} initial="hidden" animate="show">
            {users.map((user) => (
              <motion.li
                key={user._id}
                variants={fadeUp}
                className="grid grid-cols-12 items-center gap-x-4 gap-y-1 border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-white/[0.03]"
              >
                <div className="col-span-12 flex min-w-0 items-center gap-3 sm:col-span-5">
                  <UserAvatar
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    rank={user.rank}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {user.username}
                      </span>
                      {user.adminRole ? (
                        <Badge variant="default">
                          {user.adminRole === "admin" ? "Admin" : "Moderator"}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-foreground/70">
                      {user.email || "No email"}
                    </p>
                  </div>
                </div>

                <div className="col-span-12 flex items-center gap-4 text-sm sm:col-span-2">
                  <span className="tabular-nums text-foreground">
                    {user.gamesPlayed ?? 0}
                    <span className="font-sans text-xs text-foreground/70">
                      {" "}
                      played
                    </span>
                  </span>
                  <span className="tabular-nums text-emerald-400">
                    {user.wins ?? 0}
                    <span className="font-sans text-xs text-foreground/70">
                      {" "}
                      won
                    </span>
                  </span>
                </div>

                <div className="col-span-6 flex flex-col items-start gap-1 sm:col-span-2">
                  <TierBadge tier={user.subscription?.tier} />
                  {user.subscription?.expiresAt ? (
                    <span className="text-xs text-muted-foreground">
                      Until{" "}
                      {new Date(
                        user.subscription.expiresAt,
                      ).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>

                <div className="col-span-6 text-right text-xs text-muted-foreground sm:col-span-3 sm:text-left">
                  {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>

      {usersData?.hasMore ? (
        <p className="mt-3 text-sm text-foreground/80">
          Showing the first {PAGE_SIZE}. Search by username to find someone
          else.
        </p>
      ) : null}
    </div>
  );
}
