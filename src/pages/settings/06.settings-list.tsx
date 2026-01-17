import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { SettingsHeader } from "./01.settings-header";
import { AvatarSection } from "./02.avatar-section";
import { UsernameSection } from "./03.username-section";
import { PasswordSection } from "./04.password-section";
import { EmailSection } from "./05.email-section";
import { CustomizationSection } from "./07.customization-section";
import { PushDevicesSection } from "./08.push-devices-section";

export function SettingsList() {
  const {
    data: profile,
    isPending: isLoadingProfile,
    error: profileError,
  } = useConvexQuery(api.profiles.getCurrentProfile);
  const { data: userSettings, isPending: isLoadingSettings } = useConvexQuery(
    api.settings.getUserSettings,
  );

  if (profileError) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-red-400 text-center font-mono text-sm border border-red-500/20 bg-red-500/5 p-8 rounded-sm"
        >
          <div className="text-red-500 font-bold mb-2 uppercase tracking-wider">
            System Error
          </div>
          <p>Unable to load profile data: {profileError.message}</p>
        </motion.div>
      </div>
    );
  }

  if (isLoadingProfile || !profile || isLoadingSettings) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
            Initializing...
          </div>
        </div>
      </div>
    );
  }

  // If account is anonymous, only show the convert account section
  if (userSettings?.isAnonymous) {
    return (
      <div className="space-y-8">
        <SettingsHeader />
        <div className="max-w-2xl mx-auto">
          <EmailSection currentEmail={userSettings?.email} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SettingsHeader />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 max-w-7xl mx-auto">
        {/* Left Column: Identity & Access */}
        <div className="lg:col-span-7 space-y-8">
          <AvatarSection
            username={profile.username}
            currentAvatarUrl={profile.avatarUrl}
            rank={profile.rank}
            tier={profile.tier as "free" | "pro" | "pro_plus"}
            isDonor={profile.isDonor}
          />
          <UsernameSection currentUsername={profile.username} />
          <PushDevicesSection />
        </div>

        {/* Right Column: Security & Preferences */}
        <div className="lg:col-span-5 space-y-8">
          <CustomizationSection />
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-600">
                Security Protocols
              </span>
              <div className="h-px bg-white/10 flex-1" />
            </div>
            <PasswordSection />
            <EmailSection currentEmail={userSettings?.email} />
          </div>
        </div>
      </div>
    </div>
  );
}
