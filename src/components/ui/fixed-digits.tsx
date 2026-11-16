import { cn } from "@/lib/utils";

/**
 * Renders a ticking value ("14:59", "05:21:09", "9") in Poppins without
 * wobbling. Poppins digits are proportional (a "1" is half as wide as a "0")
 * and the font has no tabular figures, so each digit gets its own
 * fixed-width slot. Use it for clocks and countdowns, not static numbers.
 */
export function FixedDigits({
  children,
  className,
}: {
  children: string | number;
  className?: string;
}) {
  const text = String(children);
  return (
    <span className={cn("inline-flex whitespace-nowrap", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        {Array.from(text).map((ch, i) =>
          /\d/.test(ch) ? (
            <span key={i} className="inline-block w-[0.64em] text-center">
              {ch}
            </span>
          ) : (
            <span key={i}>{ch}</span>
          ),
        )}
      </span>
    </span>
  );
}
