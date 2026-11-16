import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { ArrowRight, ChevronDown, ChevronUp, Edit, Pin, Trash2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { CreateAnnouncementDialog } from "./CreateAnnouncementDialog";
import { DeleteAnnouncementDialog } from "./DeleteAnnouncementDialog";
import { CommentSection } from "./CommentSection";
import { UserAvatar } from "../UserAvatar";
import { proseClasses } from "./prose";
import { Painting, Sticker, EASE } from "@/components/season/art";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface Announcement {
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

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

function postTimes(createdAt: number) {
  const date = new Date(createdAt);
  let relative = "";
  let exact: string | undefined;
  let short = "";
  try {
    relative = formatDistanceToNow(date, { addSuffix: true });
    exact = format(date, "MMMM d, yyyy 'at' h:mm a");
    short = format(date, "MMM d, yyyy");
  } catch {
    // Bad timestamp: leave the dates out rather than crash the page.
  }
  return { iso: date.toISOString(), relative, exact, short };
}

/** Markdown to a short plain-text line for the columns. */
export function excerpt(markdown: string, max = 180) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_`>~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : max).trimEnd() + "…";
}

/** Edit and delete for admins, with their dialogs. */
function AdminActions({ announcement }: { announcement: Announcement }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  return (
    <>
      <div className="flex shrink-0 items-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit post"
          title="Edit post"
          onClick={() => setIsEditOpen(true)}
        >
          <Edit />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete post"
          title="Delete post"
          onClick={() => setIsDeleteOpen(true)}
          className="text-red-300 hover:text-red-200"
        >
          <Trash2 />
        </Button>
      </div>
      <CreateAnnouncementDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        editAnnouncement={announcement}
      />
      <DeleteAnnouncementDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        announcement={announcement}
      />
    </>
  );
}

function Byline({ announcement }: { announcement: Announcement }) {
  const t = postTimes(announcement.createdAt);
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-foreground">
      <UserAvatar username={announcement.createdByUsername} size="sm" noRing />
      <span className="font-medium">{announcement.createdByUsername}</span>
      <span aria-hidden="true" className="text-border-strong">
        /
      </span>
      <time dateTime={t.iso} title={t.exact} className="text-muted-foreground">
        {t.relative}
      </time>
    </div>
  );
}

function PostBody({
  content,
  limit,
  large,
}: {
  content: string;
  limit?: number;
  large?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = !!limit && content.length > limit;
  const shown =
    isExpanded || !shouldTruncate
      ? content
      : content.slice(0, limit).trimEnd() + "…";
  return (
    <div>
      <div
        className={cn(
          proseClasses,
          large && "sm:text-[17px] sm:leading-8 prose-p:text-foreground",
        )}
      >
        <ReactMarkdown>{shown}</ReactMarkdown>
      </div>
      {shouldTruncate && (
        <Button
          variant="link"
          size="sm"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          className="mt-3 h-10 px-0"
        >
          {isExpanded ? "Show less" : "Read more"}
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lead story: the pinned or newest post, set across the page          */
/* ------------------------------------------------------------------ */

export function LeadStory({
  announcement,
  isAdmin,
}: {
  announcement: Announcement;
  isAdmin: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
      className="space-y-5 sm:space-y-6"
    >
      <Painting
        crop="dispatch"
        fade="none"
        className="h-[180px] rounded-lg sm:h-[320px]"
      >
        {announcement.isPinned && (
          <Sticker
            className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 text-base sm:bottom-6 sm:right-6 sm:text-xl"
            delay={0.6}
          >
            <Pin className="size-4 sm:size-5" />
            Pinned
          </Sticker>
        )}
      </Painting>

      <header className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 break-words font-display text-4xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-7xl">
            {announcement.title}
          </h2>
          {isAdmin && <AdminActions announcement={announcement} />}
        </div>
        <Byline announcement={announcement} />
      </header>

      <div className="max-w-3xl border-t border-border pt-5">
        <PostBody content={announcement.content} limit={1400} large />
        <CommentSection
          announcementId={announcement._id}
          initialCount={announcement.commentCount}
        />
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* Earlier stories: ruled columns that open the full post              */
/* ------------------------------------------------------------------ */

export function StoryColumn({
  announcement,
  index,
  onOpen,
}: {
  announcement: Announcement;
  index: number;
  onOpen: () => void;
}) {
  const t = postTimes(announcement.createdAt);
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.3 + Math.min(index, 8) * 0.06,
        duration: 0.3,
        ease: EASE,
      }}
      className={cn(
        "group block w-full min-w-0 space-y-2 rounded-sm border-t border-border py-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:opacity-80",
        "sm:border-t-0 sm:py-0 sm:pb-8",
        "lg:border-l lg:pl-6 lg:[&:nth-child(4n+1)]:border-l-0 lg:[&:nth-child(4n+1)]:pl-0",
      )}
    >
      <p className="flex items-center gap-1.5 text-xs text-foreground/70">
        {announcement.isPinned && (
          <Pin className="size-3 text-gold-400" aria-label="Pinned" />
        )}
        <time dateTime={t.iso} title={t.exact}>
          {t.short}
        </time>
      </p>
      <h3 className="break-words text-xl font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-gold-300 sm:text-2xl">
        {announcement.title}
      </h3>
      <p className="text-sm leading-relaxed text-foreground/90">
        {excerpt(announcement.content)}
      </p>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 transition-colors group-hover:text-gold-300">
        Read more
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </motion.button>
  );
}

/** The full post with its comments, opened from a column. */
export function PostDialog({
  announcement,
  isAdmin,
  onClose,
}: {
  announcement: Announcement | null;
  isAdmin: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!announcement} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0">
        {announcement && (
          <article className="p-5 sm:p-7">
            <header className="space-y-3 pr-8">
              {announcement.isPinned && (
                <p className="inline-flex items-center gap-1.5 text-sm text-gold-400">
                  <Pin className="size-3.5" /> Pinned
                </p>
              )}
              <div className="flex items-start justify-between gap-3">
                <DialogTitle className="min-w-0 break-words font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  {announcement.title}
                </DialogTitle>
                {isAdmin && <AdminActions announcement={announcement} />}
              </div>
              <DialogDescription asChild>
                <div>
                  <Byline announcement={announcement} />
                </div>
              </DialogDescription>
            </header>
            <div className="mt-5 border-t border-border pt-5">
              <PostBody content={announcement.content} />
              <CommentSection
                announcementId={announcement._id}
                initialCount={announcement.commentCount}
              />
            </div>
          </article>
        )}
      </DialogContent>
    </Dialog>
  );
}
