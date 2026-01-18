import { motion } from "framer-motion";
import { Settings as SettingsIcon, Terminal } from "lucide-react";

export function SettingsHeader() {
  return (
    <div className="mb-12 space-y-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <div className="flex items-center gap-3 text-blue-400/60 font-mono text-xs tracking-[0.2em] uppercase bg-blue-500/5 border border-blue-500/10 px-3 py-1 rounded-full">
          <Terminal className="w-3.5 h-3.5" />
          <span>System Configuration</span>
        </div>
      </motion.div>

      <div className="flex flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-display font-medium text-white tracking-tight flex items-center gap-4"
        >
          <motion.div
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <SettingsIcon className="w-5 h-5 text-blue-400" />
          </motion.div>
          Command Center
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 flex items-center gap-3"
        >
          <div className="h-px bg-zinc-800 w-12" />
          <p className="text-zinc-500 text-sm font-mono tracking-wide">
            MANAGE PROFILE • SECURITY • PREFERENCES
          </p>
          <div className="h-px bg-zinc-800 w-12" />
        </motion.div>
      </div>
    </div>
  );
}
