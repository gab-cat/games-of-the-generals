import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from './ui/dialog';
import { Sword, Shield } from 'lucide-react';
import { useConvexQuery } from '../lib/convex-query-hooks';
import { api } from '../../convex/_generated/api';
import { UserAvatar } from './UserAvatar';

interface GameStartCountdownModalProps {
  isOpen: boolean;
  onComplete: () => void;
  player1Username: string;
  player2Username: string;
  currentUsername: string;
}

export function GameStartCountdownModal({ 
  isOpen, 
  onComplete, 
  player1Username, 
  player2Username,
  currentUsername 
}: GameStartCountdownModalProps) {
  const [countdown, setCountdown] = useState(10);

  // Fetch profile data for both players to get avatarUrl and rank
  const { data: player1Profile } = useConvexQuery(api.profiles.getProfileByUsername, {
    username: player1Username || undefined
  });
  const { data: player2Profile } = useConvexQuery(api.profiles.getProfileByUsername, {
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
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-blue-500/20 shadow-2xl [&>button]:hidden"
        aria-describedby="countdown-description"
      >
        <div className="flex flex-col items-center space-y-6 py-8">
          {/* Hidden description for accessibility */}
          <div id="countdown-description" className="sr-only">
            Game starting countdown timer. Battle will begin in {countdown} seconds.
          </div>
          {/* Battle Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="relative"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-red-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
              <Sword className="h-10 w-10 text-blue-400" />
            </div>
            
            {/* Decorative shields */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute -left-6 top-1/2 transform -translate-y-1/2"
            >
              <Shield className="h-6 w-6 text-blue-300/60" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute -right-6 top-1/2 transform -translate-y-1/2"
            >
              <Shield className="h-6 w-6 text-red-300/60" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Battle Commencing!</h2>
            <p className="text-slate-300 text-sm">Prepare for strategic warfare</p>
          </motion.div>

          {/* Players */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center space-x-8"
          >
            <div className="text-center">
              <div className="mb-2">
                <UserAvatar 
                  username={player1Username}
                  avatarUrl={player1Profile?.avatarUrl}
                  rank={player1Profile?.rank}
                  size="lg"
                  className={`mx-auto ${
                    currentUsername === player1Username 
                      ? 'ring-2 ring-blue-400' 
                      : ''
                  }`}
                />
              </div>
              <p className={`text-xs font-medium ${
                currentUsername === player1Username ? 'text-blue-300' : 'text-slate-400'
              }`}>
                {player1Username}
                {currentUsername === player1Username && (
                  <span className="block text-xs text-blue-400">(You)</span>
                )}
              </p>
            </div>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-slate-400"
            >
              <Sword className="h-6 w-6" />
            </motion.div>

            <div className="text-center">
              <div className="mb-2">
                <UserAvatar 
                  username={player2Username}
                  avatarUrl={player2Profile?.avatarUrl}
                  rank={player2Profile?.rank}
                  size="lg"
                  className={`mx-auto ${
                    currentUsername === player2Username 
                      ? 'ring-2 ring-red-400' 
                      : ''
                  }`}
                />
              </div>
              <p className={`text-xs font-medium ${
                currentUsername === player2Username ? 'text-red-300' : 'text-slate-400'
              }`}>
                {player2Username}
                {currentUsername === player2Username && (
                  <span className="block text-xs text-red-400">(You)</span>
                )}
              </p>
            </div>
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="relative"
          >
            {/* Progress Ring */}
            <svg width="120" height="120" className="transform -rotate-90">
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-700/50"
              />
              {/* Progress ring */}
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={countdown > 5 ? "text-blue-400" : countdown > 3 ? "text-yellow-400" : "text-red-400"}
              />
            </svg>
            
            {/* Countdown number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.3, type: "spring" }}
                  className={`text-4xl font-bold ${
                    countdown > 5 ? "text-blue-400" : 
                    countdown > 3 ? "text-yellow-400" : 
                    countdown > 0 ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {countdown > 0 ? countdown : "GO!"}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-slate-400 text-sm text-center"
          >
            {countdown > 0 ? "Starting in..." : "Enter the battlefield!"}
          </motion.p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
