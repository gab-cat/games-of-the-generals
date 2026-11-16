import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Play } from "lucide-react";
import { useQuery } from "convex-helpers/react/cache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatClock, formatExact, formatRelative, plural } from "./format";

// Helper function to download replay data as JSON
function downloadReplayAsJson(
  replayData: {
    game: unknown;
    moves: unknown[];
    initialBoard: unknown;
    player1Username: string;
    player2Username: string;
    moveCount: number;
    isTruncated: boolean;
  },
  match: {
    opponentUsername: string;
    createdAt: number;
    isWin: boolean;
    isDraw: boolean;
    reason: string;
    duration: number;
    moves: number;
  },
) {
  const exportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    player1Username: replayData.player1Username,
    player2Username: replayData.player2Username,
    initialBoard: replayData.initialBoard,
    moves: replayData.moves,
    gameMetadata: {
      createdAt: match.createdAt,
      duration: match.duration,
      moveCount: match.moves,
      isWin: match.isWin,
      isDraw: match.isDraw,
      reason: match.reason,
    },
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // Format filename: replay_[opponent]_[date].json
  const dateStr = new Date(match.createdAt).toISOString().split("T")[0];
  a.download = `replay_${match.opponentUsername}_${dateStr}.json`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const REASON_TEXT: Record<string, string> = {
  flag_captured: "Flag captured",
  flag_reached_base: "Flag reached the far row",
  timeout: "Time ran out",
  surrender: "Surrender",
  elimination: "No pieces left to move",
};

interface MatchItemProps {
  match: {
    _id: Id<"games">;
    gameId: Id<"games">;
    opponentUsername: string;
    isWin: boolean;
    isDraw: boolean;
    lobbyName: string | undefined;
    createdAt: number;
    duration: number;
    moves: number;
    rankAtTime: string;
    reason: string;
  };
  onViewReplay?: (gameId: Id<"games">) => void;
}

export function MatchItem({ match, onViewReplay }: MatchItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const opponentProfile = useQuery(api.profiles.getProfileByUsername, {
    username: match.opponentUsername,
  });

  // Query replay data only when downloading
  const { data: replayData } = useConvexQuery(
    api.games.getGameReplay,
    isDownloading ? { gameId: match.gameId } : "skip",
  );

  useEffect(() => {
    if (isDownloading && replayData) {
      downloadReplayAsJson(replayData, match);
      setIsDownloading(false);
      toast.success("Replay downloaded");
    }
  }, [isDownloading, replayData, match]);

  const { isWin, isDraw } = match;
  const result = isWin ? "Win" : isDraw ? "Draw" : "Loss";
  const reason = REASON_TEXT[match.reason] ?? "Game ended";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:gap-4 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Badge
          variant={isWin ? "success" : isDraw ? "secondary" : "destructive"}
          className="w-12 shrink-0 justify-center"
        >
          {result}
        </Badge>
        <UserAvatar
          username={match.opponentUsername}
          avatarUrl={opponentProfile?.avatarUrl}
          rank={opponentProfile?.rank}
          size="sm"
          frame={opponentProfile?.avatarFrame}
          className="shrink-0"
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">
            vs {match.opponentUsername}
          </div>
          <div className="truncate text-xs text-foreground/70">
            {reason}
            {match.lobbyName ? ` · ${match.lobbyName}` : ""}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-foreground/80 sm:gap-5">
        <span className="tabular-nums">
          {plural(match.moves, "move")}
        </span>
        <span className="tabular-nums">
          {formatClock(match.duration)}
        </span>
        <time
          className="text-muted-foreground"
          title={formatExact(match.createdAt)}
          dateTime={new Date(match.createdAt).toISOString()}
        >
          {formatRelative(match.createdAt)}
        </time>
      </div>

      {onViewReplay && (
        <div className="flex gap-2 sm:shrink-0">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => onViewReplay(match.gameId)}
          >
            <Play />
            Replay
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setIsDownloading(true)}
            disabled={isDownloading}
            aria-label="Download replay file"
            title="Download replay file"
          >
            {isDownloading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
