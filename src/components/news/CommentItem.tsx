import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "../UserAvatar";
import { UserNameWithBadge } from "../UserNameWithBadge";
import { Button } from "../ui/button";
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
      toast.error("Failed to update comment");
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
      toast.error("Failed to delete comment");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (!comment.author) {
    return (
      <div className="flex gap-3 py-3 opacity-50">
        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="group flex gap-3 sm:gap-5 py-5 px-2 -mx-2 first:pt-4 last:pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex-shrink-0 pt-1">
        <UserAvatar
          username={comment.author.username}
          avatarUrl={comment.author.avatarUrl}
          rank={comment.author.rank}
          size="sm"
          frame={comment.author.avatarFrame}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center flex-wrap gap-x-2.5">
            <UserNameWithBadge
              username={comment.author.username}
              tier={comment.author.tier}
              isDonor={comment.author.isDonor}
              usernameColor={comment.author.usernameColor}
              showBadges={comment.author.showBadges}
              size="sm"
            />
            <span className="text-white/10 text-xs">•</span>
            <span className="text-[10px] font-mono tracking-wider text-white/30 uppercase">
              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
            </span>
          </div>

          {(canEdit || canDelete) && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/10 hover:text-white/60 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 font-mono bg-zinc-950 border-white/10 backdrop-blur-xl p-1 shadow-2xl"
              >
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => setIsEditing(true)}
                    className="text-xs focus:bg-white/5 cursor-pointer py-2 px-3 rounded-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-2 text-blue-400" />
                    Edit Transmission
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-xs text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer py-2 px-3 rounded-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Purge Intel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="mt-3 space-y-3 px-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-black/40 border-white/10 text-white/90 text-sm min-h-[100px] focus:ring-blue-500/50 rounded-sm border-2 focus:border-blue-500/50 transition-all"
              placeholder="Update your field report..."
            />
            <div className="flex justify-end gap-2.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setContent(comment.content);
                }}
                disabled={isUpdating}
                className="h-8 px-4 text-[10px] uppercase tracking-widest hover:bg-white/5 font-mono"
              >
                Abort
              </Button>
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={isUpdating || !content.trim()}
                className="h-8 px-5 text-[10px] bg-blue-600 hover:bg-blue-700 uppercase tracking-widest font-bold"
              >
                {isUpdating ? (
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 mr-2" />
                )}
                Confirm
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap font-light tracking-wide pl-0.5">
            {comment.content}
          </p>
        )}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-zinc-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : null}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
