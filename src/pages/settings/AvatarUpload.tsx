import { useState, useRef } from "react";

import { compressImage, validateImageFile } from "@/lib/image-utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { useConvexMutationWithQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";

interface AvatarUploadProps {
  username: string;
  currentAvatarUrl?: string;
  rank?: string;
  onAvatarUpdate?: (avatarUrl: string) => void;
}

export function AvatarUpload({ 
  username, 
  currentAvatarUrl, 
  rank,
  onAvatarUpdate 
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const generateUploadUrlMutation = useConvexMutationWithQuery(api.fileUpload.generateUploadUrl);
  const processAvatarUploadMutation = useConvexMutationWithQuery(api.fileUpload.processAvatarUpload);
  
  const updateAvatarMutation = useConvexMutationWithQuery(api.profiles.updateAvatar, {
    onSuccess: () => {
      toast.success("Avatar updated successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update avatar");
    }
  });

  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsUploading(true);
      
      // Compress image to 250x250 using Jimp
      const compressedBlob = await compressImage(file, 250);
      
      // Create preview URL
      const previewObjectUrl = URL.createObjectURL(compressedBlob);
      setPreviewUrl(previewObjectUrl);
      
      // Get upload URL from Convex
      const uploadUrl = await new Promise<string>((resolve, reject) => {
        generateUploadUrlMutation.mutate({}, {
          onSuccess: resolve,
          onError: reject
        });
      });
      
      // Upload compressed image to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": compressedBlob.type },
        body: compressedBlob,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }
      
      const { storageId } = await uploadResponse.json();
      
      // Process the upload to get the file URL
      const result = await new Promise<{ storageId: string; fileUrl: string | null }>((resolve, reject) => {
        processAvatarUploadMutation.mutate({ storageId }, {
          onSuccess: resolve,
          onError: reject
        });
      });
      
      if (!result.fileUrl) {
        throw new Error("Failed to get file URL");
      }
      
      // Update avatar in database with the file URL and storage ID
      updateAvatarMutation.mutate({ 
        avatarUrl: result.fileUrl,
        avatarStorageId: storageId
      });
      
      onAvatarUpdate?.(result.fileUrl);
      
      // Clean up preview URL
      URL.revokeObjectURL(previewObjectUrl);
      
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFileSelect(file);
    }
    // Reset input
    event.target.value = '';
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFileSelect(file);
    }
  };

  const displayAvatarUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="space-y-4">
      {/* Avatar Display */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <UserAvatar 
            username={username}
            avatarUrl={displayAvatarUrl || undefined}
            rank={rank}
            size="xl"
            className="ring-2 ring-white/20 shadow-lg"
          />
          
          {/* Upload overlay button */}
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Upload Actions */}
      <div className="space-y-3">
        {/* Drag and Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-white/40 transition-colors"
        >
          <Upload className="w-6 h-6 text-white/60 mx-auto mb-2" />
          <p className="text-sm text-white/70">
            Drag & drop an image here, or{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-400 hover:text-blue-300 underline"
              disabled={isUploading}
            >
              browse
            </button>
          </p>
          <p className="text-xs text-white/50 mt-1">
            JPEG, PNG, WebP • Max 5MB • Will be resized to 250×250 and converted to WebP
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1"
            variant="gradient"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? "Uploading..." : "Choose Image"}
          </Button>

          {(displayAvatarUrl) && (
            <Button
              onClick={() => void handleRemoveAvatar()}
              disabled={isUploading}
              variant="outline"
              className="bg-red-600/10 border-red-500/30 text-red-400 hover:bg-red-600/20"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

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
