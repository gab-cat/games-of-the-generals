"use client";

import { useState, useRef } from "react";
import {
  MoreVertical,
  Shield,
  Ban,
  VolumeX,
  Volume2,
  Trash2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

interface MessageModerationMenuProps {
  messageId?: string;
  userId: Id<"users">;
  username: string;
  isOwnMessage?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  text?: string;
}

export function MessageModerationMenu({
  messageId,
  userId,
  username,
  isOwnMessage: _isOwnMessage = false,
  className = "",
  size = "sm",
  showText = false,
  text = "Actions",
}: MessageModerationMenuProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"mute" | "ban" | "delete">(
    "delete",
  );
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnmuting, setIsUnmuting] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Refs for focus management
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Moderation mutations
  const muteUser = useMutation(api.globalChat.muteUser);
  const unmuteUser = useMutation(api.globalChat.unmuteUser);
  const banUser = useMutation(api.globalChat.banUser);
  const unbanUser = useMutation(api.globalChat.unbanUser);
  const deleteMessage = useMutation(api.globalChat.deleteMessage);

  const handleShowDialog = (type: "mute" | "ban" | "delete") => {
    setDialogType(type);
    setDialogOpen(true);
    setDropdownOpen(false); // Close dropdown when opening dialog
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

      // Restore focus to trigger button after dialog closes
      setTimeout(() => {
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      }, 0);
    }
  };

  const handleDialogConfirm = async () => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    let timeoutId: NodeJS.Timeout | null = null;
    let isCompleted = false;

    try {
      // Set a timeout to force close the dialog after 30 seconds in case of network issues
      timeoutId = setTimeout(() => {
        if (!isCompleted) {
          console.warn(
            `Moderation action (${dialogType}) timed out, forcing dialog close`,
          );
          setDialogOpen(false);
          setIsSubmitting(false);
          toast.error("That took too long. Try again.");
        }
      }, 30000);

      switch (dialogType) {
        case "mute":
          await muteUser({
            targetUserId: userId,
            duration,
            reason: reason || "No reason provided",
          });
          toast.success(
            `${username} has been muted${duration ? ` for ${Math.round((duration || 0) / (1000 * 60 * 60))} hours` : " permanently"}`,
          );
          break;

        case "ban":
          await banUser({
            targetUserId: userId,
            duration,
            reason: reason || "No reason provided",
          });
          toast.success(
            `${username} has been banned${duration ? ` for ${Math.round((duration || 0) / (1000 * 60 * 60 * 24))} days` : " permanently"}`,
          );
          break;

        case "delete":
          if (!messageId) {
            toast.error("This message can't be deleted.");
            return;
          }
          await deleteMessage({
            messageId: messageId as Id<"globalChat">,
            reason: reason || "No reason provided",
          });
          toast.success("Message deleted");
          break;
      }

      isCompleted = true;

      // Clear timeout on success
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Always close dialog after successful action
      setDialogOpen(false);
      // Reset form state
      setReason("");
      setDuration(undefined);
      setDialogType("delete");
    } catch (error) {
      isCompleted = true;

      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      toast.error(
        dialogType === "delete"
          ? "Couldn't delete the message. Try again."
          : dialogType === "mute"
            ? `Couldn't mute ${username}. Try again.`
            : `Couldn't ban ${username}. Try again.`,
      );
      console.error(`${dialogType} error:`, error);
      // Keep dialog open on error so user can try again
    } finally {
      if (!isCompleted) {
        setIsSubmitting(false);
      }
    }
  };

  const handleUnmuteUser = async () => {
    if (isUnmuting) return; // Prevent double submission

    setIsUnmuting(true);
    try {
      await unmuteUser({
        targetUserId: userId,
        reason: "Unmute",
      });
      toast.success(`${username} has been unmuted`);
      // Close dialog if it's open
      if (dialogOpen) {
        setDialogOpen(false);
      }
    } catch (error) {
      toast.error(`Couldn't unmute ${username}. Try again.`);
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
        reason: "Unban",
      });
      toast.success(`${username} has been unbanned`);
      // Close dialog if it's open
      if (dialogOpen) {
        setDialogOpen(false);
      }
    } catch (error) {
      toast.error(`Couldn't unban ${username}. Try again.`);
      console.error("Unban error:", error);
    } finally {
      setIsUnbanning(false);
    }
  };

  return (
    <div className={className}>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant={showText ? "secondary" : "ghost"}
            size="sm"
            aria-label={showText ? undefined : `Moderate ${username}`}
            className={cn(
              showText
                ? "h-9 gap-1.5 border-red-500/30 bg-red-500/10 px-3 text-red-300 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-200"
                : [
                    "p-0 text-foreground/70 hover:text-foreground data-[state=open]:bg-white/[0.08] data-[state=open]:opacity-100 focus-visible:opacity-100",
                    // Hover-only on a mouse, always visible on touch
                    "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100",
                    size === "sm" && "h-6 w-6",
                    size === "md" && "h-7 w-7",
                    size === "lg" && "h-8 w-8",
                  ],
            )}
          >
            <MoreVertical />
            {showText && <span>{text}</span>}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side="top"
          className="z-[300] min-w-48"
        >
          {/* Message actions: only when a message is given */}
          {messageId !== "profile-moderation" && (
            <>
              <DropdownMenuItem
                onClick={() => handleShowDialog("delete")}
                className="gap-2 text-red-300 focus:bg-red-500/10 focus:text-red-200"
              >
                <Trash2 className="size-4" />
                Delete message
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            onClick={() => handleShowDialog("mute")}
            className="gap-2"
          >
            <VolumeX className="size-4" />
            Mute user
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleShowDialog("ban")}
            className="gap-2 text-red-300 focus:bg-red-500/10 focus:text-red-200"
          >
            <Ban className="size-4" />
            Ban user
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => void handleUnmuteUser()}
            disabled={isUnmuting}
            className="gap-2 text-emerald-300 focus:bg-emerald-500/10 focus:text-emerald-200"
          >
            <Volume2 className="size-4" />
            {isUnmuting ? "Unmuting..." : "Unmute user"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void handleUnbanUser()}
            disabled={isUnbanning}
            className="gap-2 text-emerald-300 focus:bg-emerald-500/10 focus:text-emerald-200"
          >
            <Shield className="size-4" />
            {isUnbanning ? "Unbanning..." : "Unban user"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Moderation dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "mute"
                ? "Mute user"
                : dialogType === "ban"
                  ? "Ban user"
                  : "Delete message"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "mute"
                ? `${username} won't be able to send messages in global chat.`
                : dialogType === "ban"
                  ? `${username} won't be able to open global chat.`
                  : `This removes the message from ${username} for everyone. You can't undo it.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(dialogType === "mute" || dialogType === "ban") && (
              <div>
                <Label className="text-sm font-medium">Duration</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                      type="button"
                      aria-pressed={duration === option.value}
                      onClick={() => setDuration(option.value)}
                      className={cn(
                        "h-10 rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]",
                        duration === option.value
                          ? "border-gold-500/50 bg-gold-500/10 text-gold-200"
                          : "border-border bg-white/[0.04] text-foreground hover:border-border-strong hover:bg-white/[0.08]",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason (optional)
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you doing this?"
                className="mt-2 min-h-20 resize-none"
                maxLength={200}
              />
              <div className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
                {reason.length}/200
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => handleDialogClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={dialogType === "mute" ? "default" : "destructive"}
              onClick={() => void handleDialogConfirm()}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Working..."
                : dialogType === "delete"
                  ? "Delete message"
                  : dialogType === "ban"
                    ? "Ban user"
                    : "Mute user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
