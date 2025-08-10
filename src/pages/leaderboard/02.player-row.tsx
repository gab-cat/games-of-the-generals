import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Target } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { UserAvatar } from "../../components/UserAvatar";

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
}

export function PlayerRow({ player, index }: PlayerRowProps) {
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
        return "bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 shadow-lg shadow-yellow-500/10";
      case 2:
        return "bg-gray-400/20 backdrop-blur-sm border border-gray-400/30 shadow-lg shadow-gray-400/10";
      case 3:
        return "bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 shadow-lg shadow-orange-500/10";
      default:
        return "bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`${getRankColor(player.position)} hover:bg-white/10 transition-all duration-200`}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[60px]">
              {getRankIcon(player.position)}
              <span className="font-bold text-lg text-white/90">#{player.position}</span>
            </div>
            
            <UserAvatar 
              username={player.username}
              avatarUrl={player.avatarUrl}
              rank={player.rank}
              size="md"
              className="ring-2 ring-white/20"
            />
            
            <div>
              <h4 className="font-semibold text-lg text-white/90">{player.username}</h4>
              <Badge variant="outline" className="flex items-center gap-1 w-fit bg-blue-500/20 text-blue-300 border-blue-500/30">
                <Target className="h-3 w-3" />
                {player.rank}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-lg font-bold text-green-400">{player.wins}</div>
              <div className="text-xs text-white/60">Wins</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-400">{player.losses}</div>
              <div className="text-xs text-white/60">Losses</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white/90">{player.gamesPlayed}</div>
              <div className="text-xs text-white/60">Battles</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${
                player.winRate >= 70 
                  ? 'text-green-400' 
                  : player.winRate >= 50 
                  ? 'text-yellow-400' 
                  : 'text-red-400'
              }`}>
                {player.winRate.toFixed(1)}%
              </div>
              <div className="text-xs text-white/60">Win Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
