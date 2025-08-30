"use client";

import { useState } from "react";
import { MoreVertical, Shield, Ban, VolumeX, Volume2, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

interface MessageModerationMenuProps {
  messageId: string;
  userId: Id<"users">;
  username: string;
  isOwnMessage?: boolean;
  className?: string;
}

export function MessageModerationMenu({
  messageId,
  userId,
  username,
  className = ""
}: MessageModerationMenuProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"mute" | "ban" | "delete">("delete");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnmuting, setIsUnmuting] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);

  // Moderation mutations
  const muteUser = useMutation(api.globalChat.muteUser);
  const unmuteUser = useMutation(api.globalChat.unmuteUser);
  const banUser = useMutation(api.globalChat.banUser);
  const unbanUser = useMutation(api.globalChat.unbanUser);
  const deleteMessage = useMutation(api.globalChat.deleteMessage);

  const handleShowDialog = (type: "mute" | "ban" | "delete") => {
    setDialogType(type);
    setDialogOpen(true);
    setReason("");
    setDuration(undefined);
    // Reset submitting states
    setIsSubmitting(false);
    setIsUnmuting(false);
    setIsUnbanning(false);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Reset form state when dialog closes
      setReason("");
      setDuration(undefined);
      setDialogType("delete");
      setIsSubmitting(false);
      setIsUnmuting(false);
      setIsUnbanning(false);
    }
  };

  const handleDialogConfirm = async () => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Set a timeout to force close the dialog after 30 seconds in case of network issues
      timeoutId = setTimeout(() => {
        console.warn(`Moderation action (${dialogType}) timed out, forcing dialog close`);
        setDialogOpen(false);
        setIsSubmitting(false);
        toast.error(`Request timed out. Please try again.`);
      }, 30000);

      switch (dialogType) {
        case "mute":
          await muteUser({
            targetUserId: userId,
            duration,
            reason: reason || "No reason provided",
          });
          toast.success(`${username} has been muted${duration ? ` for ${Math.round((duration || 0) / (1000 * 60 * 60))} hours` : ' permanently'}`);
          break;

        case "ban":
          await banUser({
            targetUserId: userId,
            duration,
            reason: reason || "No reason provided",
          });
          toast.success(`${username} has been banned${duration ? ` for ${Math.round((duration || 0) / (1000 * 60 * 60 * 24))} days` : ' permanently'}`);
          break;

        case "delete":
          await deleteMessage({
            messageId: messageId as Id<"globalChat">,
            reason: reason || "No reason provided",
          });
          toast.success("Message deleted");
          break;
      }

      // Clear timeout on success
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Always close dialog after successful action
      setDialogOpen(false);
      // Reset form state
      setReason("");
      setDuration(undefined);
      setDialogType("delete");
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to ${dialogType} ${dialogType === "delete" ? "message" : "user"}: ${errorMessage}`);
      console.error(`${dialogType} error:`, error);
      // Keep dialog open on error so user can try again
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnmuteUser = async () => {
    if (isUnmuting) return; // Prevent double submission

    setIsUnmuting(true);
    try {
      await unmuteUser({
        targetUserId: userId,
        reason: "Unmute"
      });
      toast.success(`${username} has been unmuted`);
      // Close dialog if it's open
      if (dialogOpen) {
        setDialogOpen(false);
      }
    } catch (error) {
      toast.error("Failed to unmute user");
      console.error("Unmute error:", error);
    } finally {
      setIsUnmuting(false);
    }
  };

  const handleUnbanUser = async () => {
    if (isUnbanning) return; // Prevent double submission

    setIsUnbanning(true);
    try {
      await unbanUser({
        targetUserId: userId,
        reason: "Unban"
      });
      toast.success(`${username} has been unbanned`);
      // Close dialog if it's open
      if (dialogOpen) {
        setDialogOpen(false);
      }
    } catch (error) {
      toast.error("Failed to unban user");
      console.error("Unban error:", error);
    } finally {
      setIsUnbanning(false);
    }
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-3 w-3 my-0 p-0 text-white/40 hover:text-white/80 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-3 h-3 my-0" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side="top"
          className="z-[300] font-body font-medium min-w-48 text-sm rounded-2xl bg-gray-950/90 backdrop-blur-sm p-1"
        >
          {/* Message Actions */}
          <DropdownMenuItem
            onClick={() => handleShowDialog("delete")}
            className="text-red-400 focus:text-red-300 focus:bg-red-500/10 text-xs"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Message
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* User Actions */}
          <DropdownMenuItem
            onClick={() => handleShowDialog("mute")}
            className="text-orange-400 focus:text-orange-300 focus:bg-orange-500/10 text-xs"
          >
            <VolumeX className="w-4 h-4 mr-2" />
            Mute User
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleShowDialog("ban")}
            className="text-red-500 focus:text-red-400 focus:bg-red-500/10 text-xs"
          >
            <Ban className="w-4 h-4 mr-2" />
            Ban User
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Quick Actions */}
          <DropdownMenuItem
            onClick={() => void handleUnmuteUser()}
            disabled={isUnmuting}
            className="text-green-400 focus:text-green-300 focus:bg-green-500/10 text-xs disabled:opacity-50"
          >
            <Volume2 className="w-4 h-4 mr-2" />
            {isUnmuting ? "Unmuting..." : "Unmute User"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void handleUnbanUser()}
            disabled={isUnbanning}
            className="text-green-400 focus:text-green-300 focus:bg-green-500/10 text-xs disabled:opacity-50"
          >
            <Shield className="w-4 h-4 mr-2" />
            {isUnbanning ? "Unbanning..." : "Unban User"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Moderation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md bg-gray-950/80 backdrop-blur-sm border-white/20 z-[110]">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "mute"
                ? "Mute User"
                : dialogType === "ban"
                ? "Ban User"
                : "Delete Message"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "mute"
                ? `Are you sure you want to mute ${username}? They will not be able to send messages in the global chat.`
                : dialogType === "ban"
                ? `Are you sure you want to ban ${username}? They will not be able to access the global chat.`
                : `Are you sure you want to delete this message from ${username}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Duration Selection for Mute/Ban */}
            {(dialogType === "mute" || dialogType === "ban") && (
              <div>
                <Label className="text-sm font-medium">Duration</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { label: "1 hour", value: 1000 * 60 * 60 },
                    { label: "6 hours", value: 1000 * 60 * 60 * 6 },
                    { label: "24 hours", value: 1000 * 60 * 60 * 24 },
                    { label: "7 days", value: 1000 * 60 * 60 * 24 * 7 },
                    { label: "30 days", value: 1000 * 60 * 60 * 24 * 30 },
                    { label: "Permanent", value: undefined },
                  ].map((option) => (
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
            <div>
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason (Optional)
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for this moderation action..."
                className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-20 resize-none"
                maxLength={200}
              />
              <div className="text-white/40 text-xs mt-1">
                {reason.length}/200 characters
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isSubmitting}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleDialogConfirm()}
              disabled={isSubmitting}
              className={
                dialogType === "delete"
                  ? "bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  : dialogType === "ban"
                  ? "bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  : "bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
              }
            >
              {isSubmitting
                ? "Processing..."
                : dialogType === "delete"
                ? "Delete Message"
                : dialogType === "ban"
                ? "Ban User"
                : "Mute User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
