import * as React from "react";

import { cn } from "@/lib/utils";

type Tone = "default" | "gold" | "win" | "loss";

const toneClass: Record<Tone, string> = {
  default: "text-foreground",
  gold: "text-gold-400",
  win: "text-emerald-400",
  loss: "text-red-400",
};

interface StatProps {
  /** Sentence-case label: "Win rate", not "WIN RATE". */
  label: React.ReactNode;
  value: React.ReactNode;
  /** Small line under the value: "Best 4", "Avg 12m". */
  hint?: React.ReactNode;
  tone?: Tone;
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl sm:text-3xl",
};

/** A number with a label. Numbers use tabular mono so they never jump. */
export function Stat({
  label,
  value,
  hint,
  tone = "default",
  align = "left",
  size = "md",
  className,
}: StatProps) {
  return (
    <div
      className={cn(
        "min-w-0",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
    >
      <div className="text-xs text-foreground/70 sm:text-[13px]">{label}</div>
      <div
        className={cn(
          "mt-0.5 font-medium tabular-nums leading-tight",
          sizeClass[size],
          toneClass[tone],
        )}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}
