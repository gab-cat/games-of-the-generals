import { useState, useEffect } from "react";

import {
  Lock,
  Sparkles,
  Crown,
  Star,
  Check,
  RotateCcw,
  Palette,
  Frame,
  Eye,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  useConvexQuery,
  useConvexMutationWithQuery,
} from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserNameWithBadge } from "@/components/UserNameWithBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useNavigate } from "@tanstack/react-router";
import { SettingsCard } from "./components/SettingsCard";

// Frame display configuration
const FRAME_CONFIG: Record<
  string,
  { label: string; preview: string; tier: "pro" | "pro_plus" | "donor" }
> = {
  none: { label: "Standard", preview: "border-transparent", tier: "pro" },
  gold: {
    label: "Gold",
    preview: "ring-2 ring-yellow-500/60 shadow-yellow-500/30",
    tier: "pro",
  },
  silver: {
    label: "Silver",
    preview: "ring-2 ring-gray-400/60 shadow-gray-400/30",
    tier: "pro",
  },
  bronze: {
    label: "Bronze",
    preview: "ring-2 ring-orange-600/60 shadow-orange-600/30",
    tier: "pro",
  },
  diamond: {
    label: "Diamond",
    preview: "ring-2 ring-cyan-400/60 shadow-cyan-400/40 animate-pulse",
    tier: "pro_plus",
  },
  fire: {
    label: "Inferno",
    preview: "ring-2 ring-orange-500/70 shadow-orange-500/50",
    tier: "pro_plus",
  },
  rainbow: {
    label: "Spectrum",
    preview: "ring-2 ring-purple-500/60 shadow-purple-500/40",
    tier: "pro_plus",
  },
  platinum: {
    label: "Platinum",
    preview: "ring-2 ring-slate-300/70 shadow-slate-300/40",
    tier: "pro_plus",
  },
  cosmic: {
    label: "Nebula",
    preview: "ring-2 ring-indigo-500/60 shadow-indigo-500/50",
    tier: "pro_plus",
  },
  donor: {
    label: "Contributor",
    preview: "ring-2 ring-pink-500/60 shadow-pink-500/40",
    tier: "donor",
  },
  heart: {
    label: "Valentine",
    preview: "ring-2 ring-rose-500/60 shadow-rose-500/40",
    tier: "donor",
  },
  supporter: {
    label: "Ally",
    preview: "ring-2 ring-purple-500/60 shadow-purple-500/40",
    tier: "donor",
  },
};

