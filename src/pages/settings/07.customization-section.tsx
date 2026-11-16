import { useState, useEffect } from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
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
import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Field,
  SaveMessage,
  SettingsCard,
  plainError,
  type SaveStatus,
} from "./components/SettingsCard";

// Frame display configuration. The ring colours are the frames themselves.
const FRAME_CONFIG: Record<
  string,
  { label: string; preview: string; tier: "pro" | "pro_plus" | "donor" }
> = {
  none: { label: "Standard", preview: "border-transparent", tier: "pro" },
  gold: { label: "Gold", preview: "ring-2 ring-yellow-500/60", tier: "pro" },
  silver: { label: "Silver", preview: "ring-2 ring-gray-400/60", tier: "pro" },
  bronze: {
    label: "Bronze",
    preview: "ring-2 ring-orange-600/60",
    tier: "pro",
  },
  diamond: {
    label: "Diamond",
    preview: "ring-2 ring-cyan-400/60",
    tier: "pro_plus",
  },
  fire: {
    label: "Inferno",
    preview: "ring-2 ring-orange-500/70",
    tier: "pro_plus",
  },
  rainbow: {
    label: "Spectrum",
    preview: "ring-2 ring-purple-500/60",
    tier: "pro_plus",
  },
  platinum: {
    label: "Platinum",
    preview: "ring-2 ring-slate-300/70",
    tier: "pro_plus",
  },
  cosmic: {
    label: "Nebula",
    preview: "ring-2 ring-indigo-500/60",
    tier: "pro_plus",
  },
  donor: {
    label: "Contributor",
    preview: "ring-2 ring-pink-500/60",
    tier: "donor",
  },
  heart: {
    label: "Valentine",
    preview: "ring-2 ring-rose-500/60",
    tier: "donor",
  },
  supporter: {
    label: "Ally",
    preview: "ring-2 ring-purple-500/60",
    tier: "donor",
  },
};

