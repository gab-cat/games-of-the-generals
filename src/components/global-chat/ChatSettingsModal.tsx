"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

// Predefined color options with names
const CHAT_COLORS = [
  { name: "Pure White", color: "#FFFFFF" },
  { name: "Soft Blue", color: "#6B9FFF" },
  { name: "Sky Blue", color: "#87CEEB" },
  { name: "Mint Green", color: "#7FFFD4" },
  { name: "Spring Green", color: "#90EE90" },
  { name: "Sunny Yellow", color: "#FFD700" },
  { name: "Warm Orange", color: "#FFA500" },
  { name: "Coral Pink", color: "#FF7F50" },
  { name: "Hot Pink", color: "#FF69B4" },
  { name: "Lavender", color: "#E6E6FA" },
  { name: "Light Purple", color: "#DDA0DD" },
  { name: "Peach", color: "#FFDAB9" },
  { name: "Seafoam", color: "#98FB98" },
  { name: "Light Cyan", color: "#E0FFFF" },
  { name: "Cream", color: "#FFFACD" },
  { name: "Light Gray", color: "#D3D3D3" },
];

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings?: {
    usernameColor?: string;
    showTimestamps?: boolean;
    enableSounds?: boolean;
    enableMentions?: boolean;
  } | null;
}

export function ChatSettingsModal({
  isOpen,
  onClose,
  currentSettings,
}: ChatSettingsModalProps) {
  const [usernameColor, setUsernameColor] = useState(
    currentSettings?.usernameColor || "#ffffff",
  );
  const [showTimestamps, setShowTimestamps] = useState(
    currentSettings?.showTimestamps ?? true,
  );
  const [enableSounds, setEnableSounds] = useState(
    currentSettings?.enableSounds ?? true,
  );
  const [enableMentions, setEnableMentions] = useState(
    currentSettings?.enableMentions ?? true,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjustedColorMessage, setAdjustedColorMessage] = useState<
    string | null
  >(null);

  const updateSettings = useMutation(api.globalChat.updateChatSettings);

  useEffect(() => {
    if (isOpen && currentSettings) {
      setUsernameColor(currentSettings.usernameColor || "#ffffff");
      setShowTimestamps(currentSettings.showTimestamps ?? true);
      setEnableSounds(currentSettings.enableSounds ?? true);
      setEnableMentions(currentSettings.enableMentions ?? true);
      setAdjustedColorMessage(null);
    }
  }, [isOpen, currentSettings]);

  const handleSave = async () => {
    setIsSubmitting(true);
    setAdjustedColorMessage(null);

    try {
      const result = await updateSettings({
        usernameColor,
        showTimestamps,
        enableSounds,
        enableMentions,
      });

      if (result.adjustedColor) {
        setAdjustedColorMessage(
          `We changed your color to ${result.adjustedColor} so it is easy to read on a dark background.`,
        );
        setUsernameColor(result.adjustedColor);
        toast.success("Saved. We adjusted your color so it is easy to read.");
      } else {
        toast.success("Chat settings saved.");
        onClose();
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Couldn't save your chat settings. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAdjustedColorMessage(null);
    onClose();
  };

  const isValidColor = (color: string) => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  };

  const colorError = !isValidColor(usernameColor)
    ? "Enter a color like #FF5733."
    : null;

  const presetName = CHAT_COLORS.find(
    (c) => c.color.toLowerCase() === usernameColor.toLowerCase(),
  )?.name;

  const toggles = [
    {
      id: "chat-timestamps",
      label: "Show message times",
      hint: "Show how long ago each message was sent.",
      checked: showTimestamps,
      onChange: setShowTimestamps,
    },
    {
      id: "chat-sounds",
      label: "Sounds",
      hint: "Play a sound for new messages.",
      checked: enableSounds,
      onChange: setEnableSounds,
    },
    {
      id: "chat-mentions",
      label: "Mention alerts",
      hint: "Get an alert when someone mentions you.",
      checked: enableMentions,
      onChange: setEnableMentions,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Chat settings</DialogTitle>
          <DialogDescription>
            Changes apply to your messages in global chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <Label className="text-sm font-medium text-foreground">
                Name color
              </Label>
              <span className="truncate text-sm text-foreground/80">
                {presetName ?? "Custom"}
              </span>
            </div>

            <div
              role="radiogroup"
              aria-label="Name color"
              className="grid grid-cols-4 gap-2 sm:grid-cols-8"
            >
              {CHAT_COLORS.map((c) => {
                const selected =
                  c.color.toLowerCase() === usernameColor.toLowerCase();
                return (
                  <button
                    key={c.color}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => setUsernameColor(c.color)}
                    className={cn(
                      "h-10 rounded-md border transition-[transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-95",
                      selected
                        ? "border-foreground ring-2 ring-foreground/80 ring-offset-2 ring-offset-card"
                        : "border-white/15 hover:scale-105",
                    )}
                    style={{ backgroundColor: c.color }}
                  />
                );
              })}
            </div>

            <div className="flex gap-2">
              <Input
                type="color"
                aria-label="Pick a custom color"
                value={isValidColor(usernameColor) ? usernameColor : "#ffffff"}
                onChange={(e) => setUsernameColor(e.target.value)}
                className="h-10 w-14 shrink-0 cursor-pointer p-1"
              />
              <Input
                type="text"
                aria-label="Hex color"
                value={usernameColor}
                onChange={(e) => setUsernameColor(e.target.value)}
                placeholder="#ffffff"
                spellCheck={false}
                aria-invalid={!!colorError}
                className="flex-1"
              />
            </div>

            {colorError && <p className="text-sm text-red-400">{colorError}</p>}
            {adjustedColorMessage && (
              <p className="text-sm text-emerald-400">{adjustedColorMessage}</p>
            )}

            <div className="rounded-lg border border-border bg-white/[0.03] py-1">
              <p className="px-3 pt-1 text-xs text-foreground/70">Preview</p>
              <div className="px-3 py-2">
                <span
                  className="text-sm font-medium"
                  style={{
                    color: isValidColor(usernameColor)
                      ? usernameColor
                      : undefined,
                  }}
                >
                  YourUsername
                </span>
                <p className="mt-0.5 text-sm text-foreground">
                  Good game. Rematch?
                </p>
              </div>
            </div>
          </section>

          <section className="divide-y divide-border border-y border-border">
            {toggles.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <Label
                    htmlFor={t.id}
                    className="text-sm font-medium text-foreground"
                  >
                    {t.label}
                  </Label>
                  <p className="mt-0.5 text-sm text-foreground/75">{t.hint}</p>
                </div>
                <Switch
                  id={t.id}
                  checked={t.checked}
                  onCheckedChange={t.onChange}
                />
              </div>
            ))}
          </section>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={isSubmitting || !!colorError}
          >
            {isSubmitting
              ? "Saving..."
              : adjustedColorMessage
                ? "Save adjusted color"
                : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
