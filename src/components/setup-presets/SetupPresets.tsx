import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Save,
  Trash2,
  Star,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { fadeUp, stagger } from "../../lib/motion";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { useNavigate } from "@tanstack/react-router";

interface SetupPresetsProps {
  currentSetup: (string | null)[][];
  onLoadPreset: (pieces: { piece: string; row: number; col: number }[]) => void;
  onApplyDefault?: () => void;
  autoLoadDefault?: boolean; // Whether to auto-load default preset on component mount
  shouldFlipBoard?: boolean; // Whether the board display is flipped (for player2)
  className?: string;
}

interface DefaultPresetData {
  _id: string; // String ID for default presets
  name: string;
  description: string;
  isDefault: boolean;
  isBuiltIn: boolean;
  pieces: { piece: string; row: number; col: number }[];
  createdAt: number;
  upvotes?: number;
}

interface PresetData {
  _id: Id<"setupPresets">;
  name: string;
  isDefault: boolean;
  isBuiltIn: boolean;
  pieces: { piece: string; row: number; col: number }[];
  createdAt: number;
  upvotes?: number;
}

/**
 * SetupPresets Component
 *
 * Features:
 * - Display default presets (hardcoded) and custom user presets
 * - Save current setup as a custom preset
 * - Load presets into the game board
 * - Set custom presets as default
 * - Auto-load default preset when component mounts (if board is empty)
 * - Delete and edit custom presets
 * - Handle board flipping for player2 (when shouldFlipBoard is true)
 *
 * Auto-load behavior:
 * - Automatically loads the user's default preset when the component first loads
 * - Only triggers if the board is completely empty (no pieces placed)
 * - Can be disabled by setting autoLoadDefault={false}
 * - Resets when board becomes empty again for subsequent auto-loads
 * - Transforms piece coordinates when board is flipped for player2
 */
