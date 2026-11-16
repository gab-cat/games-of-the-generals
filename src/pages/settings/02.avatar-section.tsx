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
      title="Profile picture"
      description="Pick a picture other players see next to your name."
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
