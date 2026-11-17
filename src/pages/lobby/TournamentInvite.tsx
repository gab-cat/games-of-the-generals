import { lazy, Suspense, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mail, Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { Grain, EASE } from "@/components/season/art";
import {
  DISMISS_STORAGE_KEY,
  TOURNAMENT_DETAILS_HINT,
  TOURNAMENT_EMAIL,
  TOURNAMENT_MAILTO,
  TOURNAMENT_SUBJECT,
  dismissedUntil,
  isDismissed,
} from "@/lib/tournament-invite";
import { cn } from "@/lib/utils";

// The ticket form only loads when someone reaches for it.
const loadSupportDialog = () => import("@/components/SupportDialog");
const SupportDialog = lazy(() =>
  loadSupportDialog().then((m) => ({ default: m.SupportDialog })),
);

const INK = "#17110a";

function readDismissed() {
  try {
    return isDismissed(localStorage.getItem(DISMISS_STORAGE_KEY), Date.now());
  } catch {
    return false;
  }
}

/* An eight-player knockout bracket, drawn in round by round. Leaves are the
 * two armies' colours; the final slot is ink. */
const LEAVES = [10, 24, 40, 54, 70, 84, 100, 114];
const R1 = [17, 47, 77, 107];
const R2 = [32, 92];
const FINAL = 62;

function pairPath(a: number, b: number, x0: number, x1: number, x2: number) {
  const mid = (a + b) / 2;
  return `M${x0} ${a}H${x1}V${b}H${x0}M${x1} ${mid}H${x2}`;
}

const ROUNDS = [
  [0, 2, 4, 6].map((i) => pairPath(LEAVES[i], LEAVES[i + 1], 10, 46, 84)),
  [0, 2].map((i) => pairPath(R1[i], R1[i + 1], 84, 118, 156)),
  [pairPath(R2[0], R2[1], 156, 190, 214)],
];

function Bracket({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg
      viewBox="0 0 240 124"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke={INK}
      strokeWidth={2.5}
      strokeLinejoin="round"
    >
      {ROUNDS.map((paths, round) =>
        paths.map((d) => (
          <motion.path
            key={d}
            d={d}
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.25 + round * 0.3, duration: 0.45, ease: EASE }}
          />
        )),
      )}
      {LEAVES.map((y, i) => (
        <circle
          key={y}
          cx={6}
          cy={y}
          r={5}
          stroke={INK}
          strokeWidth={2}
          fill={i % 2 === 0 ? "#3b82f6" : "#ef4b40"}
        />
      ))}
      <motion.rect
        x={214}
        y={FINAL - 11}
        width={22}
        height={22}
        rx={4}
        fill={INK}
        stroke="none"
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ transformOrigin: "225px 62px" }}
        transition={{ delay: 1.25, type: "spring", stiffness: 420, damping: 22 }}
      />
      <text
        x={225}
        y={FINAL + 5}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="#d9a441"
        stroke="none"
      >
        1
      </text>
    </svg>
  );
}

const inkButton =
  "inline-flex h-10 min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm sm:px-4 font-semibold transition-[background-color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-950 focus-visible:ring-offset-2 focus-visible:ring-offset-gold-500 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0";

/** Lobby invite for organizers who want to run a tournament on the site. */
export function TournamentInvite() {
  const [hidden, setHidden] = useState(readDismissed);
  const [ticketOpen, setTicketOpen] = useState(false);

  const hide = () => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, dismissedUntil(Date.now()));
    } catch {
      // Private mode: it comes back on the next visit.
    }
    setHidden(true);
  };

  const handleEmail = () => {
    // Some phones and desktops have no mail app set up, so the link can do
    // nothing. Copy the address too and say so.
    navigator.clipboard
      ?.writeText(TOURNAMENT_EMAIL)
      .then(() =>
        toast.success("Email address copied", {
          description: `Your email app should open. If it doesn't, paste ${TOURNAMENT_EMAIL}.`,
        }),
      )
      .catch(() => {});
  };

  return (
    <>
      <AnimatePresence initial={false}>
        {!hidden && (
          <motion.section
            key="tournament-invite"
            aria-labelledby="tournament-invite-title"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative overflow-hidden rounded-lg border-2 border-gold-950 bg-gold-500 text-gold-950"
          >
            <Grain opacity={0.14} />

            <div className="relative flex items-center gap-6 p-4 pr-12 sm:p-6 sm:pr-14">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-1">
                  <h2
                    id="tournament-invite-title"
                    className="font-display text-xl font-bold leading-tight sm:text-3xl"
                  >
                    Hosting a tournament?
                  </h2>
                  <p className="max-w-xl text-sm font-medium sm:text-base">
                    Run it on Generals Online. Email Gab or send a ticket, and
                    we'll help you set it up.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <a
                    href={TOURNAMENT_MAILTO}
                    aria-label={`Email ${TOURNAMENT_EMAIL}`}
                    onClick={handleEmail}
                    className={cn(
                      inkButton,
                      "bg-gold-950 text-[#f3ead8] hover:bg-black",
                    )}
                  >
                    <Mail />
                    <span className="truncate sm:hidden">Email Gab</span>
                    <span className="hidden truncate sm:inline">
                      {TOURNAMENT_EMAIL}
                    </span>
                  </a>
                  <button
                    type="button"
                    onPointerEnter={() => void loadSupportDialog()}
                    onFocus={() => void loadSupportDialog()}
                    onClick={() => setTicketOpen(true)}
                    className={cn(
                      inkButton,
                      "border-2 border-gold-950 hover:bg-gold-950/10",
                    )}
                  >
                    <Ticket />
                    Send a ticket
                  </button>
                </div>
              </div>

              <Bracket className="hidden h-[124px] w-[240px] shrink-0 md:block" />
            </div>

            <button
              type="button"
              onClick={hide}
              title="Hide for 30 days"
              aria-label="Hide for 30 days"
              className="absolute right-1.5 top-1.5 inline-flex h-10 w-10 items-center justify-center rounded-md transition-[background-color,transform] hover:bg-gold-950/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-950 active:scale-[0.96]"
            >
              <X className="size-4" />
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      {ticketOpen && (
        <Suspense fallback={null}>
          <SupportDialog
            isOpen={ticketOpen}
            onClose={() => setTicketOpen(false)}
            initialCategory="other"
            initialSubject={TOURNAMENT_SUBJECT}
            description="Tell us about your tournament. We reply in the ticket."
            detailsPlaceholder={TOURNAMENT_DETAILS_HINT}
            onSent={hide}
          />
        </Suspense>
      )}
    </>
  );
}
