import { motion } from "framer-motion";
import { Gamepad2, Trophy, Skull } from "lucide-react";

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
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Removed outer container borders/bg to blend with Tab content */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          // MISSION_LOG_FEED
        </h3>
        <span className="text-[10px] text-zinc-600 font-mono">
          {recentGames?.length || 0} RECORDS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {recentGames && recentGames.length > 0 ? (
          recentGames.map((game, i) => {
            const isPlayer1 = game.player1Id === userId;
            const won =
              (isPlayer1 && game.winner === "player1") ||
              (!isPlayer1 && game.winner === "player2");
            const opponent = isPlayer1
              ? game.player2Username
              : game.player1Username;

            return (
              <motion.div
                key={game._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-sm border transition-all relative overflow-hidden group/game ${
                  won
                    ? "bg-green-500/5 border-green-500/10 hover:border-green-500/30 hover:bg-green-500/10"
                    : "bg-red-500/5 border-red-500/10 hover:border-red-500/30 hover:bg-red-500/10"
                }`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${won ? "bg-green-500" : "bg-red-500"}`}
                />

                <div className="flex items-center gap-4 min-w-0 flex-1 pl-2">
                  <div
                    className={`p-2 rounded-sm ${won ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                  >
                    {won ? (
                      <Trophy className="w-4 h-4" />
                    ) : (
                      <Skull className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold uppercase tracking-wider ${won ? "text-green-400" : "text-red-400"}`}
                      >
                        {won ? "VICTORY" : "DEFEAT"}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono hidden sm:inline-block">
                        ID: {game._id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white/90">
                      <span className="text-zinc-500 text-xs mr-2 font-mono uppercase">
                        VS
                      </span>
                      {opponent || "Unknown Agent"}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                    {game.finishedAt ? formatDate(game.finishedAt) : "N/A"}
                  </div>
                  <div
                    className={`text-xs font-mono font-bold ${won ? "text-green-500" : "text-red-500"}`}
                  >
                    {won ? "+WIN" : "-LOSS"}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/5 rounded-sm">
            <Gamepad2 className="w-10 h-10 mb-3 opacity-20 text-zinc-500" />
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-600">
              No mission data found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
