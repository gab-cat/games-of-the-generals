import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { getPieceDisplay } from "../lib/piece-display";
import { cn } from "../lib/utils";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

// Highest to lowest, with how many of each piece a player starts with.
// Counts come from INITIAL_PIECES in convex/games.ts.
const RANKS: Array<{ piece: string; count: number }> = [
  { piece: "5 Star General", count: 1 },
  { piece: "4 Star General", count: 1 },
  { piece: "3 Star General", count: 1 },
  { piece: "2 Star General", count: 1 },
  { piece: "1 Star General", count: 1 },
  { piece: "Colonel", count: 1 },
  { piece: "Lieutenant Colonel", count: 1 },
  { piece: "Major", count: 1 },
  { piece: "Captain", count: 1 },
  { piece: "1st Lieutenant", count: 1 },
  { piece: "2nd Lieutenant", count: 1 },
  { piece: "Sergeant", count: 1 },
  { piece: "Private", count: 6 },
  { piece: "Spy", count: 2 },
  { piece: "Flag", count: 1 },
];

/** A real piece, drawn the way the game board draws it. */
function PieceChip({
  piece,
  tone = "mine",
}: {
  piece: string;
  tone?: "mine" | "neutral" | "hidden";
}) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-md border",
        tone === "mine" && "border-gold-500/30 bg-gold-500/10 text-gold-300",
        tone === "neutral" &&
          "border-border-strong bg-white/[0.06] text-foreground",
        tone === "hidden" && "border-border bg-white/[0.04] text-foreground/45",
      )}
    >
      {tone === "hidden"
        ? getPieceDisplay("Hidden", { isOpponent: true, size: "small" })
        : getPieceDisplay(piece, { size: "small" })}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Board                                                                      */
/* -------------------------------------------------------------------------- */

type Cell = { piece: string; side: "mine" | "theirs" } | null;
const ROWS = 8;
const COLS = 9;

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

/** A full opening: 21 of your pieces in the bottom three rows, 21 hidden pieces on top. */
function setupBoard(): Cell[][] {
  const board = emptyBoard();
  const mine: Array<Array<string | null>> = [
    [
      "Private",
      "Sergeant",
      "2nd Lieutenant",
      "Captain",
      "Private",
      "1st Lieutenant",
      "Major",
      "Private",
      "Private",
    ],
    [
      "Colonel",
      "1 Star General",
      "Spy",
      "4 Star General",
      "5 Star General",
      "Lieutenant Colonel",
      "2 Star General",
      "3 Star General",
      null,
    ],
    [null, null, null, "Private", "Flag", "Spy", "Private", null, null],
  ];
  mine.forEach((row, r) =>
    row.forEach((piece, c) => {
      if (piece) board[5 + r][c] = { piece, side: "mine" };
    }),
  );
  // Opponent: 21 hidden pieces in the top three rows, mirroring your layout.
  // Their ranks are never sent to your device, so they show as blank squares.
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < COLS; c++) {
      const filled = r === 0 ? c >= 2 && c <= 5 : r === 1 ? c >= 1 : true;
      if (filled) board[r][c] = { piece: "Hidden", side: "theirs" };
    }
  }
  return board;
}

/** A small position for the movement demo. */
function movementBoard(): Cell[][] {
  const board = emptyBoard();
  board[4][3] = { piece: "Captain", side: "mine" };
  board[5][5] = { piece: "Private", side: "mine" };
  board[5][4] = { piece: "Sergeant", side: "mine" };
  board[6][4] = { piece: "Flag", side: "mine" };
  board[3][3] = { piece: "Hidden", side: "theirs" };
  board[2][6] = { piece: "Hidden", side: "theirs" };
  return board;
}

