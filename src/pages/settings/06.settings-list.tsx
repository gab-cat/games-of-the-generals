import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { stagger } from "@/lib/motion";
import { AvatarSection } from "./02.avatar-section";
import { UsernameSection } from "./03.username-section";
import { PasswordSection } from "./04.password-section";
import { EmailSection } from "./05.email-section";
import { CustomizationSection } from "./07.customization-section";
import { PushDevicesSection } from "./08.push-devices-section";

function SettingsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading settings">
      <PageHeader
        title="Settings"
        description="Your profile, sign in details and look."
      />
      <div className="space-y-4 sm:space-y-6">
        {[260, 190, 150].map((h, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-5 sm:p-6"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
            <Skeleton className="mt-6 w-full" style={{ height: h - 90 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-foreground">
        <h1 className="font-display text-2xl font-semibold">
          Settings did not load
        </h1>
        <p className="mt-2 text-sm text-foreground/80">
          Check your connection and reload the page.
        </p>
      </div>
    );
  }

  if (isLoadingProfile || !profile || isLoadingSettings) {
    return <SettingsSkeleton />;
  }

  // Guests only get the form that turns the guest account into a real one.
  if (userSettings?.isAnonymous) {
    return (
      <>
        <PageHeader title="Settings" />
        <motion.div
          variants={stagger()}
          initial="hidden"
          animate="show"
          className="space-y-4 sm:space-y-6"
        >
          <EmailSection currentEmail={userSettings?.email} />
        </motion.div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile, sign in details and look."
      />
      <motion.div
        variants={stagger(0.05)}
        initial="hidden"
        animate="show"
        className="space-y-4 sm:space-y-6"
      >
        <AvatarSection
          username={profile.username}
          currentAvatarUrl={profile.avatarUrl}
          rank={profile.rank}
          tier={profile.tier as "free" | "pro" | "pro_plus"}
          isDonor={profile.isDonor}
        />
        <UsernameSection currentUsername={profile.username} />
        <EmailSection currentEmail={userSettings?.email} />
        <PasswordSection />
        <CustomizationSection />
        <PushDevicesSection />
      </motion.div>
    </>
  );
}
