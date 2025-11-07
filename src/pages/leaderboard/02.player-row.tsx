import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Target } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { UserAvatar } from "../../components/UserAvatar";
import { ExpandableCard } from "../../components/ExpandableCard";
import { ExpandedPlayerStats } from "./06.expanded-player-stats";
import { useConvexQueryWithOptions } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { useState, useEffect } from "react";
import { useQuery } from "convex-helpers/react/cache";

interface Player {
  _id: string;
  username: string;
  avatarUrl?: string;
  rank: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  position: number;
}

interface PlayerRowProps {
  player: Player;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PlayerRow({ player, index, isExpanded, onToggle }: PlayerRowProps) {
  const [showCongrats, setShowCongrats] = useState(false);

  // Fetch detailed profile stats when expanded
  const { data: profileStats, isPending: isLoadingStats } = useConvexQueryWithOptions(
    api.profiles.getProfileStatsByUsername,
    { username: player.username },
    { enabled: isExpanded }
  );

  // Get current user profile
  const currentProfile = useQuery(api.profiles.getCurrentProfile, {});

  // Show congratulations only for the current user in top positions (once per day)
  useEffect(() => {
    if (player.position <= 10 && currentProfile && player.username === currentProfile.username) {
      const storageKey = `leaderboard_congrats_${player.position}_${currentProfile.username}`;
      const lastShown = localStorage.getItem(storageKey);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      // Show congratulations if never shown before or if more than 24 hours have passed
      const shouldShow = !lastShown || (now - parseInt(lastShown)) > oneDay;

      if (shouldShow) {
        const timer = setTimeout(() => {
          setShowCongrats(true);
          // Mark as shown today
          localStorage.setItem(storageKey, now.toString());
        }, 500 + (index * 200)); // Stagger the congratulations
        return () => clearTimeout(timer);
      }
    }
  }, [player.position, index, currentProfile, player.username]);

  const getCongratulationsContent = () => {
    switch (player.position) {
      case 1:
        return {
          title: "🏆 CHAMPION OF THE REALM! 🏆",
          description: `Incredible victory, ${player.username}! You've claimed the throne as the ultimate strategist. Your tactical brilliance and commanding presence have earned you the highest honor in the kingdom of Generals.`,
          emoji: "👑",
          bgColor: "from-yellow-500/20 to-amber-600/20",
          borderColor: "border-yellow-400",
          textColor: "text-yellow-300",
          stats: `With ${player.wins} victories and a ${player.winRate.toFixed(1)}% win rate, you stand unrivaled!`
        };
      case 2:
        return {
          title: "🥈 SILVER COMMANDER! 🥈",
          description: `Outstanding performance, ${player.username}! You've secured the silver medal and proven yourself as a master strategist. Your tactical prowess places you among the elite.`,
          emoji: "🥈",
          bgColor: "from-slate-400/20 to-gray-500/20",
          borderColor: "border-slate-400",
          textColor: "text-slate-300",
          stats: `${player.wins} wins and ${player.winRate.toFixed(1)}% win rate - a testament to your strategic excellence!`
        };
      case 3:
        return {
          title: "🥉 BRONZE WARRIOR! 🥉",
          description: `Impressive achievement, ${player.username}! You've earned the bronze medal and proven your mettle on the battlefield. Your strategic mind commands respect from all.`,
          emoji: "🥉",
          bgColor: "from-orange-500/20 to-amber-600/20",
          borderColor: "border-orange-400",
          textColor: "text-orange-300",
          stats: `Commanding ${player.wins} victories with a ${player.winRate.toFixed(1)}% win rate!`
        };
      case 4:
      case 5:
        return {
          title: "🎖️ ELITE STRATEGIST! 🎖️",
          description: `Well done, ${player.username}! You've reached the elite ranks and proven your strategic prowess. Your skills place you among the top contenders.`,
          emoji: "🎖️",
          bgColor: "from-purple-500/20 to-indigo-500/20",
          borderColor: "border-purple-400",
          textColor: "text-purple-300",
          stats: `${player.wins} wins at ${player.winRate.toFixed(1)}% - elite performance!`
        };
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
        return {
          title: "⭐ TOP 10 CONTENDER! ⭐",
          description: `Congratulations, ${player.username}! You've secured a spot in the top 10 and demonstrated exceptional strategic ability. Keep climbing the ranks!`,
          emoji: "⭐",
          bgColor: "from-blue-500/20 to-cyan-500/20",
          borderColor: "border-blue-400",
          textColor: "text-blue-300",
          stats: `Position #${player.position} with ${player.wins} victories!`
        };
      default:
        return null;
    }
  };

  // Expanded content component
  const expandedContent = (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 p-6 py-0 w-full max-w-4xl">
        {isLoadingStats ? (
          <div className="flex justify-center items-center py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"
            />
          </div>
        ) : profileStats ? (
          <ExpandedPlayerStats profileStats={profileStats} />
        ) : (
          <div className="text-center py-8 text-red-400 text-sm">
            Failed to load profile stats
          </div>
        )}
      </div>
    </div>
  );

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Trophy className="h-5 w-5 text-orange-500" />;
      default:
        return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 via-amber-400/20 to-orange-500/20 backdrop-blur-md border-2 border-yellow-400/50 shadow-2xl shadow-yellow-500/20 relative overflow-hidden";
      case 2:
        return "bg-gradient-to-r from-slate-300/20 via-gray-400/20 to-slate-500/20 backdrop-blur-md border-2 border-slate-400/50 shadow-xl shadow-slate-400/15 relative overflow-hidden";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 via-orange-500/20 to-red-500/20 backdrop-blur-md border-2 border-orange-500/50 shadow-xl shadow-orange-500/15 relative overflow-hidden";
      default:
        if (position <= 10) {
          return "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 backdrop-blur-sm border border-blue-500/20 shadow-lg shadow-blue-500/10";
        }
        return "bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <ExpandableCard
        isExpanded={isExpanded}
        onExpand={onToggle}
        onCollapse={onToggle}
        overlay={true}
        overlayClassName="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        className={isExpanded ? "z-30" : ""}
        expandedContent={expandedContent}
      >
        <Card
          className={`${getRankColor(player.position)} mx-auto max-w-4xl hover:bg-white/10 hover:scale-[1.01] cursor-pointer transition-all duration-200 ${
            player.position <= 3 ? 'transform-gpu' : ''
          }`}
        >
          {/* Special top 3 effects */}
          {player.position === 1 && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 animate-pulse"></div>
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-20 animation-delay-1000"></div>
            </>
          )}
          {player.position === 2 && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-400/5 via-transparent to-slate-400/5"></div>
              <div className="absolute -top-1 -left-1 w-5 h-5 bg-slate-400 rounded-full animate-pulse opacity-15"></div>
            </>
          )}
          {player.position === 3 && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-pulse opacity-15"></div>
            </>
          )}

          <CardContent className={`relative z-10 ${player.position <= 3 ? 'p-4 sm:p-5' : 'p-2 sm:p-3'} flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3`}>
            {/* Main Info Section - Always visible */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className={`flex items-center gap-1.5 min-w-[40px] sm:min-w-[48px] flex-shrink-0 ${
                player.position <= 3 ? 'gap-2' : ''
              }`}>
                <div className={player.position <= 3 ? 'relative' : ''}>
                  {getRankIcon(player.position)}
                  {player.position <= 3 && (
                    <div className={`absolute -inset-1 rounded-full blur-sm ${
                      player.position === 1 ? 'bg-yellow-400/30' :
                      player.position === 2 ? 'bg-slate-400/30' :
                      'bg-orange-500/30'
                    }`}></div>
                  )}
                </div>
                <span className={`font-bold text-white/90 ${
                  player.position <= 3 ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                }`}>
                  #{player.position}
                </span>
              </div>

              <UserAvatar
                username={player.username}
                avatarUrl={player.avatarUrl}
                rank={player.rank}
                size={player.position <= 3 ? "md" : "sm"}
                className={`flex-shrink-0 ${
                  player.position <= 3 ? 'ring-2 ring-white/30 shadow-lg' : 'ring-1 ring-white/20'
                }`}
              />

              <div className="min-w-0 flex-1">
                <h4 className={`font-semibold text-white/90 truncate leading-tight ${
                  player.position <= 3 ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                }`}>
                  {player.username}
                </h4>
                <Badge variant="outline" className={`flex items-center gap-1 w-fit text-xs px-1.5 py-0.5 mt-0.5 ${
                  player.position <= 3
                    ? 'bg-gradient-to-r from-white/20 to-white/10 text-white border-white/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  <Target className="h-2.5 w-2.5" />
                  <span className="text-xs hidden sm:inline">{player.rank}</span>
                  <span className="text-xs sm:hidden">
                    {player.rank === "Colonel" ? "Col" :
                     player.rank === "Major" ? "Maj" :
                     player.rank === "Captain" ? "Cpt" :
                     player.rank === "Lieutenant" ? "Lt" :
                     player.rank === "Sergeant" ? "Sgt" :
                     player.rank}
                  </span>
                </Badge>
              </div>
            </div>

            {/* Stats Section - Desktop: inline, Mobile: below */}
            <div className={`grid grid-cols-4 gap-2 sm:gap-4 text-center flex-shrink-0 mt-3 sm:mt-0 border-t border-white/10 sm:border-t-0 pt-3 sm:pt-0 ${
              player.position <= 3 ? 'min-w-[160px] sm:min-w-[180px]' : 'min-w-[140px] sm:min-w-[160px]'
            }`}>
              <div>
                <div className={`font-bold leading-tight ${
                  player.position <= 3 ? 'text-base sm:text-lg text-green-300' : 'text-sm sm:text-base text-green-400'
                }`}>
                  {player.wins}
                </div>
                <div className="text-xs text-white/60 leading-tight">
                  <span className="hidden sm:inline">Wins</span>
                  <span className="sm:hidden">W</span>
                </div>
              </div>
              <div>
                <div className={`font-bold leading-tight ${
                  player.position <= 3 ? 'text-base sm:text-lg text-red-300' : 'text-sm sm:text-base text-red-400'
                }`}>
                  {player.losses}
                </div>
                <div className="text-xs text-white/60 leading-tight">
                  <span className="hidden sm:inline">Losses</span>
                  <span className="sm:hidden">L</span>
                </div>
              </div>
              <div>
                <div className={`font-bold leading-tight ${
                  player.position <= 3 ? 'text-base sm:text-lg text-white' : 'text-sm sm:text-base text-white/90'
                }`}>
                  {player.gamesPlayed}
                </div>
                <div className="text-xs text-white/60 leading-tight">
                  <span className="hidden sm:inline">Battles</span>
                  <span className="sm:hidden">G</span>
                </div>
              </div>
              <div>
                <div className={`font-bold leading-tight ${
                  player.winRate >= 70
                    ? player.position <= 3 ? 'text-green-300' : 'text-green-400'
                    : player.winRate >= 50
                    ? player.position <= 3 ? 'text-yellow-300' : 'text-yellow-400'
                    : player.position <= 3 ? 'text-red-300' : 'text-red-400'
                } ${
                  player.position <= 3 ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                }`}>
                  {player.winRate.toFixed(1)}%
                </div>
                <div className="text-xs text-white/60 leading-tight">
                  <span className="hidden sm:inline">Win Rate</span>
                  <span className="sm:hidden">WR</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </ExpandableCard>

      {/* Congratulations Dialog */}
      {(() => {
        const congrats = getCongratulationsContent();
        return congrats ? (
          <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
            <DialogContent className={`max-w-md border-2 ${congrats.borderColor} bg-gradient-to-br ${congrats.bgColor} backdrop-blur-xl`}>
              <DialogHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                    className="text-6xl"
                  >
                    {congrats.emoji}
                  </motion.div>
                </div>

                <DialogTitle className={`text-xl sm:text-2xl font-bold ${congrats.textColor} leading-tight`}>
                  {congrats.title}
                </DialogTitle>

                <DialogDescription className="text-white/90 text-sm sm:text-base leading-relaxed">
                  {congrats.description}
                </DialogDescription>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className={`text-center p-3 rounded-lg bg-black/20 border border-white/10 ${congrats.textColor} font-semibold`}
                >
                  {congrats.stats}
                </motion.div>
              </DialogHeader>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex justify-center mt-4"
              >
                <UserAvatar
                  username={player.username}
                  avatarUrl={player.avatarUrl}
                  rank={player.rank}
                  size="lg"
                  className="ring-2 ring-white/30"
                />
              </motion.div>
            </DialogContent>
          </Dialog>
        ) : null;
      })()}
    </motion.div>
  );
}
