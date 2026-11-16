"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface SpamWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  spamType: "repeated" | "caps" | "excessive" | "profanity" | "generic";
  message?: string;
}

const COPY: Record<
  SpamWarningModalProps["spamType"],
  { title: string; description: string }
> = {
  profanity: {
    title: "Language not allowed",
    description:
      "Your message has words that aren't allowed in chat. Reword it and send it again.",
  },
  repeated: {
    title: "You already sent that",
    description:
      "You sent the same message more than once. Write something different.",
  },
  caps: {
    title: "Too many capital letters",
    description: "Turn off caps lock or write the message in normal case.",
  },
  excessive: {
    title: "Too many messages",
    description:
      "You're sending messages too fast. Wait a moment and try again.",
  },
  generic: {
    title: "Message not sent",
    description:
      "The chat filter blocked your message. Change it and send it again.",
  },
};

export function SpamWarningModal({
  isOpen,
  onClose,
  spamType,
  message,
}: SpamWarningModalProps) {
  const copy = COPY[spamType] ?? COPY.generic;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="z-[400] max-w-sm">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        {message && (
          <blockquote className="break-words rounded-md border border-border bg-white/[0.04] px-3 py-2 text-sm text-foreground">
            {message.length > 150 ? `${message.substring(0, 150)}...` : message}
          </blockquote>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
