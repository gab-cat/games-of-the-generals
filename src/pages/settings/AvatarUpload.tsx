import { useState, useRef } from "react";

import { toast } from "sonner";
import { motion } from "framer-motion";
import { Camera, Upload, X, Loader2, Lock, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import {
  useConvexMutationWithQuery,
  useConvexQuery,
} from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Default tactical avatars available to all users
const DEFAULT_AVATARS = [
  { id: "avatar-1", src: "/defaults/avatar-1.webp", name: "Tactical Eye" },
  { id: "avatar-2", src: "/defaults/avatar-2.webp", name: "Shield Node" },
  { id: "avatar-3", src: "/defaults/avatar-3.webp", name: "Signal Pulse" },
  { id: "avatar-4", src: "/defaults/avatar-4.webp", name: "Radar Sweep" },
  { id: "avatar-5", src: "/defaults/avatar-5.webp", name: "Circuit Core" },
  { id: "avatar-6", src: "/defaults/avatar-6.webp", name: "Commander" },
  { id: "avatar-7", src: "/defaults/avatar-7.webp", name: "Soldier" },
  { id: "avatar-8", src: "/defaults/avatar-8.webp", name: "Soldier (F)" },
  { id: "avatar-9", src: "/defaults/avatar-9.webp", name: "Sniper" },
  { id: "avatar-10", src: "/defaults/avatar-10.webp", name: "Infiltrator" },
];

interface AvatarUploadProps {
  username: string;
  currentAvatarUrl?: string;
  rank?: string;
  onAvatarUpdate?: (avatarUrl: string) => void;
  tier?: "free" | "pro" | "pro_plus";
  isDonor?: boolean;
}

export function AvatarUpload({
  username,
  currentAvatarUrl,
  rank,
  onAvatarUpdate,
  tier = "free",
  isDonor = false,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if custom upload is allowed
  const canUploadCustom = tier === "pro" || tier === "pro_plus" || isDonor;

  const { data: customization } = useConvexQuery(
    api.customizations.getCurrentUserCustomization,
  );

  const generateUploadUrlMutation = useConvexMutationWithQuery(
    api.fileUpload.generateAvatarUploadUrl,
  );
  const processAvatarUploadMutation = useConvexMutationWithQuery(
    api.fileUpload.processAvatarUpload,
  );
  const deleteFileMutation = useConvexMutationWithQuery(api.fileUpload.deleteFile);

  const updateAvatarMutation = useConvexMutationWithQuery(
    api.profiles.updateAvatar,
    {
      onSuccess: () => {
        toast.success("Avatar updated successfully!");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to update avatar",
        );
      },
    },
  );

  const handleFileSelect = async (file: File) => {
    if (!canUploadCustom) {
      toast.error("Custom avatar uploads are for Pro and Donor members only.");
      return;
    }

    let uploadedStorageId: string | null = null;

    try {
      setIsUploading(true);

      // Dynamically import image utilities to load jimp only when needed
      const { validateImageFile, compressImage } = await import(
        "@/lib/image-utils"
      );

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        setIsUploading(false);
        return;
      }

      // Compress image to 250x250 using Jimp
      const compressedBlob = await compressImage(file, 250);

      // Create preview URL
      const previewObjectUrl = URL.createObjectURL(compressedBlob);
      setPreviewUrl(previewObjectUrl);

      // Get upload URL from Convex (Gated specifically for avatars)
      const uploadUrl = await new Promise<string>((resolve, reject) => {
        generateUploadUrlMutation.mutate(
          {},
          {
            onSuccess: resolve,
            onError: reject,
          },
        );
      });

      // Upload compressed image to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": compressedBlob.type },
        body: compressedBlob,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText || "Unknown error"}`);
      }

      const { storageId } = await uploadResponse.json();
      uploadedStorageId = storageId;

      // Process the upload to get the file URL
      const result = await new Promise<{
        storageId: string;
        fileUrl: string | null;
      }>((resolve, reject) => {
        processAvatarUploadMutation.mutate(
          { storageId },
          {
            onSuccess: resolve,
            onError: reject,
          },
        );
      });

      if (!result.fileUrl) {
        throw new Error("Failed to resolve file URL after upload");
      }

      // Update avatar in database with the file URL and storage ID
      await new Promise<void>((resolve, reject) => {
        updateAvatarMutation.mutate(
          {
            avatarUrl: result.fileUrl!,
            avatarStorageId: storageId,
          },
          {
            onSuccess: () => resolve(),
            onError: reject,
          },
        );
      });

      onAvatarUpdate?.(result.fileUrl);

      // Clean up preview URL
      URL.revokeObjectURL(previewObjectUrl);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      
      // Cleanup attempt: if storage was successful but update failed, delete the orphaned file
      if (uploadedStorageId) {
        void deleteFileMutation.mutate({ storageId: uploadedStorageId as any });
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar",
      );
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFileSelect(file);
    }
    // Reset input
    event.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true);
      updateAvatarMutation.mutate({ avatarUrl: "" });
      setPreviewUrl(null);
      onAvatarUpdate?.("");
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error("Failed to remove avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectDefaultAvatar = (src: string) => {
    setPendingAvatar(src);
    setShowConfirmDialog(true);
  };

  const confirmAvatarChange = () => {
    if (pendingAvatar) {
      setPreviewUrl(pendingAvatar);
      updateAvatarMutation.mutate({ avatarUrl: pendingAvatar });
      onAvatarUpdate?.(pendingAvatar);
    }
    setShowConfirmDialog(false);
    setPendingAvatar(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canUploadCustom) {
      toast.error("Custom avatar uploads are for Pro and Donor members only.");
      return;
    }
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFileSelect(file);
    }
  };

  const displayAvatarUrl = previewUrl || currentAvatarUrl;

  // Determine if the current avatar is a default one
  const isCurrentAvatarDefault = DEFAULT_AVATARS.some(
    (a) => a.src === displayAvatarUrl,
  );

  return (
    <>
      <div className="space-y-8">
        {/* Avatar Display & Current Identification */}
        <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-sm border border-white/5 relative group overflow-hidden">
          {/* Decorative scanner effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent top-scanner" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]" />

          <div className="relative z-10">
            <UserAvatar
              username={username}
              avatarUrl={displayAvatarUrl || undefined}
              rank={rank}
              size="xl"
              frame={customization?.avatarFrame}
              className={cn(
                "shadow-[0_0_40px_rgba(0,0,0,0.8)]",
                (!customization?.avatarFrame ||
                  customization.avatarFrame === "none") &&
                  "ring-4 ring-black",
              )}
            />

            {/* Upload overlay button - only for premium users */}
            {canUploadCustom && (
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center bg-cyan-950/60 rounded-full opacity-0 hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] border border-cyan-500/30 group/btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                ) : (
                  <div className="text-center group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-cyan-400 mx-auto mb-1" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-tighter text-cyan-400">
                      Update Meta
                    </span>
                  </div>
                )}
              </motion.button>
            )}
          </div>

          <div className="mt-4 text-center z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                Signal Locked: {username}
              </span>
            </div>
          </div>
        </div>

        {/* Default Avatar Selector */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px bg-white/10 flex-1" />
            <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.3em]">
              Genetic Templates
            </h3>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <div className="grid grid-cols-5 gap-4">
            {DEFAULT_AVATARS.map((avatar) => (
              <motion.button
                key={avatar.id}
                onClick={() => handleSelectDefaultAvatar(avatar.src)}
                disabled={isUploading}
                className={cn(
                  "relative aspect-square rounded-sm overflow-hidden border transition-all duration-300 bg-zinc-900 group/avatar",
                  displayAvatarUrl === avatar.src
                    ? "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/50"
                    : "border-white/5 grayscale hover:grayscale-0 hover:border-white/20",
                )}
                whileHover={{ scale: 1.08, zIndex: 10 }}
                whileTap={{ scale: 0.95 }}
                title={avatar.name}
              >
                <img
                  src={avatar.src}
                  alt={avatar.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                />

                {/* Tactical HUD overlays */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20" />

                {displayAvatarUrl === avatar.src && (
                  <div className="absolute inset-0 bg-cyan-500/10 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-cyan-500 p-1 rounded-sm shadow-lg">
                      <Check className="w-3 h-3 text-black stroke-[3px]" />
                    </div>
                  </div>
                )}

                <div className="absolute bottom-0 inset-x-0 bg-black/80 py-0.5 px-1 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <span className="text-[7px] font-mono text-cyan-400 uppercase tracking-tight block truncate">
                    {avatar.name}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Upload Actions - Conditional based on tier */}
        <div className="space-y-6 pt-6">
          {canUploadCustom ? (
            <div className="space-y-4">
              {/* Drag and Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="group relative border border-dashed border-white/10 rounded-sm p-6 text-center hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300"
              >
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 group-hover:border-cyan-500/50 transition-colors" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20 group-hover:border-cyan-500/50 transition-colors" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20 group-hover:border-cyan-500/50 transition-colors" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20 group-hover:border-cyan-500/50 transition-colors" />

                <div className="relative z-10">
                  <Upload className="w-6 h-6 text-zinc-500 group-hover:text-cyan-400 mx-auto mb-3 transition-colors" />
                  <p className="text-xs font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    TRANSMIT CUSTOM BIOSIG:{" "}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-cyan-500 hover:text-cyan-400 font-bold underline underline-offset-4"
                      disabled={isUploading}
                    >
                      BROWSE_SYSTEM
                    </button>
                  </p>
                  <p className="text-[10px] font-mono text-zinc-600 mt-2">
                    [JPEG, PNG, WEBP] • [MAX_5MB] • [AUTO_OPTIMIZED: 250PX]
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 bg-cyan-600/10 hover:bg-cyan-600/20 border-cyan-500/30 text-cyan-400 font-mono text-[10px] uppercase tracking-widest h-10 group"
                  variant="outline"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                  )}
                  {isUploading ? "PROCESS_UPLOAD..." : "Initialize Upload"}
                </Button>

                {displayAvatarUrl && !isCurrentAvatarDefault && (
                  <Button
                    onClick={() => void handleRemoveAvatar()}
                    disabled={isUploading}
                    variant="outline"
                    className="aspect-square w-10 p-0 bg-red-950/20 border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Upgrade CTA for free users - Refined aesthetics */
            <div className="relative group overflow-hidden border border-amber-500/10 rounded-sm p-6 bg-amber-500/[0.02] text-center space-y-4">
              {/* Animated background glow */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-full mb-2">
                  <Lock className="w-5 h-5 text-amber-500" />
                </div>
                <h4 className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-widest">
                  Custom Uplink Locked
                </h4>
              </div>

              <p className="text-[10px] font-mono text-zinc-500 max-w-[240px] mx-auto leading-relaxed">
                Personalized avatar translocation requires{" "}
                <span className="text-amber-500/80">PRO_STATUS</span> or{" "}
                <span className="text-amber-500/80">CONTRIBUTOR</span>{" "}
                authorization.
              </p>

              <Link
                to="/pricing"
                search={{ donation: undefined }}
                className="block"
              >
                <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-bold uppercase tracking-widest h-9 gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.2)]">
                  <Crown className="w-3.5 h-3.5" />
                  Request Clearance
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes top-scanner {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .top-scanner {
            animation: top-scanner 3s linear infinite;
          }
        `,
          }}
        />
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-zinc-950 border border-white/10 text-white rounded-sm md:max-w-md overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50" />
          <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />

          <AlertDialogHeader className="relative z-10 pt-4">
            <AlertDialogTitle className="text-lg font-display uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-cyan-500 block" />
              Confirm Protocol
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 font-mono text-xs leading-relaxed pl-3.5 border-l border-white/10 ml-0.5 mt-2">
              Initiating genetic template reassignment. New biometric signature
              will be broadcast across all sectors.
              <br />
              <br />
              <span className="text-white/60">
                Are you sure you want to proceed with this identity update?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="relative z-10 mt-6 gap-3 sm:gap-2">
            <AlertDialogCancel className="bg-transparent border border-white/10 text-zinc-500 hover:bg-white/5 hover:text-white font-mono uppercase text-xs tracking-wider rounded-none h-10 px-4">
              [ ABORT ]
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold uppercase text-xs tracking-widest rounded-none h-10 px-6 border-t border-white/20 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              onClick={confirmAvatarChange}
            >
              EXECUTE_CHANGE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
