import { useLayoutEffect, useState } from "react";
import { cn } from "../lib/utils";
import { holdBootScreen, isAppStarting } from "../lib/boot-screen";
import "./loader-board.css";

interface LoadingSpinnerProps {
  /** Cover the whole screen (used while the app itself loads). */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size of the board */
  size?: "sm" | "md" | "lg";
}

// The board is 9 files by 8 ranks. Each army sets up 21 pieces in the 3 rows
// nearest its edge, leaving 6 squares empty; the 2 middle rows start empty.
const BLUE_EMPTY: Record<number, number[]> = { 5: [1, 4, 7], 6: [2, 6], 7: [4] };
const RED_EMPTY: Record<number, number[]> = { 2: [0, 3, 6], 1: [2, 7], 0: [5] };

type Square = { army: "blue" | "red"; k: number } | null;

const SQUARES: Square[] = (() => {
  const squares: Square[] = Array.from({ length: 72 }, () => null);
  let k = 0;
  // Blue fills from its back row forward, left to right.
  for (const row of [7, 6, 5]) {
    for (let col = 0; col < 9; col++) {
      if (!BLUE_EMPTY[row].includes(col)) squares[row * 9 + col] = { army: "blue", k: k++ };
    }
  }
  k = 0;
  // Red does the same from its side of the table.
  for (const row of [0, 1, 2]) {
    for (let col = 8; col >= 0; col--) {
      if (!RED_EMPTY[row].includes(col)) squares[row * 9 + col] = { army: "red", k: k++ };
    }
  }
  return squares;
})();

/** Both armies setting up on the board. */
export function DeployBoard({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <div className={cn("deploy-board", className)} data-size={size} aria-hidden="true">
      {SQUARES.map((square, i) => (
        <i key={i}>
          {square && <b className={square.army} style={{ "--k": square.k } as React.CSSProperties} />}
        </i>
      ))}
      <span className="deploy-front" />
    </div>
  );
}

/**
 * The loader. While the app starts, and whenever it covers the whole screen, it
 * keeps the title card from index.html up (see src/lib/boot-screen.ts) rather
 * than drawing a second loader. Inside a page it shows the board.
 */
export function LoadingSpinner({ fullScreen = false, className, size = "md" }: LoadingSpinnerProps) {
  // Decided once per mount, so a loader doesn't switch looks halfway through.
  const [usesBootScreen] = useState(
    () => (fullScreen || isAppStarting()) && typeof document !== "undefined" && !!document.getElementById("boot"),
  );

  useLayoutEffect(() => (usesBootScreen ? holdBootScreen() : undefined), [usesBootScreen]);

  // The title card covers the screen and announces itself.
  if (usesBootScreen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex select-none items-center justify-center",
        fullScreen ? "fixed inset-0 z-[100] bg-background" : size === "sm" ? "py-8" : "min-h-[50vh]",
        className,
      )}
    >
      <DeployBoard size={fullScreen ? "lg" : size} />
      <span className="sr-only">Loading</span>
    </div>
  );
}
