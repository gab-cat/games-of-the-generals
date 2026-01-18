import { useState } from "react";
import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { CommentItem } from "./CommentItem";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
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

  // Fetch comments only when expanded
  // We use useQuery directly because we want conditional fetching which useConvexQuery might wrapper differently
  // or just use skip logic if available. Assuming standard convex useQuery supports "skip" if args are "skip".
  // But standard convex useQuery doesn't support skip easily without a special argument.
  // We'll just fetch if expanded.
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
      toast.error("Failed to post comment");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="border-t border-white/5 bg-black/20 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 px-6 sm:px-8 py-4 mt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-white/40 p-2 hover:text-white hover:bg-white/5 h-auto font-normal text-xs uppercase tracking-wider flex items-center gap-2 w-full justify-start"
      >
        <MessageSquare className="w-4 h-4" />
        {initialCount === 0
          ? "No Comments"
          : `${initialCount} Comment${initialCount === 1 ? "" : "s"}`}
        <div className="ml-auto flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </div>
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Inner container with horizontal padding to prevent focus ring clipping */}
            <div className="pt-6 pb-2 space-y-6 px-1">
              {/* Comment Input */}
              {currentUserId ? (
                <div className="space-y-3">
                  <div className="relative group">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your tactical insights..."
                      disabled={isPosting}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 min-h-[100px] text-sm focus:bg-white/10 transition-all resize-none rounded-sm border-2 focus:border-blue-500/50"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!newComment.trim() || isPosting}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-mono uppercase h-9 px-6 rounded-sm transition-all active:scale-95"
                    >
                      {isPosting ? (
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5 mr-2" />
                      )}
                      {isPosting ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-sm p-6 text-center text-xs uppercase tracking-widest text-white/30 font-mono">
                  [ ALERT ] Authorization required to transmit field reports.
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-1">
                {!comments ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-6 h-6 text-blue-500/40 animate-spin" />
                    <span className="text-[10px] font-mono tracking-widest text-white/20 uppercase animate-pulse">
                      Scanning Data Stream...
                    </span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/5 rounded-sm">
                    <span className="text-[10px] font-mono tracking-widest text-white/20 uppercase italic">
                      No field reports detected. Protocol awaiting input.
                    </span>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
