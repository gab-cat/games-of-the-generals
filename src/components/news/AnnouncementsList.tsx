import { useConvexQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  LeadStory,
  PostDialog,
  StoryColumn,
} from "./AnnouncementCard";
import { AnnouncementsHeader } from "./AnnouncementsHeader";
import { CreateAnnouncementDialog } from "./CreateAnnouncementDialog";
import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Painting, EASE } from "@/components/season/art";

/** Mirrors the front page: art band, headline, byline, body, then columns. */
function FrontPageSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading news">
      <div className="space-y-5 sm:space-y-6">
        <Skeleton className="h-[180px] w-full rounded-lg sm:h-[320px]" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-4/5 sm:h-16" />
          <Skeleton className="h-10 w-2/5 sm:h-16" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="max-w-3xl space-y-2 border-t border-border pt-5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="grid gap-x-10 gap-y-6 border-t-2 border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsMessage({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <Painting crop="warroom" fade="left" className="rounded-lg">
        <div className="relative max-w-md space-y-2 p-6 py-14 sm:p-10 sm:py-20">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            {title}
          </h2>
          <p className="text-white/90">{body}</p>
          {action && <div className="pt-3">{action}</div>}
        </div>
      </Painting>
    </motion.div>
  );
}

export function AnnouncementsList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [openId, setOpenId] = useState<Id<"announcements"> | null>(null);
  const navigate = useNavigate();

  const isAdmin = useQuery(api.globalChat.isUserAdmin, {});

  const {
    data: announcements,
    isPending: isLoading,
    error,
  } = useConvexQuery(api.announcements.listAnnouncements, {});

  // Pinned posts first, then the rest in the order the server returns them.
  const ordered = [
    ...(announcements?.filter((a) => a.isPinned) ?? []),
    ...(announcements?.filter((a) => !a.isPinned) ?? []),
  ];
  const [lead, ...earlier] = ordered;
  // Looked up live, so an edit shows at once and a delete closes the dialog.
  const openPost = ordered.find((a) => a._id === openId) ?? null;

  const newPostButton = isAdmin ? (
    <Button onClick={() => setIsCreateDialogOpen(true)}>
      <Plus />
      New post
    </Button>
  ) : null;

  return (
    <div className="space-y-8 sm:space-y-10">
      <AnnouncementsHeader actions={newPostButton} />

      {isLoading ? (
        <FrontPageSkeleton />
      ) : error ? (
        <NewsMessage
          title="News could not load"
          body="Check your connection and reload the page."
          action={
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          }
        />
      ) : !lead ? (
        <NewsMessage
          title="No news yet"
          body={
            isAdmin
              ? "Write the first post."
              : "Updates about the game and new seasons show up here."
          }
          action={
            isAdmin ? (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus />
                New post
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <LeadStory announcement={lead} isAdmin={!!isAdmin} />

          {earlier.length > 0 && (
            <section
              aria-labelledby="news-earlier"
              className="border-t-2 border-foreground pt-6"
            >
              <h2
                id="news-earlier"
                className="mb-5 text-lg font-semibold text-foreground"
              >
                Earlier
              </h2>
              <div className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
                {earlier.map((announcement, i) => (
                  <StoryColumn
                    key={announcement._id}
                    announcement={announcement}
                    index={i}
                    onOpen={() => setOpenId(announcement._id)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <p className="border-t border-border pt-6 text-sm text-foreground/80">
        Found a problem?{" "}
        <button
          type="button"
          onClick={() =>
            void navigate({ to: "/support", search: { ticketId: undefined } })
          }
          className="rounded text-gold-300 underline underline-offset-4 hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
        >
          Open a support ticket
        </button>
      </p>

      <PostDialog
        announcement={openPost}
        isAdmin={!!isAdmin}
        onClose={() => setOpenId(null)}
      />

      <CreateAnnouncementDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}
