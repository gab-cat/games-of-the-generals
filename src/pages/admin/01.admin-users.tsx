import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Shield,
  Mail,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import { formatDistanceToNow } from "date-fns";

export function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: usersData, isLoading } = useConvexQuery(
    api.adminDashboard.getAllUsers,
    { search: searchQuery || undefined, limit: 50 },
  );

  const getTierBadge = (tier?: string | null) => {
    if (!tier || tier === "free") return null;

    const styles = {
      pro: "text-blue-400 border-blue-500/30 bg-blue-500/10",
      pro_plus: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    };

    return (
      <span
        className={cn(
          "px-1.5 py-0.5 rounded-sm text-[10px] font-mono uppercase border tracking-wider",
          styles[tier as keyof typeof styles],
        )}
      >
        {tier === "pro_plus" ? "Pro+" : tier}
      </span>
    );
  };

  const getAdminBadge = (role?: string | null) => {
    if (!role) return null;

    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-mono uppercase tracking-wider">
        <Shield className="w-3 h-3" />
        {role}
      </span>
    );
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
            <Users className="w-6 h-6 text-zinc-400 group-hover/back:text-white transition-colors" />
          </Link>
          <div>
            <h2 className="text-2xl font-display font-medium text-white tracking-wide">
              User Database
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">
              <Terminal className="w-3 h-3" />
              <span>Registry Access Level: Admin</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-96 group">
          <div className="absolute inset-0 bg-blue-500/5 rounded-sm blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
          <Input
            placeholder="Search Protocol: Enter username or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900/40 border-white/10 text-white placeholder:text-zinc-600 font-mono text-xs h-10 rounded-sm focus:border-blue-500/50 focus:bg-zinc-900/80 transition-all"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="relative rounded-sm border border-white/5 bg-zinc-900/20 backdrop-blur-sm overflow-hidden">
        {/* Decorative corners */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20" />

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 bg-zinc-950/50">
          <div className="col-span-5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Identity
          </div>
          <div className="col-span-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:block">
            Combat Record
          </div>
          <div className="col-span-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden md:block">
            Clearance
          </div>
          <div className="col-span-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden lg:block">
            Timeline
          </div>
          <div className="col-span-1" />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest animate-pulse">
              Accessing Database...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!usersData?.users || usersData.users.length === 0) && (
          <div className="p-12 text-center border-b border-white/5">
            <div className="w-16 h-16 bg-zinc-900 rounded-sm border border-white/5 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-500 font-mono text-sm">
              {searchQuery
                ? "No records match search parameters"
                : "Database empty"}
            </p>
          </div>
        )}

        {/* Users Rows */}
        <div className="divide-y divide-white/5">
          {!isLoading &&
            usersData?.users.map((user, index) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.01 }}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors items-center group relative"
              >
                {/* Hover indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* User Info */}
                <div className="col-span-12 sm:col-span-5 flex items-center gap-4 min-w-0">
                  <UserAvatar
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    rank={user.rank}
                    size="sm"
                    className="ring-1 ring-white/10 group-hover:ring-white/20 transition-all rounded-sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate font-display">
                        {user.username}
                      </span>
                      {getAdminBadge(user.adminRole)}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate opacity-50">
                        {user.email || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="col-span-2 hidden sm:flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                      Matches
                    </span>
                    <span className="text-sm font-mono text-zinc-300 tabular-nums">
                      {user.gamesPlayed ?? 0}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                      Wins
                    </span>
                    <span className="text-sm font-mono text-green-400 tabular-nums">
                      {user.wins ?? 0}
                    </span>
                  </div>
                </div>

                {/* Subscription */}
                <div className="col-span-2 hidden md:flex items-center">
                  {user.subscription ? (
                    <div className="flex flex-col items-start gap-1">
                      {getTierBadge(user.subscription.tier)}
                      {user.subscription.expiresAt && (
                        <span className="text-[9px] text-zinc-600 font-mono">
                          Exp:{" "}
                          {new Date(
                            user.subscription.expiresAt,
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-600 uppercase font-mono tracking-widest border border-white/5 px-1.5 py-0.5 rounded-sm">
                      Standard
                    </span>
                  )}
                </div>

                {/* Joined Date */}
                <div className="col-span-2 hidden lg:flex items-center gap-2 text-xs text-zinc-500 font-mono">
                  <span>
                    {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                  </span>
                </div>

                {/* Action */}
                <div className="col-span-12 sm:col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-sm hover:bg-white/10 text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-white/10">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Load More */}
      {usersData?.hasMore && (
        <div className="flex justify-center pt-4">
          <button className="px-6 py-2 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-white/20 rounded-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            [ Load Additional Records ]
          </button>
        </div>
      )}
    </div>
  );
}
