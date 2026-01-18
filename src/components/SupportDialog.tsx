import { useState, useRef } from "react";
import { Send, X, Loader2, Plus, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useConvexMutationWithQuery } from "@/lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";

interface SupportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryOptions = [
  {
    value: "bug_report",
    label: "BUG REPORT",
    description: "System anomaly or error",
    icon: "🐞",
  },
  {
    value: "feature_request",
    label: "FEATURE REQ",
    description: "Proposed enhancement",
    icon: "✨",
  },
  {
    value: "account_issue",
    label: "ACCOUNT",
    description: "Access or profile issues",
    icon: "👤",
  },
  {
    value: "game_issue",
    label: "GAMEPLAY",
    description: "Match or rules dispute",
    icon: "🎮",
  },
  {
    value: "other",
    label: "GENERAL",
    description: "Other inquiries",
    icon: "💬",
  },
];

export function SupportDialog({ isOpen, onClose }: SupportDialogProps) {
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrlMutation = useConvexMutationWithQuery(
    api.fileUpload.generateUploadUrl,
  );
  const processSupportAttachmentMutation = useConvexMutationWithQuery(
    api.supportTickets.processSupportAttachmentUpload,
  );
  const createSupportTicketMutation = useConvexMutationWithQuery(
    api.supportTickets.createSupportTicket,
  );

  const handleClose = () => {
    setCategory("");
    setSubject("");
    setDescription("");
    setAttachmentFile(null);
    setAttachmentPreview(null);
    onClose();
  };

  const handleFileSelect = async (file: File) => {
    try {
      // Dynamically import image utilities to load jimp only when needed
      const { validateImageFile, compressImage } = await import(
        "@/lib/image-utils"
      );

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // Compress image to reasonable size for attachments (max 800px)
      const compressedBlob = await compressImage(file, 800);
      const compressedFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type,
      });

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedBlob);
      setAttachmentPreview(previewUrl);
      setAttachmentFile(compressedFile);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process file. Please try again.");
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

  const removeAttachment = () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !subject.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      let attachmentUrl: string | undefined;
      let attachmentStorageId: string | undefined;

      // Upload attachment if present
      if (attachmentFile) {
        // Get upload URL
        const uploadUrl = await new Promise<string>((resolve, reject) => {
          generateUploadUrlMutation.mutate(
            {},
            {
              onSuccess: resolve,
              onError: reject,
            },
          );
        });

        // Upload file
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": attachmentFile.type },
          body: attachmentFile,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload attachment");
        }

        const { storageId } = await uploadResponse.json();

        // Process the upload to get the file URL
        const result = await new Promise<{
          storageId: string;
          fileUrl: string | null;
        }>((resolve, reject) => {
          processSupportAttachmentMutation.mutate(
            { storageId },
            {
              onSuccess: resolve,
              onError: reject,
            },
          );
        });

        if (!result.fileUrl) {
          throw new Error("Failed to get attachment URL");
        }

        attachmentUrl = result.fileUrl;
        attachmentStorageId = storageId;
      }

      // Create support ticket
      await new Promise<string>((resolve, reject) => {
        createSupportTicketMutation.mutate(
          {
            category: category as any,
            subject: subject.trim(),
            description: description.trim(),
            attachmentUrl,
            attachmentStorageId: attachmentStorageId as any,
          },
          {
            onSuccess: resolve,
            onError: reject,
          },
        );
      });

      toast.success("Ticket initialized successfully. Stand by for response.");
      handleClose();
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit support ticket",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 border border-white/10 text-white shadow-2xl p-0 overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 z-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20 z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/20 z-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 z-20 pointer-events-none" />

        <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.02]">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-sm border border-blue-500/20">
              <Plus className="w-4 h-4 text-blue-400" />
            </div>
            <div className="space-y-0.5">
              <div className="font-display text-lg tracking-wide uppercase text-zinc-100">
                Initialize Support Ticket
              </div>
              <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                Secure Channel • Encrypted
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="category"
              className="text-zinc-400 font-mono text-xs uppercase tracking-wider"
            >
              Classification <span className="text-red-400">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-zinc-900/40 border-zinc-800 text-zinc-300 font-mono text-sm h-11 focus:ring-1 focus:ring-blue-500/50 hover:bg-zinc-900/60 transition-colors">
                <SelectValue placeholder="SELECT CATEGORY..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800">
                {categoryOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="font-mono text-xs uppercase focus:bg-white/5 text-zinc-400 focus:text-zinc-200 cursor-pointer py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="opacity-50">{option.icon}</span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white/80">
                          {option.label}
                        </span>
                        <span className="text-[10px] text-zinc-600 normal-case tracking-normal">
                          {option.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label
              htmlFor="subject"
              className="text-zinc-400 font-mono text-xs uppercase tracking-wider"
            >
              Subject Line <span className="text-red-400">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="BRIEF SUMMARY OF ISSUE..."
              className="bg-zinc-900/40 border-zinc-800 focus:border-blue-500/50 text-white font-mono text-sm h-11 placeholder:text-zinc-700 transition-all uppercase"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-zinc-400 font-mono text-xs uppercase tracking-wider"
            >
              Details <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed situational report..."
                className="bg-zinc-900/40 border-zinc-800 focus:border-blue-500/50 text-white min-h-[140px] resize-none transition-all placeholder:text-zinc-700 font-mono text-sm p-4 leading-relaxed"
                maxLength={2000}
              />
              <div className="absolute bottom-2 right-2 text-[10px] font-mono text-zinc-700">
                {description.length}/2000
              </div>
            </div>
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label className="text-zinc-400 font-mono text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Attachment</span>
              <span className="text-[10px] text-zinc-600">
                OPTIONAL • MAX 5MB
              </span>
            </Label>

            {/* Attachment Preview */}
            <AnimatePresence mode="wait">
              {attachmentPreview ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative group bg-zinc-900/40 border border-zinc-800 rounded-lg p-2 flex items-start gap-4"
                >
                  <img
                    src={attachmentPreview}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded bg-zinc-950 border border-white/5"
                  />
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="text-sm font-mono text-white/80 truncate">
                      {attachmentFile?.name}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {((attachmentFile?.size || 0) / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={removeAttachment}
                    variant="ghost"
                    size="icon"
                    className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border border-dashed border-zinc-800 rounded-lg p-6 text-center hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer group bg-zinc-900/20"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 group-hover:border-blue-500/40 transition-colors">
                    <Paperclip className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <p className="text-xs text-zinc-400 font-mono uppercase tracking-wide">
                    Click to upload or drag image
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-zinc-500 hover:text-white hover:bg-white/5 font-mono text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !category ||
                !subject.trim() ||
                !description.trim()
              }
              className="bg-blue-600/90 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] border-0 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Transmitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
