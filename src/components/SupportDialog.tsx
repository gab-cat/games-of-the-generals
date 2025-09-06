import { useState, useRef } from "react";
import { FileImage, Send, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
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

interface SupportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryOptions = [
    // lady bug icon on bug report
  { value: "bug_report", label: "🐞 Bug Report", description: "Report a problem or error" },
  { value: "feature_request", label: "✨ Feature Request", description: "Suggest a new feature" },
  { value: "account_issue", label: "👤 Account Issue", description: "Problems with your account" },
  { value: "game_issue", label: "🎮 Game Issue", description: "Issues during gameplay" },
  { value: "other", label: "💬 Other", description: "General questions or feedback" },
];

export function SupportDialog({ isOpen, onClose }: SupportDialogProps) {
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrlMutation = useConvexMutationWithQuery(api.fileUpload.generateUploadUrl);
  const processSupportAttachmentMutation = useConvexMutationWithQuery(api.supportTickets.processSupportAttachmentUpload);
  const createSupportTicketMutation = useConvexMutationWithQuery(api.supportTickets.createSupportTicket);

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
      const { validateImageFile, compressImage } = await import("@/lib/image-utils");

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // Compress image to reasonable size for attachments (max 800px)
      const compressedBlob = await compressImage(file, 800);
      const compressedFile = new File([compressedBlob], file.name, { type: compressedBlob.type });
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedBlob);
      setAttachmentPreview(previewUrl);
      setAttachmentFile(compressedFile);
      
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process file. Please try again.");
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
          generateUploadUrlMutation.mutate({}, {
            onSuccess: resolve,
            onError: reject
          });
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
        const result = await new Promise<{ storageId: string; fileUrl: string | null }>((resolve, reject) => {
          processSupportAttachmentMutation.mutate({ storageId }, {
            onSuccess: resolve,
            onError: reject
          });
        });

        if (!result.fileUrl) {
          throw new Error("Failed to get attachment URL");
        }

        attachmentUrl = result.fileUrl;
        attachmentStorageId = storageId;
      }

      // Create support ticket
      await new Promise<string>((resolve, reject) => {
        createSupportTicketMutation.mutate({
          category: category as any,
          subject: subject.trim(),
          description: description.trim(),
          attachmentUrl,
          attachmentStorageId: attachmentStorageId as any,
        }, {
          onSuccess: resolve,
          onError: reject
        });
      });

      toast.success("Support ticket submitted successfully! We'll get back to you soon.");
      handleClose();

    } catch (error) {
      console.error("Error submitting support ticket:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit support ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categoryOptions.find(opt => opt.value === category);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-black/20 backdrop-blur-xl border border-white/10 text-white shadow-2xl shadow-black/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white/90 flex items-center gap-2">
            💬 Contact Support
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-white/80">
              Category <span className="text-red-400">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-white/5 text-left px-8 backdrop-blur-sm border rounded-full border-white/10 hover:bg-white/10 text-white transition-all duration-200">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent className="bg-black/20 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
                {categoryOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white rounded-2xl transition-all cursor-pointer duration-200 hover:bg-white/10 focus:bg-white/10"
                  >
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-white/60">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <p className="text-xs text-white/60">{selectedCategory.description}</p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-white/80">
              Subject <span className="text-red-400">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue..."
              className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white placeholder:text-white/50 transition-all duration-200"
              maxLength={200}
            />
            <div className="text-xs text-white/50 text-right">
              {subject.length}/200
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white/80">
              Description <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about your issue, including steps to reproduce if it's a bug..."
              className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white placeholder:text-white/50 min-h-[120px] resize-none transition-all duration-200"
              maxLength={2000}
            />
            <div className="text-xs text-white/50 text-right">
              {description.length}/2000
            </div>
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label className="text-white/80">
              Attachment (Optional)
            </Label>
            
            {/* Attachment Preview */}
            {attachmentPreview && (
              <div className="relative">
                <img
                  src={attachmentPreview}
                  alt="Attachment preview"
                  className="max-w-full h-32 object-contain bg-black/20 rounded-lg"
                />
                <Button
                  type="button"
                  onClick={removeAttachment}
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Drag and Drop Area */}
            {!attachmentPreview && (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-white/40 transition-all duration-200 cursor-pointer bg-white/5 hover:bg-white/10 backdrop-blur-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="w-8 h-8 text-white/60 mx-auto mb-2" />
                <p className="text-sm text-white/70">
                  Click to upload or drag & drop an image
                </p>
                <p className="text-xs text-white/50 mt-1">
                  JPEG, PNG, WebP • Max 5MB
                </p>
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

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 transition-all duration-200 order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !category || !subject.trim() || !description.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 shadow-lg order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
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
