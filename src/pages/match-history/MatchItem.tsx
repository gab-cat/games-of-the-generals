import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { motion } from "framer-motion";
import { Target, Crown, Sword, Calendar, Clock, Trophy, Play } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

interface MatchItemProps {
  match: {
    _id: Id<"games">;
    gameId: Id<"games">;
    opponentUsername: string;
    isWin: boolean;
    isDraw: boolean;
    lobbyName: string | undefined;
    createdAt: number;
    duration: number;
    moves: number;
    rankAtTime: string;
    reason: string;
  };
  index: number;
  onViewReplay?: (gameId: Id<"games">) => void;
}

export function MatchItem({ match, index, onViewReplay }: MatchItemProps) {
  // Fetch opponent profile for avatar
  const { data: opponentProfile } = useConvexQuery(api.profiles.getProfileByUsername, {
    username: match.opponentUsername
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultIcon = (isWin: boolean, isDraw: boolean) => {
    if (isDraw) return <Target className="h-5 w-5 text-yellow-500" />;
    if (isWin) return <Crown className="h-5 w-5 text-green-500" />;
    return <Sword className="h-5 w-5 text-red-500" />;
  };

  const getResultBadge = (isWin: boolean, isDraw: boolean) => {
    if (isDraw) return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Draw</Badge>;
    if (isWin) return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Victory</Badge>;
    return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Defeat</Badge>;
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case "flag_captured": return "Flag Captured";
      case "flag_reached_base": return "Flag to Base";
      case "timeout": return "Timeout";
      case "surrender": return "Surrender";
      case "elimination": return "Elimination";
      default: return "Game Ended";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-white/5 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 shadow-lg">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            {/* Result icon and avatar */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {getResultIcon(match.isWin, match.isDraw)}
              <UserAvatar 
                username={match.opponentUsername}
                avatarUrl={opponentProfile?.avatarUrl}
                rank={opponentProfile?.rank}
                size="sm"
                className="ring-1 ring-white/20"
              />
            </div>
            
            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <span className="font-medium text-sm truncate text-white/90">vs {match.opponentUsername}</span>
                {getResultBadge(match.isWin, match.isDraw)}
              </div>
              
              {/* Lobby name */}
              <div className="text-xs truncate bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 px-2 py-1 rounded-md w-fit mb-2 max-w-full">
                {match.lobbyName || "Unknown Lobby"}
              </div>
              
              {/* Match details */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 sm:gap-3 text-xs text-white/60">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="truncate">{formatDate(match.createdAt)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(match.duration)}
                </span>
                <span className="flex items-center gap-1">
                  <Sword className="h-3 w-3" />
                  {match.moves}m
                </span>
                <span className="hidden lg:flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {match.rankAtTime}
                </span>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="text-xs text-white/60 text-right hidden sm:block">
                {getReasonText(match.reason)}
              </div>
              {onViewReplay && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewReplay(match.gameId)}
                  className="h-6 sm:h-7 px-2 sm:px-3 text-xs rounded-full bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
                >
                  <Play className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Replay</span>
                </Button>
              )}
              {/* Show reason on mobile */}
              <div className="text-xs text-white/60 text-right sm:hidden">
                {getReasonText(match.reason)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
