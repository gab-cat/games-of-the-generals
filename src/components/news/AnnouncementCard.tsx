import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Edit, Trash2, Pin, ChevronUp, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { CreateAnnouncementDialog } from "./CreateAnnouncementDialog";
import { DeleteAnnouncementDialog } from "./DeleteAnnouncementDialog";
import { CommentSection } from "./CommentSection";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Announcement {
  _id: Id<"announcements">;
  title: string;
  content: string;
  isPinned: boolean;
  createdBy: Id<"users">;
  createdByUsername: string;
  createdAt: number;
  updatedAt: number;
  commentCount?: number;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  isAdmin: boolean;
}

export function AnnouncementCard({ announcement, isAdmin }: AnnouncementCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  const CHARACTER_LIMIT = 300;
  const shouldTruncate = announcement.content.length > CHARACTER_LIMIT;
  const displayContent = isExpanded || !shouldTruncate
    ? announcement.content
    : announcement.content.slice(0, CHARACTER_LIMIT) + "...";

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`group relative overflow-hidden transition-all duration-300
          ${announcement.isPinned 
            ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30" 
            : "bg-white/5 border-white/5 hover:border-white/10"
          }
          backdrop-blur-md border rounded-sm p-6 sm:p-8
        `}
      >
        {/* Pinned Corner Marker */}
        {announcement.isPinned && (
          <div className="absolute top-0 right-0 p-4">
            <div className="flex items-center gap-2 text-amber-500/80">
              <span className="text-[10px] uppercase tracking-widest font-mono font-bold">Priority Intel</span>
              <Pin className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
        )}

        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-white/40 transition-colors" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-white/40 transition-colors" />

        {/* Header */}
        <div className="mb-6 relative z-10">
          <div className="flex flex-col gap-1 mb-2">
            <div className="flex items-center gap-3 text-xs font-mono tracking-wider text-white/40 uppercase">
              <span>LOG: {announcement._id.slice(0, 8)}</span>
              <span className="w-px h-3 bg-white/20" />
              <span className={announcement.isPinned ? "text-amber-500/80" : "text-blue-400"}>
                {announcement.createdByUsername}
              </span>
              <span className="w-px h-3 bg-white/20" />
              <span>{formatTime(announcement.createdAt)}</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-display font-medium text-white leading-tight tracking-tight mt-1 transition-colors">
              {announcement.title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className={`prose prose-invert max-w-none text-sm font-mono
            prose-headings:text-white prose-headings:text-base prose-headings:font-semibold prose-headings:tracking-tight prose-headings:mb-4 prose-headings:mt-8
            prose-p:text-white/70 prose-p:leading-relaxed prose-p:font-light prose-p:mb-6
            prose-strong:text-white prose-strong:font-medium
            prose-ul:my-6 prose-li:my-2
            prose-code:text-blue-300 prose-code:bg-blue-900/30 prose-code:border prose-code:border-blue-500/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm
            prose-a:text-blue-400 prose-a:no-underline prose-a:border-b prose-a:border-blue-400/30 hover:prose-a:border-blue-400 hover:prose-a:text-blue-300 prose-a:transition-colors
            ${announcement.isPinned ? "prose-p:text-amber-50/70" : ""}
          `}>
             <AnimatePresence mode="wait">
              <motion.div
                key={isExpanded ? "expanded" : "collapsed"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ReactMarkdown>{displayContent}</ReactMarkdown>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Expand/Collapse Button */}
          {shouldTruncate && (
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-start">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="group/btn text-blue-400 px-2 hover:text-blue-300 hover:bg-blue-500/10 hover:px-3 -ml-0 transition-all duration-300"
              >
                <span className="text-xs uppercase tracking-widest font-medium mr-2">
                  {isExpanded ? "Collapse Report" : "Read Full Report"}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                )}
              </Button>
            </div>
          )}

          {/* Comment Section */}
          <CommentSection 
            announcementId={announcement._id} 
            initialCount={announcement.commentCount} 
          />
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); setIsEditDialogOpen(true); }}
              className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 rounded-sm"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); }}
              className="h-8 w-8 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-sm"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </motion.div>

      {/* Edit Dialog */}
      <CreateAnnouncementDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        editAnnouncement={announcement}
      />

      {/* Delete Dialog */}
      <DeleteAnnouncementDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        announcement={announcement}
      />
    </>
  );
}
