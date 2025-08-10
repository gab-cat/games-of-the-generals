import { motion } from "framer-motion";
import { Calendar, Gamepad2 } from "lucide-react";

interface RecentGame {
  _id: string;
  player1Id: string;
  player2Id?: string;
  player1Username: string;
  player2Username?: string;
  winner?: string;
  finishedAt?: number;
}

interface RecentGamesProps {
  recentGames?: RecentGame[];
  userId: string;
}

export function RecentGames({ recentGames, userId }: RecentGamesProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="bg-gray-800/25 backdrop-blur-xl rounded-xl p-6 border border-white/5 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-bold text-white">Recent Battles</h3>
      </div>
      
      <div className="h-full overflow-y-auto pr-2" style={{ maxHeight: 'calc(100% - 3rem)' }}>
        {recentGames && recentGames.length > 0 ? (
          <div className="space-y-2">
            {recentGames.map((game) => {
              const isPlayer1 = game.player1Id === userId;
              const won = (isPlayer1 && game.winner === "player1") || 
                         (!isPlayer1 && game.winner === "player2");
              const opponent = isPlayer1 ? game.player2Username : game.player1Username;

              return (
                <div
                  key={game._id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    won 
                      ? "bg-green-500/5 border-green-500/20" 
                      : "bg-red-500/5 border-red-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      won ? "bg-green-400" : "bg-red-400"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-sm font-medium truncate">vs {opponent}</div>
                      <div className="text-xs text-gray-500">
                        {game.finishedAt ? formatDate(game.finishedAt) : "Unknown"}
                      </div>
                    </div>
                  </div>
                  <div className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                    won 
                      ? "bg-green-500/10 text-green-400" 
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {won ? "W" : "L"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
            <Gamepad2 className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No recent battles</p>
            <p className="text-xs text-gray-600">Start playing!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
