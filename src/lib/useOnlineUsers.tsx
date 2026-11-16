import { api } from "../../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
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

function GlobalPresenceSession({ username }: { username: string }) {
  usePresence(api.presence, "global", username, GLOBAL_PRESENCE_INTERVAL);
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
