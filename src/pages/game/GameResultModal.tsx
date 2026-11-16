import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import ConfettiBoom from "react-confetti-boom";
import { Eye, LogOut, Play } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSound } from "@/lib/SoundProvider";
import { Insignia, toPlayerRank } from "@/components/season/art";
import {
  RESULT_DIALOG_CLASS,
  focusPrimaryAction,
  ResultTitleCard,
  endSticker,
  type ResultOutcome,
} from "@/components/season/ResultTitleCard";

interface GameResult {
  winner: "player1" | "player2" | "draw";
  reason:
    | "flag_captured"
    | "flag_reached_base"
    | "timeout"
    | "surrender"
    | "elimination";
  duration: number; // in seconds
  moves: number;
  player1Username: string;
  player2Username: string;
}

interface Profile {
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
  elo?: number;
  avatarFrame?: string;
}

interface GameResultModalProps {
  result: GameResult;
  profile: Profile & { avatarUrl?: string };
  isPlayer1: boolean;
  isOpen: boolean;
  onClose: () => void;
  onCheckBoard: () => void;
  onReturnToLobby: () => void;
  gameId: Id<"games">;
  onViewReplay: (gameId: Id<"games">) => void;
  player1Profile?: (Profile & { avatarUrl?: string }) | null;
  player2Profile?: (Profile & { avatarUrl?: string }) | null;
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

function reasonSentence(outcome: ResultOutcome, reason: GameResult["reason"], moves: number) {
  if (outcome === "draw") return "The game ended in a draw.";
  const won = outcome === "win";
  const onMove = moves > 0 ? ` on move ${moves}` : "";
  switch (reason) {
    case "flag_captured":
      return won ? `You captured their flag${onMove}.` : `Your flag was captured${onMove}.`;
    case "flag_reached_base":
      return won ? "Your flag reached their back row." : "Their flag reached your back row.";
    case "timeout":
      return won ? "Your opponent ran out of time." : "You ran out of time.";
    case "surrender":
      return won ? "Your opponent surrendered." : "You surrendered the game.";
    case "elimination":
      return won ? "Your opponent has no pieces left that can move." : "You have no pieces left that can move.";
    default:
      return "The game is over.";
  }
}

export function GameResultModal({
  result,
  profile,
  isPlayer1,
  isOpen,
  onClose,
  onCheckBoard,
  onReturnToLobby,
  gameId,
  onViewReplay,
  player1Profile,
  player2Profile,
}: GameResultModalProps) {
  const isDraw = result.winner === "draw";
  const isWinner =
    (isPlayer1 && result.winner === "player1") ||
    (!isPlayer1 && result.winner === "player2");
  const outcome: ResultOutcome = isDraw ? "draw" : isWinner ? "win" : "loss";
  const { playSFX } = useSound();
  const reduceMotion = useReducedMotion();

  // Play victory/lose SFX when modal opens
  useEffect(() => {
    if (isOpen && !isDraw) {
      playSFX(isWinner ? "player-victory" : "player-lose");
    }
  }, [isOpen, isWinner, isDraw, playSFX]);

  const myName = isPlayer1 ? result.player1Username : result.player2Username;
  const theirName = isPlayer1 ? result.player2Username : result.player1Username;
  const myAvatar = (isPlayer1 ? player1Profile : player2Profile)?.avatarUrl ?? profile.avatarUrl;
  const theirAvatar = (isPlayer1 ? player2Profile : player1Profile)?.avatarUrl;
  const rank = toPlayerRank(profile.rank, profile.wins);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={RESULT_DIALOG_CLASS} onOpenAutoFocus={focusPrimaryAction}>
        {isWinner && !reduceMotion && (
          <ConfettiBoom
            mode="boom"
            particleCount={60}
            colors={["#d9a441", "#e4b55a", "#f3d28a", "#3b82f6"]}
            shapeSize={10}
            launchSpeed={1.5}
            opacityDeltaMultiplier={2}
          />
        )}

        {isOpen && (
          <ResultTitleCard
            outcome={outcome}
            myArmy={isPlayer1 ? "blue" : "red"}
            sticker={endSticker(outcome, result.reason)}
            reasonText={reasonSentence(outcome, result.reason, result.moves)}
            stats={[
              { label: "Moves", value: result.moves },
              { label: "Time", value: formatDuration(result.duration) },
              {
                label: "Your rank",
                value: (
                  <span className="inline-flex items-center gap-1.5">
                    <Insignia rank={rank} className="h-4 text-gold-400" />
                    {rank}
                  </span>
                ),
              },
              ...(typeof profile.elo === "number"
                ? [{ label: "Your rating", value: Math.round(profile.elo) }]
                : []),
            ]}
            me={{ name: myName, avatarUrl: myAvatar, caption: "You" }}
            opponent={{ name: theirName, avatarUrl: theirAvatar, caption: "Opponent" }}
            actions={
              <>
                <Button variant="ghost" onClick={onCheckBoard}>
                  <Eye />
                  Review the board
                </Button>
                {gameId && onViewReplay && (
                  <Button variant="secondary" onClick={() => onViewReplay(gameId)}>
                    <Play />
                    Watch replay
                  </Button>
                )}
                <Button data-primary-action onClick={onReturnToLobby}>
                  <LogOut />
                  Back to lobbies
                </Button>
              </>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
