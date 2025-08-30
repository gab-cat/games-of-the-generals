"use client";

import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Crown, Shield, Star, Zap, Target, X, GamepadIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "../UserAvatar";
import { Button } from "../ui/button";
import { Id } from "../../../convex/_generated/dataModel";

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

interface OnlineUsersListProps {
  users: OnlineUser[];
  onClose: () => void;
}

const rankIcons = {
  "Private": Shield,
  "Sergeant": Shield,
  "2nd Lieutenant": Star,
  "1st Lieutenant": Star,
  "Captain": Star,
  "Major": Zap,
  "Lieutenant Colonel": Zap,
  "Colonel": Target,
  "1 Star General": Crown,
  "2 Star General": Crown,
  "3 Star General": Crown,
  "4 Star General": Crown,
  "5 Star General": Crown,
};

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

export function OnlineUsersList({ users, onClose }: OnlineUsersListProps) {
  const navigate = useNavigate();

  const handleUserClick = (username: string) => {
    void navigate({ to: "/profile", search: { u: username } });
  };

  const getActivityIcon = (user: OnlineUser) => {
    if (user.gameId) {
      return <GamepadIcon className="w-3 h-3 text-green-400" />;
    }
    if (user.lobbyId) {
      return <Target className="w-3 h-3 text-blue-400" />;
    }
    return <div className="w-3 h-3 bg-green-400 rounded-full" />;
  };

  const getActivityText = (user: OnlineUser) => {
    if (user.gameId) {
      return "In Game";
    }
    if (user.lobbyId) {
      return "In Lobby";
    }
    return ""; // Empty string for online status
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-64 bg-gray-950/80 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-gray-950/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white/90 font-medium text-sm">Online Players</span>
          <span className="text-white/60 text-xs">({users.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Users List */}
      <div className="max-h-96 overflow-y-auto">
        {users.length === 0 ? (
          <div className="p-4 text-center text-white/60 text-sm">
            No players online
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {users.map((user) => {
              const RankIcon = rankIcons[user.rank as keyof typeof rankIcons] || Shield;
              const rankColor = rankColors[user.rank as keyof typeof rankColors] || "text-gray-400";

              return (
                <motion.div
                  key={user.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                  onClick={() => handleUserClick(user.username)}
                >
                  {/* Avatar */}
                  <UserAvatar
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                    rank={user.rank}
                    size="xs"
                    className="ring-1 ring-white/20 flex-shrink-0"
                  />

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-white/90 text-xs font-medium truncate">
                          {user.username}
                        </span>
                        <RankIcon className={cn("w-3 h-3 flex-shrink-0", rankColor)} />
                      </div>
                      {/* Green dot next to username */}
                      <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                    </div>
                    {getActivityText(user) && (
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        {getActivityIcon(user)}
                        <span>{getActivityText(user)}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-gray-950/20">
        <div className="text-center text-white/50 text-xs">
          Click on a player to view their profile
        </div>
      </div>
    </motion.div>
  );
}
