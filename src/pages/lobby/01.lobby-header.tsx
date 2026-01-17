import { motion } from "framer-motion";
import { Target, Trophy, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { UserBadge } from "../../components/UserBadge";
import { Id } from "../../../convex/_generated/dataModel";
import Squares from "../../components/backgrounds/Squares/Squares";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
  elo?: number;
  tier?: "free" | "pro" | "pro_plus";
  isDonor?: boolean;
}

interface LobbyHeaderProps {
  profile: Profile;
}

export function LobbyHeader({ profile }: LobbyHeaderProps) {
  const winRate =
    profile.gamesPlayed > 0
      ? Math.round((profile.wins / profile.gamesPlayed) * 100)
      : 0;
  const tier = profile.tier || "free";
  const isPro = tier === "pro";
  const isProPlus = tier === "pro_plus";
  const isDonor = profile.isDonor;

  return (
    <Card
      className={cn(
        "bg-zinc-900/60 backdrop-blur-md border shadow-2xl relative overflow-hidden transition-all duration-500 rounded-sm",
        isPro && "border-blue-500/20 shadow-blue-500/10",
        isProPlus && "border-amber-500/20 shadow-amber-500/10",
        !isPro && !isProPlus && "border-white/5",
      )}
    >
      {/* Tech Corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/10" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/10" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/10" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/10" />

      {isProPlus && (
        <motion.div
          animate={{
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none"
        />
      )}

      {/* Animated Squares Background */}
      <div className="absolute inset-0 rounded-sm overflow-hidden opacity-30 pointer-events-none">
        <Squares
          direction="diagonal"
          speed={0.2}
          borderColor={
            isProPlus
              ? "rgba(245,158,11,0.1)"
              : isPro
                ? "rgba(59,130,246,0.1)"
                : "rgba(255,255,255,0.05)"
          }
        />
      </div>

      <CardHeader className="p-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-0">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col sm:flex-row sm:items-center gap-6"
          >
            {/* Stats Icon Section */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
              className={cn(
                "w-16 h-16 rounded-sm flex items-center justify-center shadow-lg relative overflow-hidden mx-auto sm:mx-0 flex-shrink-0 transition-all duration-500 border group",
                isProPlus
                  ? "bg-amber-500/10 border-amber-500/30"
                  : isPro
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-zinc-800/50 border-white/10",
              )}
            >
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000" />

              <Target
                className={cn(
                  "h-8 w-8 relative z-10",
                  isProPlus
                    ? "text-amber-400"
                    : isPro
                      ? "text-blue-400"
                      : "text-zinc-400",
                )}
              />
            </motion.div>

            <div className="flex flex-col text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  {(isPro || isProPlus) && (
                    <UserBadge
                      type={isProPlus ? "pro_plus" : "pro"}
                      size="sm"
                      showText={false}
                      className="shadow-none"
                    />
                  )}
                  <CardTitle className="text-xl sm:text-2xl font-display font-medium text-white">
                    {profile.username}
                  </CardTitle>
                </div>
                {isDonor && (
                  <UserBadge
                    type="donor"
                    size="sm"
                    className="mx-auto sm:mx-0"
                  />
                )}
              </div>

              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <Badge
                  variant="outline"
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase bg-transparent border-opacity-40 rounded-sm h-5",
                    isProPlus
                      ? "text-amber-400 border-amber-500"
                      : isPro
                        ? "text-blue-400 border-blue-500"
                        : "text-zinc-400 border-zinc-600",
                  )}
                >
                  <Trophy className="h-3 w-3" />
                  Rank: {profile.rank}
                </Badge>

                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest hidden sm:inline-block">
                  //{" "}
                  {isProPlus ? "Elite Cmdr" : isPro ? "Pro Cmdr" : "Commander"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center sm:justify-end gap-x-8 gap-y-4"
          >
            {/* Wins */}
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">
                Victory
              </span>
              <span className="text-2xl font-mono text-green-400 tracking-tight">
                {profile.wins}
              </span>
            </div>

            {/* Losses */}
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">
                Defeat
              </span>
              <span className="text-2xl font-mono text-red-400 tracking-tight">
                {profile.losses}
              </span>
            </div>

            {/* Win Rate */}
            <div className="flex flex-col items-center sm:items-end relative group cursor-help">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                Win Rate
              </span>
              <span className="text-2xl font-mono text-blue-400 tracking-tight">
                {winRate}%
              </span>
            </div>

            {/* ELO */}
            <div className="flex flex-col items-center sm:items-end">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  ELO Rating
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-zinc-600 hover:text-zinc-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-zinc-900 border border-white/10 text-xs font-mono max-w-[200px]"
                    >
                      Calculated from Quick Match performance only.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-2xl font-mono text-yellow-400 tracking-tight">
                {profile.elo ?? 1500}
              </span>
            </div>
          </motion.div>
        </div>
      </CardHeader>
    </Card>
  );
}
