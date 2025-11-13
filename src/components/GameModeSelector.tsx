import { Clock, Zap, Eye } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export type GameMode = "classic" | "blitz" | "reveal";

interface GameModeOption {
  value: GameMode;
  label: string;
  description: string;
  twist: string; // The unique feature/highlight of this mode
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
}

const gameModes: GameModeOption[] = [
  {
    value: "classic",
    label: "Classic",
    description: "Standard rules with 15 minutes per player",
    twist: "Traditional gameplay with strategic time management",
    icon: <Clock className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    hoverBg: "hover:bg-blue-500/30",
  },
  {
    value: "blitz",
    label: "Blitz",
    description: "Fast-paced action with 6 minutes per player",
    twist: "Quick decisions under time pressure - perfect for rapid matches",
    icon: <Zap className="h-4 w-4" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/30",
    hoverBg: "hover:bg-orange-500/30",
  },
  {
    value: "reveal",
    label: "Reveal",
    description: "Winner's rank is revealed after each attack",
    twist: "Winner's piece rank is revealed after each challenge - adds strategic depth",
    icon: <Eye className="h-4 w-4" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    hoverBg: "hover:bg-purple-500/30",
  },
];

interface GameModeSelectorProps {
  value: GameMode;
  onChange: (mode: GameMode) => void;
  disabled?: boolean;
}

export const GameModeSelector = ({ value, onChange, disabled }: GameModeSelectorProps) => {
  const selectedMode = gameModes.find(mode => mode.value === value) || gameModes[0];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-white/90">Game Mode</label>
      
      {/* Mode Selection Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {gameModes.map((mode) => {
          const isSelected = value === mode.value;
          return (
            <Button
              key={mode.value}
              type="button"
              variant="outline"
              onClick={() => !disabled && onChange(mode.value)}
              disabled={disabled}
              className={cn(
                "flex items-center justify-center gap-2 h-10 transition-all duration-200",
                "border backdrop-blur-sm",
                isSelected
                  ? `${mode.bgColor} ${mode.borderColor} border-2 ${mode.color} font-semibold shadow-md`
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {mode.icon}
              <span className="text-sm">{mode.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Details Card */}
      <Card className={cn(
        "transition-all duration-200",
        selectedMode.bgColor,
        selectedMode.borderColor
      )}>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={selectedMode.color}>
                {selectedMode.icon}
              </div>
              <h3 className={cn("font-semibold text-sm", selectedMode.color)}>
                {selectedMode.label} Mode
              </h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              {selectedMode.description}
            </p>
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs font-medium text-white/90">
                <span className={selectedMode.color}>✨ Twist:</span> {selectedMode.twist}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

