import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";

interface PaginationControlsProps {
  /** Zero-based. */
  currentPage: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLoading?: boolean;
  onPrev: () => void;
  onNext: () => void;
}

/** Cursor paging: we know the page number, not the total. */
export function PaginationControls({
  currentPage,
  canGoPrev,
  canGoNext,
  isLoading = false,
  onPrev,
  onNext,
}: PaginationControlsProps) {
  if (!canGoPrev && !canGoNext) return null;

  return (
    <nav
      aria-label="Match history pages"
      className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4"
    >
      <Button
        variant="secondary"
        onClick={onPrev}
        disabled={!canGoPrev || isLoading}
      >
        <ChevronLeft />
        Newer
      </Button>
      <span aria-live="polite" className="text-sm text-foreground">
        Page <span className="tabular-nums">{currentPage + 1}</span>
      </span>
      <Button
        variant="secondary"
        onClick={onNext}
        disabled={!canGoNext || isLoading}
      >
        Older
        <ChevronRight />
      </Button>
    </nav>
  );
}
