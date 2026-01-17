import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, Crown, Star, Check, RotateCcw, Palette, Frame, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useConvexQuery, useConvexMutationWithQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserNameWithBadge } from "@/components/UserNameWithBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useNavigate } from "@tanstack/react-router";

// Frame display configuration
const FRAME_CONFIG: Record<string, { label: string; preview: string; tier: "pro" | "pro_plus" | "donor" }> = {
  none: { label: "None", preview: "border-transparent", tier: "pro" },
  gold: { label: "Gold", preview: "ring-2 ring-yellow-500/60 shadow-yellow-500/30", tier: "pro" },
  silver: { label: "Silver", preview: "ring-2 ring-gray-400/60 shadow-gray-400/30", tier: "pro" },
  bronze: { label: "Bronze", preview: "ring-2 ring-orange-600/60 shadow-orange-600/30", tier: "pro" },
  diamond: { label: "Diamond", preview: "ring-2 ring-cyan-400/60 shadow-cyan-400/40 animate-pulse", tier: "pro_plus" },
  fire: { label: "Fire", preview: "ring-2 ring-orange-500/70 shadow-orange-500/50", tier: "pro_plus" },
  rainbow: { label: "Rainbow", preview: "ring-2 ring-purple-500/60 shadow-purple-500/40", tier: "pro_plus" },
  platinum: { label: "Platinum", preview: "ring-2 ring-slate-300/70 shadow-slate-300/40", tier: "pro_plus" },
  cosmic: { label: "Cosmic", preview: "ring-2 ring-indigo-500/60 shadow-indigo-500/50", tier: "pro_plus" },
  donor: { label: "Donor", preview: "ring-2 ring-pink-500/60 shadow-pink-500/40", tier: "donor" },
  heart: { label: "Heart", preview: "ring-2 ring-rose-500/60 shadow-rose-500/40", tier: "donor" },
  supporter: { label: "Supporter", preview: "ring-2 ring-purple-500/60 shadow-purple-500/40", tier: "donor" },
};

