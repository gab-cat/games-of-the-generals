
import { useEffect, useMemo, useState } from "react";
import { useConvexQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { UserPlus, X } from "lucide-react";

export function ConvertAnonymousPopup() {
  const { data: userSettings } = useConvexQuery(api.settings.getUserSettings);
  const { data: loggedInUser } = useConvexQuery(api.auth.loggedInUser);
  const [show, setShow] = useState(false);
  const [msLeft, setMsLeft] = useState<number | null>(null);

  // Respect dismissal until next midnight UTC (persisted in localStorage)
  useEffect(() => {
    const isAnon = userSettings?.isAnonymous;
    if (!isAnon) {
      setShow(false);
      return;
    }

    const storageKey = `anonPopupDismissedUntil:${loggedInUser?._id ?? "anon"}`;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
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
      const nextMidnightUtc = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));
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
    const nextMidnightUtc = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    const storageKey = `anonPopupDismissedUntil:${loggedInUser?._id ?? "anon"}`;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, String(nextMidnightUtc.getTime()));
    }
    setShow(false);
  };

  const shouldShowReopen = userSettings?.isAnonymous && !show;

  if (!userSettings?.isAnonymous) return null;

  return (
    <>
      {show && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="fixed z-50 sm:bottom-6 sm:left-6 sm:right-auto sm:top-auto left-3 right-3 top-20"
        >
          <div className="relative bg-gray-950/40 border border-white/10 backdrop-blur-sm border-gray-600 rounded-2xl shadow-lg p-3 sm:p-4 flex items-start gap-3 w-auto sm:w-[360px]">
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="absolute top-2 right-2 text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <UserPlus className="w-6 h-6 text-white mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="text-white font-semibold text-xs sm:text-sm">Complete your account</div>
              <div className="text-blue-100 text-[11px] sm:text-xs">Set an email and password to save your progress and play on any device.</div>
              <div className="text-amber-200/90 text-[10px] sm:text-[11px] mt-1">
                Warning: Guest accounts are deleted daily at 00:00 (UTC). Time left: {countdown}
              </div>
            </div>
            <Button
              className="ml-2 px-3 py-2 sm:px-4"
              asChild
              variant="gradient"
            >
              <Link to="/settings" search={{ convert: "1" }}>
                Convert
              </Link>
            </Button>
          </div>
        </motion.div>
      )}

      {shouldShowReopen && (
        <div className="fixed z-40 sm:bottom-6 sm:left-6 right-3 top-20 sm:top-auto sm:right-auto">
          <Button
            onClick={() => setShow(true)}
            variant="gradient"
            className="px-3 sm:px-4"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            <span className="text-sm">Convert</span>
          </Button>
        </div>
      )}
    </>
  );
}
