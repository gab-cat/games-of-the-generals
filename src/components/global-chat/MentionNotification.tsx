"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { AtSign, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoAnimate } from "../../lib/useAutoAnimate";

interface Mention {
  _id: string;
  messageId: string;
  mentionerUsername: string;
  mentionedUsername: string;
  timestamp: number;
  mentionText: string;
  isExiting?: boolean;
}

export function MentionNotification() {
  const mentionsRef = useAutoAnimate();
  const [visibleMentions, setVisibleMentions] = useState<Mention[]>([]);
  const [dismissedMentions, setDismissedMentions] = useState<Set<string>>(new Set());
  const prevMentionsRef = useRef<string>('');

  const markMentionsAsRead = useMutation(api.globalChat.markMentionsAsRead);

  // Play notification sound for mentions
  const playMentionSound = useCallback(() => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Higher pitch for mentions
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn("Could not play mention sound:", error);
    }
  }, []);

  const { data: recentMentions = [] } = useConvexQueryWithOptions(
    api.globalChat.getRecentMentions,
    { limit: 5 },
    {
      staleTime: 30000, // 30 seconds - recent mentions need moderate freshness
      gcTime: 300000, // 5 minutes cache
    }
  );

  useEffect(() => {
    // Create a stable identifier for the mentions array
    const mentionsKey = recentMentions.map((m: { _id: any; }) => m._id).sort().join(',');

    // Only update if mentions have actually changed
    if (mentionsKey !== prevMentionsRef.current) {
      prevMentionsRef.current = mentionsKey;

      // Show new mentions that haven't been dismissed
      const newMentions = recentMentions.filter(
        (        mention: { _id: string; isRead: any; }) => !dismissedMentions.has(mention._id) && !mention.isRead
      );

      setVisibleMentions(prev => {
        // Combine existing mentions with new ones, avoiding duplicates
        // Also filter out mentions that are already exiting to prevent them from reappearing
        const existingIds = new Set(prev.map(m => m._id));
        const activeMentions = prev.filter(m => !m.isExiting);
        const uniqueNewMentions = newMentions.filter((m: { _id: string; }) => !existingIds.has(m._id));

        // Play sound notification for new mentions
        if (uniqueNewMentions.length > 0) {
          playMentionSound();
        }

        return [...activeMentions, ...uniqueNewMentions].slice(-3); // Keep max 3 notifications
      });
    }
  }, [recentMentions, dismissedMentions, playMentionSound]);

  // Auto-mark mentions as read when they appear on screen
  useEffect(() => {
    if (visibleMentions.length > 0) {
      markMentionsAsRead().catch((error) => {
        console.error("Failed to mark mentions as read:", error);
      });
    }
  }, [visibleMentions.length, markMentionsAsRead]);

  // Auto-dismiss mentions after 5 seconds
  useEffect(() => {
    if (visibleMentions.length === 0) return;

    const timers = visibleMentions
      .filter(mention => !mention.isExiting)
      .map(mention => {
        return setTimeout(() => {
          setVisibleMentions(prev =>
            prev.map(m => m._id === mention._id ? { ...m, isExiting: true } : m)
          );
          // Remove after animation completes
          setTimeout(() => {
            setVisibleMentions(prev => prev.filter(m => m._id !== mention._id));
          }, 350);
        }, 5000); // 5 seconds
      });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleMentions]);

  const dismissMention = useCallback((mentionId: string) => {
    setDismissedMentions(prev => new Set([...prev, mentionId]));
    setVisibleMentions(prev =>
      prev.map(m => m._id === mentionId ? { ...m, isExiting: true } : m)
    );
    // Remove after animation completes
    setTimeout(() => {
      setVisibleMentions(prev => prev.filter(m => m._id !== mentionId));
    }, 350); // Slightly longer than animation duration
  }, []);

  if (visibleMentions.length === 0) {
    return null;
  }

  return (
    <div ref={mentionsRef} className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {visibleMentions
          .filter(mention => !mention.isExiting)
          .map((mention, index) => (
          <motion.div
            key={mention._id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{
              opacity: { duration: 0.3 },
              x: { duration: 0.3 },
              scale: { duration: 0.3 },
              delay: index * 0.1
            }}
            className={cn(
              "bg-gray-950/80 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl",
              "p-4 min-w-80 max-w-sm cursor-pointer hover:bg-gray-900/80 transition-colors"
            )}
            onClick={() => dismissMention(mention._id)}
          >
            <div className="flex items-start gap-3">
              {/* Mention Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <AtSign className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-white/90 text-xs font-medium">
                    New Mention
                  </span>
                </div>

                <p className="text-white/80 text-xs mb-2">
                  <span className="font-medium text-blue-300">
                    {mention.mentionerUsername}
                  </span>{" "}
                  mentioned you in chat
                </p>

                <div className="bg-white/10 rounded-lg p-1 mb-3">
                  <p className="text-white/70 text-xs line-clamp-2">
                    {mention.mentionText}
                  </p>
                </div>

                <div className="flex items-center justify-end">
                  <span className="text-white/50 text-xs">
                    {new Date(mention.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
