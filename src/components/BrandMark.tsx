import { cn } from "@/lib/utils";

/** Three gold rank chevrons, the Season 3 mark. Decorative: pair it with the name. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("h-6 w-6 text-gold-500", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 9.5 12 5l7 4.5" />
      <path d="M5 14 12 9.5l7 4.5" />
      <path d="M5 18.5 12 14l7 4.5" />
    </svg>
  );
}

/** Mark plus product name, used in the header, footer and sign-in page. */
export function BrandLockup({
  className,
  compact = false,
}: {
  className?: string;
  /** Shorter name on very narrow screens. */
  compact?: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark className="h-6 w-6 shrink-0" />
      <span className="truncate font-display text-[17px] font-semibold leading-none text-foreground sm:text-lg">
        {compact ? (
          <>
            <span className="sm:hidden">Generals</span>
            <span className="hidden sm:inline">Games of the Generals</span>
          </>
        ) : (
          "Games of the Generals"
        )}
      </span>
    </span>
  );
}
