/*
 * The end-of-game title card, shared by the online result (GameResultModal)
 * and the AI result (AIGameResultModal). It renders inside a Radix Dialog the
 * caller owns: the winner's army colour charges across, one huge word, a
 * sticker that says how it ended, then the numbers and the next actions.
 */
import { motion, useReducedMotion } from "framer-motion";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CHEVRON, Duotone, EASE, Grain, Painting, Sticker, type Crop } from "./art";

export type ResultOutcome = "win" | "loss" | "draw";
export type Army = "blue" | "red";
export type EndReason =
  | "flag_captured"
  | "flag_reached_base"
  | "timeout"
  | "surrender"
  | "elimination";

/** The sticker: how the game ended, in two or three words. */
export function endSticker(
  outcome: ResultOutcome,
  reason: string | null | undefined,
  opponent: "player" | "ai" = "player",
): string {
  if (outcome === "draw") return "Draw";
  const won = outcome === "win";
  switch (reason) {
    case "flag_captured":
      return won ? "Flag captured" : "Flag lost";
    case "flag_reached_base":
      return won ? "Flag got through" : "Their flag got through";
    case "timeout":
      return won ? "They ran out of time" : "Out of time";
    case "surrender":
      return won ? (opponent === "ai" ? "The AI gave up" : "They surrendered") : "You surrendered";
    case "elimination":
      return won ? "No moves left for them" : "No moves left";
    default:
      return won ? "Game won" : "Game lost";
  }
}

export type ResultSide = {
  name: string;
  /** A player's avatar image. */
  avatarUrl?: string;
  /** Or a painting crop, for the AI. */
  portrait?: Crop;
  /** Small line under the name: "You", "Opponent", the AI's style. */
  caption?: string;
};

export type ResultStat = { label: string; value: React.ReactNode };

interface ResultTitleCardProps {
  outcome: ResultOutcome;
  /** The army the viewer played: blue is player 1, red is player 2. */
  myArmy: Army;
  sticker: string;
  /** One sentence on how it ended, read by screen readers as the description. */
  reasonText: string;
  stats: ResultStat[];
  me: ResultSide;
  opponent: ResultSide;
  /** Buttons, laid out by the card. Put the main action last. */
  actions: React.ReactNode;
}

const WORD: Record<ResultOutcome, string> = { win: "Victory", loss: "Defeat", draw: "Draw" };
const ARMY_HEX: Record<Army, string> = { blue: "#3b82f6", red: "#ef4b40" };

