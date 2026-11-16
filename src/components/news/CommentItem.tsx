import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { UserAvatar } from "../UserAvatar";
import { UserNameWithBadge } from "../UserNameWithBadge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";
import { Edit2, Trash2, Check, MoreHorizontal, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Id } from "../../../convex/_generated/dataModel";

interface CommentAuthor {
  username: string;
  avatarUrl?: string;
  rank: string;
  tier: "free" | "pro" | "pro_plus";
  usernameColor?: string;
  avatarFrame?: string;
  showBadges: boolean;
  isDonor: boolean;
}

interface CommentProps {
  comment: {
    _id: Id<"comments">;
    content: string;
    createdAt: number;
    userId: Id<"users">;
    author: CommentAuthor | null;
  };
  currentUserId?: Id<"users">;
}

export function CommentItem({ comment, currentUserId }: CommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user is admin
  const isAdmin = useQuery(api.globalChat.isUserAdmin, {});

  const updateComment = useMutation(api.comments.update);
  const removeComment = useMutation(api.comments.remove);

  const canEdit = currentUserId === comment.userId;
  const canDelete = currentUserId === comment.userId || isAdmin;

  const handleUpdate = async () => {
    if (!content.trim() || content === comment.content) {
      setIsEditing(false);
      setContent(comment.content);
      return;
    }

    setIsUpdating(true);
    try {
      await updateComment({ commentId: comment._id, content });
      toast.success("Comment updated");
      setIsEditing(false);
    } catch {
      toast.error("Could not save your change. Try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeComment({ commentId: comment._id });
      toast.success("Comment deleted");
    } catch {
      toast.error("Could not delete the comment. Try again.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (!comment.author) {
    return (
      <div className="flex gap-3 py-4" aria-hidden="true">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-4 first:pt-1 last:pb-1">
      <div className="shrink-0 pt-0.5">
        <UserAvatar
          username={comment.author.username}
          avatarUrl={comment.author.avatarUrl}
          rank={comment.author.rank}
          size="sm"
          frame={comment.author.avatarFrame}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2">
            <UserNameWithBadge
              username={comment.author.username}
              tier={comment.author.tier}
              isDonor={comment.author.isDonor}
              usernameColor={comment.author.usernameColor}
              showBadges={comment.author.showBadges}
              size="sm"
            />
            <time
              dateTime={new Date(comment.createdAt).toISOString()}
              title={format(comment.createdAt, "MMMM d, yyyy 'at' h:mm a")}
              className="text-xs text-muted-foreground"
            >
              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
            </time>
          </div>

          {(canEdit || canDelete) && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Comment actions"
                  className="-mr-2 -my-2"
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-red-300 focus:text-red-200"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isUpdating}
              aria-label="Edit comment"
              className="min-h-[88px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setContent(comment.content);
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={isUpdating || !content.trim()}
              >
                {isUpdating ? <Loader2 className="animate-spin" /> : <Check />}
                {isUpdating ? "Saving" : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
            {comment.content}
          </p>
        )}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : null}
              {isDeleting ? "Deleting" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
