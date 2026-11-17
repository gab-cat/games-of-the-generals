import { useState, useRef } from "react";

import { toast } from "sonner";
import { Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import {
  useConvexMutationWithQuery,
  useConvexQuery,
} from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { plainError } from "./components/SettingsCard";

// Pictures anyone can pick
const DEFAULT_AVATARS = [
  { id: "avatar-1", src: "/defaults/avatar-1.webp", name: "Eye" },
  { id: "avatar-2", src: "/defaults/avatar-2.webp", name: "Shield" },
  { id: "avatar-3", src: "/defaults/avatar-3.webp", name: "Signal" },
  { id: "avatar-4", src: "/defaults/avatar-4.webp", name: "Radar" },
  { id: "avatar-5", src: "/defaults/avatar-5.webp", name: "Circuit" },
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
  const deleteFileMutation = useConvexMutationWithQuery(
    api.fileUpload.deleteFile,
  );

  const updateAvatarMutation = useConvexMutationWithQuery(
    api.profiles.updateAvatar,
    {
      onSuccess: () => {
        toast.success("Picture saved");
      },
      onError: (error) => {
        toast.error(
          plainError(error, "Could not save the picture. Try again."),
        );
      },
    },
  );

  const handleFileSelect = async (file: File) => {
    if (!canUploadCustom) {
      toast.error("Uploading your own picture needs Pro, Pro+ or a donation.");
      return;
    }

    let uploadedStorageId: string | null = null;

    try {
      setIsUploading(true);

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
        throw new Error(
          `Upload failed: ${uploadResponse.status} ${errorText || "Unknown error"}`,
        );
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
        plainError(error, "Could not upload the picture. Try again."),
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

  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    updateAvatarMutation.mutate({ avatarUrl: "" });
    onAvatarUpdate?.("");
  };

  const handleSelectDefaultAvatar = (src: string) => {
    if (src === (previewUrl || currentAvatarUrl)) return;
    setPendingAvatar(src);
    setPreviewUrl(src);
    updateAvatarMutation.mutate(
      { avatarUrl: src },
      {
        onSuccess: () => setPendingAvatar(null),
        onError: () => {
          setPendingAvatar(null);
          setPreviewUrl(null);
        },
      },
    );
    onAvatarUpdate?.(src);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canUploadCustom) {
      toast.error("Uploading your own picture needs Pro, Pro+ or a donation.");
      return;
    }
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFileSelect(file);
    }
  };

  const displayAvatarUrl = previewUrl || currentAvatarUrl;
  const isSaving = isUploading || updateAvatarMutation.isPending;

  // Determine if the current avatar is a default one
  const isCurrentAvatarDefault = DEFAULT_AVATARS.some(
    (a) => a.src === displayAvatarUrl,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar
          username={username}
          avatarUrl={displayAvatarUrl || undefined}
          rank={rank}
          size="xl"
          frame={customization?.avatarFrame}
          className="shrink-0"
        />
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-foreground">
            {username}
          </div>
          <p
            className="mt-1 flex min-h-5 items-center gap-1.5 text-sm text-foreground/80"
            aria-live="polite"
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading
              </>
            ) : updateAvatarMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-3 text-[13px] font-medium text-foreground">
          Choose a picture
        </div>
        <div
          className="grid grid-cols-5 gap-2 sm:gap-3"
          role="group"
          aria-label="Pictures"
        >
          {DEFAULT_AVATARS.map((avatar) => {
            const selected = displayAvatarUrl === avatar.src;
            const pending = pendingAvatar === avatar.src;
            return (
              <button
                type="button"
                key={avatar.id}
                onClick={() => handleSelectDefaultAvatar(avatar.src)}
                disabled={isSaving}
                aria-pressed={selected}
                aria-label={avatar.name}
                title={avatar.name}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md border-2 bg-raised transition-[transform,border-color] duration-150 hover:border-border-strong active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:opacity-60",
                  selected ? "border-gold-500" : "border-transparent",
                )}
              >
                <img
                  src={avatar.src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {(selected || pending) && (
                  <span className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded bg-primary text-primary-foreground">
                    {pending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Check className="size-3" strokeWidth={3} />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {canUploadCustom ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="rounded-md border border-dashed border-border-strong p-4"
        >
          <div className="text-sm font-medium text-foreground">
            Use your own picture
          </div>
          <p className="mt-1 text-xs text-foreground/70">
            JPEG, PNG or WebP, up to 5 MB. Drop a file here or choose one. It is
            resized to 250 px.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
            >
              {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
              {isUploading ? "Uploading" : "Choose image"}
            </Button>
            {displayAvatarUrl && !isCurrentAvatarDefault && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleRemoveAvatar}
                disabled={isSaving}
              >
                Remove picture
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">
              Use your own picture
            </div>
            <p className="mt-0.5 text-xs text-foreground/70">
              Uploading needs Pro, Pro+ or a donation.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link to="/pricing" search={{ donation: undefined }}>
              See plans
            </Link>
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}
