"use client";

import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useConvexQueryWithOptions } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader2, Shield, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageModerationMenu } from "./MessageModerationMenu";
import { toast } from "sonner";

interface ChatMessageProps {
  message: {
    _id?: Id<"globalChat">;
    id?: string;
    userId?: Id<"users"> | string; // Optional for system messages, allow string for optimistic messages
    username: string;
    filteredMessage: string;
    timestamp: number;
    mentions?: Id<"users">[];
    usernameColor?: string;
    adminRole?: "moderator" | "admin";
  };
  currentUserSettings?: {
    usernameColor?: string;
  } | null;
  isOptimistic?: boolean;
}

export function ChatMessage({ message, isOptimistic = false }: ChatMessageProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();

  // Get current user profile to check for self-mentions - profile data changes infrequently
  const { data: currentUser } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    {
      staleTime: 120000, // 2 minutes - profile data changes infrequently
      gcTime: 600000, // 10 minutes cache
    }
  );

  // Get all usernames for validation - usernames change infrequently
  const { data: allProfiles = [] } = useConvexQueryWithOptions(
    api.globalChat.getAllUsernames,
    {},
    {
      staleTime: 300000, // 5 minutes - usernames don't change often
      gcTime: 600000, // 10 minutes cache
    }
  );

  // Check if current user is admin/moderator
  const { data: isCurrentUserAdmin = false } = useConvexQueryWithOptions(
    api.globalChat.isUserAdmin,
    isAuthenticated ? {} : "skip",
    {
      staleTime: 300000, // 5 minutes - admin status doesn't change often
      gcTime: 600000, // 10 minutes cache
    }
  );

  // Check if current user is banned
  const { data: isCurrentUserBanned = false } = useConvexQueryWithOptions(
    api.globalChat.isUserBanned,
    isAuthenticated ? {} : "skip",
    {
      staleTime: 30000, // 30 seconds - ban status can change
      gcTime: 60000, // 1 minute cache
    }
  );

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) { // Less than 1 minute
      return "now";
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleUsernameClick = () => {
    if (isAuthenticated && message.userId) {
      void navigate({ to: "/profile", search: { u: message.username } });
    }
  };

  const handleMessageClick = () => {
    if (isAuthenticated && isCurrentUserBanned) {
      // For banned users, show a helpful message about contacting admin
      toast.info("Use the 'Message Administrator' button in your ban screen to appeal your suspension", {
        duration: 5000,
      });
    }
  };

  const renderMessageWithMentions = (text: string) => {
    const mentionRegex = /(@[\w-]+)/g;
    const parts = text.split(mentionRegex);
    const validUsernames = new Set(allProfiles.map((profile: { username: string; }) => profile.username.toLowerCase()));

    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const username = part.slice(1).toLowerCase(); // Remove @ and convert to lowercase
        const isValidUser = validUsernames.has(username);
        const isCurrentUser = currentUser && username === currentUser.username.toLowerCase();

        if (!isValidUser) {
          // Not a valid user, render as plain text
          return part;
        }

        return (
          <span
            key={index}
            className={cn(
              "px-1 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity",
              isCurrentUser
                ? "bg-yellow-500/20 text-yellow-300" // Yellow for self-mentions
                : "bg-blue-500/20 text-blue-300" // Blue for other mentions
            )}
            onClick={() => {
              // Navigate to the mentioned user's profile
              void navigate({ to: "/profile", search: { u: part.slice(1) } });
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Use custom username color if available, otherwise use a default
  const usernameColor = message.usernameColor || "#ffffff";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isOptimistic ? 0.7 : 1, y: 0 }}
      className={cn(
        "group hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors",
        isOptimistic && "bg-white/5"
      )}
    >
      <div className="flex items-start">
        {/* Username */}
        <div className="flex items-start gap-1 flex-shrink-0">
          <button
            onClick={handleUsernameClick}
            className={cn(
              "text-xs font-medium hover:underline transition-colors",
              isOptimistic && "cursor-not-allowed"
            )}
            style={{ color: usernameColor }}
            disabled={isOptimistic}
          >
            {message.username}
          </button>

          {/* Admin Badge */}
          {message.adminRole && (
            <div className={cn(
              "flex items-center gap-0.5 px-1 rounded text-xs font-medium",
              message.adminRole === "admin"
                ? "bg-red-500/20 text-red-300"
                : "bg-blue-500/20 text-blue-300"
            )}>
              {message.adminRole === "admin" ? (
                <ShieldCheck className="w-3 h-3" />
              ) : (
                <Shield className="w-3 h-3" />
              )}
              <span className="capitalize">{message.adminRole === "admin" ? "Admin" : "Mod"}</span>
            </div>
          )}
        </div>

        {/* Separator */}
        <span className="text-white/40 text-xs mr-1">:</span>

        {/* Message Content */}
        <div className="flex min-w-0 items-start w-full">
          <div className="flex items-start gap-2 w-full">
            <div
              className={cn(
                "text-white/90 text-xs leading-tight break-words flex-1",
                isOptimistic && "opacity-75",
                isCurrentUserBanned && "cursor-pointer hover:bg-white/10 rounded px-1 py-0.5 transition-colors"
              )}
              onClick={isCurrentUserBanned ? handleMessageClick : undefined}
              title={isCurrentUserBanned ? "Click to message administrator" : undefined}
            >
              {renderMessageWithMentions(message.filteredMessage)}
            </div>

            {/* Loading indicator */}
            {isOptimistic && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0"
              >
                <Loader2 className="w-3 h-3 text-white/60 animate-spin" />
              </motion.div>
            )}

            {/* Moderation Menu for Admins */}
            {isCurrentUserAdmin && !isOptimistic && message._id && message.userId && (
              <MessageModerationMenu
                messageId={message._id}
                userId={message.userId as Id<"users">}
                username={message.username}
                isOwnMessage={currentUser?.userId === message.userId}
                className="ml-auto"
                size="md"
              />
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-white/40 text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {isOptimistic ? "sending..." : formatTimestamp(message.timestamp)}
        </div>
      </div>
    </motion.div>
  );
}
