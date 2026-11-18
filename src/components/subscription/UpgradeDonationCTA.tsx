"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Painting } from "@/components/season/art";
import { OtherGameCard } from "@/components/OtherGames";
import { cn } from "@/lib/utils";
import { DonationPaymentModal } from "./DonationPaymentModal";
import { QrDonationDialog } from "./QrDonationDialog";
import {
  formatCentavos,
  quotePlan,
} from "../../../convex/lib/planPricing";

const STORAGE_KEY = "upgrade-cta-dismissed-until";
// Once answered, it stays away for an hour.
const SNOOZE_MS = 60 * 60 * 1000;
// Let the page settle first so it never lands mid-click.
const OPEN_DELAY_MS = 2500;

function isSnoozed(): boolean {
  try {
    const until = Number(localStorage.getItem(STORAGE_KEY));
    // The Season 3 welcome comes first; this waits for the next visit.
    const seasonSeen = localStorage.getItem("season3_acknowledged") === "true";
    return !seasonSeen || (Number.isFinite(until) && Date.now() < until);
  } catch {
    return true; // Storage blocked: don't nag on every page.
  }
}

function snooze() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    // Private mode: it comes back on the next visit.
  }
}

/** Another dialog already open (season news, tutorial, a payment)? */
function anotherDialogOpen(): boolean {
  return !!document.querySelector('[role="dialog"], [role="alertdialog"]');
}

/**
 * Asks free players who have finished a game to get Pro or donate (PayMongo
 * checkout, or Gab's own QR Ph code with a report form). Shown in
 * front of the page once an hour at most, on the lobby, vs AI, leaderboard and
 * news pages.
 */
export function UpgradeDonationCTA() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const { data: subscription } = useConvexQuery(
    api.subscriptions.getCurrentSubscription,
    {},
  );
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile, {});
  // Guests get the "keep this account" prompt instead.
  const { data: userSettings } = useConvexQuery(api.settings.getUserSettings);

  const isLoaded =
    subscription !== undefined &&
    profile !== undefined &&
    userSettings !== undefined;
  const isEligible =
    isLoaded &&
    (subscription?.tier ?? "free") === "free" &&
    !profile?.isDonor &&
    userSettings?.isAnonymous !== true &&
    // "Enjoying the game?" only makes sense after playing one.
    (profile?.gamesPlayed ?? 0) >= 1;

  useEffect(() => {
    if (!isEligible || isSnoozed()) return;
    const timer = setTimeout(() => {
      if (isSnoozed() || anotherDialogOpen()) return;
      setOpen(true);
    }, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isEligible]);

  const handleOpenChange = (next: boolean) => {
    // Esc, "Not now" and both actions all count as an answer.
    if (!next) snooze();
    setOpen(next);
  };

  return (
    <>
      <SupportDialogView
        open={open}
        onOpenChange={handleOpenChange}
        onSeePlans={() =>
          void navigate({ to: "/pricing", search: { donation: undefined } })
        }
        onDonate={() => setDonateOpen(true)}
        onDonateQr={() => setQrOpen(true)}
      />
      <DonationPaymentModal
        open={donateOpen}
        onOpenChange={setDonateOpen}
        onChooseQr={() => {
          setDonateOpen(false);
          setQrOpen(true);
        }}
      />
      <QrDonationDialog open={qrOpen} onOpenChange={setQrOpen} />
    </>
  );
}

/** The dialog itself, without the rules for when it shows. */
export function SupportDialogView({
  open,
  onOpenChange,
  onSeePlans,
  onDonate,
  onDonateQr,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSeePlans: () => void;
  onDonate: () => void;
  onDonateQr: () => void;
}) {
  const proFrom = formatCentavos(
    Math.round(quotePlan("pro", 12).perMonthCentavos / 100) * 100,
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="max-w-md gap-0 overflow-hidden border-white/10 p-0 focus-visible:outline-none"
        // Focus the dialog, not "Not now": it opened on its own, so a ring on
        // a button before anyone touched the keyboard reads as a glitch.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <Painting crop="support" fade="bottom" className="h-44 sm:h-52">
          <AlertDialogTitle className="absolute inset-x-0 bottom-0 p-5 text-3xl font-bold leading-none tracking-[-0.03em] text-white sm:p-6 sm:text-4xl">
            Enjoying the game?
          </AlertDialogTitle>
        </Painting>

        <div className="space-y-4 p-5 pt-3 sm:p-6 sm:pt-3">
          <AlertDialogDescription className="text-sm text-foreground sm:text-base">
            Pro and donations pay for the servers that keep the game free.
          </AlertDialogDescription>

          <ul className="divide-y divide-border rounded-lg border border-border">
            <li className="flex items-baseline justify-between gap-4 p-3 sm:p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Pro</p>
                <p className="mt-0.5 text-sm text-foreground/80">
                  Stronger AI and 50 saved replays.
                </p>
              </div>
              <p className="shrink-0 text-right text-sm text-foreground">
                from <span className="font-semibold">{proFrom}</span> a month
              </p>
            </li>
            <li className="p-3 sm:p-4">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Donate</p>
                  <p className="mt-0.5 text-sm text-foreground/80">
                    ₱50 or more gets a donor badge and a profile frame.
                  </p>
                </div>
                <p className="shrink-0 text-right text-sm text-foreground">
                  any amount
                </p>
              </div>
              {/* Both close this dialog (an answer, so it snoozes) and open their own. */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <AlertDialogAction
                  onClick={onDonateQr}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "h-auto flex-col gap-0 py-2")}
                >
                  <span>Scan QR Ph</span>
                  <span className="text-xs font-normal text-foreground/75">GCash, Maya, banks</span>
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={onDonate}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "h-auto flex-col gap-0 py-2")}
                >
                  <span>PayMongo checkout</span>
                  <span className="text-xs font-normal text-foreground/75">Badge right away</span>
                </AlertDialogAction>
              </div>
            </li>
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <AlertDialogAction onClick={onSeePlans} className="sm:flex-1">
              See plans
            </AlertDialogAction>
            <AlertDialogCancel
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "mt-0 border-0 sm:mt-0",
              )}
            >
              Not now
            </AlertDialogCancel>
          </div>
        </div>

        {/* Below the actions and quieter than them, so it never competes with Pro. */}
        <OtherGameCard
          placement="upgrade-dialog"
          size="sm"
          className="rounded-none border-0 border-t border-border bg-transparent px-5 py-3 hover:border-border sm:px-6"
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}
