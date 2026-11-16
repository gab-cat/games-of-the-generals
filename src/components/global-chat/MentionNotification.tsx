"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useMutation } from "convex/react";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/button";

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
  const [visibleMentions, setVisibleMentions] = useState<Mention[]>([]);
  const [dismissedMentions, setDismissedMentions] = useState<Set<string>>(
    new Set(),
  );
  const prevMentionsRef = useRef<string>("");

  const markMentionsAsRead = useMutation(api.globalChat.markMentionsAsRead);

  // Play notification sound for mentions
  const playMentionSound = useCallback(() => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Higher pitch for mentions
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3,
      );

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
    },
  );

  useEffect(() => {
    // Create a stable identifier for the mentions array
    const mentionsKey = recentMentions
      .map((m: { _id: any }) => m._id)
      .sort()
      .join(",");

    // Only update if mentions have actually changed
    if (mentionsKey !== prevMentionsRef.current) {
      prevMentionsRef.current = mentionsKey;

      // Show new mentions that haven't been dismissed
      const newMentions = recentMentions.filter(
        (mention: { _id: string; isRead: any }) =>
          !dismissedMentions.has(mention._id) && !mention.isRead,
      );

      setVisibleMentions((prev) => {
        // Combine existing mentions with new ones, avoiding duplicates
        // Also filter out mentions that are already exiting to prevent them from reappearing
        const existingIds = new Set(prev.map((m) => m._id));
        const activeMentions = prev.filter((m) => !m.isExiting);
        const uniqueNewMentions = newMentions.filter(
          (m: { _id: string }) => !existingIds.has(m._id),
        );

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
      .filter((mention) => !mention.isExiting)
      .map((mention) => {
        return setTimeout(() => {
          setVisibleMentions((prev) =>
            prev.map((m) =>
              m._id === mention._id ? { ...m, isExiting: true } : m,
            ),
          );
          // Remove after animation completes
          setTimeout(() => {
            setVisibleMentions((prev) =>
              prev.filter((m) => m._id !== mention._id),
            );
          }, 350);
        }, 5000); // 5 seconds
      });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [visibleMentions]);

  const dismissMention = useCallback((mentionId: string) => {
    setDismissedMentions((prev) => new Set([...prev, mentionId]));
    setVisibleMentions((prev) =>
      prev.map((m) => (m._id === mentionId ? { ...m, isExiting: true } : m)),
    );
    // Remove after animation completes
    setTimeout(() => {
      setVisibleMentions((prev) => prev.filter((m) => m._id !== mentionId));
    }, 350); // Slightly longer than animation duration
  }, []);

  if (visibleMentions.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-[4.5rem] z-[60] w-[calc(100vw-2rem)] max-w-sm space-y-2 sm:top-20"
    >
      <AnimatePresence>
        {visibleMentions
          .filter((mention) => !mention.isExiting)
          .map((mention, index) => (
            <motion.div
              key={mention._id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1],
                delay: index * 0.05,
              }}
              className="pointer-events-auto flex items-start gap-2 rounded-lg border border-border-strong bg-card p-3 shadow-lg"
            >
              <button
                type="button"
                onClick={() => dismissMention(mention._id)}
                className="min-w-0 flex-1 rounded-md p-1 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                <p className="text-sm text-foreground">
                  <span className="font-semibold">
                    {mention.mentionerUsername}
                  </span>{" "}
                  mentioned you in global chat
                </p>
                <p className="mt-1 line-clamp-2 break-words text-sm text-foreground/80">
                  {mention.mentionText}
                </p>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dismissMention(mention._id)}
                aria-label="Dismiss"
                className="h-9 w-9 shrink-0"
              >
                <X />
              </Button>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
