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
import { Loader2 } from "lucide-react";
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
  announcement,
}: DeleteAnnouncementDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAnnouncement = useMutation(api.announcements.deleteAnnouncement);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteAnnouncement({ id: announcement._id });
      toast.success("Post deleted");
      onClose();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Could not delete the post. Try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isDeleting && onClose()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this post?</DialogTitle>
          <DialogDescription>
            This removes the post and its comments for everyone. It cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-white/[0.03] p-4">
          <p className="font-medium text-foreground">{announcement.title}</p>
          <p className="mt-1 line-clamp-3 text-sm text-foreground/80">
            {announcement.content}
          </p>
          {announcement.isPinned && (
            <p className="mt-2 text-xs text-foreground/80">Pinned post</p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="animate-spin" /> : null}
            {isDeleting ? "Deleting" : "Delete post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
