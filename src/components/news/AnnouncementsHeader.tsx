import { motion } from "framer-motion";

export function AnnouncementsHeader() {
  return (
    <div className="relative mb-8 sm:mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 24 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "circOut" }}
            className="h-[2px] bg-blue-500"
          />
          <span className="text-blue-500 font-mono text-xs tracking-[0.2em] uppercase">
            System Updates
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-display text-white tracking-tight">
          Intelligence Feed
        </h1>

        <p className="mt-2 text-white/40 text-xs sm:text-sm max-w-lg font-light leading-relaxed">
          Operational logs, strategic updates, and field reports from the
          Generals HQ.
        </p>
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