export function CustomizationSection() {
  const navigate = useNavigate();
  
  // Queries
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile);
  const { data: customization, isPending: isLoadingCustomization } = useConvexQuery(
    api.customizations.getCurrentUserCustomization
  );
  const { data: availableFrames } = useConvexQuery(api.customizations.getAvailableFrames);
  const { data: availableColors } = useConvexQuery(api.customizations.getAvailableColors);

  // Mutations
  const updateCustomization = useConvexMutationWithQuery(api.customizations.updateCustomization, {
    onSuccess: () => {
      toast.success("Customization updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update customization");
    },
  });

  const resetCustomization = useConvexMutationWithQuery(api.customizations.resetCustomization, {
    onSuccess: () => {
      toast.success("Customization reset to default");
      setSelectedColor(null);
      setSelectedFrame("none");
      setShowBadges(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reset customization");
    },
  });

  // Local state for preview
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string>("none");
  const [showBadges, setShowBadges] = useState<boolean>(true);

  // Sync state with fetched customization
  useEffect(() => {
    if (customization) {
      setSelectedColor(customization.usernameColor || null);
      setSelectedFrame(customization.avatarFrame || "none");
      setShowBadges(customization.showBadges ?? true);
    }
  }, [customization]);

  const tier = availableFrames?.tier ?? "free";
  const isDonor = availableFrames?.isDonor ?? false;
  const isLocked = tier === "free" && !isDonor;

  const handleColorSelect = (color: string | null) => {
    setSelectedColor(color);
    updateCustomization.mutate({ usernameColor: color });
  };

  const handleFrameSelect = (frame: string) => {
    setSelectedFrame(frame);
    updateCustomization.mutate({ avatarFrame: frame === "none" ? null : frame });
  };

  const handleShowBadgesToggle = (checked: boolean) => {
    setShowBadges(checked);
    updateCustomization.mutate({ showBadges: checked });
  };

  const handleReset = () => {
    resetCustomization.mutate({});
  };

  const handleUpgrade = () => {
    navigate({ to: "/pricing", search: { donation: undefined } });
  };

  if (isLoadingCustomization) {
    return (
      <Card className="rounded-xl border border-white/10 bg-black/30">
        <CardContent className="p-4 sm:p-5">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border border-white/10 bg-black/30 relative overflow-hidden">
      {/* Locked Overlay for Free Tier */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6"
        >
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full p-4 mb-4 border border-white/10">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Premium Feature</h3>
          <p className="text-white/60 text-sm text-center mb-4 max-w-xs">
            Customize your username color and avatar frame with a Pro subscription
          </p>
          <Button
            variant="gradient"
            onClick={handleUpgrade}
            className="gap-2"
          >
            <Crown className="w-4 h-4" />
            Upgrade to Pro
          </Button>
        </motion.div>
      )}

      <CardHeader className="p-4 sm:p-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-white text-base font-medium">Customization</CardTitle>
            {tier !== "free" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  tier === "pro_plus"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                )}
              >
                {tier === "pro_plus" ? "Pro+" : "Pro"}
              </Badge>
            )}
            {isDonor && (
              <Badge variant="outline" className="text-xs border-pink-500/30 bg-pink-500/10 text-pink-400">
                Donor
              </Badge>
            )}
          </div>
          {!isLocked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={resetCustomization.isPending}
              className="text-white/60 hover:text-white text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
        <CardDescription className="text-white/60 text-sm">
          Personalize your profile appearance
        </CardDescription>
      </CardHeader>

      <CardContent className={cn("p-4 sm:p-5 pt-2 space-y-6", isLocked && "opacity-50 pointer-events-none")}>
        {/* Live Preview */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-xs text-white/50 uppercase tracking-wider mb-3">Preview</div>
          <div className="flex items-center gap-4">
            <UserAvatar
              username={profile?.username || "You"}
              avatarUrl={profile?.avatarUrl}
              rank={profile?.rank || "Private"}
              size="lg"
              frame={selectedFrame !== "none" ? selectedFrame : undefined}
              className="flex-shrink-0 shadow-lg"
            />
            <div className="min-w-0">
              <UserNameWithBadge
                username={profile?.username || "Your Username"}
                tier={tier === "free" ? undefined : tier}
                isDonor={isDonor}
                usernameColor={selectedColor || undefined}
                size="lg"
                showBadges={showBadges}
              />
              <p className="text-white/40 text-xs mt-1">This is how you'll appear to others</p>
            </div>
          </div>
        </div>

        {/* Username Color Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-blue-400" />
            <span className="text-white/90 text-sm font-medium">Username Color</span>
            {availableColors?.allowCustom && (
              <Badge variant="outline" className="text-xs border-amber-500/30 bg-amber-500/10 text-amber-300">
                Custom Hex Available
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Default/No color option */}
            <button
              onClick={() => handleColorSelect(null)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                selectedColor === null
                  ? "border-white ring-2 ring-white/30"
                  : "border-white/30 hover:border-white/50"
              )}
            >
              {selectedColor === null && <Check className="w-4 h-4 text-white" />}
            </button>
            
            {/* Color palette */}
            {availableColors?.colors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center shadow-lg",
                  selectedColor === color
                    ? "border-white ring-2 ring-white/30 scale-110"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && <Check className="w-4 h-4 text-white drop-shadow-md" />}
              </button>
            ))}
          </div>

          {/* Custom hex input for Pro+ / Donors */}
          {availableColors?.allowCustom && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="#RRGGBB"
                value={selectedColor?.startsWith("#") && !availableColors.colors.includes(selectedColor) ? selectedColor : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    if (value.length === 7) {
                      handleColorSelect(value);
                    }
                  }
                }}
                className="w-28 px-3 py-1.5 text-sm rounded-lg bg-white/5 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <span className="text-white/40 text-xs">Enter custom hex color</span>
            </div>
          )}
        </div>

        {/* Avatar Frame Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Frame className="w-4 h-4 text-purple-400" />
            <span className="text-white/90 text-sm font-medium">Avatar Frame</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Object.entries(FRAME_CONFIG).map(([frameId, config]) => {
              const isAvailable = availableFrames?.frames.includes(frameId);
              const isSelected = selectedFrame === frameId;

              return (
                <button
                  key={frameId}
                  onClick={() => isAvailable && handleFrameSelect(frameId)}
                  disabled={!isAvailable}
                  className={cn(
                    "relative aspect-square rounded-lg border transition-all duration-200 flex flex-col items-center justify-center p-1 gap-1",
                    isSelected
                      ? "border-white bg-white/10 ring-2 ring-white/30"
                      : isAvailable
                        ? "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                        : "border-white/10 bg-white/5 opacity-40 cursor-not-allowed"
                  )}
                >
                  {/* Mini avatar preview with frame */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30",
                      frameId !== "none" && config.preview
                    )}
                  />
                  <span className="text-[10px] text-white/70 truncate w-full text-center">{config.label}</span>
                  
                  {/* Lock icon for unavailable */}
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <Lock className="w-3 h-3 text-white/50" />
                    </div>
                  )}
                  
                  {/* Tier badge */}
                  {config.tier === "pro_plus" && (
                    <div className="absolute -top-1 -right-1">
                      <Star className="w-3 h-3 text-amber-400" />
                    </div>
                  )}
                  {config.tier === "donor" && (
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="w-3 h-3 text-pink-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-white/40 text-xs mt-3">
            {tier === "pro" && "Upgrade to Pro+ for animated frames"}
            {tier === "pro_plus" && !isDonor && "Donate to unlock exclusive donor frames"}
            {isDonor && "Thank you for your support! You have access to donor-exclusive frames."}
          </p>
        </div>

        {/* Show Badges Toggle */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Eye className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-white/90 text-sm font-medium">Show Badges</span>
                <p className="text-white/50 text-xs">Display tier and donor badges next to your name</p>
              </div>
            </div>
            <Switch
              checked={showBadges}
              onCheckedChange={handleShowBadgesToggle}
              disabled={updateCustomization.isPending}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
