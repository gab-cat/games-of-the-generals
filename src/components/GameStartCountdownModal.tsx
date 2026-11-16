import { useState, useEffect, memo } from "react";
import { FixedDigits } from "@/components/ui/fixed-digits";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "../../convex/_generated/api";
import { UserAvatar } from "./UserAvatar";
import { useSound } from "../lib/SoundProvider";

interface GameStartCountdownModalProps {
  isOpen: boolean;
  onComplete: () => void;
  player1Username: string;
  player2Username: string;
  currentUsername: string;
}

export const GameStartCountdownModal = memo(function GameStartCountdownModal({
  isOpen,
  onComplete,
  player1Username,
  player2Username,
  currentUsername,
}: GameStartCountdownModalProps) {
  const [countdown, setCountdown] = useState(10);

  // Fetch profile data for both players to get avatarUrl and rank
  const player1Profile = useQuery(api.profiles.getProfileByUsername, {
    username: player1Username || undefined,
  });
  const player2Profile = useQuery(api.profiles.getProfileByUsername, {
    username: player2Username || undefined,
  });
  const { playSFX } = useSound();

  useEffect(() => {
    if (isOpen) {
      // Play match-found SFX when the game starting modal opens
      playSFX("match-found");

      setCountdown(10);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimeout(() => {
              onComplete();
            }, 1000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // Reset countdown when modal is closed
      setCountdown(10);
    }
  }, [isOpen, onComplete]);

  const players = [
    {
      key: "p1",
      name: player1Username,
      profile: player1Profile,
      ring: "ring-blue-400/60",
      label: "bg-blue-500/15 text-blue-200 border-blue-400/30",
    },
    {
      key: "p2",
      name: player2Username,
      profile: player2Profile,
      ring: "ring-red-400/60",
      label: "bg-red-500/15 text-red-200 border-red-400/30",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-xl gap-0 p-0 [&>button]:hidden outline-none focus:outline-none focus-visible:outline-none"
        aria-describedby="countdown-description"
      >
        <DialogTitle className="sr-only">Match found</DialogTitle>
        <DialogDescription id="countdown-description" className="sr-only">
          Your game starts in {countdown} seconds.
        </DialogDescription>

        <div className="px-5 pb-6 pt-7 text-center sm:px-8">
          <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Match found
          </h2>
          <p className="mt-1 text-sm text-foreground/80">
            Next, you place your pieces.
          </p>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
            {players.map((p, i) => {
              const isYou = currentUsername === p.name;
              return (
                <motion.div
                  key={p.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: 0.1 + i * 0.08 }}
                  className={`flex min-w-0 flex-col items-center ${i === 1 ? "order-3" : "order-1"}`}
                >
                  <UserAvatar
                    username={p.name}
                    avatarUrl={p.profile?.avatarUrl}
                    rank={p.profile?.rank}
                    size="xl"
                    frame={p.profile?.avatarFrame}
                    className={`h-16 w-16 ring-2 sm:h-24 sm:w-24 ${p.ring}`}
                  />
                  <p className="mt-3 max-w-full truncate text-base font-semibold text-foreground sm:text-lg">
                    {p.name}
                  </p>
                  <span
                    className={`mt-1 rounded border px-1.5 py-0.5 text-xs ${
                      isYou ? p.label : "border-border text-foreground/70"
                    }`}
                  >
                    {isYou ? "You" : "Opponent"}
                  </span>
                </motion.div>
              );
            })}

            <div className="order-2 flex w-16 flex-col items-center sm:w-24">
              <span className="text-xs text-foreground/70">Starting in</span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={countdown}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-4xl font-semibold tabular-nums sm:text-6xl"
                >
                  {countdown > 0 ? (
                    <span
                      className={
                        countdown <= 3 ? "text-gold-400" : "text-foreground"
                      }
                    >
                      <FixedDigits>{countdown}</FixedDigits>
                    </span>
                  ) : (
                    <span className="font-sans text-3xl text-emerald-400 sm:text-4xl">
                      Go
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="relative h-1 w-full bg-white/[0.06]">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 10, ease: "linear" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});
