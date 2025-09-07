

import { api } from "../../convex/_generated/api";
import usePresence from "@convex-dev/presence/react";
import { useQuery } from "convex-helpers/react/cache";

export const useOnlineUsers = () => {
  const currentUser = useQuery(api.profiles.getCurrentProfile, {});
  // Use presence system for online users
  const presenceState = usePresence(
    api.presence,
    "global",
    currentUser?.username || "Anonymous", // This will be overridden by the actual username from the presence system
    60000 // 60 seconds
  );
  const filteredPresenceState = presenceState?.filter((user) => user.online !== false && user.userId !== "Anonymous");

  // Fetch online users with profile data
  const onlineUsers = useQuery(api.globalChat.getOnlineUsers, filteredPresenceState && currentUser ? { users: filteredPresenceState } : "skip");

  return {
    onlineUsers,
  }
}