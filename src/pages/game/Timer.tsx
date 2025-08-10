import { useState, useEffect, useRef, useCallback } from "react";
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

export function Timer({ 
  duration, 
  onTimeout, 
  label, 
  variant = "game", 
  isActive = false,
  timeUsed = 0,
  onTimeUpdate: _onTimeUpdate,
  turnStartTime
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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const progressValue = ((duration - timeLeft) / duration) * 100;
  const isLowTime = timeLeft <= 60; // Last minute
  const isCritical = timeLeft <= 30; // Last 30 seconds

  const getVariantStyles = useCallback(() => {
    if (variant === "setup") {
      return {
        bgColor: isCritical ? "bg-red-500/10" : isLowTime ? "bg-yellow-500/10" : "bg-blue-500/10",
        borderColor: isCritical ? "border-red-500/30" : isLowTime ? "border-yellow-500/30" : "border-blue-500/30",
        textColor: isCritical ? "text-red-400" : isLowTime ? "text-yellow-400" : "text-blue-400",
        iconColor: isCritical ? "text-red-500" : isLowTime ? "text-yellow-500" : "text-blue-500"
      };
    } else {
      return {
        bgColor: isCritical ? "bg-red-500/10" : isLowTime ? "bg-orange-500/10" : !isActive ? "bg-gray-500/10" : "bg-green-500/10",
        borderColor: isCritical ? "border-red-500/30" : isLowTime ? "border-orange-500/30" : !isActive ? "border-gray-500/30" : "border-green-500/30",
        textColor: isCritical ? "text-red-400" : isLowTime ? "text-orange-400" : !isActive ? "text-gray-400" : "text-green-400",
        iconColor: isCritical ? "text-red-500" : isLowTime ? "text-orange-500" : !isActive ? "text-gray-500" : "text-green-500"
      };
    }
  }, [variant, isCritical, isLowTime, isActive]);

  const styles = getVariantStyles();

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ 
        scale: isCritical && isActive ? [1, 1.02, 1] : 1,
        opacity: !isActive ? 0.6 : 1 
      }}
      transition={{
        scale: isCritical && isActive ? { repeat: Infinity, duration: 1 } : { duration: 0.3 },
        opacity: { duration: 0.3 }
      }}
      className={`${styles.bgColor} ${styles.borderColor} border backdrop-blur-md rounded-lg p-2`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCritical && isActive ? (
            <AlertTriangle className={`h-4 w-4 ${styles.iconColor}`} />
          ) : (
            <Clock className={`h-4 w-4 ${styles.iconColor}`} />
          )}
          <span className="text-sm font-medium text-muted-foreground mr-4">
            {label} {!isActive && "(Waiting)"}
          </span>
        </div>
        <span className={`font-mono text-lg font-bold ${styles.textColor}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
      
      <Progress 
        value={progressValue} 
        className="h-2"
        // Note: We might need to add custom color variants to the Progress component
      />
      
      {isCritical && isActive && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-xs text-red-400 mt-2 text-center font-medium"
        >
          TIME RUNNING OUT!
        </motion.p>
      )}
    </motion.div>
  );
}
