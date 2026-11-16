import { CircleHelp } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface TutorialButtonProps {
  /** Opens the one tutorial dialog owned by Layout. */
  onOpen: () => void;
  variant?: "icon" | "text";
  className?: string;
}

/**
 * Opens "How to play". Layout owns the single TutorialModal and decides when
 * to show it on first sign-in, so this button never opens it by itself.
 */
export function TutorialButton({
  onOpen,
  variant = "icon",
  className,
}: TutorialButtonProps) {
  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpen}
        aria-label="How to play"
        title="How to play"
        className={cn("h-9 w-9", className)}
      >
        <CircleHelp className="!size-[18px]" />
      </Button>
    );
  }

  return (
    <Button variant="secondary" onClick={onOpen} className={className}>
      <CircleHelp />
      How to play
    </Button>
  );
}
