/*
 * Season 3 art pieces for the pages that get a signature look (lobby, vs AI,
 * leaderboard, news, game result, profile, achievements). They build on the
 * key art (ChevronClash): the 1981-box blue and red chevrons, paintings shown
 * as a two-colour print in an army colour, Poppins at poster size, one gold
 * accent. Paintings live in /public/art (see ART below); each page uses its
 * own so the same picture isn't everywhere.
 */
import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const PAINTING_WIDE = "/season/season-3-banner.webp"; // 1600×640, soldier with raised fist, army charging
export const PAINTING_TALL = "/main-bg.webp"; // 1024×1536, fist officer, helmeted soldier, pointing officer

export const ARMY = {
  blue: "#3b82f6",
  red: "#ef4b40",
  gold: "#d9a441",
} as const;
export type Tone = keyof typeof ARMY;

/**
 * Paintings for the signature pages, all in the Season 3 oil-painting style.
 * `pos` is the focal point (CSS background-position), `scale` the zoom.
 * Generated as drafts with the Antigravity CLI from the Season 3 painting.
 */
export const CROPS = {
  // The original Season 3 paintings
  fist: { src: PAINTING_TALL, pos: "18% 22%", scale: 2.2 },
  soldier: { src: PAINTING_TALL, pos: "30% 96%", scale: 2.6 },
  pointing: { src: PAINTING_TALL, pos: "92% 82%", scale: 2.4 },
  charge: { src: PAINTING_TALL, pos: "60% 50%", scale: 1.6 },
  // One per page
  recruit: { src: "/art/recruit.webp", pos: "50% 30%", scale: 1 }, // vs AI: Recruit
  veteran: { src: "/art/veteran.webp", pos: "50% 30%", scale: 1 }, // vs AI: Veteran
  commander: { src: "/art/commander.webp", pos: "50% 30%", scale: 1 }, // vs AI: Commander
  standoff: { src: "/art/standoff.webp", pos: "50% 50%", scale: 1 }, // lobby quick match
  summit: { src: "/art/summit.webp", pos: "30% 40%", scale: 1 }, // leaderboard #1
  march: { src: "/art/march.webp", pos: "50% 60%", scale: 1 }, // leaderboard #2 / #3, profile
  dispatch: { src: "/art/dispatch.webp", pos: "40% 45%", scale: 1 }, // news lead
  warroom: { src: "/art/warroom.webp", pos: "50% 50%", scale: 1 }, // news, empty states
  victory: { src: "/art/victory.webp", pos: "60% 45%", scale: 1 }, // game result: win
  defeat: { src: "/art/defeat.webp", pos: "40% 50%", scale: 1 }, // game result: loss
  ceremony: { src: "/art/ceremony.webp", pos: "50% 40%", scale: 1 }, // achievements
  pricingStandard: { src: "/art/pricing-standard.webp", pos: "50% 20%", scale: 1 }, // pricing: Standard
  pricingPro: { src: "/art/pricing-pro.webp", pos: "50% 25%", scale: 1 }, // pricing: Pro
  pricingProPlus: { src: "/art/pricing-proplus.webp", pos: "50% 18%", scale: 1 }, // pricing: Pro+
  support: { src: "/art/support.webp", pos: "60% 35%", scale: 1 }, // donate band, support dialog
} as const;
export type Crop = keyof typeof CROPS;

