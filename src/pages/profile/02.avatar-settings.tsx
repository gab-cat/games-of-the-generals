import { motion } from "framer-motion";
import { AvatarUpload } from "../settings/AvatarUpload";
import { riseIn } from "@/lib/motion";

interface AvatarSettingsProps {
  username: string;
  currentAvatarUrl?: string;
  rank: string;
  tier?: "free" | "pro" | "pro_plus";
  isDonor?: boolean;
}

export function AvatarSettings({
  username,
  currentAvatarUrl,
  rank,
  tier,
  isDonor,
}: AvatarSettingsProps) {
  return (
    <motion.div
      {...riseIn}
      className="rounded-lg border border-border bg-card p-5 sm:p-6"
    >
      <h2 className="mb-4 text-base font-semibold text-foreground">Avatar</h2>
      <AvatarUpload
        username={username}
        currentAvatarUrl={currentAvatarUrl}
        rank={rank}
        tier={tier}
        isDonor={isDonor}
      />
    </motion.div>
  );
}
