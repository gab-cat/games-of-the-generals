import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { AnnouncementCard } from "./AnnouncementCard";
import { AnnouncementsHeader } from "./AnnouncementsHeader";
import { CreateAnnouncementDialog } from "./CreateAnnouncementDialog";
import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache";
import { Button } from "../ui/button";
import { Plus, Loader2, GitCommitVertical } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";

export function AnnouncementsList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Check if user is admin
  const isAdmin = useQuery(api.globalChat.isUserAdmin, {});

  const { data: announcements, isPending: isLoading, error } = useConvexQuery(
    api.announcements.listAnnouncements,
    {}
  );

  // Separate pinned and regular announcements
  const pinnedAnnouncements = announcements?.filter(announcement => announcement.isPinned) || [];
  const regularAnnouncements = announcements?.filter(announcement => !announcement.isPinned) || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <span className="text-blue-500/60 font-mono text-sm tracking-widest animate-pulse">ESTABLISHING UPLINK...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 border border-red-500/20 bg-red-500/5 rounded-sm">
        <div className="text-red-400 mb-2 font-mono uppercase tracking-wider">Connection Failure</div>
        <div className="text-white/40 text-sm">Unable to retrieve command logs.</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Background Grid Line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/5 hidden sm:block" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 pl-0 sm:pl-12 relative">
        <AnnouncementsHeader />

        {isAdmin && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm uppercase tracking-wider text-xs font-bold flex items-center gap-2 self-start sm:self-center mb-8 sm:mb-12 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </Button>
        )}
      </div>

      <div className="space-y-12">
        {/* Pinned Announcements */}
        {pinnedAnnouncements.length > 0 && (
          <div className="relative pl-0 sm:pl-12">
            <div className="absolute left-0 top-6 w-10 h-px bg-amber-500/30 hidden sm:block" />
            <div className="absolute left-[15px] top-[22px] w-2.5 h-2.5 bg-amber-500 rounded-full ring-4 ring-black hidden sm:block shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            
            <div className="space-y-6">
              {pinnedAnnouncements.map((announcement, index) => (
                <motion.div
                  key={announcement._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AnnouncementCard
                    announcement={announcement}
                    isAdmin={isAdmin || false}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Announcements Stream */}
        {regularAnnouncements.length > 0 && (
          <div className="space-y-8 relative">
             {regularAnnouncements.map((announcement, index) => (
              <div key={announcement._id} className="relative pl-0 sm:pl-12 group">
                <div className="absolute left-0 top-8 w-10 h-px bg-white/10 group-hover:bg-blue-500/50 transition-colors hidden sm:block" />
                <div className="absolute left-[17px] top-[30px] w-1.5 h-1.5 bg-white/20 rounded-full ring-4 ring-black group-hover:bg-blue-500 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all hidden sm:block" />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <AnnouncementCard
                    announcement={announcement}
                    isAdmin={isAdmin || false}
                  />
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {(!announcements || announcements.length === 0) && (
        <div className="text-center py-20 pl-0 sm:pl-12">
          <div className="text-white/20 font-mono text-4xl mb-4 tracking-tighter">NULL</div>
          <div className="text-white/40 text-sm font-mono uppercase tracking-widest">
            {isAdmin ? "Initialize log sequence..." : "No data streams available."}
          </div>
        </div>
      )}

      {/* Footer Support Message */}
      <div className="mt-20 pl-0 sm:pl-12 pt-8 border-t border-white/5 flex items-center gap-4 text-white/30 text-xs font-mono uppercase tracking-wider">
        <GitCommitVertical className="w-4 h-4" />
        <span>End of Log</span>
        <span className="flex-1 h-px bg-white/5" />
        <button
          onClick={() => void navigate({ to: "/support", search: { ticketId: undefined } })}
          className="hover:text-blue-400 transition-colors"
        >
          Submit Issue Ticket
        </button>
      </div>

      {/* Create Announcement Dialog */}
      <CreateAnnouncementDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}
