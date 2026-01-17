import { motion } from "framer-motion";
import { Progress } from "../../components/ui/progress";
import { Lock, Scan } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
}

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp)
      .toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      .toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01, translateY: -2 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <div
        className={`relative h-full overflow-hidden rounded-sm border transition-all duration-300 group ${
          achievement.unlocked
            ? "bg-gradient-to-br from-zinc-900/90 to-black/90 border-yellow-500/30 shadow-[0_0_15px_-3px_rgba(234,179,8,0.1)]"
            : "bg-black/60 border-white/5 hover:border-white/10"
        }`}
      >
        {/* Background decorative elements */}
        {achievement.unlocked && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full pointer-events-none" />
        )}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />

        {/* Card Content */}
        <div className="relative p-5 flex flex-col h-full">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div
              className={`p-3 rounded-sm border ${
                achievement.unlocked
                  ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                  : "bg-white/5 border-white/5 text-white/20"
              } relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}
            >
              <div className="text-3xl relative z-10">{achievement.icon}</div>
              {achievement.unlocked && (
                <div className="absolute inset-0 bg-yellow-400/10 blur-sm animate-pulse" />
              )}
            </div>

            <div className="flex flex-col items-end">
              {achievement.unlocked ? (
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                  <Scan className="w-3 h-3" />
                  <span>ACQUIRED</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-white/40 bg-white/5 px-2 py-1 rounded-sm border border-white/5">
                  <Lock className="w-3 h-3" />
                  <span>LOCKED</span>
                </div>
              )}
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 space-y-2">
            <h3
              className={`font-display text-lg tracking-wide ${
                achievement.unlocked ? "text-white" : "text-white/40"
              }`}
            >
              {achievement.name}
            </h3>
            <p
              className={`text-sm leading-relaxed ${
                achievement.unlocked ? "text-white/60" : "text-white/20"
              }`}
            >
              {achievement.description}
            </p>
          </div>

          {/* Footer / Progress */}
          <div className="mt-6 pt-4 border-t border-white/5">
            {achievement.unlocked ? (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/30 uppercase tracking-wider">
                  Date Acquired
                </span>
                <span className="text-yellow-500/80">
                  {formatDate(achievement.unlockedAt)}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {achievement.progress !== undefined ? (
                  <>
                    <div className="flex justify-between text-[10px] uppercase font-mono tracking-wider text-white/30">
                      <span>Progress Protocol</span>
                      <span>{Math.round(achievement.progress)}%</span>
                    </div>
                    <Progress
                      value={achievement.progress}
                      className="h-1 bg-white/5"
                    />
                  </>
                ) : (
                  <div className="text-[10px] uppercase font-mono tracking-wider text-white/20 text-right">
                    Locked Content
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
