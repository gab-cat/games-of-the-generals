import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Target, Clock, Sword, Crown, Medal, Calendar, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Id } from "../../convex/_generated/dataModel";

interface MatchHistoryProps {
  userId: string;
  onViewReplay?: (gameId: Id<"games">) => void;
}

export function MatchHistory({ userId, onViewReplay }: MatchHistoryProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 8; // Increased from 5 to reduce pagination requests
  
  const matchHistory = useQuery(api.games.getMatchHistory, { 
    userId: userId as Id<"users">,
    limit: pageSize,
    offset: currentPage * pageSize,
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
      case "flag_captured":
        return "Flag Captured";
      case "flag_reached_base":
        return "Flag Reached Base";
      case "timeout":
        return "Time Expired";
      case "surrender":
        return "Surrender";
      case "elimination":
        return "Elimination";
      default:
        return "Game Over";
    }
  };

  if (matchHistory === undefined) {
    return (
      <div className="flex justify-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!matchHistory || matchHistory.matches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <Medal className="h-12 w-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60">No battle history yet.</p>
        <p className="text-sm text-white/40">Fight your first battle to start your legend!</p>
      </motion.div>
    );
  }

  const totalPages = Math.ceil(matchHistory.total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-4"
        >
          {/* Battle Chronicles Icon Section */}
          <motion.div
            initial={{ scale: 0, rotateY: -180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
            className="w-12 h-12 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
          >
            {/* Animated history scroll effect */}
            <motion.div
              animate={{ y: [-20, 20, -20] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-blue-500/10 rounded-xl"
            />
            <Calendar className="h-6 w-6 text-purple-400 relative z-10" />
          </motion.div>
          
          <div className="flex flex-col">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <h3 className="text-lg font-semibold text-white/90">Battle Chronicles</h3>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">{matchHistory.total} battles</Badge>
            </motion.div>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex items-center gap-2"
            >
              <div className="h-0.5 w-8 bg-gradient-to-r from-purple-500/60 to-blue-500/60 rounded-full"></div>
              <span className="text-xs text-white/50 font-mono">
                Victory and defeat records
              </span>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-white/60">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
      
      <div className="space-y-2">
        {matchHistory.matches.map((match, index: number) => (
          <motion.div
            key={match._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {getResultIcon(match.isWin, match.isDraw)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate text-white/90">vs {match.opponentUsername}</span>
                        {getResultBadge(match.isWin, match.isDraw)}
                      </div>
                      <div className="text-xs truncate bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 px-2 rounded-md flex w-fit mt-1 mb-2">{match.lobbyName}</div>
                      <div className="flex items-center gap-3 text-xs text-white/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(match.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(match.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Sword className="h-3 w-3" />
                          {match.moves}m
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {match.rankAtTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs text-white/60">
                      {getReasonText(match.reason)}
                    </div>
                    {onViewReplay && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewReplay(match.gameId)}
                        className="h-6 px-2 text-xs rounded-full bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Replay
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
