import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { AnnouncementCard } from "./AnnouncementCard";
import { AnnouncementsHeader } from "./AnnouncementsHeader";
import { CreateAnnouncementDialog } from "./CreateAnnouncementDialog";
import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache";
import { Button } from "../ui/button";
import { Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function AnnouncementsList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
        <span className="ml-2 text-white/60">Loading announcements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-2">Failed to load announcements</div>
        <div className="text-white/60 text-sm">Please try again later</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <AnnouncementsHeader />

        {isAdmin && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            Create Announcement
          </Button>
        )}
      </div>

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div className="space-y-3">
          <div className="space-y-3">
            {pinnedAnnouncements.map((announcement, index) => (
              <motion.div
                key={announcement._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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

      {/* Regular Announcements */}
      {regularAnnouncements.length > 0 && (
        <div className="space-y-3">
          {pinnedAnnouncements.length > 0 && (
            <h2 className="text-base font-semibold text-white/90 flex items-center gap-2">
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              Recent Announcements
            </h2>
          )}
          <div className="space-y-3">
            {regularAnnouncements.map((announcement, index) => (
              <motion.div
                key={announcement._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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

      {/* Empty State */}
      {(!announcements || announcements.length === 0) && (
        <div className="text-center py-12">
          <div className="text-white/60 mb-2">No announcements yet</div>
          <div className="text-white/40 text-sm">
            {isAdmin ? "Create your first announcement to get started!" : "Check back later for updates"}
          </div>
        </div>
      )}

      {/* Create Announcement Dialog */}
      <CreateAnnouncementDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}
