import { motion } from "framer-motion";
import { History, Swords, Activity } from "lucide-react";

interface MatchHistoryHeaderProps {
  totalMatches: number;
}

export function MatchHistoryHeader({ totalMatches }: MatchHistoryHeaderProps) {
  return (
    <div className="relative mb-8 sm:mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 24 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "circOut" }}
                className="h-[2px] bg-blue-500"
              />
              <span className="text-blue-500 font-mono text-xs tracking-[0.2em] uppercase">
                Archive Protocols
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-display text-white tracking-tight">
              Combat Log
            </h1>
            <p className="mt-2 text-white/40 text-xs sm:text-sm max-w-lg font-light leading-relaxed">
              Review past engagements and analyze combat performance statistics.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-mono text-white/40 tracking-widest uppercase mb-1">
                Total Engagements
              </span>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <Swords className="w-4 h-4 text-blue-500" />
                <span className="text-2xl font-mono font-bold text-white leading-none">
                  {totalMatches}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Decorative background element */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 2 }}
        className="absolute -top-12 -left-12 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none z-0"
      />
    </div>
  );
}
