import { Camera } from "lucide-react";
import { AvatarUpload } from "./AvatarUpload";
import { SettingsCard } from "./components/SettingsCard";

interface AvatarSectionProps {
  username: string;
  currentAvatarUrl?: string;
  rank: string;
  tier?: "free" | "pro" | "pro_plus";
  isDonor?: boolean;
}

export function AvatarSection({
  username,
  currentAvatarUrl,
  rank,
  tier,
  isDonor,
}: AvatarSectionProps) {
  return (
    <SettingsCard
      title="Identity Matrix"
      description="Update your visual identification protocol."
      icon={<Camera className="w-5 h-5" />}
      delay={0.1}
    >
      <AvatarUpload
        username={username}
        currentAvatarUrl={currentAvatarUrl}
        rank={rank}
        tier={tier}
        isDonor={isDonor}
      />
    </SettingsCard>
  );
}
