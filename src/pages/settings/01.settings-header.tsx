import { motion } from "framer-motion";
import { Settings as SettingsIcon } from "lucide-react";

export function SettingsHeader() {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex items-center gap-4 mb-8"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
        className="w-12 h-12 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl"
        />
        <SettingsIcon className="h-6 w-6 text-blue-400 relative z-10" />
      </motion.div>
      
      <div className="flex flex-col">
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white/90"
        >
          Account Settings
        </motion.h1>
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex items-center gap-2"
        >
          <div className="h-0.5 w-8 bg-gradient-to-r from-blue-500/60 to-purple-500/60 rounded-full"></div>
          <span className="text-xs text-white/50 font-mono">
            Customize your profile
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
