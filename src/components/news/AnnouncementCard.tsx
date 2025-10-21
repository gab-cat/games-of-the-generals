import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Edit, Trash2, Pin, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { CreateAnnouncementDialog } from "./CreateAnnouncementDialog";
import { DeleteAnnouncementDialog } from "./DeleteAnnouncementDialog";
import { useState } from "react";
import { motion } from "framer-motion";

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

interface AnnouncementCardProps {
  announcement: Announcement;
  isAdmin: boolean;
}

export function AnnouncementCard({ announcement, isAdmin }: AnnouncementCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/10 backdrop-blur-sm border border-white/10 hover:bg-black/20 transition-all duration-200 shadow-lg rounded-lg p-4 pb-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-bold text-white">{announcement.title}</h3>
              {announcement.isPinned && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Pin className="w-4 h-4 fill-current" />
                  <span className="text-xs font-medium">Pinned</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-white/60 text-sm">
              <User className="w-3 h-3" />
              <span>{announcement.createdByUsername}</span>
              <span>•</span>
              <span>{formatTime(announcement.createdAt)}</span>
              {announcement.updatedAt !== announcement.createdAt && (
                <>
                  <span>•</span>
                  <span className="text-yellow-400">Updated {formatTime(announcement.updatedAt)}</span>
                </>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="text-white/60 hover:text-white hover:bg-white/10 p-2"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none prose-sm">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-xl font-bold text-gray-200 mb-2 mt-4 first:mt-0">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-200 mb-2 mt-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-medium text-gray-200 mb-1 mt-3">{children}</h3>,
              p: ({ children }) => <p className="text-gray-300/90 text-sm mb-2 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="text-gray-300/90 text-sm mb-2 ml-4 space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="text-gray-300/90 text-sm mb-2 ml-4 space-y-0.5">{children}</ol>,
              li: ({ children }) => <li className="text-gray-300/90 text-sm">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-3 border-blue-400 pl-3 italic text-gray-300/90 my-2">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-black/40 text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-black/40 text-white p-3 rounded-lg overflow-x-auto my-2 text-sm">
                  {children}
                </pre>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-blue-400 hover:text-blue-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {announcement.content}
          </ReactMarkdown>
        </div>
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
