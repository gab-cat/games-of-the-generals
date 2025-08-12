import { motion } from "framer-motion";
import { AvatarUpload } from "../settings/AvatarUpload";
import { Settings } from "lucide-react";

interface AvatarSettingsProps {
  username: string;
  currentAvatarUrl?: string;
  rank: string;
}

export function AvatarSettings({ username, currentAvatarUrl, rank }: AvatarSettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border border-white/10 bg-black/30 p-6 mb-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Settings className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold text-white">Avatar Settings</h2>
      </div>
      <AvatarUpload 
        username={username}
        currentAvatarUrl={currentAvatarUrl}
        rank={rank}
      />
    </motion.div>
  );
}
