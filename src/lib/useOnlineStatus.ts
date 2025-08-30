import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface UseOnlineStatusOptions {
  currentPage?: string;
  gameId?: Id<"games">;
  lobbyId?: Id<"lobbies">;
  heartbeatInterval?: number; // in milliseconds, default 5 minutes (300000ms)
  userId?: Id<"users">;
  username?: string;
}

export function useOnlineStatus(options: UseOnlineStatusOptions = {}) {
  const { isAuthenticated } = useConvexAuth();
  const markOnline = useMutation(api.globalChat.markUserOnline);
  const markOffline = useMutation(api.globalChat.markUserOffline);
  const heartbeat = useMutation(api.globalChat.heartbeat);

  const {
    currentPage,
    gameId,
    lobbyId,
    heartbeatInterval = 300000, // 5 minutes (300000ms)
    userId,
    username,
  } = options;

  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef<boolean>(true);

  const markUserOnline = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await markOnline({
        currentPage,
        gameId,
        lobbyId,
      });
    } catch (error) {
      console.error("Failed to mark user online:", error);
    }
  }, [isAuthenticated, markOnline, currentPage, gameId, lobbyId]);

  const markUserOffline = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await markOffline();
    } catch (error) {
      console.error("Failed to mark user offline:", error);
    }
  }, [isAuthenticated, markOffline]);

  const sendHeartbeat = useCallback(async () => {
    if (!isAuthenticated || !userId || !username) return;

    try {
      await heartbeat({
        userId,
        username,
        currentPage,
        gameId,
        lobbyId,
      });
    } catch (error) {
      console.error("Failed to send heartbeat:", error);
    }
  }, [isAuthenticated, heartbeat, userId, username, currentPage, gameId, lobbyId]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    visibilityRef.current = isVisible;

    if (isVisible) {
      // Tab became visible, send immediate heartbeat
      void sendHeartbeat();
    }
  }, [sendHeartbeat]);

  // Handle beforeunload (tab close)
  const handleBeforeUnload = useCallback(() => {
    // Mark offline synchronously if possible
    if (navigator.sendBeacon && isAuthenticated) {
      // Use sendBeacon for reliable delivery on page unload
      const data = JSON.stringify({ action: "markOffline" });
      navigator.sendBeacon("/api/offline", data);
    } else {
      // Fallback to async call (may not complete)
      void markUserOffline();
    }
  }, [isAuthenticated, markUserOffline]);

  // Setup heartbeat interval
  useEffect(() => {
    if (!isAuthenticated) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return;
    }

    // Mark online immediately
    void markUserOnline();

    // Setup heartbeat
    heartbeatRef.current = setInterval(() => {
      if (visibilityRef.current) {
        void sendHeartbeat();
      }
    }, heartbeatInterval);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [isAuthenticated, markUserOnline, sendHeartbeat, heartbeatInterval]);

  // Setup visibility change listener
  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [handleVisibilityChange, handleBeforeUnload]);

  // Handle authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      void markUserOffline();
    }
  }, [isAuthenticated, markUserOffline]);

  return {
    markUserOnline,
    markUserOffline,
    sendHeartbeat,
  };
}
