import { Button } from "@/components/ui/button";

import { UserAvatar } from "@/components/UserAvatar";
import { UserNameWithBadge } from "@/components/UserNameWithBadge";
import { useQuery } from "convex-helpers/react/cache";
import { motion } from "framer-motion";
import { Users, MessageCircle, Clock, Zap, Eye } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

import { cn } from "@/lib/utils";

interface LobbyCardProps {
  lobby: {
    _id: Id<"lobbies">;
    name: string;
    hostId: Id<"users">;
    hostUsername: string;
    playerId?: Id<"users">;
    playerUsername?: string;
    status: "waiting" | "playing" | "finished";
    isPrivate?: boolean;
    gameMode?: "classic" | "blitz" | "reveal";
  };
  index: number;
  currentUserId: Id<"users">;
  onJoin: (lobbyId: Id<"lobbies">) => void;
  onLeave: (lobbyId: Id<"lobbies">) => void;
  onInviteToLobby?: (lobbyId: Id<"lobbies">) => void;
  isJoining?: boolean;
  isLeaving?: boolean;
}

const getGameModeBadge = (gameMode?: "classic" | "blitz" | "reveal") => {
  const mode = gameMode || "classic";
  switch (mode) {
    case "blitz":
      return {
        label: "Blitz",
        icon: <Zap className="h-3 w-3" />,
        className: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      };
    case "reveal":
      return {
        label: "Reveal",
        icon: <Eye className="h-3 w-3" />,
        className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      };
    case "classic":
    default:
      return {
        label: "Classic",
        icon: <Clock className="h-3 w-3" />,
        className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      };
  }
};

export function LobbyCard({
  lobby,
  index,
  currentUserId,
  onJoin,
  onLeave,
  onInviteToLobby,
  isJoining,
  isLeaving,
}: LobbyCardProps) {
  // Fetch host profile for avatar
  const hostProfile = useQuery(api.profiles.getProfileByUsername, {
    username: lobby.hostUsername,
  });

  // Fetch player profile for avatar if there's a player
  const playerProfile = useQuery(
    api.profiles.getProfileByUsername,
    lobby.playerUsername ? { username: lobby.playerUsername } : "skip",
  );

  const gameModeBadge = getGameModeBadge(lobby.gameMode);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="group relative bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-sm p-4 hover:bg-zinc-900/80 transition-all duration-300 overflow-hidden">
        {/* Tech Corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 group-hover:border-amber-500/50 transition-colors" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 group-hover:border-amber-500/50 transition-colors" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10 group-hover:border-amber-500/50 transition-colors" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 group-hover:border-amber-500/50 transition-colors" />

        {/* Scanline Effect on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          {/* Left: Lobby Info */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Host Avatar with Hex Frame */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 bg-amber-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              <UserAvatar
                username={lobby.hostUsername}
                avatarUrl={hostProfile?.avatarUrl}
                rank={hostProfile?.rank}
                size="md"
                frame={hostProfile?.avatarFrame}
                className="relative ring-1 ring-white/10 group-hover:ring-amber-500/50 transition-all"
              />
              <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5 border border-white/10">
                <div className="p-1 bg-amber-500/20 rounded-full">
                  <Users className="w-2.5 h-2.5 text-amber-400" />
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Lobby ID: {lobby._id.slice(-4)}
                </span>
                {gameModeBadge && (
                  <div
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wider",
                      gameModeBadge.className.replace("bg-", "bg-transparent "), // Make badge background transparent for tech look
                    )}
                  >
                    {gameModeBadge.label}
                  </div>
                )}
              </div>

              <h4 className="font-display font-medium text-zinc-100 text-lg truncate group-hover:text-amber-200 transition-colors">
                {lobby.name}
              </h4>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-0.5 border border-white/5">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase">
                    Host
                  </span>
                  <UserNameWithBadge
                    username={lobby.hostUsername}
                    tier={hostProfile?.tier}
                    isDonor={hostProfile?.isDonor}
                    usernameColor={hostProfile?.usernameColor}
                    size="xs"
                  />
                </div>

                {lobby.playerUsername && playerProfile && (
                  <>
                    <span className="text-zinc-700 font-mono">VS</span>
                    <div className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-0.5 border border-white/5">
                      <span className="text-red-500/50 font-mono text-[10px] uppercase">
                        Rival
                      </span>
                      <UserNameWithBadge
                        username={lobby.playerUsername}
                        tier={playerProfile?.tier}
                        isDonor={playerProfile?.isDonor}
                        usernameColor={playerProfile?.usernameColor}
                        size="xs"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions & Status */}
          <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-3 sm:pt-0 border-t border-white/5 sm:border-0 pl-0 sm:pl-4 border-l-0 sm:border-l sm:border-white/5 border-dashed">
            <div className="flex flex-col items-end gap-1 mr-2">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Status
              </span>
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider",
                  lobby.playerId ? "text-red-400" : "text-emerald-400",
                )}
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    lobby.playerId ? "bg-red-500" : "bg-emerald-500",
                  )}
                />
                {lobby.playerId ? "Full Capacity" : "Open Slot"}
              </div>
            </div>

            {/* Invite button - only visible for host */}
            {lobby.hostId === currentUserId && (
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 h-9 font-mono text-xs uppercase tracking-wider"
                onClick={() => onInviteToLobby?.(lobby._id)}
              >
                <MessageCircle className="h-3.5 w-3.5 sm:mr-2" />
                <span className="hidden sm:inline">Invite</span>
              </Button>
            )}

            {lobby.hostId === currentUserId ? (
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 h-9 font-mono text-xs uppercase tracking-wider"
                onClick={() => onLeave(lobby._id)}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                    <span className="hidden sm:inline">Terminating...</span>
                  </div>
                ) : (
                  "Abort"
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                className={cn(
                  "h-9 font-mono text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_10px_-4px_rgba(0,0,0,0.5)]",
                  lobby.playerId
                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    : "bg-amber-600 hover:bg-amber-500 text-white border border-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]",
                )}
                onClick={() => onJoin(lobby._id)}
                disabled={!!lobby.playerId || isJoining}
              >
                {isJoining ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Syncing...</span>
                  </div>
                ) : lobby.playerId ? (
                  <span className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Full</span>
                  </span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Engage</span>
                    <span className="sm:hidden">Join</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
