"use client";

import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  formatClock,
  formatFull,
  splitMentions,
} from "@/lib/chat-grouping";
import { Id } from "../../../convex/_generated/dataModel";
import { MessageModerationMenu } from "./MessageModerationMenu";
import { UserNameWithBadge } from "../UserNameWithBadge";
import { UserAvatar } from "../UserAvatar";
import { Badge } from "../ui/badge";

export interface ChatLine {
  key: string;
  _id?: Id<"globalChat">;
  userId?: string;
  username: string;
  filteredMessage: string;
  timestamp: number;
  usernameColor?: string;
  adminRole?: "moderator" | "admin";
  tier?: "free" | "pro" | "pro_plus";
  isDonor?: boolean;
  avatarUrl?: string;
  /** Lowercase usernames the server resolved for this message's @mentions. */
  mentionedUsernames?: string[];
  isOptimistic?: boolean;
}

export interface ChatViewer {
  userId?: string;
  username?: string;
  isAdmin: boolean;
  isBanned: boolean;
  showTimestamps: boolean;
}

interface ChatMessageGroupProps {
  messages: ChatLine[];
  viewer: ChatViewer;
  /** Rise in on mount. Off for the first page so a full panel doesn't ripple. */
  animate: boolean;
}

/**
 * One run of messages from one sender: avatar, name and time once, then each
 * message as its own line. Pure view: everything it shows comes in as props.
 */
export function ChatMessageGroup({
  messages,
  viewer,
  animate,
}: ChatMessageGroupProps) {
  const head = messages[0];
  const isOwn =
    !!head.isOptimistic || (!!viewer.userId && viewer.userId === head.userId);
  const me = viewer.username?.toLowerCase();

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-2.5 px-3 pb-1 pt-2.5"
    >
      {head.userId && !head.isOptimistic ? (
        <Link
          to="/profile"
          search={{ u: head.username }}
          aria-label={`${head.username}'s profile`}
          tabIndex={-1}
          className="mt-0.5 shrink-0 self-start rounded-full transition-opacity hover:opacity-85"
        >
          <UserAvatar
            username={head.username}
            avatarUrl={head.avatarUrl}
            size="sm"
          />
        </Link>
      ) : (
        <UserAvatar
          username={head.username}
          avatarUrl={head.avatarUrl}
          size="sm"
          className="mt-0.5 shrink-0"
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-1.5">
          {head.userId && !head.isOptimistic ? (
            <Link
              to="/profile"
              search={{ u: head.username }}
              className="min-w-0 rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              title={head.username}
            >
              <UserNameWithBadge
                username={head.username}
                tier={head.tier}
                isDonor={head.isDonor}
                usernameColor={head.usernameColor}
                size="md"
              />
            </Link>
          ) : (
            <UserNameWithBadge
              username={head.username}
              tier={head.tier}
              isDonor={head.isDonor}
              usernameColor={head.usernameColor}
              size="md"
              className="min-w-0"
            />
          )}

          {head.adminRole && (
            <Badge
              variant={head.adminRole === "admin" ? "default" : "secondary"}
              className="shrink-0 self-center px-1 py-0 text-[11px] leading-4"
            >
              {head.adminRole === "admin" ? "Admin" : "Mod"}
            </Badge>
          )}

          {isOwn && (
            <span className="shrink-0 text-xs text-muted-foreground">You</span>
          )}

          {viewer.showTimestamps && !head.isOptimistic && (
            <time
              dateTime={new Date(head.timestamp).toISOString()}
              title={formatFull(head.timestamp)}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {formatClock(head.timestamp)}
            </time>
          )}
        </div>

        <div className="mt-0.5 space-y-0.5">
          {messages.map((msg, i) => (
            <MessageLine
              key={msg.key}
              message={msg}
              viewer={viewer}
              me={me}
              showGutterTime={i > 0}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MessageLine({
  message,
  viewer,
  me,
  showGutterTime,
}: {
  message: ChatLine;
  viewer: ChatViewer;
  me: string | undefined;
  showGutterTime: boolean;
}) {
  const parts = splitMentions(message.filteredMessage, message.mentionedUsernames);
  const mentionsMe =
    !!me &&
    message.userId !== viewer.userId &&
    parts.some((p) => p.mention?.toLowerCase() === me);

  const canModerate =
    viewer.isAdmin && !message.isOptimistic && message._id && message.userId;

  return (
    <div
      className={cn(
        "group relative -mx-1.5 flex items-start gap-1 rounded-md px-1.5 py-0.5 transition-colors",
        mentionsMe
          ? "bg-gold-500/[0.09] before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-gold-400"
          : "[@media(hover:hover)]:hover:bg-white/[0.03]",
        message.isOptimistic && "opacity-60",
      )}
    >
      {/* Time of a follow-up line, in the avatar column on hover */}
      {showGutterTime && viewer.showTimestamps && !message.isOptimistic && (
        <time
          dateTime={new Date(message.timestamp).toISOString()}
          title={formatFull(message.timestamp)}
          className="pointer-events-none absolute -left-[2.6rem] top-[0.3rem] hidden w-9 text-right text-[10px] leading-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:hover)]:block"
        >
          {formatClock(message.timestamp).replace(/\s?[AP]M$/i, "")}
        </time>
      )}

      <p
        className={cn(
          "min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-[1.45] text-foreground",
          viewer.isBanned && "cursor-pointer",
        )}
        onClick={
          viewer.isBanned
            ? () =>
                toast.info(
                  "To appeal your suspension, use the Message administrator button on your ban screen.",
                  { duration: 5000 },
                )
            : undefined
        }
      >
        {parts.map((part, i) =>
          part.mention ? (
            <Link
              key={i}
              to="/profile"
              search={{ u: part.mention }}
              className={cn(
                "rounded px-0.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                part.mention.toLowerCase() === me
                  ? "bg-gold-500/20 text-gold-200 hover:bg-gold-500/30"
                  : "text-gold-300 hover:bg-white/[0.08]",
              )}
            >
              {part.text}
            </Link>
          ) : (
            <span key={i}>{part.text}</span>
          ),
        )}
        {message.isOptimistic && (
          <span className="ml-2 inline-flex items-center gap-1 align-middle text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Sending
          </span>
        )}
      </p>

      {canModerate && (
        <MessageModerationMenu
          messageId={message._id!}
          userId={message.userId as Id<"users">}
          username={message.username}
          isOwnMessage={viewer.userId === message.userId}
          size="sm"
          className="-my-0.5 shrink-0"
        />
      )}
    </div>
  );
}
