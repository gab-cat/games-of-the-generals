import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/*
 * The Season 3 key art: the blue and red chevrons from the 1981 box charge in
 * from both sides and meet in the middle. The Season 3 painting shows through
 * them as a two-colour print (soldier on the blue side, troops on the red).
 * Used on the sign-in page and the Season 3 announcement.
 */

const PAINTING = "/season/season-3-banner.webp";
const EASE = [0.16, 1, 0.3, 1] as const;

// Each half is a chevron; their tips meet at the centre line.
const LEFT_CLIP = "polygon(0 0, 52% 0, 100% 50%, 52% 100%, 0 100%, 48% 50%)";
const RIGHT_CLIP = "polygon(48% 0, 100% 0, 52% 50%, 100% 100%, 48% 100%, 0 50%)";

function Half({ side, delay }: { side: "left" | "right"; delay: number }) {
  const left = side === "left";
  return (
    <motion.div
      className="absolute inset-y-0 w-1/2 overflow-hidden"
      style={{ [left ? "left" : "right"]: 0, clipPath: left ? LEFT_CLIP : RIGHT_CLIP }}
      initial={{ x: left ? "-105%" : "105%" }}
      animate={{ x: [left ? "-105%" : "105%", left ? "2%" : "-2%", "0%"] }}
      transition={{ duration: 1.1, times: [0, 0.82, 1], ease: EASE, delay }}
    >
      {/* The right 60% of the painting, bottom-anchored, spread across both halves */}
      <motion.img
        src={PAINTING}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute bottom-0 h-auto w-[333%] max-w-none origin-bottom-right brightness-[1.9] contrast-[1.15] grayscale"
        style={{ right: left ? "-100%" : 0 }}
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: EASE }}
      />
      {/* Army colour: blue one side, red the other, as on the 1981 box */}
      <div
        className={cn(
          "absolute inset-0 mix-blend-multiply",
          left ? "bg-[#3b82f6]" : "bg-[#ef4b40]",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 mix-blend-screen",
          left
            ? "bg-gradient-to-br from-[#0a1a3d]/60 via-transparent to-[#7fb0ff]/25"
            : "bg-gradient-to-bl from-[#3d0a0a]/60 via-transparent to-[#ff9a8f]/25",
        )}
      />
    </motion.div>
  );
}

export function ChevronClash({
  className,
  delay = 0.2,
  fadeTo = "#0a0909",
  children,
}: {
  className?: string;
  /** Seconds before the chevrons charge in. */
  delay?: number;
  /** Colour the bottom edge fades into, to blend with what sits below. */
  fadeTo?: string;
  /** Overlays such as the season sticker. */
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)} aria-hidden="true">
      <Half side="left" delay={delay} />
      <Half side="right" delay={delay} />
      {/* Spark where the tips meet */}
      <motion.div
        // Centred through framer's x/y; the scaleY animation would replace
        // Tailwind's translate classes.
        className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[3px] bg-gold-200"
        style={{ x: "-50%", y: "-50%", filter: "blur(1px)", boxShadow: "0 0 40px 10px rgba(243,210,138,0.6)" }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 1] }}
        transition={{ duration: 0.7, delay: delay + 0.85, times: [0, 0.2, 1] }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
        style={{ backgroundImage: `linear-gradient(to top, ${fadeTo}, transparent)` }}
      />
      {children}
    </div>
  );
}

/** The tilted gold "Season 3" sticker that lands after the clash. */
export function SeasonSticker({
  delay = 1.35,
  className,
  line = "is open",
}: {
  delay?: number;
  className?: string;
  line?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.6, rotate: -18 }}
      animate={{ opacity: 1, scale: 1, rotate: -7 }}
      transition={{ delay, type: "spring", stiffness: 380, damping: 18 }}
      className={cn(
        "absolute rounded-md border-2 border-[#17110a] bg-gold-500 px-3 py-1.5 text-[#17110a] sm:px-4 sm:py-2",
        className,
      )}
    >
      <div className="text-xl font-bold leading-none sm:text-2xl">Season 3</div>
      <div className="mt-0.5 text-xs font-semibold leading-none">{line}</div>
    </motion.div>
  );
}
