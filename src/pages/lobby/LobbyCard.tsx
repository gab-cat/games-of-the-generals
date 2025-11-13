

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { useQuery } from "convex-helpers/react/cache";
import { motion } from "framer-motion";
import { Users, MessageCircle, Clock, Zap, Eye } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

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
        className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      };
  }
};

export function LobbyCard({ lobby, index, currentUserId, onJoin, onLeave, onInviteToLobby, isJoining, isLeaving }: LobbyCardProps) {
  // Fetch host profile for avatar
  const hostProfile = useQuery(api.profiles.getProfileByUsername, {
    username: lobby.hostUsername
  });

  // Fetch player profile for avatar if there's a player
  const playerProfile = useQuery(
    api.profiles.getProfileByUsername,
    lobby.playerUsername ? { username: lobby.playerUsername } : "skip"
  );

  const gameModeBadge = getGameModeBadge(lobby.gameMode);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 shadow-lg">
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 gap-3 sm:gap-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm flex-shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <UserAvatar 
                username={lobby.hostUsername}
                avatarUrl={hostProfile?.avatarUrl}
                rank={hostProfile?.rank}
                size="sm"
                className="ring-1 ring-white/20 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm sm:text-base text-white/90 truncate">{lobby.name}</h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <p className="text-xs sm:text-sm text-white/60 truncate">
                    Host: {lobby.hostUsername}
                  </p>
                  {lobby.playerUsername && playerProfile && (
                    <>
                      <span className="hidden sm:inline text-white/40">•</span>
                      <div className="flex items-center gap-1">
                        <UserAvatar 
                          username={lobby.playerUsername}
                          avatarUrl={playerProfile.avatarUrl}
                          rank={playerProfile.rank}
                          size="sm"
                          className="ring-1 ring-white/20 w-4 h-4 sm:w-5 sm:h-5"
                        />
                        <span className="text-xs sm:text-sm text-white/60 truncate">{lobby.playerUsername}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-shrink-0">
            <Badge className={gameModeBadge.className}>
              {gameModeBadge.icon}
              <span className="ml-1 hidden sm:inline">{gameModeBadge.label}</span>
            </Badge>
            <Badge variant={lobby.playerId ? "destructive" : "secondary"} className={lobby.playerId ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"}>
              {lobby.playerId ? "2/2" : "1/2"}
            </Badge>
            
            {/* Invite button - only visible for host */}
            {lobby.hostId === currentUserId && (
              <Button
                variant="ghost"
                size="sm"
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0 sm:p-2"
                onClick={() => onInviteToLobby?.(lobby._id)}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Invite</span>
              </Button>
            )}

            {lobby.hostId === currentUserId ? (
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs sm:text-sm"
                onClick={() => onLeave(lobby._id)}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin" />
                    <span className="hidden sm:inline">Deleting...</span>
                    <span className="sm:hidden">...</span>
                  </div>
                ) : (
                  "Delete"
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                className={lobby.playerId ? "bg-gray-500/20 text-gray-400 border border-gray-500/30 text-xs sm:text-sm" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs sm:text-sm"}
                onClick={() => onJoin(lobby._id)}
                disabled={!!lobby.playerId || isJoining}
              >
                {isJoining ? (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Joining...</span>
                    <span className="sm:hidden">...</span>
                  </div>
                ) : lobby.playerId ? (
                  "Full"
                ) : (
                  <>
                    <span className="hidden sm:inline">Join Battle</span>
                    <span className="sm:hidden">Join</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