function MiniBoard({
  board,
  selected = null,
  moves = [],
  attacks = [],
  onSelect,
  label,
}: {
  board: Cell[][];
  selected?: string | null;
  moves?: string[];
  attacks?: string[];
  onSelect?: (key: string) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="mx-auto grid w-full max-w-md grid-cols-9 gap-px overflow-hidden rounded-md border border-border-strong bg-white/10"
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`;
          const isMove = moves.includes(key);
          const isAttack = attacks.includes(key);
          const isSelected = selected === key;
          const canSelect = !!onSelect && cell?.side === "mine";
          const base = cn(
            "relative flex aspect-square items-center justify-center bg-[#0f0f12] p-0.5 transition-colors",
            cell?.side === "mine" && "text-gold-300",
            cell?.side === "theirs" && "bg-[#17171b] text-foreground/45",
            isMove && "bg-gold-500/15 ring-1 ring-inset ring-gold-500/60",
            isAttack &&
              "bg-red-500/15 text-foreground/70 ring-1 ring-inset ring-red-400/60",
            isSelected && "bg-gold-500/20 ring-2 ring-inset ring-gold-400",
            canSelect &&
              "cursor-pointer hover:bg-gold-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:scale-95",
          );
          const content = cell ? (
            cell.side === "theirs" ? (
              getPieceDisplay("Hidden", { isOpponent: true, size: "small" })
            ) : (
              getPieceDisplay(cell.piece, { size: "small" })
            )
          ) : isMove ? (
            <span
              className="size-1.5 rounded-full bg-gold-400"
              aria-hidden="true"
            />
          ) : null;

          return canSelect ? (
            <button
              key={key}
              type="button"
              className={base}
              aria-pressed={isSelected}
              aria-label={`${cell!.piece}, row ${r + 1}, column ${c + 1}`}
              onClick={() => onSelect?.(key)}
            >
              {content}
            </button>
          ) : (
            <div key={key} className={base}>
              {content}
            </div>
          );
        }),
      )}
    </div>
  );
}

function MovementDemo() {
  const [board] = useState(movementBoard);
  const [selected, setSelected] = useState<string | null>("4-3");

  const moves: string[] = [];
  const attacks: string[] = [];
  if (selected) {
    const [r, c] = selected.split("-").map(Number);
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const target = board[nr][nc];
      if (target?.side === "mine") continue;
      (target ? attacks : moves).push(`${nr}-${nc}`);
    }
  }

  return (
    <div className="space-y-3">
      <MiniBoard
        board={board}
        selected={selected}
        moves={moves}
        attacks={attacks}
        onSelect={(key) => setSelected((prev) => (prev === key ? null : key))}
        label="Practice board. Select one of your pieces to see where it can move."
      />
      <p
        className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-foreground/85"
        aria-live="polite"
      >
        {selected ? (
          <>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-2.5 rounded-sm bg-gold-500/60"
                aria-hidden="true"
              />
              Move
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="size-2.5 rounded-sm bg-red-400/60"
                aria-hidden="true"
              />
              Battle
            </span>
          </>
        ) : (
          "Tap one of your pieces to see where it can go."
        )}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

interface Step {
  id: string;
  title: string;
  lead: string;
  content: ReactNode;
}

function Matchup({
  a,
  b,
  headline,
  body,
}: {
  a: string;
  b: string;
  headline: string;
  body: string;
}) {
  return (
    <li className="flex items-center gap-4 py-3">
      <div className="flex shrink-0 items-center gap-1.5">
        <PieceChip piece={a} tone="neutral" />
        <PieceChip piece={b} tone="neutral" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{headline}</p>
        <p className="mt-0.5 text-sm text-foreground/80">{body}</p>
      </div>
    </li>
  );
}

function Point({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="py-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-0.5 text-sm text-foreground/80">{children}</p>
    </li>
  );
}

const STEPS: Step[] = [
  {
    id: "goal",
    title: "The goal",
    lead: "Two players, 21 pieces each, and one Flag to protect.",
    content: (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <PieceChip piece="Flag" />
            <p className="text-sm text-foreground">Your Flag. Keep it safe.</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <PieceChip piece="Hidden" tone="hidden" />
            <p className="text-sm text-foreground">
              Opponent piece. Rank hidden.
            </p>
          </div>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          <Point title="Capture the enemy Flag">
            Or walk your own Flag to your opponent&apos;s back row.
          </Point>
          <Point title="You can't see ranks">
            Your opponent&apos;s pieces stay hidden until pieces engage.
          </Point>
          <Point title="One move per turn">
            Players take turns. A turn is one move of one piece.
          </Point>
        </ul>
      </div>
    ),
  },
  {
    id: "setup",
    title: "Set up your pieces",
    lead: "Before the game starts, place all 21 pieces in your three rows closest to you.",
    content: (
      <div className="space-y-4">
        <MiniBoard
          board={setupBoard()}
          label="The board: 9 columns and 8 rows. Your pieces fill the bottom three rows."
        />
        <ul className="divide-y divide-border border-y border-border">
          <Point title="9 columns, 8 rows">
            You fill the bottom three rows. Your opponent fills the top three.
          </Point>
          <Point title="Any arrangement">
            Put the Flag, Spies and generals wherever you think is smart. You
            have 5 minutes to finish.
          </Point>
        </ul>
      </div>
    ),
  },
  {
    id: "pieces",
    title: "Pieces and ranks",
    lead: "The higher the rank, the stronger the piece. This is the full set you start with.",
    content: (
      <div className="space-y-3">
        <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          {RANKS.map(({ piece, count }) => (
            <li
              key={piece}
              className="flex items-center gap-3 border-b border-border py-2"
            >
              <PieceChip
                piece={piece}
                tone={piece === "Spy" || piece === "Flag" ? "neutral" : "mine"}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {piece}
              </span>
              <span className="text-sm tabular-nums text-foreground/80">
                x{count}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-foreground/80">
          Listed from highest to lowest. The Spy and the Flag follow their own
          rules, covered next.
        </p>
      </div>
    ),
  },
  {
    id: "battles",
    title: "How battles work",
    lead: "Move onto an enemy piece to challenge it.",
    content: (
      <ul className="divide-y divide-border border-y border-border">
        <Matchup
          a="Major"
          b="Captain"
          headline="Major beats Captain"
          body="The higher rank stays. The lower rank is removed."
        />
        <Matchup
          a="Colonel"
          b="Colonel"
          headline="Colonel and Colonel"
          body="Equal ranks are both removed."
        />
        <Matchup
          a="Spy"
          b="5 Star General"
          headline="Spy beats 5 Star General"
          body="The Spy beats every officer, from Sergeant up."
        />
        <Matchup
          a="Private"
          b="Spy"
          headline="Private beats Spy"
          body="Only a Private beats the Spy. A Private loses to Sergeants and officers."
        />
        <Matchup
          a="Private"
          b="Flag"
          headline="Private captures the Flag"
          body="Any piece captures a Flag. A Flag that attacks another piece is removed."
        />
      </ul>
    ),
  },
  {
    id: "moving",
    title: "Move one square",
    lead: "Each turn, move one piece one square up, down, left or right.",
    content: (
      <div className="space-y-4">
        <MovementDemo />
        <ul className="divide-y divide-border border-y border-border">
          <Point title="No diagonals">
            You can't move onto a square held by your own piece.
          </Point>
          <Point title="Moving onto an enemy piece">
            This starts a battle. The result follows the rules in How battles
            work.
          </Point>
        </ul>
      </div>
    ),
  },
  {
    id: "winning",
    title: "How to win",
    lead: "There are three ways a game ends.",
    content: (
      <ul className="divide-y divide-border border-y border-border">
        <Point title="Capture the Flag">
          Move any piece onto your opponent&apos;s Flag.
        </Point>
        <Point title="Reach the far row">
          Move your Flag to your opponent&apos;s back row, the far row of the
          board. If it is still there after their next move, you win.
        </Point>
        <Point title="The clock">
          Each player has 15 minutes in total, or 6 in Blitz. If yours runs out,
          you lose. You can also resign at any time.
        </Point>
      </ul>
    ),
  },
];

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

export function TutorialModal({
  isOpen,
  onClose,
  onComplete,
}: TutorialModalProps) {
  const [[step, direction], setStep] = useState<[number, number]>([0, 1]);
  const last = STEPS.length - 1;
  const current = STEPS[step];

  // Always start from the first step when the dialog opens.
  useEffect(() => {
    if (isOpen) setStep([0, 1]);
  }, [isOpen]);

  const go = useCallback(
    (delta: number) => {
      setStep(([s]) => {
        const next = Math.min(last, Math.max(0, s + delta));
        return next === s ? [s, 1] : [next, delta];
      });
    },
    [last],
  );

  const finish = () => {
    // Layout's onComplete closes the dialog and records that the player saw it.
    if (onComplete) onComplete();
    else onClose();
  };

  // Arrow keys move between steps. Esc is handled by the dialog.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, go]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          // Focus the dialog itself so no control shows a focus ring on open.
          e.preventDefault();
          (e.currentTarget as HTMLElement).focus();
        }}
        className="flex h-[min(42rem,calc(100dvh-2rem))] max-w-2xl flex-col gap-0 overflow-hidden bg-card p-0"
      >
        {/* Header */}
        <div className="shrink-0 px-5 pb-1 pt-5 sm:px-6 sm:pt-6">
          <DialogTitle className="text-2xl">How to play</DialogTitle>
          <DialogDescription className="sr-only">
            {STEPS.length} short steps on the goal, pieces, battles and winning.
          </DialogDescription>
          <nav aria-label="Steps" className="mt-3 flex gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep([i, i > step ? 1 : -1])}
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === step ? "step" : undefined}
                className="group flex h-6 flex-1 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              >
                <span
                  className={cn(
                    "h-1 w-full rounded-sm transition-colors",
                    i <= step
                      ? "bg-gold-500"
                      : "bg-white/15 group-hover:bg-white/30",
                  )}
                />
              </button>
            ))}
          </nav>
        </div>

        {/* Step */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={current.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="text-lg font-semibold text-foreground">
                {current.title}
              </h3>
              <p className="mb-4 mt-1 text-sm text-foreground/85 sm:text-base">
                {current.lead}
              </p>
              {current.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
          <Button
            variant="secondary"
            onClick={() => go(-1)}
            disabled={step === 0}
          >
            <ChevronLeft />
            Previous
          </Button>

          <p
            className="text-sm tabular-nums text-foreground/80"
            aria-live="polite"
          >
            {step + 1} of {STEPS.length}
          </p>

          {step === last ? (
            <Button onClick={finish}>Start playing</Button>
          ) : (
            <Button onClick={() => go(1)}>
              Next
              <ChevronRight />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
