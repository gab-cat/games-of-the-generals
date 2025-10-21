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
import { Loader2, Trash2, X } from "lucide-react";
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

interface DeleteAnnouncementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement;
}

export function DeleteAnnouncementDialog({
  isOpen,
  onClose,
  announcement
}: DeleteAnnouncementDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAnnouncement = useMutation(api.announcements.deleteAnnouncement);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteAnnouncement({ id: announcement._id });
      toast.success("Announcement deleted successfully!");
      onClose();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-red-400">
            Delete Announcement
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Are you sure you want to delete this announcement? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Announcement Preview */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h4 className="font-medium text-white mb-2">{announcement.title}</h4>
          <p className="text-slate-400 text-sm line-clamp-3">
            {announcement.content.length > 100
              ? `${announcement.content.substring(0, 100)}...`
              : announcement.content
            }
          </p>
          {announcement.isPinned && (
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-xs text-yellow-400">Pinned</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            {isDeleting ? "Deleting..." : "Delete Announcement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
