import { useEffect, useMemo, useState } from "react";
import { FixedDigits } from "@/components/ui/fixed-digits";
import { useConvexQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Link, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";
import { UserPlus, X } from "lucide-react";

export function ConvertAnonymousPopup() {
  const { data: userSettings } = useConvexQuery(api.settings.getUserSettings);
  const { data: loggedInUser } = useConvexQuery(api.auth.loggedInUser);
  const [show, setShow] = useState(false);
  const [msLeft, setMsLeft] = useState<number | null>(null);
  // Never cover a board: stay out of live games, spectating, replays and the AI game.
  const { pathname } = useLocation();
  const onBoardScreen = /^\/(game|spectate|replay|ai-game)(\/|$)/.test(pathname);

  // Respect dismissal until next midnight UTC (persisted in localStorage)
  useEffect(() => {
    const isAnon = userSettings?.isAnonymous;
    if (!isAnon) {
      setShow(false);
      return;
    }

    const storageKey = `anonPopupDismissedUntil:${loggedInUser?._id ?? "anon"}`;
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(storageKey)
        : null;
    const until = stored ? parseInt(stored, 10) : 0;
    const now = Date.now();
    if (until && now < until) {
      setShow(false);
    } else {
      // Clear stale key if past expiry
      if (until && now >= until && typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
      }
      setShow(true);
    }
  }, [userSettings?.isAnonymous, loggedInUser?._id]);

  // Compute countdown to next midnight UTC to align with backend cleanup
  useEffect(() => {
    if (!show) return;
    const computeMsLeft = () => {
      const now = new Date();
      const nextMidnightUtc = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0,
          0,
          0,
          0,
        ),
      );
      return nextMidnightUtc.getTime() - now.getTime();
    };

    setMsLeft(computeMsLeft());
    const interval = setInterval(() => setMsLeft(computeMsLeft()), 1000);
    return () => clearInterval(interval);
  }, [show]);

  const countdown = useMemo(() => {
    if (msLeft == null) return "";
    const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, [msLeft]);

  const handleDismiss = () => {
    const now = new Date();
    const nextMidnightUtc = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0,
      ),
    );
    const storageKey = `anonPopupDismissedUntil:${loggedInUser?._id ?? "anon"}`;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        storageKey,
        String(nextMidnightUtc.getTime()),
      );
    }
    setShow(false);
  };

  const shouldShowReopen = userSettings?.isAnonymous && !show;

  if (!userSettings?.isAnonymous) return null;

  // Sits above the phone tab bar (h-16 plus the safe area) and never over the
  // header. On large screens it moves to the bottom-left corner.
  const position =
    "fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-50 lg:inset-x-auto lg:bottom-6 lg:left-6";

  return (
    <AnimatePresence initial={false}>
      {show && !onBoardScreen && (
        <motion.div
          key="convert-card"
          role="region"
          aria-label="Save your guest account"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`${position} lg:w-[340px]`}
        >
          <div className="relative rounded-lg border border-border-strong bg-card p-3 pr-12 sm:p-4 sm:pr-12">
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss until tomorrow"
              className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-foreground">
              Save your guest account
            </p>
            <p className="mt-1 text-[13px] text-foreground/85">
              Guest accounts are deleted every day at 00:00 UTC. Add an email
              and password to keep your progress and play on any device.
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-foreground/80">
                Time left{" "}
                <FixedDigits className="text-gold-300">{countdown}</FixedDigits>
              </p>
              <Button asChild size="sm">
                <Link to="/settings" search={{ convert: "1" }}>
                  Save account
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {shouldShowReopen && (
        <motion.div
          key="convert-reopen"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] left-3 z-40 lg:bottom-6 lg:left-6"
        >
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShow(true)}
            className="bg-card"
          >
            <UserPlus />
            Save account
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
