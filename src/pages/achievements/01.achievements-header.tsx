import { motion } from "framer-motion";
import { Lock, Unlock } from "lucide-react";

interface AchievementsHeaderProps {
  unlockedCount: number;
  lockedCount: number;
  totalCount: number;
}

export function AchievementsHeader({
  unlockedCount,
  lockedCount,
  totalCount,
}: AchievementsHeaderProps) {
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="relative mb-8 sm:mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 24 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "circOut" }}
                className="h-[2px] bg-yellow-500"
              />
              <span className="text-yellow-500 font-mono text-xs tracking-[0.2em] uppercase">
                System Milestone Tracking
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-display text-white tracking-tight uppercase">
              Operational
              <br />
              Milestones
            </h1>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-mono text-white/40 tracking-widest uppercase mb-1">
                Completion Status
              </span>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-mono font-bold text-yellow-500 leading-none">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <Unlock className="w-3 h-3" />
                    <span>{unlockedCount} ACQUIRED</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-white/30">
                    <Lock className="w-3 h-3" />
                    <span>{lockedCount} LOCKED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar with technical markings */}
        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
          />
          {/* Grid markings on progress bar */}
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-white/20 uppercase tracking-wider">
          <span>Initiation</span>
          <span>Mastery</span>
        </div>
      </motion.div>

      {/* Decorative background element */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 2 }}
        className="absolute -top-24 -right-12 w-96 h-96 bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none z-0"
      />
    </div>
  );
}