function SideChip({ side, army, highlight }: { side: ResultSide; army: Army; highlight: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className="relative size-10 shrink-0 overflow-hidden rounded-full bg-raised"
        style={{ boxShadow: highlight ? `0 0 0 2px ${ARMY_HEX[army]}` : "0 0 0 1px rgba(255,255,255,.15)" }}
      >
        {side.portrait ? (
          <Painting crop={side.portrait} fade="none" zoomIn={false} className="absolute inset-0" />
        ) : side.avatarUrl ? (
          <img src={side.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-sm font-semibold text-foreground">
            {side.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground" title={side.name}>
          {side.name}
        </p>
        {side.caption && <p className="truncate text-xs text-foreground/70">{side.caption}</p>}
      </div>
    </div>
  );
}

export function ResultTitleCard({
  outcome,
  myArmy,
  sticker,
  reasonText,
  stats,
  me,
  opponent,
  actions,
}: ResultTitleCardProps) {
  const reduce = useReducedMotion();
  const theirArmy: Army = myArmy === "blue" ? "red" : "blue";
  const winnerArmy: Army | null = outcome === "draw" ? null : outcome === "win" ? myArmy : theirArmy;
  const loserArmy: Army | null = winnerArmy ? (winnerArmy === "blue" ? "red" : "blue") : null;
  const scene: Crop = outcome === "win" ? "victory" : outcome === "loss" ? "defeat" : "standoff";

  const charge = (from: "left" | "right", delay = 0.1) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { x: from === "left" ? "-100%" : "100%" },
          animate: { x: "0%" },
          transition: { duration: 0.85, ease: EASE, delay },
        };

  return (
    <div>
      {/* The clash */}
      <div className="relative h-56 overflow-hidden bg-[#0a0909] sm:h-72">
        {winnerArmy && loserArmy ? (
          <>
            {/* The loser's colour, pushed back to the far edge */}
            <motion.div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 w-[34%] brightness-[0.45]"
              style={{ clipPath: CHEVRON.leftFlat }}
              {...charge("right", 0.15)}
            >
              <Duotone crop="charge" tone={loserArmy} zoomIn={false} className="size-full" />
            </motion.div>
            {/* The winner's colour band, then the painting inside it */}
            <motion.div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-[86%]"
              style={{ clipPath: CHEVRON.rightFlat, backgroundColor: ARMY_HEX[winnerArmy] }}
              {...charge("left", 0.1)}
            />
            <motion.div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-[82%]"
              style={{ clipPath: CHEVRON.rightFlat }}
              {...charge("left", 0.18)}
            >
              <Painting crop={scene} fade="none" className="size-full" />
              <div
                className="absolute inset-0 mix-blend-multiply"
                style={{ backgroundColor: ARMY_HEX[winnerArmy], opacity: 0.28 }}
              />
            </motion.div>
          </>
        ) : (
          <motion.div aria-hidden="true" className="absolute inset-0" {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } })}>
            <Duotone crop={scene} tone="gold" className="size-full" />
          </motion.div>
        )}
        <Grain opacity={0.2} />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-card via-card/70 to-transparent" />

        <motion.div
          className="absolute bottom-3 left-5 right-5 sm:bottom-4 sm:left-8"
          initial={reduce ? false : { opacity: 0, y: 24, scale: 1.06 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.5 }}
        >
          <DialogTitle className="text-[64px] font-bold leading-[0.9] tracking-[-0.04em] text-[#f6f1e7] sm:text-[104px]">
            {WORD[outcome]}
          </DialogTitle>
        </motion.div>

        <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
          <Sticker
            delay={reduce ? 0 : 1}
            rotate={-5}
            tone={outcome === "loss" ? "paper" : "gold"}
            className="text-sm sm:text-lg"
          >
            {sticker}
          </Sticker>
        </div>
      </div>

      <motion.div
        className="space-y-5 p-5 sm:space-y-6 sm:p-8"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: reduce ? 0 : 0.75 } } }}
      >
        <motion.div variants={rise}>
          <DialogDescription className="text-base text-foreground">{reasonText}</DialogDescription>
        </motion.div>

        <motion.dl
          variants={rise}
          className={cn(
            "grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-4",
            stats.length >= 4 ? "sm:grid-cols-4" : "sm:grid-cols-3",
          )}
        >
          {stats.map((s) => (
            <div key={s.label} className="min-w-0">
              <dt className="text-xs text-foreground/70 sm:text-[13px]">{s.label}</dt>
              <dd className="mt-0.5 truncate text-xl font-semibold leading-tight text-foreground">{s.value}</dd>
            </div>
          ))}
        </motion.dl>

        <motion.div variants={rise} className="flex items-center justify-between gap-3">
          <SideChip side={me} army={myArmy} highlight={outcome === "win"} />
          <span className="shrink-0 text-sm text-foreground/70">vs</span>
          <div className="flex min-w-0 justify-end">
            <SideChip side={opponent} army={theirArmy} highlight={outcome === "loss"} />
          </div>
        </motion.div>

        <motion.div variants={rise} className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {actions}
        </motion.div>
      </motion.div>
    </div>
  );
}

const rise = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE } },
};

/** Classes for the DialogContent that holds the card: no padding, room for the art, a close button that reads on the painting. */
export const RESULT_DIALOG_CLASS =
  "max-w-2xl gap-0 overflow-x-hidden p-0 [&>button:last-child]:z-10 [&>button:last-child]:bg-black/55 [&>button:last-child]:text-white [&>button:last-child:hover]:bg-black/75";

/** Radix focuses the first button on open; send focus to the main action instead. */
export function focusPrimaryAction(e: Event) {
  const el = (e.target as HTMLElement | null)?.querySelector<HTMLElement>("[data-primary-action]");
  if (el) {
    e.preventDefault();
    el.focus();
  }
}
