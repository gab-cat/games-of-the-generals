import { Clock, Zap, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type GameMode = "classic" | "blitz" | "reveal";

interface GameModeOption {
  value: GameMode;
  label: string;
  /** What the mode changes, in one plain sentence. */
  description: string;
  icon: React.ReactNode;
}

const gameModes: GameModeOption[] = [
  {
    value: "classic",
    label: "Classic",
    description:
      "Standard rules with 15 minutes per player. Time to think each move.",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: "blitz",
    label: "Blitz",
    description: "6 minutes per player. Quick decisions under time pressure.",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    value: "reveal",
    label: "Reveal",
    description:
      "The winner's rank is shown after every attack, so each fight gives something away.",
    icon: <Eye className="h-4 w-4" />,
  },
];

interface GameModeSelectorProps {
  value: GameMode;
  onChange: (mode: GameMode) => void;
  disabled?: boolean;
}

export const GameModeSelector = ({
  value,
  onChange,
  disabled,
}: GameModeSelectorProps) => {
  const selectedMode =
    gameModes.find((mode) => mode.value === value) || gameModes[0];

  return (
    <div className="space-y-2">
      <span
        id="game-mode-label"
        className="text-sm font-medium text-foreground"
      >
        Game mode
      </span>

      <div
        role="radiogroup"
        aria-labelledby="game-mode-label"
        className="grid grid-cols-3 gap-2"
      >
        {gameModes.map((mode) => {
          const isSelected = value === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(mode.value)}
              disabled={disabled}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-50",
                isSelected
                  ? "border-gold-500/40 bg-gold-500/10 text-gold-300"
                  : "border-border bg-white/[0.04] text-foreground hover:border-border-strong hover:bg-white/[0.08]",
              )}
            >
              {mode.icon}
              {mode.label}
            </button>
          );
        })}
      </div>

      <p className="text-[13px] text-foreground/80" aria-live="polite">
        {selectedMode.description}
      </p>
    </div>
  );
};
