import { useState, useEffect } from "react";
import { Bell, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { unsubscribeFromPush } from "@/lib/push-client";
import { SettingsCard } from "./components/SettingsCard";
import { useAutoAnimate } from "@/lib/useAutoAnimate";

export function PushDevicesSection() {
  const pushSubsRef = useAutoAnimate();
  const existingSubs = useQuery(api.push.getSubscriptionsForCurrentUser) || [];
  const removeSubscriptionByEndpoint = useMutation(
    api.push.removeSubscriptionByEndpoint,
  );
  const [localEndpoint, setLocalEndpoint] = useState<string | null>(null);
  const [isRemovingEndpoint, setIsRemovingEndpoint] = useState<string | null>(
    null,
  );

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
      toast.success("Device unregistered");
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove subscription");
    } finally {
      setIsRemovingEndpoint(null);
    }
  };

  return (
    <SettingsCard
      title="Push Notifications"
      description="Manage devices authorized to receive tactical alerts."
      icon={<Bell className="w-5 h-5" />}
      delay={0.2}
    >
      <div ref={pushSubsRef} className="space-y-3">
        {existingSubs.length > 0 ? (
          existingSubs.map((sub: any) => {
            const isThisDevice = sub.endpoint === localEndpoint;
            const ua: string = sub.userAgent || "Unknown device";
            const label = isThisDevice ? "Current Terminal" : ua;

            return (
              <div
                key={sub._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-sm bg-black/40 border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="p-2 bg-zinc-900 rounded-sm border border-white/10 mt-1">
                    <Smartphone className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-zinc-300 text-sm font-medium truncate flex items-center gap-2">
                      {label}
                      {isThisDevice && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-sm border border-blue-500/20 uppercase tracking-wider font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-zinc-600 text-xs font-mono mt-1">
                      Registered:{" "}
                      {sub.createdAt
                        ? new Date(sub.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRemovingEndpoint === sub.endpoint}
                  onClick={() => void handleRemoveSubscription(sub.endpoint)}
                  className="w-full sm:w-auto h-8 text-xs font-mono uppercase tracking-wider border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
                >
                  {isRemovingEndpoint === sub.endpoint
                    ? "REVOKING..."
                    : "REVOKE ACCESS"}
                </Button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-zinc-600 font-mono text-xs">
            NO DEVICES REGISTERED FOR TACTICAL ALERTS
          </div>
        )}
      </div>
    </SettingsCard>
  );
}
