"use client";

import { motion } from "framer-motion";
import {
  Ban,
  Mail,
  LogOut,
  MessageSquare,
  Clock,
  User,
  AlertTriangle,
  Send,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { useConvexQueryWithOptions } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import Squares from "./backgrounds/Squares/Squares";

export function BanScreen() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const markUserOffline = useMutation(api.globalChat.markUserOffline);
  const sendAppealToAdmins = useMutation(api.globalChat.sendAppealToAdmins);

  // State for appeal dialog
  const [isAppealDialogOpen, setIsAppealDialogOpen] = useState(false);
  const [appealMessage, setAppealMessage] = useState("");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

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

    if (remainingMs <= 0) return "Expired";

    const seconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else {
      return `${seconds} second${seconds > 1 ? "s" : ""}`;
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
      toast.error("Please enter your appeal message");
      return;
    }

    if (appealMessage.length < 50) {
      toast.error("Appeal message must be at least 50 characters");
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
      toast.error(
        error instanceof Error ? error.message : "Failed to send appeal",
      );
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const handleLogout = async () => {
    try {
      await markUserOffline();
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Failed to logout:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 font-mono relative pt-0 overflow-hidden flex flex-col items-center justify-center p-2">
      <div className="relative z-10 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="backdrop-blur-xl border border-zinc-800 shadow-2xl overflow-hidden relative"
        >
          {/* Top Decorative Bar */}
          <div className="bg-red-950/20 p-3 flex items-center justify-between border-b border-red-900/30">
            <div className="flex items-center gap-2 text-xs text-red-500 font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Security Protocol /// Active</span>
            </div>
            <div className="flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <div className="h-4 w-[1px] bg-red-900/50" />
              <div className="text-[10px] text-red-500/50 font-mono">
                SUSPENDED
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 relative">
            {/* Scanline Effect */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-[1px] bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.5)] z-20 pointer-events-none"
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            <div className="flex flex-col items-center text-center space-y-8">
              {/* Central Graphic */}
              <div className="relative group">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
                <div className="bg-zinc-950 p-6 rounded-full border border-red-500/30 relative shadow-[0_0_30px_rgba(220,38,38,0.1)]">
                  <Ban className="w-16 h-16 text-red-500" />
                </div>
                <div className="absolute inset-[-10px] border border-dashed border-red-900/50 rounded-full animate-[spin_60s_linear_infinite]" />
              </div>

              {/* Text Content */}
              <div className="space-y-4 max-w-lg">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-xl">
                  Access
                  <br />
                  <span className="text-red-500">Denied</span>
                </h1>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed border-l-2 border-red-500/50 pl-4 text-left bg-red-950/10 p-2 rounded-r">
                  Your command clearance has been revoked. Tactical operations
                  are suspended immediately.
                </p>
              </div>

              {/* Ban Details Grid */}
              {banDetails && (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-800 border border-zinc-800 overflow-hidden rounded-sm">
                  {/* Status Box */}
                  <div className="bg-zinc-900/80 p-4 flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                      <Clock className="w-3 h-3" /> Duration
                    </div>
                    <div className="text-zinc-100 font-mono font-medium">
                      {banDetails.expiresAt ? (
                        <span className="text-amber-500">
                          {formatRemainingTime(banDetails.expiresAt)}
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold">
                          PERMANENT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Moderator Box */}
                  <div className="bg-zinc-900/80 p-4 flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                      <User className="w-3 h-3" /> Issued By
                    </div>
                    <div className="text-zinc-100 font-mono font-medium">
                      {banDetails.moderatorUsername}
                    </div>
                  </div>

                  {/* Reason Box - Full Width */}
                  <div className="col-span-1 md:col-span-2 bg-zinc-900/80 p-4 flex flex-col items-start gap-1 border-t border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                      <Terminal className="w-3 h-3" /> Violation Code
                    </div>
                    <div className="text-zinc-300 font-mono text-sm text-left leading-relaxed">
                      {banDetails.reason || "No explicit reason provided."}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {/* Appeal Action */}
                <Dialog
                  open={isAppealDialogOpen}
                  onOpenChange={setIsAppealDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      disabled={hasSentAppeal}
                      variant="outline"
                      className="h-12 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white hover:border-zinc-500 text-zinc-400 font-mono uppercase tracking-wider text-xs transition-all duration-300"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-2" />
                      {hasSentAppeal ? "Appeal Pending" : "Submit Appeal"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white font-mono uppercase tracking-wider flex items-center gap-2 text-base">
                        <Send className="w-4 h-4 text-amber-500" />
                        Appeal Submission
                      </DialogTitle>
                      <DialogDescription className="text-zinc-500 text-xs font-mono">
                        Provide a detailed explanation for administrative
                        review.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="appeal-message"
                          className="text-xs uppercase text-zinc-500 font-mono tracking-wider"
                        >
                          Official Statement
                        </Label>
                        <Textarea
                          id="appeal-message"
                          placeholder="State your case..."
                          value={appealMessage}
                          onChange={(e) => setAppealMessage(e.target.value)}
                          className="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-700 focus:border-amber-500/50 text-sm font-mono min-h-[150px]"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                          <span>MIN: 50 CHARS</span>
                          <span>{appealMessage.length}/1000</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => setIsAppealDialogOpen(false)}
                          variant="ghost"
                          className="flex-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                        >
                          CANCEL
                        </Button>
                        <Button
                          onClick={() => void handleSendAppeal()}
                          disabled={
                            isSubmittingAppeal || appealMessage.length < 50
                          }
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-bold font-mono tracking-wider"
                        >
                          {isSubmittingAppeal
                            ? "TRANSMITTING..."
                            : "SEND APPEAL"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Email Support Action */}
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = "mailto:support@generalsonline.app")
                  }
                  className="h-12 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white hover:border-zinc-500 text-zinc-400 font-mono uppercase tracking-wider text-xs transition-all duration-300"
                >
                  <Mail className="w-3.5 h-3.5 mr-2" />
                  Contact Admin
                </Button>
              </div>

              {/* Logout - Primary Action */}
              <Button
                onClick={() => void handleLogout()}
                className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-900/30 hover:border-red-500/50 h-10 font-mono text-xs uppercase tracking-widest transition-all"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Disconnect Session
              </Button>
            </div>
          </div>

          {/* Bottom Footer Bar */}
          <div className="bg-zinc-950 border-t border-zinc-800 p-2 flex justify-between items-center px-4">
            <div className="flex gap-1.5">
              <div className="w-1 h-1 bg-zinc-700 rounded-full" />
              <div className="w-1 h-1 bg-zinc-700 rounded-full" />
              <div className="w-1 h-1 bg-zinc-700 rounded-full" />
            </div>
            <span className="text-[9px] text-zinc-600 font-mono tracking-widest uppercase">
              ID: {isAuthenticated ? "USER_LOCKED" : "GUEST"} /// V2.5
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
