import { useState, useEffect, useRef, useCallback, memo } from "react";
import { FixedDigits } from "@/components/ui/fixed-digits";
import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TimerProps {
  duration: number; // in seconds
  onTimeout: () => void;
  label: string;
  variant?: "setup" | "game";
  isActive: boolean; // Whether this timer should be counting down
  timeUsed?: number; // time already used in seconds
  onTimeUpdate?: (timeUsed: number) => void;
  turnStartTime?: number; // timestamp when current turn started
}

export const Timer = memo(function Timer({
  duration,
  onTimeout,
  label,
  variant: _variant = "game",
  isActive = false,
  timeUsed = 0,
  onTimeUpdate: _onTimeUpdate,
  turnStartTime,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Update ref when onTimeout changes to avoid stale closures
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Memoize timeout handler to prevent recreation
  const handleTimeout = useCallback(() => {
    onTimeoutRef.current();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Calculate current time left
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isActive || !turnStartTime) {
      // When not active, show remaining time based on server's time used
      setTimeLeft(Math.max(0, duration - timeUsed));
      return;
    }

    // When active, start the countdown
    const startTime = Date.now();
    const initialTimeLeft = Math.max(0, duration - timeUsed);
    setTimeLeft(initialTimeLeft);

    // Use a longer interval to reduce CPU usage (500ms instead of 100ms)
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, initialTimeLeft - elapsed);

      setTimeLeft(remaining);

      // Check for timeout
      if (remaining <= 0) {
        handleTimeout();
      }
    }, 500); // Reduced frequency for better performance

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, turnStartTime, timeUsed, duration, handleTimeout]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const progressValue = ((duration - timeLeft) / duration) * 100;
  const isLowTime = timeLeft <= 60; // Last minute
  const isCritical = timeLeft <= 30; // Last 30 seconds

  const timeColor =
    isActive && isCritical
      ? "text-red-400"
      : isActive && isLowTime
        ? "text-gold-300"
        : "text-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: !isActive ? 0.7 : 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-lg border bg-white/[0.03] px-3 py-2.5 ${
        isActive && isCritical ? "border-red-500/40" : "border-border"
      }`}
      role="timer"
      aria-label={label}
    >
      <div className="flex items-center justify-between gap-6">
        <span className="flex items-center gap-2 text-[13px] text-foreground/80">
          {isCritical && isActive ? (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          ) : (
            <Clock className="h-4 w-4 text-foreground/70" />
          )}
          {label}
          {!isActive && <span className="text-foreground/60">(paused)</span>}
        </span>
        <span
          className={`text-xl font-semibold tabular-nums ${timeColor}`}
        >
          <FixedDigits>{formatTime(timeLeft)}</FixedDigits>
        </span>
      </div>

      <Progress
        value={progressValue}
        className={`mt-2 h-1 ${isActive && isCritical ? "[&>div]:bg-red-400" : ""}`}
      />

      {isCritical && isActive && (
        <p className="mt-2 text-xs text-red-300">Time is almost up.</p>
      )}
    </motion.div>
  );
});
