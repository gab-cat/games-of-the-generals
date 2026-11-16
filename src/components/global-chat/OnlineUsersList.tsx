"use client";

import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "../UserAvatar";
import { UserNameWithBadge } from "../UserNameWithBadge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { fadeUp, stagger } from "../../lib/motion";
import { Id } from "../../../convex/_generated/dataModel";

interface OnlineUser {
  userId: string;
  username: string | undefined;
  rank: string | undefined;
  avatarUrl?: string;
  lastSeenAt: number | undefined;
  currentPage?: string;
  gameId?: Id<"games">;
  lobbyId?: Id<"lobbies">;
  aiGameId?: Id<"aiGameSessions">;
  tier: "free" | "pro" | "pro_plus";
  isDonor: boolean;
  avatarFrame?: string;
  usernameColor?: string;
}

interface OnlineUsersListProps {
  users: OnlineUser[] | undefined;
  onClose: () => void;
  /** Fill the parent instead of floating as its own panel (phones). */
  embedded?: boolean;
}

function getActivity(user: OnlineUser): { text: string; dot: string } {
  if (user.gameId) return { text: "In a game", dot: "bg-red-400" };
  if (user.lobbyId) return { text: "In a lobby", dot: "bg-gold-400" };
  if (user.aiGameId) return { text: "Playing the AI", dot: "bg-gold-400" };
  return { text: "Online", dot: "bg-emerald-400" };
}

export function OnlineUsersList({
  users,
  onClose,
  embedded = false,
}: OnlineUsersListProps) {
  const navigate = useNavigate();

  const handleUserClick = (username: string) => {
    void navigate({ to: "/profile", search: { u: username } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col overflow-hidden bg-card",
        embedded
          ? "h-full"
          : "h-full w-64 rounded-lg border border-border-strong shadow-lg",
      )}
    >
      <div
        className={cn(
          "flex h-12 shrink-0 items-center gap-2 border-b border-border",
          embedded ? "pl-1.5 pr-4" : "justify-between pl-4 pr-2",
        )}
      >
        {embedded && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Back to chat"
            className="h-9 w-9"
          >
            <ArrowLeft />
          </Button>
        )}
        <h3 className="text-sm font-semibold text-foreground">
          Online now
          {users && (
            <span className="ml-2 text-xs font-normal tabular-nums text-foreground/70">
              {users.length}
            </span>
          )}
        </h3>
        {!embedded && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close online players"
            className="h-9 w-9"
          >
            <X />
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {users === undefined ? (
          <div className="space-y-1" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex h-12 items-center gap-3 px-2">
                <Skeleton className="size-7 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-foreground/80">
            No one else is online right now.
          </p>
        ) : (
          <motion.ul
            variants={stagger(0.02)}
            initial="hidden"
            animate="show"
            className="space-y-0.5"
          >
            {users.map((user) => {
              const activity = getActivity(user);
              return (
                <motion.li key={user.userId} variants={fadeUp}>
                  <button
                    type="button"
                    onClick={() =>
                      user.username && handleUserClick(user.username)
                    }
                    className="flex min-h-12 w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:bg-white/[0.1]"
                  >
                    <UserAvatar
                      username={user.username ?? ""}
                      avatarUrl={user.avatarUrl}
                      rank={user.rank}
                      size="xs"
                      frame={user.avatarFrame}
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <UserNameWithBadge
                        username={user.username ?? "Player"}
                        tier={user.tier}
                        isDonor={user.isDonor}
                        usernameColor={user.usernameColor}
                        size="md"
                      />
                      <p className="flex items-center gap-1.5 truncate text-xs text-foreground/75">
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            activity.dot,
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">
                          {user.rank ? `${user.rank} · ` : ""}
                          {activity.text}
                        </span>
                      </p>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>
    </motion.div>
  );
}
