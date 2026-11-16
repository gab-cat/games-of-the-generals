import { useState } from "react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { CommentItem } from "./CommentItem";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Skeleton } from "../ui/skeleton";
import {
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

interface CommentSectionProps {
  announcementId: Id<"announcements">;
  initialCount?: number;
}

export function CommentSection({
  announcementId,
  initialCount = 0,
}: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Get current user profile for permissions and commenting
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile, {});
  const currentUserId = profile?.userId;

  // Fetch comments only once the thread is opened.
  const comments = useQuery(
    api.comments.list,
    isExpanded ? { announcementId } : "skip",
  );

  const createComment = useMutation(api.comments.create);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsPosting(true);
    try {
      await createComment({ announcementId, content: newComment });
      setNewComment("");
      toast.success("Comment posted");
    } catch {
      toast.error("Could not post your comment. Try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const count = initialCount;
  return (
    <div className="mt-5 border-t border-border pt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="-ml-3 h-10 px-3"
      >
        <MessageSquare />
        {count === 0
          ? "Comments"
          : `${count} ${count === 1 ? "comment" : "comments"}`}
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </Button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 px-1 pb-1 pt-3">
              {currentUserId ? (
                <div className="space-y-3">
                  <label
                    htmlFor={`comment-${announcementId}`}
                    className="sr-only"
                  >
                    Write a comment
                  </label>
                  <Textarea
                    id={`comment-${announcementId}`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment"
                    disabled={isPosting}
                    className="min-h-[88px] resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!newComment.trim() || isPosting}
                    >
                      {isPosting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Send />
                      )}
                      {isPosting ? "Posting" : "Post comment"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-white/[0.03] p-4 text-sm text-foreground">
                  Sign in to leave a comment.
                </p>
              )}

              {!comments ? (
                <div className="space-y-4" aria-busy="true">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="py-4 text-center text-sm text-foreground/80">
                  No comments yet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment._id}
                      comment={comment}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
