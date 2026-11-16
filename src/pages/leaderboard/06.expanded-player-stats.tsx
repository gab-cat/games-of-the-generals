import { Link } from "@tanstack/react-router";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Stat } from "@/components/ui/stat";
import { SectionHeader } from "@/components/ui/page-header";
import {
  formatDate,
  formatRelative,
  formatSpan,
  formatExact,
  plural,
} from "../match-history/format";

interface ProfileStats {
  username: string;
  avatarUrl?: string;
  rank: string;
  createdAt: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  elo: number;
  winStreak?: number;
  bestWinStreak?: number;
  totalPlayTime?: number;
  avgGameTime?: number;
  fastestWin?: number;
  longestGame?: number;
  capturedFlags?: number;
  piecesEliminated?: number;
  spiesRevealed?: number;
  recentGames?: any[];
  bio?: string;
  userId?: string;
  avatarFrame?: string;
}

interface ExpandedPlayerStatsProps {
  profileStats: ProfileStats;
}

export function ExpandedPlayerStats({
  profileStats,
}: ExpandedPlayerStatsProps) {
  const recent = (profileStats.recentGames ?? []).slice(0, 4);

  return (
    <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[14rem_minmax(0,1fr)]">
      {/* Identity */}
      <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
        <UserAvatar
          username={profileStats.username}
          avatarUrl={profileStats.avatarUrl}
          rank={profileStats.rank}
          size="xl"
          frame={profileStats.avatarFrame}
          className="h-24 w-24"
        />
        <div className="min-w-0 max-w-full">
          <h2 className="break-words font-display text-2xl font-semibold text-foreground">
            {profileStats.username}
          </h2>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Badge variant="outline">{profileStats.rank}</Badge>
            <span className="text-xs text-foreground/70">
              Member since {formatDate(profileStats.createdAt)}
            </span>
          </div>
        </div>
        {profileStats.bio ? (
          <p className="break-words text-sm text-foreground/80">
            {profileStats.bio}
          </p>
        ) : null}
        <Button asChild variant="secondary" size="sm" className="mt-1">
          <Link to="/profile" search={{ u: profileStats.username }}>
            View full profile
          </Link>
        </Button>
      </div>

      {/* Numbers and recent games */}
      <div className="min-w-0 space-y-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          <Stat label="Rating" value={profileStats.elo ?? 1500} tone="gold" />
          <Stat label="Wins" value={profileStats.wins} />
          <Stat label="Losses" value={profileStats.losses} />
          <Stat
            label="Win rate"
            value={`${Math.round(profileStats.winRate)}%`}
          />
          <Stat label="Games" value={profileStats.gamesPlayed} />
          <Stat label="Best streak" value={profileStats.bestWinStreak || 0} />
          <Stat
            label="Flags captured"
            value={profileStats.capturedFlags || 0}
          />
          <Stat
            label="Time played"
            value={
              profileStats.totalPlayTime
                ? formatSpan(profileStats.totalPlayTime)
                : "0m"
            }
          />
        </div>

        <div>
          <SectionHeader as="h3" title="Recent games" className="mb-2" />
          {recent.length > 0 ? (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {recent.map((game: any) => {
                const isPlayer1 = game.player1Id === profileStats.userId;
                const draw = !game.winner || game.winner === "draw";
                const won =
                  !draw &&
                  ((isPlayer1 && game.winner === "player1") ||
                    (!isPlayer1 && game.winner === "player2"));
                const opponent = isPlayer1
                  ? game.player2Username
                  : game.player1Username;
                return (
                  <li
                    key={game._id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Badge
                        variant={
                          won ? "success" : draw ? "secondary" : "destructive"
                        }
                        className="w-12 shrink-0 justify-center"
                      >
                        {won ? "Win" : draw ? "Draw" : "Loss"}
                      </Badge>
                      <span className="truncate text-sm text-foreground">
                        vs {opponent || "unknown player"}
                      </span>
                    </div>
                    {game.finishedAt ? (
                      <time
                        className="shrink-0 text-xs text-muted-foreground"
                        title={formatExact(game.finishedAt)}
                        dateTime={new Date(game.finishedAt).toISOString()}
                      >
                        {formatRelative(game.finishedAt)}
                      </time>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-center text-sm text-foreground/80">
              {profileStats.gamesPlayed > 0
                ? `${plural(profileStats.gamesPlayed, "game")} played, none saved here.`
                : "No finished games yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Same layout as the loaded stats, shown while they load. */
export function ExpandedPlayerStatsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading player stats"
      className="grid gap-6 p-4 sm:p-6 md:grid-cols-[14rem_minmax(0,1fr)]"
    >
      <div className="flex flex-col items-center gap-3 md:items-start">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-6 w-14" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-[132px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
