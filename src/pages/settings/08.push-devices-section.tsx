import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { unsubscribeFromPush } from "@/lib/push-client";
import { SettingsCard, plainError } from "./components/SettingsCard";
import { useAutoAnimate } from "@/lib/useAutoAnimate";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function describeDevice(userAgent: string | undefined): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent;
  const os = /iPhone|iPad/.test(ua)
    ? "iPhone or iPad"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "Mac"
          : /Linux/.test(ua)
            ? "Linux"
            : null;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : null;
  if (os && browser) return `${browser} on ${os}`;
  return os || browser || "Unknown device";
}

export function PushDevicesSection() {
  const pushSubsRef = useAutoAnimate();
  const subs = useQuery(api.push.getSubscriptionsForCurrentUser);
  const existingSubs = subs ?? [];
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
      toast.success("Device removed");
    } catch (e: unknown) {
      toast.error(plainError(e, "Could not remove the device. Try again."));
    } finally {
      setIsRemovingEndpoint(null);
    }
  };

  return (
    <SettingsCard
      title="Notifications"
      description="Devices that get push notifications from the game."
    >
      <div ref={pushSubsRef} className="space-y-2">
        {subs === undefined ? (
          <Skeleton className="h-[68px] w-full" />
        ) : existingSubs.length > 0 ? (
          existingSubs.map((sub: any) => {
            const isThisDevice = sub.endpoint === localEndpoint;
            const removing = isRemovingEndpoint === sub.endpoint;

            return (
              <div
                key={sub._id}
                className="flex flex-col justify-between gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                    <span className="truncate">
                      {describeDevice(sub.userAgent)}
                    </span>
                    {isThisDevice && <Badge>This device</Badge>}
                  </div>
                  <div className="mt-0.5 text-xs text-foreground/70">
                    Added{" "}
                    {sub.createdAt
                      ? new Date(sub.createdAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "on an unknown date"}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={removing}
                  onClick={() => void handleRemoveSubscription(sub.endpoint)}
                  className="w-full sm:w-auto"
                >
                  {removing && <Loader2 className="animate-spin" />}
                  {removing ? "Removing" : "Remove"}
                </Button>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-foreground/80">
            No devices get notifications yet.
          </p>
        )}
      </div>
    </SettingsCard>
  );
}
