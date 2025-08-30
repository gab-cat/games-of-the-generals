"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, MessageSquareOff } from "lucide-react";
import { Button } from "../ui/button";

interface SpamWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  spamType: 'repeated' | 'caps' | 'excessive' | 'profanity' | 'generic';
  message?: string;
}

export function SpamWarningModal({ isOpen, onClose, spamType, message }: SpamWarningModalProps) {
  const getSpamMessage = () => {
    switch (spamType) {
      case 'profanity':
        return {
          title: "Inappropriate Language",
          description: "Your message contains inappropriate or offensive language. Please keep the conversation respectful.",
          icon: Shield,
          severity: 'error'
        };
      case 'repeated':
        return {
          title: "Repeated Message",
          description: "You sent the same message multiple times. Please vary your messages.",
          icon: MessageSquareOff,
          severity: 'warning'
        };
      case 'caps':
        return {
          title: "Excessive Caps",
          description: "Your message contains too many capital letters. Please use proper capitalization.",
          icon: AlertTriangle,
          severity: 'warning'
        };
      case 'excessive':
        return {
          title: "Excessive Messaging",
          description: "You're sending messages too frequently. Please slow down.",
          icon: Shield,
          severity: 'error'
        };
      default:
        return {
          title: "Message Filtered",
          description: "Your message was flagged by our spam filter.",
          icon: Shield,
          severity: 'error'
        };
    }
  };

  const spamInfo = getSpamMessage();
  const IconComponent = spamInfo.icon;

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
            className="bg-gray-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full ${
                  spamInfo.severity === 'error'
                    ? 'bg-red-500/20'
                    : 'bg-yellow-500/20'
                }`}>
                  <IconComponent className={`w-8 h-8 ${
                    spamInfo.severity === 'error'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`} />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">
                {spamInfo.title}
              </h3>

              <p className="text-white/70 text-sm mb-4">
                {spamInfo.description}
              </p>

              {message && (
                <div className="bg-black/40 rounded-lg p-3 mb-4">
                  <div className="text-white/60 text-xs mb-1">Your message:</div>
                  <div className="text-white/90 text-sm italic">
                    "{message.length > 100 ? `${message.substring(0, 100)}...` : message}"
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                >
                  I understand
                </Button>
              </div>

              <div className="mt-4 text-xs text-white/50">
                <Shield className="w-3 h-3 inline mr-1" />
                Our spam filter helps maintain a positive chat experience for everyone
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
