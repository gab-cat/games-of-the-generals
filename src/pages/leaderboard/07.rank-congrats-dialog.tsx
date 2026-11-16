import { useEffect } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSound } from "@/lib/SoundProvider";

interface RankCongratsDialogProps {
  open: boolean;
  position: number | null;
  player?: {
    username: string;
    avatarUrl?: string;
    rank: string;
    avatarFrame?: string;
  };
  onClose: () => void;
}

/** Shown once when the viewer reaches a new best place in the top ten. */
export function RankCongratsDialog({
  open: isOpen,
  position,
  player,
  onClose,
}: RankCongratsDialogProps) {
  const { playSFX } = useSound();
  const open = isOpen && position !== null && !!player;

  useEffect(() => {
    if (open) playSFX("leaderboard");
  }, [open, playSFX]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            You are number {position} on the leaderboard
          </DialogTitle>
          <DialogDescription className="text-center">
            That is your best place so far.
          </DialogDescription>
        </DialogHeader>
        {player ? (
          <div className="flex justify-center py-2">
            <UserAvatar
              username={player.username}
              avatarUrl={player.avatarUrl}
              rank={player.rank}
              size="xl"
              frame={player.avatarFrame}
              className="h-20 w-20"
            />
          </div>
        ) : null}
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
