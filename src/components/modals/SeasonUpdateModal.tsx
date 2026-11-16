import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { ChevronClash, SeasonSticker } from "../season/ChevronClash";

// Bump `storageKey` for each new season so every player sees the new one once.
const SEASON = {
  storageKey: "season3_acknowledged",
  title: "Generals Online is back",
  intro: "Season 3 starts now. Thanks for coming back.",
  points: [
    {
      title: "Everyone starts fresh",
      body: "Rank, rating and wins start over for every player. Your record from before is saved on your profile.",
    },
    {
      title: "Same account, same sign-in",
      body: "Sign in the way you always have. There's nothing to set up again.",
    },
  ],
  cta: "Let's play",
};

const EASE = [0.16, 1, 0.3, 1] as const;

function hasSeen(): boolean {
  try {
    return localStorage.getItem(SEASON.storageKey) === "true";
  } catch {
    return true; // Storage blocked: don't nag on every visit.
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEASON.storageKey, "true");
  } catch {
    // Ignore: worst case the player sees it again next visit.
  }
}

export function SeasonUpdateModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (hasSeen()) return;
    // Wait a moment so it doesn't fight other first-load popups.
    const timer = setTimeout(() => setIsOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    markSeen();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden border-white/10 bg-[#0a0909] p-0 [&>button:last-child]:z-10 [&>button:last-child]:bg-black/55 [&>button:last-child]:text-foreground [&>button:last-child]:hover:bg-black/75">
        <ChevronClash className="h-[190px] sm:h-[240px]" delay={0.15}>
          <SeasonSticker
            className="bottom-4 left-5 sm:left-8"
            delay={1.2}
            line="starts now"
          />
        </ChevronClash>

        <div className="px-5 pb-5 pt-3 sm:px-8 sm:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.5, ease: EASE }}
          >
            <DialogTitle className="text-balance text-[1.75rem] font-bold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl">
              {SEASON.title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-base text-foreground/85">
              {SEASON.intro}
            </DialogDescription>
          </motion.div>

          <ul className="mt-6 space-y-3">
            {SEASON.points.map((point, i) => (
              <motion.li
                key={point.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.95 + i * 0.08, duration: 0.35, ease: EASE }}
                className="border-l-2 border-gold-500 pl-4"
              >
                <p className="font-semibold text-foreground">{point.title}</p>
                <p className="mt-0.5 text-sm text-foreground/80">{point.body}</p>
              </motion.li>
            ))}
          </ul>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.35, ease: EASE }}
            className="mt-7 flex sm:justify-end"
          >
            <button
              type="button"
              onClick={close}
              className="h-11 w-full rounded-md bg-primary px-7 text-sm font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-[hsl(var(--primary-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0909] active:scale-[0.98] sm:w-auto"
            >
              {SEASON.cta}
            </button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
