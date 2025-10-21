import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface Announcement {
  _id: Id<"announcements">;
  title: string;
  content: string;
  isPinned: boolean;
  createdBy: Id<"users">;
  createdByUsername: string;
  createdAt: number;
  updatedAt: number;
}

interface CreateAnnouncementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editAnnouncement?: Announcement;
}

export function CreateAnnouncementDialog({
  isOpen,
  onClose,
  editAnnouncement
}: CreateAnnouncementDialogProps) {
  const [title, setTitle] = useState(editAnnouncement?.title || "");
  const [content, setContent] = useState(editAnnouncement?.content || "");
  const [isPinned, setIsPinned] = useState(editAnnouncement?.isPinned || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createAnnouncement = useMutation(api.announcements.createAnnouncement);
  const updateAnnouncement = useMutation(api.announcements.updateAnnouncement);

  const isEditing = !!editAnnouncement;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && editAnnouncement) {
        await updateAnnouncement({
          id: editAnnouncement._id,
          title: title.trim(),
          content: content.trim(),
          isPinned,
        });
        toast.success("Announcement updated successfully!");
      } else {
        await createAnnouncement({
          title: title.trim(),
          content: content.trim(),
          isPinned,
        });
        toast.success("Announcement created successfully!");
      }

      // Reset form and close dialog
      setTitle("");
      setContent("");
      setIsPinned(false);
      onClose();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error(isEditing ? "Failed to update announcement" : "Failed to create announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle(editAnnouncement?.title || "");
      setContent(editAnnouncement?.content || "");
      setIsPinned(editAnnouncement?.isPinned || false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Announcement" : "Create Announcement"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isEditing
              ? "Update the announcement details below."
              : "Create a new announcement. Content supports Markdown formatting."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title"
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-white">
              Content *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter announcement content (Markdown supported)"
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 min-h-[200px] font-mono text-sm"
              disabled={isSubmitting}
              required
            />
            <div className="text-xs text-slate-400">
              Supports Markdown: **bold**, *italic*, [links](url), `code`, etc.
            </div>
          </div>

          {/* Pinned Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pinned"
              checked={isPinned}
              onCheckedChange={(checked) => setIsPinned(checked === true)}
              disabled={isSubmitting}
              className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label htmlFor="pinned" className="text-white text-sm">
              Pin this announcement (appears at the top)
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSubmitting
                ? (isEditing ? "Updating..." : "Creating...")
                : (isEditing ? "Update Announcement" : "Create Announcement")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
