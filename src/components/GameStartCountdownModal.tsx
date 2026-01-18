import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "./ui/dialog";
import { Sword, Target, Crosshair, Wifi } from "lucide-react";
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-3xl w-full bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-0 overflow-hidden shadow-2xl [&>button]:hidden text-white rounded-sm outline-none focus:outline-none focus-visible:outline-none"
        aria-describedby="countdown-description"
      >
        <div className="relative min-h-[250px] max-h-[85vh] sm:min-h-[300px] md:h-[500px] flex flex-col">
          {/* Tactical Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* Top Bar - Status */}
          <div className="relative z-10 flex items-center justify-between px-3 py-2 md:p-4 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-mono text-emerald-500/80">
              <Wifi className="w-3 h-3 animate-pulse" />
              <span className="hidden xs:inline">LINK_ESTABLISHED</span>
              <span className="xs:hidden">LINKED</span>
            </div>
            <div className="text-[10px] md:text-xs font-mono text-white/20">
              V8.2
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-mono text-blue-400/80">
              <Target className="w-3 h-3" />
              <span className="hidden xs:inline">TARGET_LOCKED</span>
              <span className="xs:hidden">LOCKED</span>
            </div>
          </div>

          <div className="flex-1 relative z-10 flex flex-col md:flex-row items-center justify-center md:justify-between px-4 py-3 md:p-12 gap-2 md:gap-8 overflow-y-auto overflow-x-hidden">
            {/* Player 1 (Blue) */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex md:flex-1 flex-col items-center"
            >
              <div className="relative group">
                <div
                  className={`absolute inset-0 bg-blue-500/20 rounded-full blur-xl transition-all duration-500 ${currentUsername === player1Username ? "opacity-100 scale-125" : "opacity-0 scale-100"}`}
                />
                <div className="relative w-16 h-16 xs:w-20 xs:h-20 sm:w-28 sm:h-28 md:w-40 md:h-40">
                  <UserAvatar
                    username={player1Username}
                    avatarUrl={player1Profile?.avatarUrl}
                    rank={player1Profile?.rank}
                    size="xl"
                    frame={player1Profile?.avatarFrame}
                    className="w-full h-full ring-2 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                  />
                  {currentUsername === player1Username && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-sm tracking-wider shadow-lg font-mono border border-blue-400/50 z-20">
                      YOU
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 md:mt-6 text-center">
                <h3 className="text-base md:text-2xl font-bold text-white tracking-tight">
                  {player1Username}
                </h3>
                <div className="mt-1 md:mt-2 flex items-center justify-center gap-2">
                  <div className="h-1 w-12 md:h-1.5 md:w-16 bg-blue-900/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <span className="text-[10px] md:text-xs font-mono text-blue-400">
                    READY
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Center Display - VS & Countdown */}
            <div className="flex flex-col items-center justify-center shrink-0 w-32 md:w-48 relative py-2 md:py-0">
              <div className="absolute inset-0 bg-zinc-900/50 blur-2xl -z-10" />

              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                className="mb-1 md:mb-8"
              >
                <div className="w-8 h-8 md:w-16 md:h-16 bg-zinc-800 rounded-lg flex items-center justify-center border border-white/10 rotate-45 transform hover:rotate-90 transition-transform duration-700">
                  <Sword className="w-4 h-4 md:w-8 md:h-8 text-white/80 -rotate-45" />
                </div>
              </motion.div>

              <div className="relative">
                <div className="text-center space-y-1 md:space-y-2">
                  <div className="text-[10px] md:text-xs font-mono text-white/50 tracking-[0.2em] uppercase">
                    Commencing
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={countdown}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-3xl md:text-7xl font-mono font-bold text-white tabular-nums tracking-tighter"
                    >
                      {countdown > 0 ? (
                        <>
                          <span className="text-white/20">00:0</span>
                          <span
                            className={
                              countdown <= 3 ? "text-red-500" : "text-white"
                            }
                          >
                            {countdown}
                          </span>
                        </>
                      ) : (
                        <span className="text-emerald-500 text-4xl md:text-5xl tracking-normal">
                          GO!
                        </span>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Player 2 (Red) */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex md:flex-1 flex-col items-center"
            >
              <div className="relative group">
                <div
                  className={`absolute inset-0 bg-red-500/20 rounded-full blur-xl transition-all duration-500 ${currentUsername === player2Username ? "opacity-100 scale-125" : "opacity-0 scale-100"}`}
                />
                <div className="relative w-16 h-16 xs:w-20 xs:h-20 sm:w-28 sm:h-28 md:w-40 md:h-40">
                  <UserAvatar
                    username={player2Username}
                    avatarUrl={player2Profile?.avatarUrl}
                    rank={player2Profile?.rank}
                    size="xl"
                    frame={player2Profile?.avatarFrame}
                    className="w-full h-full ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  />
                  {currentUsername === player2Username && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-sm tracking-wider shadow-lg font-mono border border-red-400/50 z-20">
                      YOU
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 md:mt-6 text-center">
                <h3 className="text-base md:text-2xl font-bold text-white tracking-tight">
                  {player2Username}
                </h3>
                <div className="mt-1 md:mt-2 flex items-center justify-center gap-2">
                  <span className="text-[10px] md:text-xs font-mono text-red-400">
                    READY
                  </span>
                  <div className="h-1 w-12 md:h-1.5 md:w-16 bg-red-900/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-red-500"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, delay: 0.6 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Bar - Tips */}
          <div className="relative z-10 p-4 bg-black/40 border-t border-white/10">
            <div className="flex items-center justify-center gap-4 text-white/40">
              <Crosshair className="w-4 h-4" />
              <p className="text-xs md:text-sm font-mono uppercase tracking-wider">
                {countdown > 0
                  ? "Initialising Battle Systems..."
                  : "Engagement Protocols Active"}
              </p>
              <Crosshair className="w-4 h-4" />
            </div>
            {/* Loading/Progress Bar at very bottom */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 via-white to-red-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 10, ease: "linear" }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
