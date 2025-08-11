import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { SettingsHeader } from "./01.settings-header";
import { AvatarSection } from "./02.avatar-section";
import { UsernameSection } from "./03.username-section";
import { PasswordSection } from "./04.password-section";
import { EmailSection } from "./05.email-section";

export function SettingsList() {
  const { data: profile, isPending: isLoadingProfile, error: profileError } = useConvexQuery(api.profiles.getCurrentProfile);
  const { data: userSettings, isPending: isLoadingSettings } = useConvexQuery(api.settings.getUserSettings);

  if (profileError) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-red-400 text-center"
        >
          <p>Error loading profile: {profileError.message}</p>
        </motion.div>
      </div>
    );
  }

  if (isLoadingProfile || !profile || isLoadingSettings) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  // If account is anonymous, only show the convert account section
  if (userSettings?.isAnonymous) {
    return (
      <div className="space-y-6">
        <SettingsHeader />
        <div className="flex justify-center">
          <div className="max-w-md w-full">
            <EmailSection currentEmail={userSettings?.email} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsHeader />
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <div className="space-y-6">
          <AvatarSection 
            username={profile.username}
            currentAvatarUrl={profile.avatarUrl}
            rank={profile.rank}
          />
          <UsernameSection currentUsername={profile.username} />
        </div>
        
        <div className="space-y-6">
          <PasswordSection />
          <EmailSection currentEmail={userSettings?.email} />
        </div>
      </div>
    </div>
  );
}