/** A painting in full colour, darkened toward one edge so type can sit on it. */
export function Painting({
  crop,
  className,
  fade = "bottom",
  zoomIn = true,
  children,
}: {
  crop: Crop;
  className?: string;
  fade?: "bottom" | "left" | "right" | "none";
  zoomIn?: boolean;
  children?: React.ReactNode;
}) {
  const c = CROPS[crop];
  const fades = {
    bottom: "linear-gradient(to top, rgba(11,11,13,.95), rgba(11,11,13,.35) 45%, transparent 75%)",
    left: "linear-gradient(to right, rgba(11,11,13,.92), rgba(11,11,13,.4) 45%, transparent 75%)",
    right: "linear-gradient(to left, rgba(11,11,13,.92), rgba(11,11,13,.4) 45%, transparent 75%)",
    none: "none",
  } as const;
  return (
    <div className={cn("relative overflow-hidden bg-[#1a140c]", className)}>
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${c.src})`,
          backgroundSize: c.scale === 1 ? "cover" : `${c.scale * 100}%`,
          backgroundPosition: c.pos,
          backgroundRepeat: "no-repeat",
        }}
        initial={zoomIn ? { scale: 1.08 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: EASE }}
      />
      <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: fades[fade] }} />
      {children}
    </div>
  );
}

/**
 * The painting as a two-colour print in one army colour, the same treatment as
 * ChevronClash: grayscale, brightened, then the army colour multiplied over.
 */
export function Duotone({
  crop = "charge",
  tone = "blue",
  className,
  zoomIn = true,
  children,
}: {
  crop?: Crop;
  tone?: Tone;
  className?: string;
  zoomIn?: boolean;
  children?: React.ReactNode;
}) {
  const c = CROPS[crop];
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 grayscale brightness-[1.75] contrast-[1.15]"
        style={{
          backgroundImage: `url(${c.src})`,
          backgroundSize: c.scale === 1 ? "cover" : `${c.scale * 100}%`,
          backgroundPosition: c.pos,
          backgroundRepeat: "no-repeat",
        }}
        initial={zoomIn ? { scale: 1.12 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: EASE }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 mix-blend-multiply"
        style={{ backgroundColor: ARMY[tone] }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 mix-blend-screen"
        style={{
          backgroundImage:
            tone === "blue"
              ? "linear-gradient(135deg, rgba(10,26,61,.6), transparent 55%, rgba(127,176,255,.22))"
              : tone === "red"
                ? "linear-gradient(225deg, rgba(61,10,10,.6), transparent 55%, rgba(255,154,143,.22))"
                : "linear-gradient(135deg, rgba(40,26,6,.55), transparent 55%, rgba(255,226,160,.25))",
        }}
      />
      {children}
    </div>
  );
}

/** Clip paths for the box-art chevron. `right` points right. */
export const CHEVRON = {
  right: "polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%, 22% 50%)",
  left: "polygon(22% 0, 100% 0, 78% 50%, 100% 100%, 22% 100%, 0 50%)",
  rightFlat: "polygon(0 0, 86% 0, 100% 50%, 86% 100%, 0 100%)",
  leftFlat: "polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)",
} as const;

/** A paper-grain overlay so flat colour reads as print. Pure SVG, no request. */
export function Grain({ className, opacity = 0.18 }: { className?: string; opacity?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full mix-blend-overlay", className)}
      style={{ opacity }}
    >
      <filter id={`grain-${id}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${id})`} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Rank insignia, drawn from the Philippine Army's: chevrons for the     */
/* enlisted ranks, triangles for company grade, suns for field grade,    */
/* stars for generals. These are the player ranks the server gives out   */
/* (convex/profiles.ts: Private 0, Sergeant 3, Lieutenant 5, Captain 10, */
/* Major 20, Colonel 30, General 50 wins).                               */
/* ------------------------------------------------------------------ */

export const PLAYER_RANKS = [
  { name: "General", minWins: 50 },
  { name: "Colonel", minWins: 30 },
  { name: "Major", minWins: 20 },
  { name: "Captain", minWins: 10 },
  { name: "Lieutenant", minWins: 5 },
  { name: "Sergeant", minWins: 3 },
  { name: "Private", minWins: 0 },
] as const;
export type PlayerRank = (typeof PLAYER_RANKS)[number]["name"];

export function rankFor(wins: number): PlayerRank {
  return PLAYER_RANKS.find((r) => wins >= r.minWins)!.name;
}
/** A rank string from the server, or the rank its wins earn when it's missing or unknown. */
export function toPlayerRank(rank: string | undefined | null, wins = 0): PlayerRank {
  return PLAYER_RANKS.some((r) => r.name === rank) ? (rank as PlayerRank) : rankFor(wins);
}
export function nextRank(wins: number) {
  const i = PLAYER_RANKS.findIndex((r) => wins >= r.minWins);
  return i > 0 ? PLAYER_RANKS[i - 1] : null;
}

function Chevron({ y }: { y: number }) {
  return <path d={`M2 ${y + 8} L12 ${y} L22 ${y + 8}`} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="miter" />;
}
function Triangle({ x }: { x: number }) {
  return <path d={`M${x} 18 L${x + 7} 5 L${x + 14} 18 Z`} fill="currentColor" />;
}
function Sun({ cx, r = 6 }: { cx: number; r?: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    return (
      <line
        key={i}
        x1={cx + Math.cos(a) * (r * 0.55)}
        y1={12 + Math.sin(a) * (r * 0.55)}
        x2={cx + Math.cos(a) * r}
        y2={12 + Math.sin(a) * r}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    );
  });
  return (
    <g>
      <circle cx={cx} cy={12} r={r * 0.42} fill="currentColor" />
      {rays}
    </g>
  );
}
function Star({ cx, r = 6 }: { cx: number; r?: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${cx + Math.cos(a) * rr},${12 + Math.sin(a) * rr}`;
  }).join(" ");
  return <polygon points={pts} fill="currentColor" />;
}

/** The insignia for a player rank. Width grows with the number of devices. */
export function Insignia({ rank, className }: { rank: PlayerRank; className?: string }) {
  const svg = (w: number, children: React.ReactNode) => (
    <svg viewBox={`0 0 ${w} 24`} className={cn("h-6 w-auto", className)} role="img" aria-label={rank}>
      {children}
    </svg>
  );
  switch (rank) {
    case "Private":
      return svg(24, <Chevron y={8} />);
    case "Sergeant":
      return svg(24, <><Chevron y={2} /><Chevron y={8} /><Chevron y={14} /></>);
    case "Lieutenant":
      return svg(16, <Triangle x={1} />);
    case "Captain":
      return svg(48, <><Triangle x={1} /><Triangle x={17} /><Triangle x={33} /></>);
    case "Major":
      return svg(16, <Sun cx={8} r={7.5} />);
    case "Colonel":
      return svg(48, <><Sun cx={8} r={7.5} /><Sun cx={24} r={7.5} /><Sun cx={40} r={7.5} /></>);
    case "General":
      return svg(48, <><Star cx={8} r={7.5} /><Star cx={24} r={7.5} /><Star cx={40} r={7.5} /></>);
  }
}

/** A tilted sticker in the SeasonSticker style, for one loud label per page. */
export function Sticker({
  children,
  className,
  tone = "gold",
  delay = 0.5,
  rotate = -6,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "gold" | "paper";
  delay?: number;
  rotate?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.5, rotate: rotate - 10 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ delay, type: "spring", stiffness: 380, damping: 20 }}
      className={cn(
        "inline-block rounded-md border-2 border-[#17110a] px-3 py-1.5 font-bold leading-none text-[#17110a]",
        tone === "gold" ? "bg-gold-500" : "bg-[#f3ead8]",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
