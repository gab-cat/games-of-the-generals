"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Ban, VolumeX, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

interface ModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, duration?: number) => Promise<void>;
  title: string;
  description: string;
  actionType: "mute" | "ban" | "delete" | "warn";
  username: string;
  confirmText: string;
  confirmButtonText: string;
  showDuration?: boolean;
  showReason?: boolean;
}

const durationOptions = [
  { label: "1 hour", value: 1000 * 60 * 60 },
  { label: "6 hours", value: 1000 * 60 * 60 * 6 },
  { label: "24 hours", value: 1000 * 60 * 60 * 24 },
  { label: "7 days", value: 1000 * 60 * 60 * 24 * 7 },
  { label: "30 days", value: 1000 * 60 * 60 * 24 * 30 },
  { label: "Permanent", value: undefined },
];

export function ModerationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionType,
  username,
  confirmText,
  confirmButtonText,
  showDuration = false,
  showReason = true,
}: ModerationModalProps) {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(reason || "No reason provided", duration);
      setReason("");
      setDuration(undefined);
      onClose();
    } catch (error) {
      console.error("Moderation action failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case "mute":
        return <VolumeX className="w-6 h-6 text-orange-500" />;
      case "ban":
        return <Ban className="w-6 h-6 text-red-500" />;
      case "delete":
        return <Trash2 className="w-6 h-6 text-red-500" />;
      case "warn":
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getActionColor = () => {
    switch (actionType) {
      case "mute":
        return "text-orange-400";
      case "ban":
      case "delete":
        return "text-red-400";
      case "warn":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-950/90 backdrop-blur-sm z-[500]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm border border-white/20 rounded-none md:rounded-2xl shadow-2xl z-[510] flex items-center justify-center p-4 md:p-8"
          >
            <div className="w-full max-w-2xl bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getActionIcon()}
                  <div>
                    <h3 className="text-white font-semibold text-lg">{title}</h3>
                    <p className="text-white/60 text-sm">Target: {username}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Description */}
              <p className="text-white/80 text-sm mb-6">{description}</p>

              {/* Duration Selection */}
              {showDuration && (
                <div className="mb-4">
                  <Label className="text-white/80 text-sm block mb-2">Duration</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {durationOptions.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => setDuration(option.value)}
                        className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                          duration === option.value
                            ? "border-blue-500 bg-blue-500/20 text-blue-300"
                            : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason Input */}
              {showReason && (
                <div className="mb-6">
                  <Label htmlFor="reason" className="text-white/80 text-sm block mb-2">
                    Reason (Optional)
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide a reason for this moderation action..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-20 resize-none"
                    maxLength={200}
                  />
                  <div className="text-white/40 text-xs mt-1">
                    {reason.length}/200 characters
                  </div>
                </div>
              )}

              {/* Warning Text */}
              <div className={`mb-6 p-3 rounded-lg border ${getActionColor()} border-current bg-current/10`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Confirmation Required</p>
                    <p className="opacity-90">{confirmText}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleConfirm()}
                  className={`flex-1 ${
                    actionType === "delete"
                      ? "bg-red-600 hover:bg-red-700"
                      : actionType === "ban"
                      ? "bg-red-600 hover:bg-red-700"
                      : actionType === "mute"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-yellow-600 hover:bg-yellow-700"
                  } text-white`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : confirmButtonText}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
