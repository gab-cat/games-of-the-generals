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

interface CreateAnnouncementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editAnnouncement?: Announcement;
}

export function CreateAnnouncementDialog({
  isOpen,
  onClose,
  editAnnouncement,
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
      toast.error("Add a title and a body first.");
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
        toast.success("Post updated");
      } else {
        await createAnnouncement({
          title: title.trim(),
          content: content.trim(),
          isPinned,
        });
        toast.success("Post published");
      }

      // Reset form and close dialog
      setTitle("");
      setContent("");
      setIsPinned(false);
      onClose();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error(
        isEditing
          ? "Could not save the post. Try again."
          : "Could not publish the post. Try again.",
      );
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit post" : "New post"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Changes show up for everyone right away."
              : "The post is visible to all players as soon as you publish it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Body</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[220px]"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-foreground/80">
              Markdown works: **bold**, *italic*, [link](url), lists and
              headings.
            </p>
          </div>

          <div className="flex min-h-10 items-center gap-3">
            <Checkbox
              id="pinned"
              checked={isPinned}
              onCheckedChange={(checked) => setIsPinned(checked === true)}
              disabled={isSubmitting}
            />
            <Label htmlFor="pinned" className="cursor-pointer">
              Pin to the top of the news page
            </Label>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {isSubmitting
                ? isEditing
                  ? "Saving"
                  : "Publishing"
                : isEditing
                  ? "Save changes"
                  : "Publish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
