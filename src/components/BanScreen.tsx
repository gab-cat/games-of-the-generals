"use client";

import { motion } from "framer-motion";
import { LogOut, Loader2, Mail, MessageSquare } from "lucide-react";
import { useConvexQueryWithOptions } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { riseIn } from "../lib/motion";

import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

export function BanScreen() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const markUserOffline = useMutation(api.globalChat.markUserOffline);
  const sendAppealToAdmins = useMutation(api.globalChat.sendAppealToAdmins);

  // State for appeal dialog
  const [isAppealDialogOpen, setIsAppealDialogOpen] = useState(false);
  const [appealMessage, setAppealMessage] = useState("");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Get ban details
  const { data: banDetails } = useConvexQueryWithOptions(
    api.globalChat.getUserBanDetails,
    isAuthenticated ? {} : "skip",
    {
      staleTime: 30000,
      gcTime: 60000,
    },
  );

  // Check if user has already sent an appeal
  const hasSentAppeal = useQuery(api.globalChat.hasUserSentAppeal);
  const lastAppealTimestamp = useQuery(api.globalChat.getLastAppealTimestamp);

  const formatRemainingTime = (expiresAt: number) => {
    const now = Date.now();
    const remainingMs = expiresAt - now;

    if (remainingMs <= 0) return "Ending now";

    const seconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} ${days === 1 ? "day" : "days"} left`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? "hour" : "hours"} left`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} left`;
    } else {
      return `${seconds} ${seconds === 1 ? "second" : "seconds"} left`;
    }
  };

  const getNextAppealTime = () => {
    if (!lastAppealTimestamp) return null;

    const nextAppealTime = lastAppealTimestamp + 24 * 60 * 60 * 1000; // 24 hours later
    const now = Date.now();

    if (nextAppealTime <= now) return null; // Can send now

    return nextAppealTime;
  };

  const handleSendAppeal = async () => {
    if (!appealMessage.trim()) {
      toast.error("Write your appeal first.");
      return;
    }

    if (appealMessage.length < 50) {
      toast.error("Write at least 50 characters.");
      return;
    }

    setIsSubmittingAppeal(true);

    try {
      const result = await sendAppealToAdmins({
        appealMessage: appealMessage.trim(),
      });
      toast.success(result.message);
      setAppealMessage("");
      setIsAppealDialogOpen(false);
    } catch (error) {
      console.error("Failed to send appeal:", error);
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("last 24 hours")
          ? "You already sent an appeal in the last 24 hours. Try again later."
          : message.includes("No administrators")
            ? "No admins are available right now. Try again later."
            : "Couldn't send your appeal. Try again.",
      );
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await markUserOffline();
      await signOut();
      toast.success("Signed out");
    } catch (error) {
      console.error("Failed to logout:", error);
      toast.error("Couldn't sign out. Try again.");
      setIsSigningOut(false);
    }
  };

  const nextAppealTime = getNextAppealTime();
  const appealTooShort =
    appealMessage.trim().length > 0 && appealMessage.trim().length < 50;

  return (
    <div className="mx-auto w-full max-w-xl py-4 sm:py-10">
      <motion.div {...riseIn} className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Your account is suspended
          </h1>
          <p className="mt-3 text-base text-foreground/90">
            You can't play or chat while the suspension is active. You can
            appeal it or sign out below.
          </p>
        </div>

        {banDetails && (
          <dl className="divide-y divide-border rounded-lg border border-border bg-card">
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-foreground/80">Length</dt>
              <dd className="text-sm font-medium text-foreground">
                {banDetails.expiresAt
                  ? formatRemainingTime(banDetails.expiresAt)
                  : "Permanent"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-foreground/80">Issued by</dt>
              <dd className="text-sm font-medium text-foreground">
                {banDetails.moderatorUsername}
              </dd>
            </div>
            <div className="space-y-1 px-4 py-3">
              <dt className="text-sm text-foreground/80">Reason</dt>
              <dd className="text-sm text-foreground">
                {banDetails.reason || "No reason was given."}
              </dd>
            </div>
          </dl>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Dialog
              open={isAppealDialogOpen}
              onOpenChange={setIsAppealDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="lg" disabled={hasSentAppeal}>
                  <MessageSquare />
                  {hasSentAppeal ? "Appeal sent" : "Appeal the suspension"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Appeal your suspension</DialogTitle>
                  <DialogDescription>
                    Explain what happened and why it should be lifted. An admin
                    will read it. You can send one appeal every 24 hours.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-1.5">
                  <Label htmlFor="appeal-message">Your message</Label>
                  <Textarea
                    id="appeal-message"
                    value={appealMessage}
                    onChange={(e) => setAppealMessage(e.target.value)}
                    maxLength={1000}
                    disabled={isSubmittingAppeal}
                    aria-invalid={appealTooShort ? true : undefined}
                    className="min-h-[150px]"
                  />
                  <div className="flex justify-between gap-3 text-xs">
                    <span
                      className={
                        appealTooShort ? "text-red-300" : "text-foreground/70"
                      }
                    >
                      {appealTooShort
                        ? `${50 - appealMessage.trim().length} more characters needed.`
                        : "At least 50 characters."}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {appealMessage.length}/1000
                    </span>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAppealDialogOpen(false)}
                    disabled={isSubmittingAppeal}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleSendAppeal()}
                    disabled={
                      isSubmittingAppeal || appealMessage.trim().length < 50
                    }
                  >
                    {isSubmittingAppeal && <Loader2 className="animate-spin" />}
                    {isSubmittingAppeal ? "Sending" : "Send appeal"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                (window.location.href = "mailto:support@generalsonline.app")
              }
            >
              <Mail />
              Email support
            </Button>
          </div>

          {hasSentAppeal && (
            <p className="text-sm text-foreground/85" role="status">
              An admin will review your appeal.
              {nextAppealTime
                ? ` You can send another after ${new Date(nextAppealTime).toLocaleString()}.`
                : ""}
            </p>
          )}

          <Button
            variant="ghost"
            onClick={() => void handleLogout()}
            disabled={isSigningOut}
            className="-ml-2"
          >
            {isSigningOut ? <Loader2 className="animate-spin" /> : <LogOut />}
            {isSigningOut ? "Signing out" : "Sign out"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