export const SetupPresets = React.memo(
  ({
    currentSetup,
    onLoadPreset,
    onApplyDefault,
    autoLoadDefault = true, // Default to true for backwards compatibility
    shouldFlipBoard = false, // Default to false for backwards compatibility
    className,
  }: SetupPresetsProps) => {
    const [isExpanded, setIsExpanded] = useState(false); // Changed default to false for better performance
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [newPresetName, setNewPresetName] = useState("");
    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<{
      id: Id<"setupPresets">;
      name: string;
    } | null>(null);
    const hasAutoLoaded = useRef(false);

    const navigate = useNavigate();

    // Queries
    const presets = useQuery(api.setupPresets.getUserSetupPresets);
    const defaultPresets = useQuery(api.setupPresets.getDefaultPresets);
    const defaultPreset = useQuery(api.setupPresets.getDefaultPreset);
    const { data: presetLimit } = useConvexQuery(
      api.featureGating.checkSetupPresetLimit,
      {},
    );

    // Mutations
    const savePreset = useMutation(api.setupPresets.saveSetupPreset);
    const loadPreset = useMutation(api.setupPresets.loadSetupPreset);
    const deletePreset = useMutation(api.setupPresets.deleteSetupPreset);
    const setDefaultPreset = useMutation(api.setupPresets.setDefaultPreset);
    const updatePreset = useMutation(api.setupPresets.updateSetupPreset);

    // No need to initialize built-in presets since they're now hardcoded

    // Memoized board empty check
    const isBoardEmpty = useMemo(() => {
      return currentSetup.flat().every((cell) => cell === null);
    }, [currentSetup]);

    // Memoized helper functions to handle board flipping for player2
    const transformPiecesForDisplay = useMemo(() => {
      if (!shouldFlipBoard) {
        return (pieces: { piece: string; row: number; col: number }[]) =>
          pieces;
      }

      // When board is flipped, we need to transform the row coordinates
      // The board has 8 rows (0-7), so row X becomes row (7-X) when flipped
      return (pieces: { piece: string; row: number; col: number }[]) =>
        pieces.map((piece) => ({
          ...piece,
          row: 7 - piece.row,
        }));
    }, [shouldFlipBoard]);

    const transformPiecesFromDisplay = useMemo(() => {
      if (!shouldFlipBoard) {
        return (pieces: { piece: string; row: number; col: number }[]) =>
          pieces;
      }

      // When saving, we need to convert display coordinates back to logical coordinates
      // If display shows row X and board is flipped, the logical row is (7-X)
      return (pieces: { piece: string; row: number; col: number }[]) =>
        pieces.map((piece) => ({
          ...piece,
          row: 7 - piece.row,
        }));
    }, [shouldFlipBoard]);

    // Auto-load default preset when component loads
    useEffect(() => {
      if (
        defaultPreset &&
        !hasAutoLoaded.current &&
        autoLoadDefault &&
        isBoardEmpty
      ) {
        hasAutoLoaded.current = true;
        // Only auto-load if the board is empty (no pieces placed yet)
        void loadPreset({ presetId: defaultPreset._id })
          .then((preset) => {
            const transformedPieces = transformPiecesForDisplay(preset.pieces);
            onLoadPreset(transformedPieces);
            toast.success(`Auto-loaded default preset: ${preset.name}`, {
              duration: 2000,
            });
          })
          .catch((error) => {
            console.error("Failed to auto-load default preset:", error);
            toast.error("Failed to load default preset");
            hasAutoLoaded.current = false; // Reset on error so user can try again
          });
      }
    }, [
      defaultPreset,
      autoLoadDefault,
      isBoardEmpty,
      loadPreset,
      onLoadPreset,
      transformPiecesForDisplay,
    ]);

    // Reset auto-load flag when board becomes empty again
    useEffect(() => {
      if (isBoardEmpty && hasAutoLoaded.current) {
        // Only reset if the board was previously loaded and is now empty
        hasAutoLoaded.current = false;
      }
    }, [isBoardEmpty]);

    // Convert current setup to pieces array - memoized for performance
    const getCurrentPieces = useMemo(() => {
      const pieces: { piece: string; row: number; col: number }[] = [];
      for (let row = 0; row < currentSetup.length; row++) {
        for (let col = 0; col < currentSetup[row].length; col++) {
          const piece = currentSetup[row][col];
          if (piece) {
            pieces.push({ piece, row, col });
          }
        }
      }
      // Transform back to logical coordinates when saving (currentSetup is in display coordinates)
      return transformPiecesFromDisplay(pieces);
    }, [currentSetup, transformPiecesFromDisplay]);

    const handleSavePreset = useCallback(async () => {
      if (!newPresetName.trim()) {
        toast.error("Enter a name for this preset");
        return;
      }

      setIsSaving(true);
      try {
        const pieces = getCurrentPieces;
        await savePreset({
          name: newPresetName.trim(),
          pieces: pieces,
        });
        setNewPresetName("");
        setShowSaveDialog(false);
        toast.success("Preset saved");
      } catch (error) {
        console.error("Failed to save preset:", error);
        toast.error("Could not save the preset. Try again.");
      } finally {
        setIsSaving(false);
      }
    }, [newPresetName, getCurrentPieces, savePreset]);

    const handleLoadPreset = useCallback(
      async (presetId: string, isDefault: boolean = false) => {
        try {
          if (isDefault) {
            // Load default preset
            const defaultPreset = defaultPresets?.find(
              (p) => p._id === presetId,
            );
            if (defaultPreset) {
              const transformedPieces = transformPiecesForDisplay(
                defaultPreset.pieces,
              );
              onLoadPreset(transformedPieces);
              toast.success(`Loaded preset: ${defaultPreset.name}`);
            } else {
              toast.error("Default preset not found");
            }
          } else {
            // Load custom preset from database
            const preset = await loadPreset({
              presetId: presetId as Id<"setupPresets">,
            });
            const transformedPieces = transformPiecesForDisplay(preset.pieces);
            onLoadPreset(transformedPieces);
            toast.success(`Loaded preset: ${preset.name}`);
          }
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load preset",
          );
        }
      },
      [loadPreset, onLoadPreset, defaultPresets, transformPiecesForDisplay],
    );

    const handleDeletePreset = useCallback(
      async (presetId: Id<"setupPresets">, presetName: string) => {
        try {
          await deletePreset({ presetId });
          toast.success(`Deleted preset: ${presetName}`);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to delete preset",
          );
        }
      },
      [deletePreset],
    );

    const handleToggleDefault = useCallback(
      async (presetId: Id<"setupPresets">, isCurrentlyDefault: boolean) => {
        try {
          if (isCurrentlyDefault) {
            await setDefaultPreset({ presetId: undefined });
            toast.success("Default preset cleared");
          } else {
            await setDefaultPreset({ presetId });
            toast.success("Default preset set");
          }
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to update default preset",
          );
        }
      },
      [setDefaultPreset],
    );

    const handleApplyDefault = useCallback(async () => {
      if (defaultPreset) {
        try {
          const preset = await loadPreset({ presetId: defaultPreset._id });
          const transformedPieces = transformPiecesForDisplay(preset.pieces);
          onLoadPreset(transformedPieces);
          toast.success(`Applied default preset: ${preset.name}`);
        } catch {
          toast.error("Failed to apply default preset");
        }
      } else {
        toast.info("No default preset set");
      }
    }, [defaultPreset, loadPreset, onLoadPreset, transformPiecesForDisplay]);

    const handleEditPreset = useCallback(
      async (presetId: Id<"setupPresets">, newName: string) => {
        if (!newName.trim()) {
          toast.error("Please enter a valid name");
          return;
        }

        try {
          await updatePreset({
            presetId,
            name: newName.trim(),
          });

          setEditingPresetId(null);
          setEditingName("");
          toast.success("Preset renamed.");
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to rename preset",
          );
        }
      },
      [updatePreset],
    );

    const startEditing = useCallback(
      (presetId: Id<"setupPresets">, currentName: string) => {
        setEditingPresetId(presetId);
        setEditingName(currentName);
      },
      [],
    );

    const cancelEditing = useCallback(() => {
      setEditingPresetId(null);
      setEditingName("");
    }, []);

    // Memoized preset data to avoid recalculation on every render
    const customPresets = useMemo(() => presets || [], [presets]);
    const builtInPresets = useMemo(
      () => defaultPresets || [],
      [defaultPresets],
    );

    // Run a preset action and show a spinner on that row while it works.
    const runBusy = async (id: string, fn: () => Promise<void>) => {
      setBusyId(id);
      try {
        await fn();
      } finally {
        setBusyId(null);
      }
    };

    const titleBlock = (
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-foreground">
          Setup presets
        </h3>
        {presetLimit ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-foreground/75">
            <span className="tabular-nums">
              {presetLimit.limit === Infinity
                ? "Unlimited saves"
                : `${presetLimit.current}/${presetLimit.limit} saved`}
            </span>
            {presetLimit.tier !== "free" &&
              presetLimit.status === "grace_period" && (
                <Badge>Grace period</Badge>
              )}
            {presetLimit.tier !== "free" &&
              presetLimit.status === "expired" && (
                <Badge variant="destructive">Expired</Badge>
              )}
          </p>
        ) : null}
      </div>
    );

    if (presets === undefined) {
      return (
        <div
          className={cn(
            "rounded-lg border border-border bg-card p-4",
            className,
          )}
        >
          {titleBlock}
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      );
    }

    const hasAny = builtInPresets.length > 0 || customPresets.length > 0;

    const rowShell =
      "flex items-center justify-between gap-2 border-b border-border py-1.5 last:border-b-0";

    return (
      <div className={cn("rounded-lg border border-border bg-card", className)}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            {titleBlock}
            {defaultPreset && onApplyDefault && (
              <Button
                onClick={() => void handleApplyDefault()}
                variant="secondary"
                size="sm"
              >
                <Star />
                Use default
              </Button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <Save />
                  Save this setup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save this setup</DialogTitle>
                  <DialogDescription>
                    Name it so you can load it in a later game.
                  </DialogDescription>
                </DialogHeader>
                {presetLimit &&
                  !presetLimit.canCreate &&
                  presetLimit.reason === "limit_reached" && (
                    <div className="rounded-lg border border-gold-500/30 bg-gold-500/10 p-3 text-sm text-foreground">
                      <p className="font-medium">Preset limit reached</p>
                      <p className="mt-1 text-foreground/80">
                        You have {presetLimit.limit} saved on the{" "}
                        {presetLimit.tier === "free"
                          ? "Free"
                          : presetLimit.tier === "pro"
                            ? "Pro"
                            : "Pro+"}{" "}
                        plan. Delete one to save another.
                        {presetLimit.tier === "free" && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() =>
                              navigate({
                                to: "/pricing",
                                search: { donation: undefined },
                              })
                            }
                            className="ml-1 h-auto p-0 text-[length:inherit]"
                          >
                            Upgrade for unlimited presets.
                          </Button>
                        )}
                      </p>
                    </div>
                  )}
                {presetLimit &&
                  !presetLimit.canCreate &&
                  presetLimit.reason === "subscription_expired" && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-foreground">
                      <p className="font-medium">Subscription expired</p>
                      <p className="mt-1 text-foreground/80">
                        Renew to save more presets.
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() =>
                            navigate({
                              to: "/subscription",
                              search: { subscription: undefined },
                            })
                          }
                          className="ml-1 h-auto p-0 text-[length:inherit]"
                        >
                          Renew
                        </Button>
                      </p>
                    </div>
                  )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSavePreset();
                  }}
                  className="grid gap-4"
                >
                  <Input
                    placeholder="Preset name"
                    aria-label="Preset name"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    maxLength={30}
                    disabled={isSaving}
                    autoFocus
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSaveDialog(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Saving
                        </>
                      ) : (
                        "Save preset"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls="setup-presets-list"
            >
              {isExpanded ? "Hide presets" : "Show presets"}
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              id="setup-presets-list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-5 border-t border-border p-4">
                {builtInPresets.length > 0 && (
                  <section>
                    <h4 className="text-sm font-semibold text-foreground">
                      Popular setups
                    </h4>
                    <motion.ul
                      variants={stagger(0.04)}
                      initial="hidden"
                      animate="show"
                      className="mt-1"
                    >
                      {builtInPresets.map((preset: DefaultPresetData) => (
                        <motion.li
                          key={preset._id}
                          variants={fadeUp}
                          className={rowShell}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm text-foreground">
                              {preset.name}
                            </span>
                            {preset.upvotes && preset.upvotes > 0 ? (
                              <span className="shrink-0 text-xs tabular-nums text-foreground/70">
                                {preset.upvotes}{" "}
                                {preset.upvotes === 1 ? "upvote" : "upvotes"}
                              </span>
                            ) : null}
                          </div>
                          <Button
                            onClick={() =>
                              void runBusy(preset._id, () =>
                                handleLoadPreset(preset._id, true),
                              )
                            }
                            variant="secondary"
                            size="sm"
                            disabled={busyId !== null}
                            aria-label={`Use ${preset.name}`}
                          >
                            {busyId === preset._id && (
                              <Loader2 className="animate-spin" />
                            )}
                            Use
                          </Button>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </section>
                )}

                {customPresets.length > 0 && (
                  <section>
                    <h4 className="text-sm font-semibold text-foreground">
                      My presets
                    </h4>
                    <motion.ul
                      variants={stagger(0.04)}
                      initial="hidden"
                      animate="show"
                      className="mt-1"
                    >
                      {customPresets.map((preset: PresetData) => (
                        <motion.li
                          key={preset._id}
                          variants={fadeUp}
                          className={rowShell}
                        >
                          {editingPresetId === preset._id ? (
                            <form
                              className="flex min-w-0 flex-1 items-center gap-1"
                              onSubmit={(e) => {
                                e.preventDefault();
                                void runBusy(preset._id, () =>
                                  handleEditPreset(preset._id, editingName),
                                );
                              }}
                            >
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                aria-label="Preset name"
                                autoFocus
                                maxLength={30}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                className="min-w-0 flex-1"
                              />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                aria-label="Save name"
                                disabled={busyId !== null}
                              >
                                {busyId === preset._id ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <Check className="text-emerald-400" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                onClick={cancelEditing}
                                variant="ghost"
                                size="icon"
                                aria-label="Cancel rename"
                              >
                                <X />
                              </Button>
                            </form>
                          ) : (
                            <>
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-sm text-foreground">
                                  {preset.name}
                                </span>
                                {preset.isDefault && <Badge>Default</Badge>}
                              </div>
                              <div className="flex shrink-0 items-center">
                                <Button
                                  onClick={() =>
                                    void runBusy(preset._id, () =>
                                      handleLoadPreset(preset._id, false),
                                    )
                                  }
                                  variant="secondary"
                                  size="sm"
                                  disabled={busyId !== null}
                                  aria-label={`Use ${preset.name}`}
                                  className="mr-1"
                                >
                                  {busyId === preset._id && (
                                    <Loader2 className="animate-spin" />
                                  )}
                                  Use
                                </Button>
                                <Button
                                  onClick={() =>
                                    void runBusy(preset._id, () =>
                                      handleToggleDefault(
                                        preset._id,
                                        preset.isDefault,
                                      ),
                                    )
                                  }
                                  variant="ghost"
                                  size="icon"
                                  disabled={busyId !== null}
                                  aria-label={
                                    preset.isDefault
                                      ? "Clear default"
                                      : "Make default"
                                  }
                                  title={
                                    preset.isDefault
                                      ? "Clear default"
                                      : "Make default"
                                  }
                                >
                                  <Star
                                    className={
                                      preset.isDefault
                                        ? "fill-gold-400 text-gold-400"
                                        : ""
                                    }
                                  />
                                </Button>
                                <Button
                                  onClick={() =>
                                    startEditing(preset._id, preset.name)
                                  }
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Rename"
                                  title="Rename"
                                >
                                  <Pencil />
                                </Button>
                                <Button
                                  onClick={() =>
                                    setPendingDelete({
                                      id: preset._id,
                                      name: preset.name,
                                    })
                                  }
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Delete"
                                  title="Delete"
                                >
                                  <Trash2 className="text-red-400" />
                                </Button>
                              </div>
                            </>
                          )}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </section>
                )}

                {!hasAny && (
                  <div className="py-2 text-center">
                    <p className="text-sm font-medium text-foreground">
                      No presets yet
                    </p>
                    <p className="mt-1 text-sm text-foreground/75">
                      Place your pieces, then save the setup to reuse it.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AlertDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => {
            if (!open) setPendingDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this preset?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDelete
                  ? `"${pendingDelete.name}" will be removed. This can't be undone.`
                  : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                className="border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                onClick={() => {
                  if (pendingDelete) {
                    void handleDeletePreset(
                      pendingDelete.id,
                      pendingDelete.name,
                    );
                  }
                }}
              >
                Delete preset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  },
);
