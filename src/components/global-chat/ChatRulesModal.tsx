"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";

interface ChatRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export function ChatRulesModal({ isOpen, onClose, onAgree }: ChatRulesModalProps) {
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat rules change very infrequently
  const { data: chatRules } = useConvexQueryWithOptions(
    api.globalChat.getChatRules,
    {},
    {
      staleTime: 600000, // 10 minutes - chat rules almost never change
      gcTime: 1800000, // 30 minutes cache
    }
  );
  const agreeToRules = useMutation(api.globalChat.agreeToChatRules);

  const handleAgree = async () => {
    if (!isAgreed) return;

    setIsSubmitting(true);
    try {
      await agreeToRules({});
      onAgree();
      onClose();
    } catch (error) {
      console.error("Failed to agree to rules:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsAgreed(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-black/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white/90 text-xl font-bold">
            Global Chat Rules
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-96 pr-4">
            <div className="text-white/80 space-y-4">
              {chatRules ? (
                <div
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: chatRules.rulesText.replace(/\n/g, "<br />").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  }}
                />
              ) : (
                <div className="text-white/60">Loading rules...</div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex items-center space-x-2 py-4 border-t border-white/10">
          <Checkbox
            id="agree"
            checked={isAgreed}
            onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
            className="border-white/40 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <label
            htmlFor="agree"
            className="text-sm text-white/80 cursor-pointer"
          >
            I have read and agree to follow the global chat rules
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleAgree()}
            disabled={!isAgreed || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isSubmitting ? "Agreeing..." : "I Agree"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
