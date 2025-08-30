"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { UserAvatar } from "../UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

interface OnlineUser {
  userId: Id<"users">;
  username: string;
  rank: string;
  avatarUrl?: string;
  lastSeenAt: number;
  currentPage?: string;
  gameId?: Id<"games">;
  lobbyId?: Id<"lobbies">;
}

interface MentionAutocompleteProps {
  query: string;
  isOpen: boolean;
  onSelect: (username: string) => void;
  onClose: () => void;
}

const rankColors = {
  "Private": "text-gray-400",
  "Sergeant": "text-green-400",
  "2nd Lieutenant": "text-blue-400",
  "1st Lieutenant": "text-blue-500",
  "Captain": "text-purple-400",
  "Major": "text-purple-500",
  "Lieutenant Colonel": "text-orange-400",
  "Colonel": "text-orange-500",
  "1 Star General": "text-yellow-400",
  "2 Star General": "text-yellow-500",
  "3 Star General": "text-red-400",
  "4 Star General": "text-red-500",
  "5 Star General": "text-red-600",
};

const rankIcons = {
  "Private": "⚫",
  "Sergeant": "🟢",
  "2nd Lieutenant": "🔵",
  "1st Lieutenant": "🔵",
  "Captain": "🟣",
  "Major": "🟣",
  "Lieutenant Colonel": "🟠",
  "Colonel": "🟠",
  "1 Star General": "⭐",
  "2 Star General": "⭐",
  "3 Star General": "🔴",
  "4 Star General": "🔴",
  "5 Star General": "🔴",
};

export function MentionAutocomplete({
  query,
  isOpen,
  onSelect,
  onClose,
}: MentionAutocompleteProps) {
  // Get online users for autocomplete
  const onlineUsers = useQuery(
    api.globalChat.getOnlineUsers,
    {} // Always query for online users
  )?.filter((user): user is NonNullable<typeof user> => user !== null) || [];

  // Filter users based on query
  const filteredUsers = onlineUsers.filter((user) =>
    user.username.toLowerCase().includes(query.toLowerCase())
  );

  // Handle selection
  const handleSelect = (username: string) => {
    onSelect(username);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-64 max-h-48 overflow-y-auto bg-black/95 backdrop-blur-xl border-white/20"
        sideOffset={8}
      >
        {filteredUsers.length === 0 && query ? (
          <div className="text-center text-white/60 text-sm py-4 px-2">
            No users found matching "{query}"
          </div>
        ) : (
          <>
            {filteredUsers.map((user) => {
              const RankIcon = rankIcons[user.rank as keyof typeof rankIcons] || "⚫";
              const rankColor = rankColors[user.rank as keyof typeof rankColors] || "text-gray-400";

              return (
                <DropdownMenuItem
                  key={user.userId}
                  onClick={() => handleSelect(user.username)}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/10 focus:bg-white/10"
                >
                  {/* Avatar */}
                  <UserAvatar
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    rank={user.rank}
                    size="sm"
                    className="ring-1 ring-white/20 flex-shrink-0"
                  />

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/90 text-sm font-medium truncate">
                        {user.username}
                      </span>
                      <span className={cn("text-xs flex-shrink-0", rankColor)}>
                        {RankIcon}
                      </span>
                    </div>
                    <div className="text-white/60 text-xs">
                      {user.currentPage === "chat" ? "In Chat" :
                       user.gameId ? "In Game" :
                       user.lobbyId ? "In Lobby" : "Online"}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}

            {filteredUsers.length > 0 && (
              <>
                <DropdownMenuSeparator className="bg-white/20" />
                <div className="text-center text-white/50 text-xs py-2 px-3">
                  {filteredUsers.length === 1
                    ? "1 user found"
                    : `${filteredUsers.length} users found`}
                </div>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
