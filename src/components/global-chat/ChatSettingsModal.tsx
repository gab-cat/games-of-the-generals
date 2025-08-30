"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";

// Predefined color options with names
const CHAT_COLORS = [
  { name: "Pure White", color: "#FFFFFF", description: "Clean and bright" },
  { name: "Soft Blue", color: "#6B9FFF", description: "Calm and trustworthy" },
  { name: "Sky Blue", color: "#87CEEB", description: "Friendly and approachable" },
  { name: "Mint Green", color: "#7FFFD4", description: "Fresh and modern" },
  { name: "Spring Green", color: "#90EE90", description: "Natural and vibrant" },
  { name: "Sunny Yellow", color: "#FFD700", description: "Energetic and cheerful" },
  { name: "Warm Orange", color: "#FFA500", description: "Friendly and inviting" },
  { name: "Coral Pink", color: "#FF7F50", description: "Playful and warm" },
  { name: "Hot Pink", color: "#FF69B4", description: "Fun and lively" },
  { name: "Lavender", color: "#E6E6FA", description: "Soft and elegant" },
  { name: "Light Purple", color: "#DDA0DD", description: "Creative and artistic" },
  { name: "Peach", color: "#FFDAB9", description: "Gentle and warm" },
  { name: "Seafoam", color: "#98FB98", description: "Calming and natural" },
  { name: "Light Cyan", color: "#E0FFFF", description: "Cool and refreshing" },
  { name: "Cream", color: "#FFFACD", description: "Soft and welcoming" },
  { name: "Light Gray", color: "#D3D3D3", description: "Neutral and balanced" },
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

export function ChatSettingsModal({ isOpen, onClose, currentSettings }: ChatSettingsModalProps) {
  const [usernameColor, setUsernameColor] = useState(currentSettings?.usernameColor || "#ffffff");
  const [showTimestamps, setShowTimestamps] = useState(currentSettings?.showTimestamps ?? true);
  const [enableSounds, setEnableSounds] = useState(currentSettings?.enableSounds ?? true);
  const [enableMentions, setEnableMentions] = useState(currentSettings?.enableMentions ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjustedColorMessage, setAdjustedColorMessage] = useState<string | null>(null);

  // Check if current color is one of the presets
  const isPresetColor = CHAT_COLORS.some(color => color.color === usernameColor);

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
        setAdjustedColorMessage(`Color adjusted to ${result.adjustedColor} for better readability`);
        setUsernameColor(result.adjustedColor);
        toast.success("Color adjusted for readability!");
      } else {
        toast.success("Chat settings updated!");
        onClose();
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update settings");
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
    ? "Please enter a valid hex color (e.g. #FF5733)"
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-950/80 backdrop-blur-sm border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white/90 text-xl font-bold">
            Chat Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Username Color */}
          <div className="space-y-4">
            <Label className="text-white/90 text-sm font-medium">
              Username Color
            </Label>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Color Selection */}
              <div className="space-y-4">
                {/* Preset Colors Dropdown */}
                <div className="space-y-2">
                  <Label className="text-white/80 text-sm">Choose a Color</Label>
                  <Select
                    value={isPresetColor ? usernameColor : "custom"}
                    onValueChange={(value) => {
                      if (value !== "custom") {
                        setUsernameColor(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a color...">
                        {isPresetColor ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-white/20"
                              style={{ backgroundColor: usernameColor }}
                            />
                            {CHAT_COLORS.find(c => c.color === usernameColor)?.name}
                          </div>
                        ) : (
                          "Custom color selected"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CHAT_COLORS.map((colorOption) => (
                        <SelectItem key={colorOption.color} value={colorOption.color}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-white/20"
                              style={{ backgroundColor: colorOption.color }}
                            />
                            <span>{colorOption.name}</span>
                            <span className="text-white/60 text-xs ml-auto">
                              {colorOption.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Color Option */}
                <div className="border-t border-white/20 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Label className="text-white/80 text-sm">
                      Custom Color
                    </Label>
                    {!isPresetColor && (
                      <span className="text-blue-400 text-xs bg-blue-500/20 px-2 py-1 rounded-full">
                        Currently Selected
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={usernameColor}
                      onChange={(e) => setUsernameColor(e.target.value)}
                      className={`w-16 h-10 p-1 bg-black/40 border-white/20 ${
                        !isPresetColor ? 'ring-2 ring-blue-500/50' : ''
                      }`}
                    />
                    <Input
                      type="text"
                      value={usernameColor}
                      onChange={(e) => setUsernameColor(e.target.value)}
                      placeholder="#ffffff"
                      className={`flex-1 bg-black/40 border-white/20 text-white placeholder:text-white/40 ${
                        !isPresetColor ? 'ring-2 ring-blue-500/50' : ''
                      }`}
                    />
                  </div>
                </div>

                {colorError && (
                  <p className="text-red-400 text-xs">{colorError}</p>
                )}
                {adjustedColorMessage && (
                  <p className="text-green-400 text-xs">{adjustedColorMessage}</p>
                )}
              </div>

              {/* Right Side - Chat Preview */}
              <div className="space-y-3">
                <Label className="text-white/80 text-sm">Preview</Label>

                <div className="bg-black/40 rounded-lg border border-white/10 p-4">
                  <div className="space-y-3">
                    {/* Selected Color Info */}
                    <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white/30"
                        style={{ backgroundColor: usernameColor }}
                      />
                      <div>
                        <div className="text-white/90 text-sm font-medium">
                          {isPresetColor
                            ? CHAT_COLORS.find(c => c.color === usernameColor)?.name
                            : "Custom Color"
                          }
                        </div>
                        <div className="text-white/60 text-xs">
                          {usernameColor.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Chat Message Preview */}
                    <div>
                      <div className="text-white/70 text-xs mb-2">How it will appear in chat:</div>
                      <div className="bg-black/60 rounded p-3 border border-white/5">
                        <div className="flex items-start gap-1">
                          <span
                            className="text-sm font-medium"
                            style={{ color: usernameColor }}
                          >
                            YourUsername
                          </span>
                          <span className="text-white/40 text-sm">:</span>
                          <span className="text-white/90 text-sm flex-1 leading-tight">
                            Hey everyone! This is how my messages will look with this color.
                          </span>
                        </div>
                        <div className="flex items-start gap-1 mt-1">
                          <span
                            className="text-sm font-medium"
                            style={{ color: usernameColor }}
                          >
                            YourUsername
                          </span>
                          <span className="text-white/40 text-sm">:</span>
                          <span className="text-white/90 text-sm flex-1 leading-tight">
                            Another message to show the color consistency.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-white/60 text-xs">
              Choose from {CHAT_COLORS.length} preset colors or create your own custom color. Colors are automatically optimized for readability on dark backgrounds.
            </p>
          </div>

          {/* Show Timestamps */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white/90 text-sm font-medium">
                Show Timestamps
              </Label>
              <p className="text-white/60 text-xs">
                Display message timestamps on hover
              </p>
            </div>
            <Switch
              checked={showTimestamps}
              onCheckedChange={setShowTimestamps}
            />
          </div>

          {/* Enable Sounds */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white/90 text-sm font-medium">
                Enable Sounds
              </Label>
              <p className="text-white/60 text-xs">
                Play sound notifications for messages
              </p>
            </div>
            <Switch
              checked={enableSounds}
              onCheckedChange={setEnableSounds}
            />
          </div>

          {/* Enable Mentions */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white/90 text-sm font-medium">
                Enable Mentions
              </Label>
              <p className="text-white/60 text-xs">
                Receive notifications when someone mentions you
              </p>
            </div>
            <Switch
              checked={enableMentions}
              onCheckedChange={setEnableMentions}
            />
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
            onClick={() => void handleSave()}
            disabled={isSubmitting || !!colorError}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : adjustedColorMessage ? "Save Adjusted Color" : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
