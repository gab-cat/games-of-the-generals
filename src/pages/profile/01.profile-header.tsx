import { motion } from "framer-motion";
import { Badge } from "../../components/ui/badge";
import { UserAvatar } from "../../components/UserAvatar";
import { Settings } from "lucide-react";

interface ProfileStats {
  username: string;
  avatarUrl?: string;
  rank: string;
  createdAt: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
}

interface ProfileHeaderProps {
  profileStats: ProfileStats;
  onAvatarSettingsToggle: () => void;
}

export function ProfileHeader({ profileStats, onAvatarSettingsToggle }: ProfileHeaderProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "General": return "from-yellow-500 to-amber-600";
      case "Colonel": return "from-purple-500 to-violet-600";
      case "Major": return "from-blue-500 to-indigo-600";
      case "Captain": return "from-green-500 to-emerald-600";
      case "Lieutenant": return "from-orange-500 to-red-600";
      case "Sergeant": return "from-red-500 to-pink-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gray-800/30 backdrop-blur-xl rounded-xl border border-white/5 p-6 mb-6"
    >
      <div className="flex items-center justify-between">
        {/* Left side - Avatar and Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar 
              username={profileStats.username}
              avatarUrl={profileStats.avatarUrl}
              rank={profileStats.rank}
              size="xl"
              className="ring-1 ring-white/20 shadow-lg"
            />
            <button
              onClick={onAvatarSettingsToggle}
              className="absolute -bottom-0.5 -right-0.5 bg-gray-900/90 backdrop-blur-sm rounded-full p-1.5 ring-1 ring-white/20 hover:bg-gray-800/90 transition-colors"
              title="Change avatar"
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
          </div>
        
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {profileStats.username}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs px-2 py-0.5 bg-gradient-to-r ${getRankColor(profileStats.rank)} text-white border-0 font-medium`}>
                {profileStats.rank}
              </Badge>
              <div className="text-gray-500 text-xs">Member since {formatDate(profileStats.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Right side - Main Stats */}
        <div className="flex gap-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-green-400">{profileStats.wins}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Wins</div>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-red-400">{profileStats.losses}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Losses</div>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-blue-400">{profileStats.gamesPlayed}</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Games</div>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-purple-400">{profileStats.winRate}%</div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">Win Rate</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
