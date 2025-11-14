

import { api } from "../../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
import { useQuery } from "convex-helpers/react/cache";
import { useMemo } from "react";
import { useConvexQueryWithOptions } from "./convex-query-hooks";

// Presence interval - matches server-side retry logic
const PRESENCE_INTERVAL = 60000; // 60 seconds

export const useOnlineUsers = () => {
  const currentUser = useQuery(api.profiles.getCurrentProfile, {});

  // Memoize username to prevent unnecessary presence hook re-initialization
  // This prevents rapid heartbeat calls when component re-renders
  const stableUsername = useMemo(() => {
    return currentUser?.username || "Anonymous";
  }, [currentUser?.username]);

  // Memoize room ID to prevent re-initialization
  const stableRoomId = useMemo(() => "global", []);

  // Use presence system for online users with stable parameters
  // The hook manages heartbeats internally, so stable params prevent rapid re-initialization
  usePresence(
    api.presence,
    stableRoomId,
    stableUsername,
    PRESENCE_INTERVAL
  );

  // Get online users directly from presence.listRoom which already enriches with profile data
  const onlineUsers = useConvexQueryWithOptions(
    api.presence.listRoom,
    { roomId: "global" },
    {
      staleTime: 30000, // 30 seconds - online users data needs moderate freshness
      gcTime: 120000, // 2 minutes cache
    }
  );

  return {
    onlineUsers: onlineUsers?.data?.filter((user): user is NonNullable<typeof user> => user !== null),
  }
}