import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { SettingsHeader } from "./01.settings-header";
import { AvatarSection } from "./02.avatar-section";
import { UsernameSection } from "./03.username-section";
import { PasswordSection } from "./04.password-section";
import { EmailSection } from "./05.email-section";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { unsubscribeFromPush } from "@/lib/push-client";
import { useAutoAnimate } from "../../lib/useAutoAnimate";


export function SettingsList() {
  const pushSubsRef = useAutoAnimate();
  const { data: profile, isPending: isLoadingProfile, error: profileError } = useConvexQuery(api.profiles.getCurrentProfile);
  const { data: userSettings, isPending: isLoadingSettings } = useConvexQuery(api.settings.getUserSettings);
  const { data: existingSubs = [] } = useConvexQuery(api.push.getSubscriptionsForCurrentUser, {} as any);
  const removeSubscriptionByEndpoint = useMutation(api.push.removeSubscriptionByEndpoint);
  const [localEndpoint, setLocalEndpoint] = useState<string | null>(null);
  const [isRemovingEndpoint, setIsRemovingEndpoint] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        if (!("serviceWorker" in navigator)) return;
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setLocalEndpoint(sub?.endpoint ?? null);
      } catch {
        setLocalEndpoint(null);
      }
    })();
  }, []);

  const handleRemoveSubscription = async (endpoint: string) => {
    try {
      setIsRemovingEndpoint(endpoint);
      if (endpoint === localEndpoint) {
        await unsubscribeFromPush();
      }
      await removeSubscriptionByEndpoint({ endpoint });
      toast.success("Subscription removed");
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove subscription");
    } finally {
      setIsRemovingEndpoint(null);
    }
  };
  

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
        <div className="flex justify-center px-4 sm:px-6">
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
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-6xl mx-auto  sm:px-6">
        <div className="space-y-6">
          <AvatarSection 
            username={profile.username}
            currentAvatarUrl={profile.avatarUrl}
            rank={profile.rank}
          />
          <UsernameSection currentUsername={profile.username} />
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Push Devices</div>
                <div className="text-white/60 text-sm">Manage registered devices for push notifications</div>
              </div>
            </div>
            <div ref={pushSubsRef} className="mt-4 space-y-2">
              {existingSubs && existingSubs.length > 0 ? (
                existingSubs.map((sub: any) => {
                  const isThisDevice = sub.endpoint === localEndpoint;
                  const ua: string = sub.userAgent || "Unknown device";
                  const label = isThisDevice ? "This device" : ua;
                  return (
                    <div key={sub._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg bg-white/5">
                      <div className="min-w-0">
                        <div className="text-white/90 text-sm truncate break-words">{label}</div>
                        <div className="text-white/50 text-xs mt-0.5">
                          {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : ""}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isRemovingEndpoint === sub.endpoint}
                        onClick={() => { void handleRemoveSubscription(sub.endpoint); }}
                        className="w-full sm:w-auto"
                      >
                        {isThisDevice ? (isRemovingEndpoint === sub.endpoint ? "Unregistering..." : "Unregister") : (isRemovingEndpoint === sub.endpoint ? "Removing..." : "Remove")}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-white/60 text-sm">No registered devices</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <PasswordSection />
          <EmailSection currentEmail={userSettings?.email} />
        </div>
      </div>
    </div>
  );
}
