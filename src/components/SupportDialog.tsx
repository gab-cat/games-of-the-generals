import { useState, useRef, useEffect } from "react";
import { Send, X, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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
  /** Prefill for dialogs opened from a specific place, like the lobby's tournament invite. */
  initialCategory?: string;
  initialSubject?: string;
  detailsPlaceholder?: string;
  description?: string;
  /** Called after the ticket is created. */
  onSent?: () => void;
}

const categoryOptions = [
  {
    value: "bug_report",
    label: "Bug report",
    description: "Something is broken",
  },
  {
    value: "feature_request",
    label: "Feature request",
    description: "An idea for the game",
  },
  {
    value: "account_issue",
    label: "Account",
    description: "Sign in or profile problems",
  },
  {
    value: "game_issue",
    label: "Gameplay",
    description: "A match or a rules question",
  },
  { value: "other", label: "Other", description: "Anything else" },
];

export function SupportDialog({
  isOpen,
  onClose,
  initialCategory,
  initialSubject,
  detailsPlaceholder,
  description: intro,
  onSent,
}: SupportDialogProps) {
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply the prefill each time the dialog opens; closing clears the form.
  useEffect(() => {
    if (!isOpen) return;
    if (initialCategory) setCategory(initialCategory);
    if (initialSubject) setSubject(initialSubject);
  }, [isOpen, initialCategory, initialSubject]);

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
      const { validateImageFile, compressImage } = await import(
        "@/lib/image-utils"
      );

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // Keep the whole screenshot, longest side at most 800px.
      const compressedBlob = await compressImage(file, 800, 0.8, "fit");
      const compressedFile = new File([compressedBlob], file.name, {
        type: compressedBlob.type,
      });

      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedBlob);
      setAttachmentPreview(previewUrl);
      setAttachmentFile(compressedFile);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Could not read that image. Try another one.");
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
      toast.error("Choose a topic and fill in the subject and details.");
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

      toast.success("Ticket sent. We will reply in the ticket.");
      onSent?.();
      handleClose();
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      toast.error("Could not send your ticket. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !isSubmitting && !!category && !!subject.trim() && !!description.trim();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && handleClose()}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>
            {intro ?? "Tell us what happened. We reply in the ticket."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="category">Topic</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={isSubmitting}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Choose a topic" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    <span className="ml-2 text-foreground/70">
                      {option.description}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="A short summary"
              maxLength={200}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Details</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                detailsPlaceholder ?? "What happened, and what did you expect?"
              }
              className="min-h-[140px] resize-none"
              maxLength={2000}
              disabled={isSubmitting}
            />
            <p className="text-right text-xs tabular-nums text-muted-foreground">
              {description.length} / 2000
            </p>
          </div>

          <div className="space-y-2">
            <Label>Screenshot (optional, image up to 5 MB)</Label>
            <AnimatePresence mode="wait" initial={false}>
              {attachmentPreview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 rounded-lg border border-border bg-white/[0.03] p-2"
                >
                  <img
                    src={attachmentPreview}
                    alt="Selected screenshot"
                    className="h-16 w-16 rounded-md border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {attachmentFile?.name}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {((attachmentFile?.size || 0) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={removeAttachment}
                    variant="ghost"
                    size="icon"
                    aria-label="Remove screenshot"
                    disabled={isSubmitting}
                  >
                    <X />
                  </Button>
                </motion.div>
              ) : (
                <motion.button
                  key="drop"
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex min-h-[72px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-4 text-sm text-foreground transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:opacity-50"
                >
                  <Paperclip className="size-4" />
                  Choose an image or drop one here
                </motion.button>
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

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
              {isSubmitting ? "Sending" : "Send ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
