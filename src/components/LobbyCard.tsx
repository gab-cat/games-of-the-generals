import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { UserAvatar } from "./UserAvatar";
import { Users } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

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
  };
  index: number;
  currentUserId: Id<"users">;
  onJoin: (lobbyId: Id<"lobbies">) => void;
  onLeave: (lobbyId: Id<"lobbies">) => void;
}

export function LobbyCard({ lobby, index, currentUserId, onJoin, onLeave }: LobbyCardProps) {
  // Fetch host profile for avatar
  const hostProfile = useQuery(api.profiles.getProfileByUsername, { 
    username: lobby.hostUsername 
  });
  
  // Fetch player profile for avatar if there's a player
  const playerProfile = useQuery(api.profiles.getProfileByUsername, 
    lobby.playerUsername ? { username: lobby.playerUsername } : "skip"
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 shadow-lg">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm">
              <Users className="h-5 w-5 text-blue-300" />
            </div>
            <div className="flex items-center gap-3">
              <UserAvatar 
                username={lobby.hostUsername}
                avatarUrl={hostProfile?.avatarUrl}
                rank={hostProfile?.rank}
                size="sm"
                className="ring-1 ring-white/20"
              />
              <div>
                <h4 className="font-semibold text-white/90">{lobby.name}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white/60">
                    Host: {lobby.hostUsername}
                  </p>
                  {lobby.playerUsername && playerProfile && (
                    <>
                      <span className="text-white/40">•</span>
                      <div className="flex items-center gap-1">
                        <UserAvatar 
                          username={lobby.playerUsername}
                          avatarUrl={playerProfile.avatarUrl}
                          rank={playerProfile.rank}
                          size="sm"
                          className="ring-1 ring-white/20 w-5 h-5"
                        />
                        <span className="text-sm text-white/60">{lobby.playerUsername}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={lobby.playerId ? "destructive" : "secondary"} className={lobby.playerId ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-green-500/20 text-green-300 border-green-500/30"}>
              {lobby.playerId ? "2/2" : "1/2"}
            </Badge>
            {lobby.hostId === currentUserId ? (
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                onClick={() => onLeave(lobby._id)}
              >
                Delete
              </Button>
            ) : (
              <Button
                size="sm"
                className={lobby.playerId ? "bg-gray-500/20 text-gray-400 border border-gray-500/30" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"}
                onClick={() => onJoin(lobby._id)}
                disabled={!!lobby.playerId}
              >
                {lobby.playerId ? "Full" : "Join Battle"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
