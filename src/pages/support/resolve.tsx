import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  Paperclip,
  Play,
  Search,
} from "lucide-react";
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
import { SupportTicketDetails } from "./01.support-ticket-details";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { fadeUp, stagger } from "@/lib/motion";
import {
  PriorityText,
  StatusBadge,
  categoryLabel,
  priorityLabel,
  statusLabel,
} from "./support-ui";

export function SupportResolvePage({
  initialTicketId,
}: { initialTicketId?: string } = {}) {
  const [selectedTicketId, setSelectedTicketId] =
    useState<Id<"supportTickets"> | null>(
      (initialTicketId as Id<"supportTickets"> | undefined) ?? null,
    );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showResolved, setShowResolved] = useState(false);
  const [pendingTicketId, setPendingTicketId] =
    useState<Id<"supportTickets"> | null>(null);

  const {
    data: tickets,
    isLoading,
    error,
  } = useConvexQuery(api.supportTickets.getAllSupportTickets, {});

  const updateTicketStatus = useMutation(
    api.supportTickets.updateSupportTicketStatus,
  );

  const query = searchQuery.toLowerCase();
  const filteredTickets =
    tickets?.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.category.toLowerCase().includes(query) ||
        ticket.username.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter;
      const matchesResolved =
        showResolved ||
        (ticket.status !== "resolved" && ticket.status !== "closed");
      return (
        matchesSearch && matchesStatus && matchesPriority && matchesResolved
      );
    }) || [];

  const openCount = tickets?.filter((t) => t.status === "open").length || 0;

  const handleStatusChange = async (
    ticketId: Id<"supportTickets">,
    newStatus: string,
    newPriority?: string,
  ) => {
    setPendingTicketId(ticketId);
    try {
      await updateTicketStatus({
        ticketId,
        status: newStatus as any,
        priority: newPriority as any,
      });
      toast.success(`Ticket marked ${statusLabel(newStatus).toLowerCase()}`);
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast.error("Could not update the ticket. Try again.");
    } finally {
      setPendingTicketId(null);
    }
  };

  if (selectedTicketId) {
    return (
      <SupportTicketDetails
        ticketId={selectedTicketId}
        onBack={() => setSelectedTicketId(null)}
        isAdminView={true}
      />
    );
  }

  return (
    <div className="pb-10">
      <PageHeader
        title="Support tickets"
        description={
          tickets
            ? `${openCount} open, ${filteredTickets.length} shown.`
            : undefined
        }
        actions={
          <Button variant="secondary" asChild>
            <Link to="/admin">Back to admin</Link>
          </Button>
        }
      />

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search tickets"
            placeholder="Search by subject, details or player"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger aria-label="Filter by status" className="lg:w-[170px]">
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
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger
            aria-label="Filter by priority"
            className="lg:w-[170px]"
          >
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {["urgent", "high", "medium", "low"].map((p) => (
              <SelectItem key={p} value={p}>
                {priorityLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showResolved ? "outline" : "secondary"}
          aria-pressed={showResolved}
          onClick={() => setShowResolved(!showResolved)}
        >
          {showResolved
            ? "Hide resolved and closed"
            : "Show resolved and closed"}
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Tickets could not load"
          body="Check your connection and reload the page."
        />
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          title="No tickets to show"
          body={
            tickets && tickets.length > 0
              ? "No ticket matches these filters. Resolved and closed tickets are hidden by default."
              : "Nobody has opened a ticket yet."
          }
        />
      ) : (
        <motion.ul
          variants={stagger(0.03)}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filteredTickets.map((ticket) => {
            const isPending = pendingTicketId === ticket._id;
            return (
              <motion.li
                key={ticket._id}
                variants={fadeUp}
                className="flex items-stretch gap-2 rounded-lg border border-border bg-card transition-colors hover:border-border-strong"
              >
                <button
                  type="button"
                  onClick={() => setSelectedTicketId(ticket._id)}
                  className="group flex min-w-0 flex-1 items-center justify-between gap-4 rounded-lg p-4 text-left hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
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
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground/80">
                      <span className="text-foreground">{ticket.username}</span>
                      <span aria-hidden="true">·</span>
                      <span>{categoryLabel(ticket.category)}</span>
                      <span aria-hidden="true">·</span>
                      <time className="text-muted-foreground">
                        {format(new Date(ticket.createdAt), "MMM d, h:mm a")}
                      </time>
                      {ticket.assignedToUsername && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Handled by {ticket.assignedToUsername}</span>
                        </>
                      )}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-3">
                      <StatusBadge status={ticket.status} />
                      <PriorityText priority={ticket.priority} />
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-foreground/60 transition-transform group-hover:translate-x-0.5" />
                </button>

                {(ticket.status === "open" ||
                  ticket.status === "in_progress") && (
                  <div className="flex items-center pr-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() =>
                        void handleStatusChange(
                          ticket._id,
                          ticket.status === "open" ? "in_progress" : "resolved",
                        )
                      }
                    >
                      {isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : ticket.status === "open" ? (
                        <Play />
                      ) : (
                        <CheckCircle2 />
                      )}
                      <span className="hidden sm:inline">
                        {ticket.status === "open" ? "Start" : "Resolve"}
                      </span>
                      <span className="sr-only sm:hidden">
                        {ticket.status === "open"
                          ? "Start working on this ticket"
                          : "Mark as resolved"}
                      </span>
                    </Button>
                  </div>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
