import type { ReactNode } from "react";
import { GamepadIcon, Target } from "lucide-react";

export type PresenceStatus = "in_game" | "in_lobby" | "in_ai" | "online" | "offline";

export interface PresenceLikeUser {
  username?: string | null;
  gameId?: unknown;
  lobbyId?: unknown;
  aiGameId?: unknown;
}

export function deriveStatus(user?: PresenceLikeUser | null): PresenceStatus {
  if (!user) return "offline";
  if (user.gameId) return "in_game";
  if (user.lobbyId) return "in_lobby";
  if ((user as any).aiGameId) return "in_ai";
  return "online";
}

export function getStatusText(status: PresenceStatus): string | null {
  switch (status) {
    case "in_game":
      return "In Game";
    case "in_lobby":
      return "In Lobby";
    case "in_ai":
      return "In AI Game";
    default:
      return null; // For generic online, show bio/wins instead
  }
}

export function getStatusColorClass(status: PresenceStatus): string {
  switch (status) {
    case "in_game":
      return "text-red-400/80 text-xs";
    case "in_lobby":
      return "text-green-400/80 text-xs";
    case "in_ai":
      return "text-yellow-400/80 text-xs";
    case "online":
      return "text-white/60 text-xs";
    default:
      return "text-white/40 text-xs";
  }
}

export function getStatusIndicatorNode(status: PresenceStatus): ReactNode | null {
  switch (status) {
    case "in_game":
      return <GamepadIcon className="w-3 h-3 text-red-400/80" />;
    case "in_lobby":
      return <Target className="size-2.5 text-green-400/80" />;
    case "in_ai":
      return <GamepadIcon className="w-3 h-3 text-yellow-400/80" />;
    case "online":
      return <div className="size-2.5 bg-green-400/80 rounded-full" />;
    default:
      return null;
  }
}

export function getStatusForUsername<T extends PresenceLikeUser>(onlineUsers: T[] | undefined, username?: string | null): PresenceStatus {
  if (!onlineUsers || !username) return "offline";
  const u = onlineUsers.find(u => u.username === username);
  return deriveStatus(u);
}


