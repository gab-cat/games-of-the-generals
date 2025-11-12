

import { api } from "../../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
import { useQuery } from "convex-helpers/react/cache";
import { useMemo, useRef, useEffect, useState } from "react";
import { useConvexQueryWithOptions } from "./convex-query-hooks";

// OPTIMIZED: Debounce presence updates to reduce query calls
const DEBOUNCE_MS = 2000; // 2 seconds debounce
const PRESENCE_INTERVAL = 60000; // 60 seconds - matches server-side retry logic

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
  const presenceState = usePresence(
    api.presence,
    stableRoomId,
    stableUsername,
    PRESENCE_INTERVAL
  );
  
  // Filter presence state with memoization to prevent unnecessary recalculations
  const filteredPresenceState = useMemo(() => {
    if (!presenceState || !Array.isArray(presenceState)) {
      return [];
    }
    return presenceState.filter((user) => user.online !== false && user.userId !== "Anonymous");
  }, [presenceState]);

  // OPTIMIZED: Debounce the presence state to prevent excessive query calls
  // This reduces the frequency of downstream queries that depend on presence state
  const [debouncedPresenceState, setDebouncedPresenceState] = useState(filteredPresenceState);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timeout to prevent multiple rapid updates
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout to update debounced state
    // This prevents rapid-fire query calls when presence state changes frequently
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedPresenceState(filteredPresenceState);
    }, DEBOUNCE_MS);

    // Cleanup on unmount or when filteredPresenceState changes
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