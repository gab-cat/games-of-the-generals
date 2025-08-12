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
import { useMutation, useAction } from "convex/react";
import { subscribeUserToPush, serializeSubscription } from "@/lib/push-client";

export function SettingsList() {
  const { data: profile, isPending: isLoadingProfile, error: profileError } = useConvexQuery(api.profiles.getCurrentProfile);
  const { data: userSettings, isPending: isLoadingSettings } = useConvexQuery(api.settings.getUserSettings);
  const { data: existingSubs } = useConvexQuery(api.push.getSubscriptionsForCurrentUser, {} as any);
  const saveSubscription = useMutation(api.push.saveSubscription);
  const removeSubscriptionByEndpoint = useMutation(api.push.removeSubscriptionByEndpoint);
  const sendTestNotification = useAction(api.pushNode.sendTestNotification);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  useEffect(() => {
    setVapidKey(import.meta.env.VITE_VAPID_PUBLIC_KEY || null);
  }, []);

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

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Push Notifications</div>
                <div className="text-white/60 text-sm">Get notified for new direct messages and invites</div>
              </div>
              <div className="flex items-center gap-2">
                {existingSubs && existingSubs.length > 0 ? (
                  <Button
                    variant="secondary"
                    disabled={isSubscribing}
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onClick={async () => {
                      setIsSubscribing(true);
                      try {
                        const reg = await navigator.serviceWorker.getRegistration();
                        const sub = await reg?.pushManager.getSubscription();
                        if (sub) {
                          await sub.unsubscribe();
                          await removeSubscriptionByEndpoint({ endpoint: sub.endpoint });
                        }
                        toast.success("Push notifications disabled");
                      } catch (e:any) {
                        toast.error(e?.message || "Failed to disable push");
                      } finally {
                        setIsSubscribing(false);
                      }
                    }}
                  >Disable</Button>
                ) : (
                  <Button
                    disabled={isSubscribing || !vapidKey}
                    className="text-black"
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onClick={async () => {
                      if (!vapidKey) {
                        toast.error("Push is not configured");
                        return;
                      }
                      setIsSubscribing(true);
                      try {
                        const sub = await subscribeUserToPush(vapidKey);
                        if (!sub) {
                          toast.error("Permission denied or subscription failed");
                          return;
                        }
                        await saveSubscription({ subscription: serializeSubscription(sub) });
                        toast.success("Push notifications enabled");
                      } catch (e:any) {
                        toast.error(e?.message || "Failed to enable push");
                      } finally {
                        setIsSubscribing(false);
                      }
                    }}
                  >Enable</Button>
                )}
                <Button
                  variant="ghost"
                  disabled={!existingSubs || existingSubs.length === 0}
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={async () => {
                    try {
                      await sendTestNotification({});
                      toast.success("Test notification sent");
                    } catch (e:any) {
                      toast.error(e?.message || "Failed to send test");
                    }
                  }}
                >Send Test</Button>
              </div>
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
