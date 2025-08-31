"use client";

import { useState } from "react";
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-950/40 backdrop-blur-sm border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white/90 text-xl font-bold">
            Global Chat Rules
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-96 pr-4">
            <div className="text-white/80 space-y-6">
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-white/90 mb-2">1. Respect and Courtesy</h2>
                  <p className="text-white/80 mb-3">Treat all players with respect and courtesy</p>
                  <ul className="space-y-1 ml-4">
                    <li className="text-white/70">• No harassment, bullying, or discriminatory language</li>
                    <li className="text-white/70">• Respect different cultures, backgrounds, and playing styles</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white/90 mb-2">2. Appropriate Content</h2>
                  <p className="text-white/80 mb-3">Keep conversations appropriate for all ages</p>
                  <ul className="space-y-1 ml-4">
                    <li className="text-white/70">• No explicit, violent, or offensive content</li>
                    <li className="text-white/70">• No spam or excessive self-promotion</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white/90 mb-2">3. Game-Related Discussion</h2>
                  <p className="text-white/80 mb-3">Discuss strategies, tactics, and game mechanics</p>
                  <ul className="space-y-1 ml-4">
                    <li className="text-white/70">• Share tips and help fellow players</li>
                    <li className="text-white/70">• Respect game rules and fair play</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white/90 mb-2">4. Privacy and Safety</h2>
                  <p className="text-white/80 mb-3">Do not share personal information</p>
                  <ul className="space-y-1 ml-4">
                    <li className="text-white/70">• Report any suspicious or harmful behavior</li>
                    <li className="text-white/70">• Use the @mention feature responsibly</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white/90 mb-2">5. Moderation</h2>
                  <p className="text-white/80 mb-3">Follow moderator instructions</p>
                  <ul className="space-y-1 ml-4">
                    <li className="text-white/70">• Users may be muted for rule violations</li>
                    <li className="text-white/70">• Repeated violations may result in account restrictions</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white/90 mb-2">6. Technical Guidelines</h2>
                  <p className="text-white/80 mb-3">Keep messages under 500 characters</p>
                  <ul className="space-y-1 ml-4">
                    <li className="text-white/70">• Avoid excessive caps or special characters</li>
                    <li className="text-white/70">• Use appropriate channels for different topics</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-white/20 pt-4 mt-6">
                <p className="text-white/90 font-semibold">
                  By using the global chat, you agree to follow these rules. Violations may result in temporary or permanent restrictions from the chat system.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-3 py-4 border-t border-white/10">
          <div className="flex items-center space-x-2">
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="liability"
              checked={isLiableAcknowledged}
              onCheckedChange={(checked) => setIsLiableAcknowledged(checked as boolean)}
              className="border-white/40 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <label
              htmlFor="liability"
              className="text-sm text-white/80 cursor-pointer"
            >
              I understand that if these rules are violated, my account can be banned temporarily or permanently, and I am liable for all my actions
            </label>
          </div>
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
            onClick={handleAgree}
            disabled={!isAgreed || !isLiableAcknowledged}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            I Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