export function CustomizationSection() {
  const navigate = useNavigate();

  // Queries
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile);
  const { data: customization, isPending: isLoadingCustomization } =
    useConvexQuery(api.customizations.getCurrentUserCustomization);
  const { data: availableFrames } = useConvexQuery(
    api.customizations.getAvailableFrames,
  );
  const { data: availableColors } = useConvexQuery(
    api.customizations.getAvailableColors,
  );

  // Mutations
  const updateCustomization = useConvexMutationWithQuery(
    api.customizations.updateCustomization,
    {
      onSuccess: () => {
        toast.success("Visual configuration applied");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update customization");
      },
    },
  );

  const resetCustomization = useConvexMutationWithQuery(
    api.customizations.resetCustomization,
    {
      onSuccess: () => {
        toast.success("Visual settings restored to default");
        setSelectedColor(null);
        setSelectedFrame("none");
        setShowBadges(true);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to reset customization");
      },
    },
  );

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
    updateCustomization.mutate({
      avatarFrame: frame === "none" ? null : frame,
    });
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
      <SettingsCard delay={0}>
        <div className="flex justify-center items-center py-8">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
        </div>
      </SettingsCard>
    );
  }

  const actionButton = !isLocked && (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReset}
      disabled={resetCustomization.isPending}
      className="h-8 text-[10px] uppercase font-mono tracking-wider text-zinc-500 hover:text-white hover:bg-white/5"
    >
      <RotateCcw className="w-3 h-3 mr-1.5" />
      Reset Defaults
    </Button>
  );

  return (
    <SettingsCard
      title="Visual Customization"
      description="Personalize your tactical interface appearance."
      icon={<Sparkles className="w-5 h-5" />}
      action={actionButton}
      className="relative overflow-hidden"
    >
      {/* Locked Overlay for Free Tier - Refined Command Center Aesthetic */}
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[3px] flex flex-col items-center justify-center p-8 text-center group/locked">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-150 animate-pulse" />
            <div className="bg-zinc-900 border border-amber-500/30 rounded-full p-5 relative z-10 shadow-[0_0_30px_rgba(245,158,11,0.15)] group-hover/locked:border-amber-500/50 transition-colors">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            {/* HUD elements */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500/40" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500/40" />
          </div>

          <h3 className="text-xl font-display text-white mb-3 tracking-[0.2em] uppercase">
            Access Restricted
          </h3>

          <div className="space-y-1 mb-8">
            <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
              Visual modification protocols require
            </p>
            <p className="text-amber-500/80 text-xs font-mono font-bold uppercase tracking-[0.2em]">
              Level 2 Clearance [PRO_OR_HIGHER]
            </p>
          </div>

          <Button
            onClick={handleUpgrade}
            className="bg-amber-600 hover:bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-widest px-8 py-6 h-auto gap-3 shadow-[0_4px_25px_rgba(217,119,6,0.25)] border-t border-white/20"
          >
            <Crown className="w-4 h-4" />
            Upgrade Clearance
          </Button>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center"
                >
                  <Star className="w-3 h-3 text-amber-500/40" />
                </div>
              ))}
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">
              Join 500+ elite operatives
            </span>
          </div>
        </div>
      )}

      <div
        className={cn(
          "space-y-8",
          isLocked && "opacity-20 pointer-events-none filter blur-sm",
        )}
      >
        {/* Live Preview */}
        <div className="bg-black/40 rounded-sm p-6 border border-white/5 relative group">
          {/* Scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] pointer-events-none opacity-20" />

          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
            <Eye className="w-3 h-3" /> Live Preview
          </div>

          <div className="flex items-center gap-6">
            <UserAvatar
              username={profile?.username || "You"}
              avatarUrl={profile?.avatarUrl}
              rank={profile?.rank || "Private"}
              size="lg"
              frame={selectedFrame !== "none" ? selectedFrame : undefined}
              className={cn(
                "flex-shrink-0 shadow-[0_0_30px_rgba(0,0,0,0.5)]",
                selectedFrame === "none" && "ring-1 ring-white/10",
              )}
            />
            <div className="min-w-0 space-y-1">
              <UserNameWithBadge
                username={profile?.username || "Your Username"}
                tier={tier === "free" ? undefined : tier}
                isDonor={isDonor}
                usernameColor={selectedColor || undefined}
                size="lg"
                showBadges={showBadges}
              />
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-zinc-600 text-xs font-mono uppercase">
                  System Online
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Username Color Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-300 text-xs font-mono uppercase tracking-wider">
                Display Color
              </span>
            </div>
            {availableColors?.allowCustom && (
              <span className="text-[10px] text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded-sm border border-amber-500/20 font-mono uppercase">
                Hex Code Enabled
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Default/No color option */}
            <button
              onClick={() => handleColorSelect(null)}
              className={cn(
                "w-9 h-9 rounded-sm border transition-all duration-200 flex items-center justify-center relative",
                selectedColor === null
                  ? "border-white bg-white/10 ring-1 ring-white/20"
                  : "border-white/10 bg-black/40 hover:border-white/30",
              )}
            >
              {selectedColor === null && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Color palette */}
            {availableColors?.colors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={cn(
                  "w-9 h-9 rounded-sm transition-all duration-200 flex items-center justify-center shadow-lg relative overflow-hidden group/color",
                  selectedColor === color
                    ? "ring-2 ring-white/50 scale-105"
                    : "hover:scale-105 opacity-80 hover:opacity-100",
                )}
                style={{ backgroundColor: color }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/color:opacity-100 transition-opacity" />
                {selectedColor === color && (
                  <Check className="w-4 h-4 text-white drop-shadow-md relative z-10" />
                )}
              </button>
            ))}
          </div>

          {/* Custom hex input for Pro+ / Donors */}
          {availableColors?.allowCustom && (
            <div className="mt-4 flex items-center gap-3 bg-black/20 p-2 rounded-sm border border-white/5 max-w-xs">
              <span className="text-zinc-500 font-mono text-sm ml-2">#</span>
              <input
                type="text"
                placeholder="RRGGBB"
                value={
                  selectedColor?.startsWith("#") &&
                  !availableColors.colors.includes(selectedColor)
                    ? selectedColor.replace("#", "")
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[0-9A-Fa-f]{0,6}$/.test(value)) {
                    if (value.length === 6) {
                      handleColorSelect(`#${value}`);
                    }
                  }
                }}
                className="w-full bg-transparent border-none text-white placeholder:text-zinc-700 focus:outline-none focus:ring-0 font-mono text-sm uppercase tracking-widest"
              />
            </div>
          )}
        </div>

        {/* Avatar Frame Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Frame className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-300 text-xs font-mono uppercase tracking-wider">
              Frame Signature
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {Object.entries(FRAME_CONFIG).map(([frameId, config]) => {
              const isAvailable = availableFrames?.frames.includes(frameId);
              const isSelected = selectedFrame === frameId;

              return (
                <button
                  key={frameId}
                  onClick={() => isAvailable && handleFrameSelect(frameId)}
                  disabled={!isAvailable}
                  className={cn(
                    "relative aspect-square rounded-sm border transition-all duration-200 flex flex-col items-center justify-center p-2 gap-2 group/frame",
                    isSelected
                      ? "border-white/40 bg-white/5 ring-1 ring-white/10"
                      : isAvailable
                        ? "border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/5"
                        : "border-white/5 bg-black/20 opacity-30 cursor-not-allowed",
                  )}
                >
                  {/* Tier indicator */}
                  {config.tier === "pro_plus" && (
                    <div className="absolute top-1 right-1">
                      <Star className="w-2.5 h-2.5 text-amber-500/50" />
                    </div>
                  )}
                  {config.tier === "donor" && (
                    <div className="absolute top-1 right-1">
                      <Sparkles className="w-2.5 h-2.5 text-pink-500/50" />
                    </div>
                  )}

                  {/* Wrapper for the frame preview */}
                  <div className="relative">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full bg-zinc-800",
                        frameId !== "none" && config.preview,
                      )}
                    />
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-zinc-500" />
                      </div>
                    )}
                  </div>

                  <span
                    className={cn(
                      "text-[9px] font-mono uppercase tracking-wider truncate w-full text-center",
                      isSelected ? "text-white" : "text-zinc-500",
                    )}
                  >
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Show Badges Toggle */}
        <div className="bg-white/[0.02] rounded-sm p-4 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-zinc-200 text-xs font-mono uppercase tracking-wider block">
                Rank Insignia
              </span>
              <p className="text-zinc-600 text-[10px] font-mono">
                Display tier protocols publicly
              </p>
            </div>
          </div>
          <Switch
            checked={showBadges}
            onCheckedChange={handleShowBadgesToggle}
            disabled={updateCustomization.isPending}
            className="data-[state=checked]:bg-emerald-600"
          />
        </div>
      </div>
    </SettingsCard>
  );
}
