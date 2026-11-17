import { useEffect, useRef, useState } from "react";
import { useConvex, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex-helpers/react/cache";
import type { FunctionReturnType } from "convex/server";
import { useConvexQueryWithOptions } from "./convex-query-hooks";

type OnlineUser = NonNullable<
  FunctionReturnType<typeof api.presence.listRoom>[number]
>;

// One heartbeat per tab keeps the user marked online in the global room.
// The presence component treats a session as gone after 2.5 intervals, so
// 120s means someone who closes the tab shows offline within 5 minutes.
// Each heartbeat is a function call: at 60s with two mounted panels this was
// 120 calls per online user per hour; now it is 30.
const GLOBAL_PRESENCE_INTERVAL = 120_000;

// Heartbeat-only version of `usePresence` from @convex-dev/presence. The
// library hook also subscribes to `presence.list` for the room, which every
// tab re-ran whenever anyone in the game went online or offline, and nothing
// here used the result. Session handling matches the library: one session per
// mounted instance, a beacon disconnect on unload, and disconnect while the
// tab is hidden.
function useGlobalPresenceHeartbeat(username: string) {
  const convex = useConvex();
  const heartbeat = useMutation(api.presence.heartbeat);
  const disconnect = useMutation(api.presence.disconnect);
  const [instanceId] = useState(() => crypto.randomUUID());
  // A remount with the same session (React dev re-runs effects) adopts it
  // instead of being disconnected by the effect it replaced.
  const activeSessionRef = useRef<string | null>(null);

  useEffect(() => {
    const sessionId = JSON.stringify([instanceId, "global", username]);
    activeSessionRef.current = sessionId;
    let canceled = false;
    let sessionToken: string | null = null;
    let inFlight = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const endIfOrphaned = (token: string) => {
      queueMicrotask(() => {
        if (activeSessionRef.current !== sessionId) {
          disconnect({ sessionToken: token }).catch(() => {});
        }
      });
    };

    const beat = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await heartbeat({
          roomId: "global",
          userId: username,
          sessionId,
          interval: GLOBAL_PRESENCE_INTERVAL,
        });
        if (canceled) {
          if (result.sessionToken) endIfOrphaned(result.sessionToken);
          return;
        }
        sessionToken = result.sessionToken || null;
      } catch {
        // Offline or a deploy in progress: the next beat tries again.
      } finally {
        inFlight = false;
      }
    };

    const start = () => {
      void beat();
      if (timer) clearInterval(timer);
      timer = setInterval(() => void beat(), GLOBAL_PRESENCE_INTERVAL);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const onUnload = () => {
      if (!sessionToken) return;
      navigator.sendBeacon(
        `${convex.url}/api/mutation`,
        new Blob(
          [
            JSON.stringify({
              path: "presence:disconnect",
              args: { sessionToken },
            }),
          ],
          { type: "application/json" },
        ),
      );
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
        if (sessionToken) {
          disconnect({ sessionToken }).catch(() => {});
        }
      } else {
        start();
      }
    };

    start();
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      canceled = true;
      activeSessionRef.current = null;
      stop();
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      if (sessionToken) endIfOrphaned(sessionToken);
    };
  }, [convex, heartbeat, disconnect, instanceId, username]);
}

function GlobalPresenceSession({ username }: { username: string }) {
  useGlobalPresenceHeartbeat(username);
  return null;
}

// Mount once, in the app layout.
export function GlobalPresenceHeartbeat() {
  const currentUser = useQuery(api.profiles.getCurrentProfile, {});
  if (!currentUser?.username) return null;
  return <GlobalPresenceSession username={currentUser.username} />;
}

// Online users list. Subscribe only while the panel that shows it is open:
// listRoom re-runs for every subscriber whenever anyone joins or leaves.
export const useOnlineUsers = (enabled: boolean) => {
  const onlineUsers = useConvexQueryWithOptions(
    api.presence.listRoom,
    { roomId: "global" },
    {
      enabled,
      staleTime: 30000,
      gcTime: 120000,
    },
  );

  return {
    onlineUsers: (
      onlineUsers?.data as FunctionReturnType<typeof api.presence.listRoom> | undefined
    )?.filter((user): user is OnlineUser => user !== null),
  };
};
