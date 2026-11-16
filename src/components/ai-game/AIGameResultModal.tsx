import React from "react";
import { Loader2 } from "lucide-react";
import ConfettiBoom from "react-confetti-boom";
import { useReducedMotion } from "framer-motion";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { useSound } from "../../lib/SoundProvider";
import { useConvexQueryWithOptions } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Insignia } from "../season/art";
import {
  RESULT_DIALOG_CLASS,
  focusPrimaryAction,
  ResultTitleCard,
  endSticker,
  type ResultOutcome,
} from "../season/ResultTitleCard";

interface AIGameResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: "player1" | "player2" | null;
  gameEndReason: string | null;
  difficulty: "easy" | "medium" | "hard";
  behavior: "aggressive" | "defensive" | "passive" | "balanced";
  moveCount: number;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

const opponentInfo = {
  easy: { label: "Recruit", rank: "Private", portrait: "recruit" },
  medium: { label: "Veteran", rank: "Captain", portrait: "veteran" },
  hard: { label: "Commander", rank: "General", portrait: "commander" },
} as const;

const behaviorLabel = {
  aggressive: "Aggressive",
  defensive: "Defensive",
  passive: "Passive",
  balanced: "Balanced",
} as const;

function reasonSentence(outcome: ResultOutcome, reason: string | null, moves: number) {
  if (outcome === "draw") return "Neither side could win.";
  const won = outcome === "win";
  const onMove = moves > 0 ? ` on move ${moves}` : "";
  switch (reason) {
    case "flag_captured":
      return won ? `You captured the AI's flag${onMove}.` : `The AI captured your flag${onMove}.`;
    case "flag_reached_base":
      return won ? "Your flag reached the far row." : "The AI's flag reached your back row.";
    case "elimination":
      return won ? "The AI has no pieces that can move." : "You have no pieces that can move.";
    case "timeout":
      return won ? "The AI ran out of time." : "You ran out of time.";
    case "surrender":
      return won ? "The AI gave up." : "You gave up.";
    default:
      return won ? "You beat the AI." : "The AI won this one.";
  }
}

export function AIGameResultModal({
  isOpen,
  onClose,
  winner,
  gameEndReason,
  difficulty,
  behavior,
  moveCount,
  onPlayAgain,
  onReturnToLobby,
}: AIGameResultModalProps) {
  const outcome: ResultOutcome =
    winner === "player1" ? "win" : winner === "player2" ? "loss" : "draw";
  const { playSFX } = useSound();
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = React.useState<"again" | "leave" | null>(null);

  // Same cached query the AI page already holds, so this costs nothing extra.
  const { data: profile } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    { staleTime: 120000, gcTime: 600000 },
  );

  // Play victory/lose SFX when modal opens
  React.useEffect(() => {
    if (isOpen && outcome !== "draw") {
      playSFX(outcome === "win" ? "player-victory" : "player-lose");
    }
  }, [isOpen, outcome, playSFX]);

  // The board closes the modal when an action starts, so reset the pending
  // state whenever it closes or reopens.
  React.useEffect(() => {
    if (!isOpen) setPending(null);
  }, [isOpen]);

  const ai = opponentInfo[difficulty];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={RESULT_DIALOG_CLASS} onOpenAutoFocus={focusPrimaryAction}>
        {outcome === "win" && !reduceMotion && (
          <ConfettiBoom
            mode="boom"
            particleCount={60}
            colors={["#e0b85c", "#d9a441", "#f3d58f", "#3b82f6"]}
            shapeSize={10}
            launchSpeed={1.2}
            opacityDeltaMultiplier={2.5}
          />
        )}

        {isOpen && (
          <ResultTitleCard
            outcome={outcome}
            myArmy="blue"
            sticker={endSticker(outcome, gameEndReason, "ai")}
            reasonText={reasonSentence(outcome, gameEndReason, moveCount)}
            stats={[
              { label: "Moves", value: moveCount },
              {
                label: "Opponent",
                value: (
                  <span className="inline-flex items-center gap-1.5">
                    <Insignia rank={ai.rank} className="h-4 text-gold-400" />
                    {ai.label}
                  </span>
                ),
              },
              { label: "Style", value: behaviorLabel[behavior] },
            ]}
            me={{
              name: profile?.username ?? "You",
              avatarUrl: profile?.avatarUrl,
              caption: "You",
            }}
            opponent={{
              name: ai.label,
              portrait: ai.portrait,
              caption: `${behaviorLabel[behavior]} AI`,
            }}
            actions={
              <>
                <Button
                  variant="secondary"
                  disabled={pending !== null}
                  onClick={() => {
                    setPending("leave");
                    onReturnToLobby();
                  }}
                >
                  {pending === "leave" ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Leaving
                    </>
                  ) : (
                    "Back to menu"
                  )}
                </Button>
                <Button
                  data-primary-action
                  disabled={pending !== null}
                  onClick={() => {
                    setPending("again");
                    onPlayAgain();
                  }}
                >
                  {pending === "again" ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Starting
                    </>
                  ) : (
                    "Play again"
                  )}
                </Button>
              </>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
