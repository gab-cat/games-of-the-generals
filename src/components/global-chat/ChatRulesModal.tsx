"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

interface ChatRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

const RULES = [
  {
    title: "Respect and courtesy",
    summary: "Treat all players with respect and courtesy.",
    points: [
      "No harassment, bullying, or discriminatory language.",
      "Respect different cultures, backgrounds, and playing styles.",
    ],
  },
  {
    title: "Appropriate content",
    summary: "Keep conversations appropriate for all ages.",
    points: [
      "No explicit, violent, or offensive content.",
      "No spam or excessive self-promotion.",
    ],
  },
  {
    title: "Game-related discussion",
    summary: "Discuss strategies, tactics, and game mechanics.",
    points: [
      "Share tips and help fellow players.",
      "Respect game rules and fair play.",
    ],
  },
  {
    title: "Privacy and safety",
    summary: "Do not share personal information.",
    points: [
      "Report any suspicious or harmful behavior.",
      "Use the @mention feature responsibly.",
    ],
  },
  {
    title: "Moderation",
    summary: "Follow moderator instructions.",
    points: [
      "Users may be muted for rule violations.",
      "Repeated violations may result in account restrictions.",
    ],
  },
  {
    title: "Technical guidelines",
    summary: "Keep messages under 500 characters.",
    points: [
      "Avoid excessive caps or special characters.",
      "Use appropriate channels for different topics.",
    ],
  },
];

export function ChatRulesModal({
  isOpen,
  onClose,
  onAgree,
}: ChatRulesModalProps) {
  const [isAgreed, setIsAgreed] = useState(false);
  const [isLiableAcknowledged, setIsLiableAcknowledged] = useState(false);

  const handleAgree = () => {
    if (!isAgreed || !isLiableAcknowledged) return;

    onAgree();
    onClose();
  };

  const handleClose = () => {
    setIsAgreed(false);
    setIsLiableAcknowledged(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border p-5 pr-14">
          <DialogTitle>Chat rules</DialogTitle>
          <DialogDescription>
            Read these before you post in global chat.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ol className="space-y-5">
            {RULES.map((rule, i) => (
              <li key={rule.title}>
                <h3 className="text-sm font-semibold text-foreground">
                  <span className="mr-2 tabular-nums text-gold-400">
                    {i + 1}.
                  </span>
                  {rule.title}
                </h3>
                <p className="mt-1 text-sm text-foreground/85">
                  {rule.summary}
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground/80 marker:text-foreground/40">
                  {rule.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-border pt-4 text-sm text-foreground/85">
            By using global chat, you agree to follow these rules. Breaking them
            can lead to a temporary or permanent chat restriction.
          </p>
        </div>

        <div className="shrink-0 space-y-3 border-t border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="agree"
              checked={isAgreed}
              onCheckedChange={(checked) => setIsAgreed(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="agree"
              className="cursor-pointer text-sm text-foreground"
            >
              I have read and agree to follow the global chat rules.
            </label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="liability"
              checked={isLiableAcknowledged}
              onCheckedChange={(checked) =>
                setIsLiableAcknowledged(checked === true)
              }
              className="mt-0.5"
            />
            <label
              htmlFor="liability"
              className="cursor-pointer text-sm text-foreground"
            >
              I understand that my account can be banned temporarily or
              permanently if I break these rules, and I am responsible for what
              I post.
            </label>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-5 py-4">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAgree}
            disabled={!isAgreed || !isLiableAcknowledged}
          >
            I agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
