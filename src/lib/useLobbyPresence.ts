import { useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds
const ABANDONMENT_CHECK_INTERVAL_MS = 10 * 1000; // 10 seconds

interface UseLobbyPresenceOptions {
  /** Called when host abandons the lobby */
  onHostAbandoned?: () => void;
  /** Called when player abandons the lobby */
  onPlayerAbandoned?: () => void;
  /** Called when lobby is deleted */
  onLobbyDeleted?: () => void;
}

interface UseLobbyPresenceReturn {
  /** Whether the host is currently online */
  hostOnline: boolean | null;
  /** Whether the player is currently online */
  playerOnline: boolean | null;
  /** Force an abandonment check */
  checkAbandonment: () => void;
}

/**
 * Hook for lobby presence tracking with heartbeat and abandonment detection.
 * 
 * This hook:
 * 1. Sends heartbeats every 30 seconds to signal the user is active
 * 2. Checks for abandonment every 10 seconds
 * 3. Calls appropriate callbacks when abandonment is detected
 * 
 * @param lobbyId - The lobby ID to track presence for (null to disable)
 * @param options - Callbacks for abandonment events
 */
export function useLobbyPresence(
  lobbyId: Id<"lobbies"> | null,
  options: UseLobbyPresenceOptions = {}
): UseLobbyPresenceReturn {
  const { onHostAbandoned, onPlayerAbandoned, onLobbyDeleted } = options;
  
  const heartbeatLobby = useMutation(api.lobbies.heartbeatLobby);
  const checkLobbyAbandonment = useMutation(api.lobbies.checkLobbyAbandonment);
  
  // Query for lobby activity status
  const activityStatus = useQuery(
    api.lobbies.getLobbyActivityStatus,
    lobbyId ? { lobbyId } : "skip"
  );
  
  // Track if callbacks have been called to prevent duplicates
  const calledRef = useRef<{
    hostAbandoned: boolean;
    playerAbandoned: boolean;
    lobbyDeleted: boolean;
  }>({ hostAbandoned: false, playerAbandoned: false, lobbyDeleted: false });
  
  // Reset called flags when lobbyId changes
  useEffect(() => {
    calledRef.current = { hostAbandoned: false, playerAbandoned: false, lobbyDeleted: false };
  }, [lobbyId]);
  
  // Heartbeat effect - send heartbeat every 30 seconds
  useEffect(() => {
    if (!lobbyId) return;
    
    // Send initial heartbeat immediately
    heartbeatLobby({ lobbyId }).catch(console.error);
    
    // Set up heartbeat interval
    const heartbeatInterval = setInterval(() => {
      heartbeatLobby({ lobbyId }).catch(console.error);
    }, HEARTBEAT_INTERVAL_MS);
    
    return () => clearInterval(heartbeatInterval);
  }, [lobbyId, heartbeatLobby]);
  
  // Check abandonment callback
  const checkAbandonment = useCallback(async () => {
    if (!lobbyId) return;
    
    try {
      const result = await checkLobbyAbandonment({ lobbyId });
      
      if (result.abandoned && result.reason) {
        switch (result.reason) {
          case "host_abandoned":
            if (!calledRef.current.hostAbandoned) {
              calledRef.current.hostAbandoned = true;
              onHostAbandoned?.();
            }
            break;
          case "player_abandoned":
            if (!calledRef.current.playerAbandoned) {
              calledRef.current.playerAbandoned = true;
              onPlayerAbandoned?.();
            }
            break;
          case "lobby_deleted":
            if (!calledRef.current.lobbyDeleted) {
              calledRef.current.lobbyDeleted = true;
              onLobbyDeleted?.();
            }
            break;
        }
      }
    } catch (error: any) {
      console.error("Error checking lobby abandonment:", error);
      
      // Only treat as deleted if the error explicitly indicates the resource is missing.
      // We check for various error signatures that suggest the lobby doesn't exist.
      const isNotFoundError = 
        error.status === 404 || 
        error.response?.status === 404 ||
        error.message?.toLowerCase().includes("not found") ||
        error.message?.toLowerCase().includes("failed to find");

      if (isNotFoundError && !calledRef.current.lobbyDeleted) {
        calledRef.current.lobbyDeleted = true;
        onLobbyDeleted?.();
      }
      
      // For other errors (network issues, timeouts, 429s), we don't call onLobbyDeleted.
      // The hook will retry automatically on the next interval.
    }
  }, [lobbyId, checkLobbyAbandonment, onHostAbandoned, onPlayerAbandoned, onLobbyDeleted]);
  
  // Abandonment check effect - check every 10 seconds
  useEffect(() => {
    if (!lobbyId) return;
    
    const abandonmentInterval = setInterval(() => {
      checkAbandonment();
    }, ABANDONMENT_CHECK_INTERVAL_MS);
    
    return () => clearInterval(abandonmentInterval);
  }, [lobbyId, checkAbandonment]);
  
  // Handle visibility changes - check abandonment when tab becomes visible
  useEffect(() => {
    if (!lobbyId) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab became visible, send heartbeat and check abandonment
        heartbeatLobby({ lobbyId }).catch(console.error);
        checkAbandonment();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [lobbyId, heartbeatLobby, checkAbandonment]);
  
  return {
    hostOnline: activityStatus?.hostOnline ?? null,
    playerOnline: activityStatus?.playerOnline ?? null,
    checkAbandonment,
  };
}
