"use client";

import { motion } from "framer-motion";
import { Ban, Mail, LogOut, MessageSquare, Clock, User, AlertTriangle, Send } from "lucide-react";
import { useConvexQueryWithOptions } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

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

  // Get ban details
  const { data: banDetails } = useConvexQueryWithOptions(
    api.globalChat.getUserBanDetails,
    isAuthenticated ? {} : "skip",
    {
      staleTime: 30000, // 30 seconds
      gcTime: 60000, // 1 minute
    }
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
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  };

  const getNextAppealTime = () => {
    if (!lastAppealTimestamp) return null;

    const nextAppealTime = lastAppealTimestamp + (24 * 60 * 60 * 1000); // 24 hours later
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
      const result = await sendAppealToAdmins({ appealMessage: appealMessage.trim() });
      toast.success(result.message);
      setAppealMessage("");
      setIsAppealDialogOpen(false);
    } catch (error) {
      console.error("Failed to send appeal:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send appeal");
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
    <div className="h-max bg-gradient-to-br from-red-950/20 via-gray-900/10 to-red-950/20 rounded-3xl border border-white/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center space-y-8"
      >
        {/* Ban Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <Ban className="w-10 h-10 text-red-400" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-bold text-white">Account Suspended</h1>
          <p className="text-white/70">
            Your account has been temporarily or permanently suspended from accessing the game.
          </p>
        </motion.div>

        {/* Ban Details */}
        {banDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r max-w-md mx-auto from-red-950/30 to-red-900/20 rounded-lg p-4 border border-red-500/20 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <h3 className="text-white font-medium text-base">Suspension Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Duration/Time Remaining */}
              <div className="bg-black/15 rounded-md p-3 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-white/70 text-xs font-medium">
                    {banDetails.expiresAt ? "Time Remaining" : "Duration"}
                  </span>
                </div>
                <div className="text-white font-semibold text-base">
                  {banDetails.expiresAt ? (
                    <span className="text-red-400">{formatRemainingTime(banDetails.expiresAt)}</span>
                  ) : (
                    <span className="text-red-400">Permanent</span>
                  )}
                </div>
              </div>

              {/* Moderator */}
              <div className="bg-black/15 rounded-md p-3 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-white/70 text-xs font-medium">Moderator</span>
                </div>
                <div className="text-white font-medium text-sm">
                  {banDetails.moderatorUsername}
                </div>
              </div>
            </div>

            {/* Reason */}
            {banDetails.reason && (
              <div className="mt-3 bg-black/15 rounded-md p-3 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-white/70 text-xs font-medium">Reason for Suspension</span>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  {banDetails.reason}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <p className="text-white/70 text-sm text-center">
            If you believe this is an error or would like to appeal this decision, please contact an administrator:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Message Admin */}
            <div className="bg-gradient-to-br from-blue-950/30 to-blue-900/20 rounded-xl p-6 border border-blue-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white font-semibold">Appeal Your Ban</span>
              </div>

              <p className="text-white/70 text-sm mb-4 text-center">
                Send a formal appeal to all administrators
              </p>

              <Dialog open={isAppealDialogOpen} onOpenChange={setIsAppealDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={hasSentAppeal}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium"
                  >
                    {hasSentAppeal ? "Appeal Already Sent" : "Submit Appeal"}
                  </Button>
                </DialogTrigger>

                <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Submit Ban Appeal
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">
                      Explain why you believe this ban should be lifted. Be respectful and provide specific details.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="appeal-message" className="text-white">
                        Appeal Message
                      </Label>
                      <Textarea
                        id="appeal-message"
                        placeholder="Please explain the situation and why you believe this ban should be reviewed..."
                        value={appealMessage}
                        onChange={(e) => setAppealMessage(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 mt-1"
                        rows={6}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {appealMessage.length}/1000 characters (minimum 50)
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsAppealDialogOpen(false)}
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => void handleSendAppeal()}
                        disabled={isSubmittingAppeal || appealMessage.length < 50}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
                      >
                        {isSubmittingAppeal ? "Sending..." : "Send Appeal"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <p className="text-white/50 text-xs mt-3 text-center">
                {hasSentAppeal && getNextAppealTime()
                  ? `Next appeal available in ${formatRemainingTime(getNextAppealTime()!)}`
                  : hasSentAppeal
                  ? "You can send another appeal now"
                  : "Include details about your suspension and appeal reason"
                }
              </p>
            </div>

            {/* Email Contact */}
            <div className="bg-gradient-to-br from-green-950/30 to-green-900/20 rounded-xl p-6 border border-green-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white font-semibold">Email Support</span>
              </div>

              <p className="text-white/70 text-sm mb-4 text-center">
                Alternative contact method
              </p>

              <a
                href="mailto:support@generalsonline.app"
                className="block w-full bg-green-600 hover:bg-green-700 text-sm text-white font-medium text-center py-2 px-4 rounded-full transition-colors"
              >
                support@generalsonline.app
              </a>

              <p className="text-white/50 text-xs mt-3 text-center">
                Include your username and details about the suspension
              </p>
            </div>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={() => void handleLogout()}
            variant="outline"
            className="bg-red-600/20 max-w-md mx-auto px-8 border-red-500/50 text-red-300 hover:bg-red-600/30 hover:border-red-400/70 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-white/40 text-xs"
        >
          <p>Games of Generals - Fair Play Enforcement</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
