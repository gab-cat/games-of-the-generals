

import { api } from "../../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
import { useQuery } from "convex-helpers/react/cache";
import { useMemo, useRef, useEffect, useState } from "react";
import { useConvexQueryWithOptions } from "./convex-query-hooks";

// OPTIMIZED: Debounce presence updates to reduce query calls
const DEBOUNCE_MS = 2000; // 2 seconds debounce

export const useOnlineUsers = () => {
  const currentUser = useQuery(api.profiles.getCurrentProfile, {});
  
  // Use presence system for online users
  const presenceState = usePresence(
    api.presence,
    "global",
    currentUser?.username || "Anonymous",
    60000 // 60 seconds
  );
  
  // Filter presence state
  const filteredPresenceState = useMemo(() => {
    return presenceState?.filter((user) => user.online !== false && user.userId !== "Anonymous");
  }, [presenceState]);

  // OPTIMIZED: Debounce the presence state to prevent excessive query calls
  const [debouncedPresenceState, setDebouncedPresenceState] = useState(filteredPresenceState);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout to update debounced state
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedPresenceState(filteredPresenceState);
    }, DEBOUNCE_MS);

    // Cleanup on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [filteredPresenceState]);

  // OPTIMIZED: Memoize the query args to prevent unnecessary re-renders
  const queryArgs = useMemo(() => {
    if (!debouncedPresenceState || !currentUser) {
      return "skip";
    }
    return { users: debouncedPresenceState };
  }, [debouncedPresenceState, currentUser]);

  // OPTIMIZED: Use query with options for better caching
  const onlineUsers = useConvexQueryWithOptions(
    api.globalChat.getOnlineUsers,
    queryArgs,
    {
      staleTime: 30000, // 30 seconds - online users data needs moderate freshness
      gcTime: 120000, // 2 minutes cache
      enabled: queryArgs !== "skip",
    }
  );

  return {
    onlineUsers: onlineUsers?.data,
  }
}