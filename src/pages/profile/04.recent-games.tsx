import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fadeUp, stagger } from "@/lib/motion";
import { formatExact, formatRelative } from "../match-history/format";

interface RecentGame {
  _id: string;
  player1Id: string;
  player2Id?: string;
  player1Username: string;
  player2Username?: string;
  winner?: string;
  finishedAt?: number;
}

interface RecentGamesProps {
  recentGames?: RecentGame[];
  userId: string;
  isOwnProfile?: boolean;
}

export function RecentGames({
  recentGames,
  userId,
  isOwnProfile = false,
}: RecentGamesProps) {
  const navigate = useNavigate();

  if (!recentGames || recentGames.length === 0) {
    return (
      <EmptyState
        title="No finished games yet"
        body={
          isOwnProfile
            ? "Your last games show up here after you play."
            : "This player's last games show up here."
        }
        action={
          isOwnProfile ? (
            <Button onClick={() => void navigate({ to: "/" })}>
              Find a game
            </Button>
          ) : undefined
        }
        className="py-10"
      />
    );
  }

  return (
    <div>
      <motion.ul
        variants={stagger(0.04)}
        initial="hidden"
        animate="show"
        className="divide-y divide-border border-y border-border"
      >
        {recentGames.map((game) => {
          const isPlayer1 = game.player1Id === userId;
          const draw = !game.winner || game.winner === "draw";
          const won =
            !draw &&
            ((isPlayer1 && game.winner === "player1") ||
              (!isPlayer1 && game.winner === "player2"));
          const opponent = isPlayer1
            ? game.player2Username
            : game.player1Username;

          return (
            <motion.li
              key={game._id}
              variants={fadeUp}
              className="flex items-center justify-between gap-3 px-1 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Badge
                  variant={won ? "success" : draw ? "secondary" : "destructive"}
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
            </motion.li>
          );
        })}
      </motion.ul>
      {isOwnProfile && (
        <div className="mt-3">
          <Button
            variant="link"
            onClick={() => void navigate({ to: "/match-history" })}
          >
            See all in match history
          </Button>
        </div>
      )}
    </div>
  );
}