export function CustomizationSection() {
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

  const [status, setStatus] = useState<SaveStatus>(null);

  // Local state for the preview
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string>("none");
  const [showBadges, setShowBadges] = useState<boolean>(true);

  // Mutations
  const updateCustomization = useConvexMutationWithQuery(
    api.customizations.updateCustomization,
    {
      onSuccess: () => {
        setStatus({ kind: "success", message: "Saved." });
      },
      onError: (error) => {
        const message = plainError(
          error,
          "Could not save that change. Try again.",
        );
        setStatus({ kind: "error", message });
        toast.error(message);
      },
    },
  );

  const resetCustomization = useConvexMutationWithQuery(
    api.customizations.resetCustomization,
    {
      onSuccess: () => {
        setStatus({ kind: "success", message: "Back to the defaults." });
        setSelectedColor(null);
        setSelectedFrame("none");
        setShowBadges(true);
      },
      onError: (error) => {
        const message = plainError(error, "Could not reset. Try again.");
        setStatus({ kind: "error", message });
        toast.error(message);
      },
    },
  );

  // Sync state with fetched customization
  useEffect(() => {
    if (customization) {
      setSelectedColor(customization.usernameColor || null);
      setSelectedFrame(customization.avatarFrame || "none");
      setShowBadges(customization.showBadges ?? true);
    }
  }, [customization]);

  // A failed save puts the picker back to what is stored.
  useEffect(() => {
    if (updateCustomization.isError && customization) {
      setSelectedColor(customization.usernameColor || null);
      setSelectedFrame(customization.avatarFrame || "none");
      setShowBadges(customization.showBadges ?? true);
    }
  }, [updateCustomization.isError, customization]);

  const tier = availableFrames?.tier ?? "free";
  const isDonor = availableFrames?.isDonor ?? false;
  const isLocked = tier === "free" && !isDonor;
  const isSaving =
    updateCustomization.isPending || resetCustomization.isPending;

  const handleColorSelect = (color: string | null) => {
    setSelectedColor(color);
    setStatus(null);
    updateCustomization.mutate({ usernameColor: color });
  };

  const handleFrameSelect = (frame: string) => {
    setSelectedFrame(frame);
    setStatus(null);
    updateCustomization.mutate({
      avatarFrame: frame === "none" ? null : frame,
    });
  };

  const handleShowBadgesToggle = (checked: boolean) => {
    setShowBadges(checked);
    setStatus(null);
    updateCustomization.mutate({ showBadges: checked });
  };

  const handleReset = () => {
    setStatus(null);
    resetCustomization.mutate({});
  };

  if (isLoadingCustomization) {
    return (
      <SettingsCard
        title="Appearance"
        description="Name colour, avatar frame and badge."
      >
        <div className="space-y-6" aria-busy="true">
          <Skeleton className="h-[88px] w-full" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="size-10" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[5.5rem]" />
            ))}
          </div>
        </div>
      </SettingsCard>
    );
  }

  const actionButton = !isLocked && (
    <Button variant="ghost" size="sm" onClick={handleReset} disabled={isSaving}>
      {resetCustomization.isPending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <RotateCcw />
      )}
      Reset
    </Button>
  );

  const customHex =
    selectedColor?.startsWith("#") &&
    !availableColors?.colors.includes(selectedColor)
      ? selectedColor.replace("#", "")
      : "";

  return (
    <SettingsCard
      title="Appearance"
      description="Name colour, avatar frame and badge."
      action={actionButton}
    >
      <div className="space-y-6">
        {isLocked && (
          <div className="flex flex-col gap-3 rounded-md border border-gold-500/30 bg-gold-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">
              Name colours and avatar frames are for Pro, Pro+ and donors.
            </p>
            <Button asChild variant="secondary" className="shrink-0">
              <Link to="/pricing" search={{ donation: undefined }}>
                See plans
              </Link>
            </Button>
          </div>
        )}

        <div
          inert={isLocked}
          className={cn("space-y-6", isLocked && "opacity-50")}
        >
          {/* Live preview */}
          <div className="rounded-md border border-border bg-white/[0.02] p-4">
            <div className="mb-3 text-[13px] font-medium text-foreground">
              Preview
            </div>
            <div className="flex items-center gap-4">
              <UserAvatar
                username={profile?.username || "You"}
                avatarUrl={profile?.avatarUrl}
                rank={profile?.rank || "Private"}
                size="lg"
                frame={selectedFrame !== "none" ? selectedFrame : undefined}
                className={cn(
                  "shrink-0",
                  selectedFrame === "none" && "ring-1 ring-white/10",
                )}
              />
              <div className="min-w-0">
                <UserNameWithBadge
                  username={profile?.username || "Your username"}
                  tier={tier === "free" ? undefined : tier}
                  isDonor={isDonor}
                  usernameColor={selectedColor || undefined}
                  size="lg"
                  showBadges={showBadges}
                />
              </div>
            </div>
          </div>

          {/* Name colour */}
          <div>
            <div className="mb-3 text-[13px] font-medium text-foreground">
              Name colour
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Name colour"
            >
              <button
                type="button"
                onClick={() => handleColorSelect(null)}
                aria-label="Default colour"
                aria-pressed={selectedColor === null}
                className={cn(
                  "flex size-10 items-center justify-center rounded-md border text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                  selectedColor === null
                    ? "border-gold-500/60 bg-gold-500/10"
                    : "border-border bg-white/[0.04] hover:border-border-strong hover:bg-white/[0.08]",
                )}
              >
                {selectedColor === null ? <Check className="size-4" /> : "Aa"}
              </button>

              {availableColors?.colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  aria-label={`Colour ${color}`}
                  aria-pressed={selectedColor === color}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-md border-2 transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                    selectedColor === color
                      ? "border-foreground"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <Check className="size-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>

            {availableColors?.allowCustom && (
              <div className="mt-4 max-w-xs">
                <Field
                  label="Custom colour"
                  htmlFor="settings-hex"
                  hint="Six hex digits, like C9A24A."
                >
                  <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-white/[0.04] px-3 focus-within:ring-2 focus-within:ring-ring/60">
                    <span className="text-sm text-foreground/70">
                      #
                    </span>
                    <input
                      id="settings-hex"
                      type="text"
                      autoCapitalize="characters"
                      spellCheck={false}
                      placeholder="RRGGBB"
                      defaultValue={customHex}
                      key={customHex}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^[0-9A-Fa-f]{6}$/.test(value)) {
                          handleColorSelect(`#${value}`);
                        }
                      }}
                      maxLength={6}
                      className="w-full bg-transparent text-sm tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>
                </Field>
              </div>
            )}
          </div>

          {/* Avatar frame */}
          <div>
            <div className="mb-3 text-[13px] font-medium text-foreground">
              Avatar frame
            </div>
            <div
              className="grid grid-cols-3 gap-2 sm:grid-cols-6"
              role="group"
              aria-label="Avatar frame"
            >
              {Object.entries(FRAME_CONFIG).map(([frameId, config]) => {
                const isAvailable = availableFrames?.frames.includes(frameId);
                const isSelected = selectedFrame === frameId;

                return (
                  <button
                    type="button"
                    key={frameId}
                    onClick={() => isAvailable && handleFrameSelect(frameId)}
                    disabled={!isAvailable}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-md border p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                      isSelected
                        ? "border-gold-500/60 bg-gold-500/10"
                        : isAvailable
                          ? "border-border bg-white/[0.04] hover:border-border-strong hover:bg-white/[0.08]"
                          : "cursor-not-allowed border-border bg-transparent opacity-50",
                    )}
                  >
                    <div
                      className={cn(
                        "size-8 rounded-full bg-raised",
                        frameId !== "none" && config.preview,
                      )}
                    />
                    <span className="w-full truncate text-center text-xs text-foreground">
                      {config.label}
                    </span>
                    {config.tier !== "pro" && (
                      <span className="-mt-1 text-[11px] text-foreground/70">
                        {config.tier === "pro_plus" ? "Pro+" : "Donor"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badge */}
          <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
            <label
              htmlFor="settings-show-badges"
              className="min-w-0 cursor-pointer"
            >
              <span className="block text-sm font-medium text-foreground">
                Show my badge
              </span>
              <span className="mt-0.5 block text-xs text-foreground/70">
                Pro, Pro+ and donor badges next to your name.
              </span>
            </label>
            <Switch
              id="settings-show-badges"
              checked={showBadges}
              onCheckedChange={handleShowBadgesToggle}
              disabled={updateCustomization.isPending}
            />
          </div>
        </div>

        <div className="flex min-h-5 items-center gap-2" aria-live="polite">
          {isSaving ? (
            <p className="flex items-center gap-1.5 text-sm text-foreground/80">
              <Loader2 className="size-4 animate-spin" />
              Saving
            </p>
          ) : (
            <SaveMessage status={status} />
          )}
        </div>
      </div>
    </SettingsCard>
  );
}
