"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingTime: number; // in seconds
}

export function RateLimitModal({ isOpen, onClose, remainingTime }: RateLimitModalProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-full">
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">
                Rate Limit Exceeded
              </h3>

              <p className="text-white/70 text-sm mb-4">
                You've sent too many messages too quickly. Please wait before sending another message.
              </p>

              <div className="bg-black/40 rounded-lg p-4 mb-6">
                <div className="text-2xl font-mono text-yellow-400 mb-1">
                  {formatTime(remainingTime)}
                </div>
                <div className="text-white/60 text-xs">
                  Time remaining
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                >
                  Got it
                </Button>
              </div>

              <div className="mt-4 text-xs text-white/50">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Spamming may result in temporary chat restrictions
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
