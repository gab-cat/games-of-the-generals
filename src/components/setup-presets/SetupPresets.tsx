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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Save,
  Download,
  Trash2,
  Star,
  StarOff,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
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
        alert("Please enter a preset name");
        return;
      }

      try {
        const pieces = getCurrentPieces;
        await savePreset({
          name: newPresetName.trim(),
          pieces: pieces,
        });
        setNewPresetName("");
        setShowSaveDialog(false);
      } catch (error) {
        console.error("Failed to save preset:", error);
        alert("Failed to save preset");
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
          toast.success("Preset renamed successfully!");
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

    if (presets === undefined) {
      return (
        <Card
          className={cn(
            "bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20 rounded-sm",
            className,
          )}
        >
          <CardContent className="p-4">
            <div className="text-white/60 text-sm">Loading presets...</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        className={cn(
          "bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20 rounded-sm",
          className,
        )}
      >
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-white/90 text-lg">
                <Bookmark className="h-5 w-5 text-blue-400" />
                Setup Presets
              </CardTitle>
              {presetLimit && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-light text-white/60">
                    {presetLimit.limit === Infinity
                      ? "Unlimited"
                      : `${presetLimit.current}/${presetLimit.limit} custom preset${presetLimit.limit !== 1 ? "s" : ""}`}
                  </span>
                  {presetLimit.tier !== "free" &&
                    presetLimit.status === "grace_period" && (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono rounded-sm px-2">
                        Grace Period
                      </Badge>
                    )}
                  {presetLimit.tier !== "free" &&
                    presetLimit.status === "expired" && (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-mono rounded-sm px-2">
                        Expired
                      </Badge>
                    )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {defaultPreset && onApplyDefault && (
                <Button
                  onClick={() => void handleApplyDefault()}
                  variant="outline"
                  size="sm"
                  className="bg-yellow-500/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30"
                >
                  <Star className="h-4 w-4 mr-1" />
                  Default
                </Button>
              )}
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-emerald-600/80 hover:bg-emerald-500/80 text-white font-mono text-xs rounded-sm border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Current
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border border-white/10 rounded-sm shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Save Setup Preset
                  </DialogTitle>
                  {presetLimit && (
                    <div className="mt-2">
                      {!presetLimit.canCreate &&
                        presetLimit.reason === "limit_reached" && (
                          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 text-amber-300 text-sm">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="font-medium">Limit Reached</span>
                            </div>
                            <p className="text-amber-300/80 text-xs mt-1 font-light">
                              You've reached the limit of {presetLimit.limit}{" "}
                              custom presets for{" "}
                              {presetLimit.tier === "free"
                                ? "Free"
                                : presetLimit.tier === "pro"
                                  ? "Pro"
                                  : "Pro+"}{" "}
                              tier.
                              {presetLimit.tier === "free" && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() =>
                                    navigate({
                                      to: "/pricing",
                                      search: {
                                        donation: undefined,
                                      },
                                    })
                                  }
                                  className="text-amber-300 hover:text-amber-200 p-0 h-auto ml-1 font-light underline"
                                >
                                  Upgrade to Pro for unlimited presets.
                                </Button>
                              )}
                            </p>
                          </div>
                        )}
                      {!presetLimit.canCreate &&
                        presetLimit.reason === "subscription_expired" && (
                          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 text-red-300 text-sm">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="font-medium">
                                Subscription Expired
                              </span>
                            </div>
                            <p className="text-red-300/80 text-xs mt-1 font-light">
                              Your subscription has expired. Please renew to
                              create more custom presets.
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() =>
                                  navigate({
                                    to: "/subscription",
                                    search: {
                                      subscription: undefined,
                                    },
                                  })
                                }
                                className="text-red-300 hover:text-red-200 p-0 h-auto ml-1 font-light underline"
                              >
                                Renew Now
                              </Button>
                            </p>
                          </div>
                        )}
                      {presetLimit.canCreate && (
                        <div className="text-white/60 text-xs font-light">
                          {presetLimit.limit === Infinity
                            ? "Unlimited custom presets"
                            : `You can save ${presetLimit.limit - presetLimit.current} more preset${presetLimit.limit - presetLimit.current !== 1 ? "s" : ""} (${presetLimit.current}/${presetLimit.limit})`}
                        </div>
                      )}
                    </div>
                  )}
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter preset name..."
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="bg-zinc-900/50 border-white/10 text-white placeholder:text-white/30 font-mono text-sm focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50"
                    maxLength={30}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowSaveDialog(false)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => void handleSavePreset()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Save Preset
                    </Button>
                  </div>
                  <div className="text-xs text-white/40 font-mono">
                    You can save up to 5 custom presets. ({customPresets.length}
                    /5)
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="p-4 pt-0 space-y-4">
                {/* Built-in Presets */}
                {builtInPresets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white/80 mb-2 flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      Popular Setups
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {builtInPresets.map((preset: DefaultPresetData) => (
                        <motion.div
                          key={preset._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-2 rounded-sm bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Badge
                              variant="outline"
                              className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-[10px] font-mono rounded-sm px-2"
                            >
                              Popular
                            </Badge>
                            <span
                              className={cn(
                                "text-white/90 text-sm font-medium",
                                preset.isDefault && "text-yellow-500 underline",
                              )}
                            >
                              {preset.name}
                            </span>
                            {preset.upvotes && preset.upvotes > 0 ? (
                              <span className="text-xs text-white/50">
                                ({preset.upvotes} upvotes)
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() =>
                                void handleLoadPreset(preset._id, true)
                              }
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4 text-blue-400" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Presets */}
                {customPresets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white/80 mb-2 flex items-center gap-1">
                      <Plus className="h-4 w-4 text-blue-400" />
                      My Presets
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {customPresets.map((preset: PresetData) => (
                        <motion.div
                          key={preset._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-2 rounded-sm bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {editingPresetId === preset._id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  value={editingName}
                                  onChange={(e) =>
                                    setEditingName(e.target.value)
                                  }
                                  className="bg-white/10 border-white/20 text-white h-8 text-sm"
                                  autoFocus
                                  maxLength={30}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      void handleEditPreset(
                                        preset._id,
                                        editingName,
                                      );
                                    } else if (e.key === "Escape") {
                                      cancelEditing();
                                    }
                                  }}
                                />
                                <Button
                                  onClick={() =>
                                    void handleEditPreset(
                                      preset._id,
                                      editingName,
                                    )
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-4 w-4 text-green-400" />
                                </Button>
                                <Button
                                  onClick={cancelEditing}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4 text-red-400" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span
                                  className={cn(
                                    "text-white/90 text-sm font-medium",
                                    preset.isDefault &&
                                      "text-yellow-500 underline",
                                  )}
                                >
                                  {preset.name}
                                </span>
                                {preset.upvotes && preset.upvotes > 0 ? (
                                  <span className="text-xs text-white/50">
                                    ({preset.upvotes} upvotes)
                                  </span>
                                ) : null}
                              </>
                            )}
                          </div>
                          {editingPresetId !== preset._id && (
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() =>
                                  void handleToggleDefault(
                                    preset._id,
                                    preset.isDefault,
                                  )
                                }
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                {preset.isDefault ? (
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                ) : (
                                  <StarOff className="h-4 w-4 text-white/40" />
                                )}
                              </Button>
                              <Button
                                onClick={() =>
                                  startEditing(preset._id, preset.name)
                                }
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4 text-white/60" />
                              </Button>
                              <Button
                                onClick={() =>
                                  void handleLoadPreset(preset._id, false)
                                }
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4 text-blue-400" />
                              </Button>
                              <Button
                                onClick={() =>
                                  void handleDeletePreset(
                                    preset._id,
                                    preset.name,
                                  )
                                }
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {(!defaultPresets || defaultPresets.length === 0) &&
                  (!presets || presets.length === 0) && (
                    <div className="text-center py-4 text-white/60">
                      <Bookmark className="h-8 w-8 mx-auto mb-2 text-white/40" />
                      <p className="text-sm">No presets found</p>
                      <p className="text-xs">
                        Save your current setup to create your first preset!
                      </p>
                    </div>
                  )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  },
);
