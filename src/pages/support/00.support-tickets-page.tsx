import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, ChevronRight, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SupportDialog } from "@/components/SupportDialog";
import { SupportTicketDialog } from "@/components/SupportTicketDialog";
import { Id } from "../../../convex/_generated/dataModel";
import { fadeUp, stagger } from "@/lib/motion";
import {
  StatusBadge,
  PriorityText,
  categoryLabel,
  statusLabel,
} from "./support-ui";

interface SupportTicketsPageProps {
  initialTicketId?: string;
}

function TicketRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  );
}

export function SupportTicketsPage({
  initialTicketId,
}: SupportTicketsPageProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] =
    useState<Id<"supportTickets"> | null>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    data: tickets,
    isLoading,
    error,
  } = useConvexQuery(api.supportTickets.getUserSupportTickets, {});

  // Open the ticket dialog when the page is opened from a link or email
  useEffect(() => {
    if (initialTicketId && tickets && tickets.length > 0) {
      setSelectedTicketId(initialTicketId as Id<"supportTickets">);
      setIsTicketDialogOpen(true);
    }
  }, [initialTicketId, tickets]);

  const query = searchQuery.toLowerCase();
  const filteredTickets =
    tickets?.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.category.toLowerCase().includes(query) ||
        categoryLabel(ticket.category).toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  const handleTicketClick = (ticketId: Id<"supportTickets">) => {
    setSelectedTicketId(ticketId);
    setIsTicketDialogOpen(true);
  };

  const handleCloseTicketDialog = () => {
    setIsTicketDialogOpen(false);
    setSelectedTicketId(null);
  };

  const newTicketButton = (
    <Button onClick={() => setIsCreateDialogOpen(true)}>
      <Plus />
      New ticket
    </Button>
  );

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <PageHeader
        title="Support"
        description="Report a bug, ask about your account or suggest a feature. We reply in the ticket."
        actions={newTicketButton}
      />

      {tickets && tickets.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mb-4 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search tickets"
              placeholder="Search tickets"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              aria-label="Filter by status"
              className="sm:w-[180px]"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["open", "in_progress", "resolved", "closed"].map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <TicketRowSkeleton />
          <TicketRowSkeleton />
          <TicketRowSkeleton />
        </div>
      ) : error ? (
        <EmptyState
          title="Tickets could not load"
          body="Check your connection and try again."
          action={
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          }
        />
      ) : tickets && tickets.length === 0 ? (
        <EmptyState
          title="No tickets yet"
          body="When you open a ticket, you can follow the replies here."
          action={newTicketButton}
        />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          title="No tickets match"
          body="Try another word or a different status."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <motion.ul
          variants={stagger(0.04)}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filteredTickets.map((ticket) => (
            <motion.li key={ticket._id} variants={fadeUp}>
              <button
                type="button"
                onClick={() => handleTicketClick(ticket._id)}
                className="group flex w-full items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-border-strong hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.995]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-medium text-foreground">
                      {ticket.subject}
                    </h2>
                    {ticket.attachmentUrl && (
                      <Paperclip
                        className="size-3.5 shrink-0 text-foreground/70"
                        aria-label="Has an attachment"
                      />
                    )}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-foreground/80">
                    <span>{categoryLabel(ticket.category)}</span>
                    <span aria-hidden="true">·</span>
                    <time className="text-muted-foreground">
                      {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                    </time>
                    <span aria-hidden="true">·</span>
                    <PriorityText priority={ticket.priority} />
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  <ChevronRight className="size-4 text-foreground/60 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}

      <SupportDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      <SupportTicketDialog
        ticketId={selectedTicketId}
        isOpen={isTicketDialogOpen}
        onClose={handleCloseTicketDialog}
      />
    </div>
  );
}
