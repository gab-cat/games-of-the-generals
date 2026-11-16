"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../lib/utils";

interface LoadingSpinnerProps {
  /** Cover the whole screen (used while the app itself loads). */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size of the mark */
  size?: "sm" | "md" | "lg";
}

const widths = { sm: 36, md: 60, lg: 84 } as const;

// The two armies from the 1981 box: a blue chevron and a red one. They charge
// in from either side, meet in the middle with a gold flash, fall back and go
// again. The same mark is drawn in plain CSS in index.html for the first paint,
// so the hand-off from HTML to React doesn't jump. Keep the two in sync.
const BLUE = "2,0 13,0 23,12 13,24 2,24 12,12";
const RED = "46,0 35,0 25,12 35,24 46,24 36,12";
const CYCLE = 1.6;
const TIMES = [0, 0.38, 0.62, 1];

export function ClashMark({ width = 60, className }: { width?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const still = reduceMotion ?? false;
  const loop = { duration: CYCLE, repeat: Infinity, ease: [0.16, 1, 0.3, 1] as const, times: TIMES };

  return (
    <svg
      viewBox="0 0 48 24"
      width={width}
      height={width / 2}
      aria-hidden="true"
      className={cn("overflow-visible", className)}
    >
      <motion.polygon
        points={BLUE}
        fill="#3b82f6"
        initial={false}
        animate={still ? { x: 0, opacity: 1 } : { x: [-9, 0, 0, -9], opacity: [0, 1, 1, 0] }}
        transition={still ? undefined : loop}
      />
      <motion.polygon
        points={RED}
        fill="#ef4b40"
        initial={false}
        animate={still ? { x: 0, opacity: 1 } : { x: [9, 0, 0, 9], opacity: [0, 1, 1, 0] }}
        transition={still ? undefined : loop}
      />
      <motion.rect
        x={23.25}
        y={-3}
        width={1.5}
        height={30}
        rx={0.75}
        fill="#f3d28a"
        style={{ transformOrigin: "24px 12px" }}
        initial={false}
        animate={still ? { opacity: 0.9, scaleY: 1 } : { opacity: [0, 0, 1, 0], scaleY: [0.2, 0.2, 1, 1] }}
        transition={still ? undefined : { ...loop, times: [0, 0.36, 0.42, 0.7] }}
      />
    </svg>
  );
}

/** The loader: the blue and red chevrons meeting in the middle. */
export function LoadingSpinner({
  fullScreen = false,
  className,
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex select-none flex-col items-center justify-center gap-5",
        fullScreen
          ? "fixed inset-0 z-[100] bg-background"
          : size === "sm"
            ? "py-8"
            : "min-h-[50vh]",
        className,
      )}
    >
      <ClashMark width={fullScreen ? 96 : widths[size]} />
      {fullScreen && (
        <p className="text-sm font-semibold text-foreground/80">Games of the Generals</p>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
}
