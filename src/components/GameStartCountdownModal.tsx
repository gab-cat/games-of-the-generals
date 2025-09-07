import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from './ui/dialog';
import { Sword } from 'lucide-react';
import { useQuery } from 'convex-helpers/react/cache';
import { api } from '../../convex/_generated/api';
import { UserAvatar } from './UserAvatar';

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
  currentUsername 
}: GameStartCountdownModalProps) {
  const [countdown, setCountdown] = useState(10);

  // Fetch profile data for both players to get avatarUrl and rank
  const player1Profile = useQuery(api.profiles.getProfileByUsername, {
    username: player1Username || undefined
  });
  const player2Profile = useQuery(api.profiles.getProfileByUsername, {
    username: player2Username || undefined
  });

  useEffect(() => {
    if (isOpen) {
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

  const progress = ((10 - countdown) / 10) * 100;
  const circumference = 2 * Math.PI * 50; // radius = 50
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-lg bg-black/20 backdrop-blur-sm border border-slate-700/50 shadow-2xl [&>button]:hidden shadow-blue-500/20"
        aria-describedby="countdown-description"
      >
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-lg" />

        <div className="relative flex flex-col items-center space-y-6 py-8 px-6">
          {/* Hidden description for accessibility */}
          <div id="countdown-description" className="sr-only">
            Game starting countdown timer. Battle will begin in {countdown} seconds.
          </div>
          
          {/* Battle Icon with Glowing Ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            {/* Outer glowing ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.3)",
                  "0 0 30px rgba(59, 130, 246, 0.5)",
                  "0 0 20px rgba(59, 130, 246, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Main sword container */}
            <div className="w-20 h-20 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-full flex items-center justify-center border border-slate-600/50 shadow-lg relative z-10">
              <Sword className="h-10 w-10 text-slate-300" />
            </div>
          </motion.div>

          {/* Clean Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              Battle Commencing!
            </h2>
            <p className="text-slate-400 text-sm">
              Prepare for strategic warfare
            </p>
          </motion.div>

          {/* Clean Players Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center justify-center space-x-8"
          >
            {/* Player 1 */}
            <div className="text-center">
              <div className="mb-3 relative">
                <UserAvatar
                  username={player1Username}
                  avatarUrl={player1Profile?.avatarUrl}
                  rank={player1Profile?.rank}
                  size="lg"
                  className={`mx-auto ${
                    currentUsername === player1Username
                      ? 'ring-2 ring-blue-400'
                      : 'ring-1 ring-slate-600'
                  }`}
                />
                {/* Clean YOU indicator */}
                {currentUsername === player1Username && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                    className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-md"
                  >
                    YOU
                  </motion.div>
                )}
              </div>
              <p className={`text-sm font-medium ${
                currentUsername === player1Username ? 'text-blue-300' : 'text-slate-400'
              }`}>
                {player1Username}
              </p>
            </div>

            {/* Simple VS indicator */}
            <div className="bg-slate-700/50 border border-slate-600/50 rounded-full px-3 py-1">
              <span className="text-slate-300 font-medium text-sm">VS</span>
            </div>

            {/* Player 2 */}
            <div className="text-center">
              <div className="mb-3 relative">
                <UserAvatar 
                  username={player2Username}
                  avatarUrl={player2Profile?.avatarUrl}
                  rank={player2Profile?.rank}
                  size="lg"
                  className={`mx-auto ${
                    currentUsername === player2Username 
                      ? 'ring-2 ring-red-400' 
                      : 'ring-1 ring-slate-600'
                  }`}
                />
                {/* Clean YOU indicator */}
                {currentUsername === player2Username && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                    className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-md"
                  >
                    YOU
                  </motion.div>
                )}
              </div>
              <p className={`text-sm font-medium ${
                currentUsername === player2Username ? 'text-red-300' : 'text-slate-400'
              }`}>
                {player2Username}
              </p>
            </div>
          </motion.div>

          {/* Clean Countdown */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="relative"
          >
            {/* Simple Progress Ring */}
            <svg width="120" height="120" className="transform -rotate-90">
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="rgba(100, 116, 139, 0.3)"
                strokeWidth="4"
                fill="transparent"
              />
              {/* Progress ring */}
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                stroke={countdown > 5 ? "#3b82f6" : countdown > 3 ? "#f59e0b" : "#ef4444"}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="drop-shadow-sm"
              />
            </svg>
            
            {/* Clean countdown number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <span className={`text-4xl font-bold ${
                    countdown > 5 ? "text-blue-400" : 
                    countdown > 3 ? "text-yellow-400" : 
                    countdown > 0 ? "text-red-400" : "text-green-400"
                  }`}>
                    {countdown > 0 ? countdown : "GO!"}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Clean Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-slate-400 text-sm text-center"
          >
            {countdown > 0 ? "Starting in..." : "Enter the battlefield!"}
          </motion.p>
        </div>
      </DialogContent>
    </Dialog>
  );
});
