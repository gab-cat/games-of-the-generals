import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { motion } from "framer-motion";
import { Loader2, Lock, MessageCircle } from "lucide-react";
import { useQuery } from "convex-helpers/react/cache";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  BLUE_TEXT,
  CornerRecord,
  ModeStamp,
  RED_TEXT,
  type GameModeName,
} from "./fight-card";

interface LobbyCardProps {
  lobby: {
    _id: Id<"lobbies">;
    name: string;
    hostId: Id<"users">;
    hostUsername: string;
    playerId?: Id<"users">;
    playerUsername?: string;
    status: "waiting" | "playing" | "finished";
    isPrivate?: boolean;
    gameMode?: GameModeName;
    createdAt?: number;
    hostCard?: {
      rank: string;
      wins: number;
      elo: number;
      avatarUrl?: string;
      avatarFrame?: string;
    };
  };
  currentUserId: Id<"users">;
  onJoin: (lobbyId: Id<"lobbies">) => void;
  onLeave: (lobbyId: Id<"lobbies">) => void;
  onInviteToLobby?: (lobbyId: Id<"lobbies">) => void;
  isJoining?: boolean;
  isLeaving?: boolean;
}

/**
 * An open lobby as a bout on a fight card: the host in the blue corner, the
 * empty red corner is your seat (the Join button).
 */
export function LobbyCard({
  lobby,
  currentUserId,
  onJoin,
  onLeave,
  onInviteToLobby,
  isJoining,
  isLeaving,
}: LobbyCardProps) {
  // Host avatar, rank and rating
  // New lobbies carry the host's card. Lobbies created before that change
  // look the host up instead.
  const fetchedHost = useQuery(
    api.profiles.getProfileByUsername,
    lobby.hostCard ? "skip" : { username: lobby.hostUsername },
  );
  const hostProfile = lobby.hostCard ?? fetchedHost;

  // Only this card's button shows the spinner when a join is in flight.
  const [joinedHere, setJoinedHere] = useState(false);
  useEffect(() => {
    if (!isJoining) setJoinedHere(false);
  }, [isJoining]);

  const isHost = lobby.hostId === currentUserId;
  const isFull = !!lobby.playerId;
  const joiningHere = !!isJoining && joinedHere;

  const join = () => {
    setJoinedHere(true);
    onJoin(lobby._id);
  };

  const opened = lobby.createdAt
    ? formatDistanceToNowStrict(lobby.createdAt, { addSuffix: true })
    : null;

  return (
    <motion.article
      variants={fadeUp}
      aria-label={`${lobby.name}, hosted by ${lobby.hostUsername}`}
      className="grid grid-cols-[minmax(0,1fr)_auto_6.5rem] items-stretch gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:border-border-strong sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_14rem] sm:gap-5 sm:p-4"
    >
      {/* Blue corner: the host */}
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          username={lobby.hostUsername}
          avatarUrl={hostProfile?.avatarUrl}
          frame={hostProfile?.avatarFrame}
          size="lg"
          className="hidden shrink-0 sm:flex"
        />
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-lg font-bold leading-tight sm:text-3xl",
              BLUE_TEXT,
            )}
            title={lobby.hostUsername}
          >
            {lobby.hostUsername}
          </p>
          {hostProfile === undefined ? (
            <Skeleton className="mt-1.5 h-3.5 w-24" />
          ) : (
            <CornerRecord
              rank={hostProfile?.rank}
              wins={hostProfile?.wins}
              elo={hostProfile?.elo ?? 1500}
              className="mt-1"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-1.5">
        <span
          className="text-lg font-bold text-gold-400 sm:text-2xl"
          aria-hidden="true"
        >
          vs
        </span>
        <ModeStamp mode={lobby.gameMode} />
      </div>

      {/* Red corner */}
      {isFull ? (
        <div className="flex min-w-0 flex-col items-end justify-center text-right">
          <p
            className={cn(
              "max-w-full truncate text-lg font-bold leading-tight sm:text-3xl",
              RED_TEXT,
            )}
            title={lobby.playerUsername}
          >
            {lobby.playerUsername}
          </p>
          <p className="mt-1 text-xs text-foreground/80 sm:text-sm">Full</p>
        </div>
      ) : isHost ? (
        <div className="flex min-h-[56px] min-w-0 flex-col items-center justify-center rounded-md border-2 border-dashed border-[#ef4b40]/35 px-2 text-center">
          <span className={cn("text-sm font-semibold sm:text-xl", RED_TEXT)}>
            Waiting
          </span>
          <span className="text-[11px] text-foreground/80 sm:text-xs">
            for an opponent
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={join}
          disabled={isJoining}
          aria-label={`Join ${lobby.hostUsername}'s lobby`}
          className="group flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border-2 border-dashed border-[#ef4b40]/50 px-2 text-center transition-[background-color,border-color,transform] duration-150 hover:border-[#ef4b40] hover:bg-[#ef4b40]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 sm:flex-row sm:gap-3 sm:px-4"
        >
          {joiningHere ? (
            <span
              className={cn(
                "inline-flex items-center gap-2 text-base font-bold sm:text-2xl",
                RED_TEXT,
              )}
            >
              <Loader2 className="size-4 animate-spin sm:size-5" />
              Joining
            </span>
          ) : (
            <>
              <span className={cn("text-base font-bold sm:hidden", RED_TEXT)}>
                Join
              </span>
              <span className="text-[11px] text-foreground/80 sm:hidden">
                Your seat
              </span>
              <span
                className={cn(
                  "hidden truncate text-3xl font-bold sm:inline",
                  RED_TEXT,
                )}
              >
                Your seat
              </span>
              <span className="hidden rounded-md border border-[#ef4b40]/60 px-3 py-1.5 text-sm font-semibold text-[#ffb3ac] transition-colors group-hover:bg-[#ef4b40]/20 sm:inline">
                Join
              </span>
            </>
          )}
        </button>
      )}

      {/* The lobby itself, and the host's actions */}
      <div className="col-span-3 flex min-w-0 items-center justify-between gap-3 border-t border-border pt-2 text-sm sm:col-span-1 sm:flex-col sm:items-end sm:justify-center sm:gap-2 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <div className="min-w-0 sm:w-full sm:text-right">
          <div className="flex min-w-0 items-center gap-1.5 sm:justify-end">
            {lobby.isPrivate && (
              <Lock
                className="size-3.5 shrink-0 text-foreground/80"
                aria-label="Private lobby"
              />
            )}
            <span
              className="truncate font-medium text-foreground"
              title={lobby.name}
            >
              {lobby.name}
            </span>
          </div>
          {opened && (
            <time
              dateTime={new Date(lobby.createdAt!).toISOString()}
              title={new Date(lobby.createdAt!).toLocaleString()}
              className="text-xs text-muted-foreground"
            >
              Opened {opened}
            </time>
          )}
        </div>

        {isHost && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => onInviteToLobby?.(lobby._id)}
            >
              <MessageCircle />
              Invite
            </Button>
            <Button
              variant="destructive"
              onClick={() => onLeave(lobby._id)}
              disabled={isLeaving}
            >
              {isLeaving && <Loader2 className="animate-spin" />}
              {isLeaving ? "Closing" : "Close"}
            </Button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
