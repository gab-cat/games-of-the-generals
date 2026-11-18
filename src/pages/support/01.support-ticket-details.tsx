import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  useConvexQuery,
  useConvexMutationWithQuery,
} from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Id } from "../../../convex/_generated/dataModel";
import { fadeUp } from "@/lib/motion";
import { DonationConfirmPanel } from "./donation-confirm-panel";
import {
  PriorityText,
  ReplyBox,
  StatusBadge,
  TicketThread,
  categoryLabel,
  priorityLabel,
  statusLabel,
} from "./support-ui";

interface SupportTicketDetailsProps {
  ticketId: Id<"supportTickets">;
  onBack: () => void;
  isAdminView?: boolean;
}

export function SupportTicketDetails({
  ticketId,
  onBack,
  isAdminView = false,
}: SupportTicketDetailsProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const {
    data: ticketData,
    isLoading,
    error,
  } = useConvexQuery(api.supportTickets.getSupportTicketWithUpdates, {
    ticketId,
  });

  const addUpdateMutation = useConvexMutationWithQuery(
    api.supportTickets.addSupportTicketUpdate,
  );
  const updateTicketStatusMutation = useConvexMutationWithQuery(
    api.supportTickets.updateSupportTicketStatus,
  );

  const handleAddUpdate = async () => {
    if (!newMessage.trim()) {
      toast.error("Write a reply first.");
      return;
    }

    try {
      setIsSubmitting(true);
      await new Promise<string>((resolve, reject) => {
        addUpdateMutation.mutate(
          {
            ticketId,
            message: newMessage.trim(),
          },
          {
            onSuccess: resolve,
            onError: reject,
          },
        );
      });

      setNewMessage("");
      toast.success("Reply sent");
    } catch (error) {
      console.error("Error adding update:", error);
      toast.error("Could not send your reply. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    newStatus: string,
    newPriority?: string,
  ) => {
    try {
      setIsUpdatingStatus(true);
      await new Promise<void>((resolve, reject) => {
        updateTicketStatusMutation.mutate(
          {
            ticketId,
            status: newStatus as any,
            priority: newPriority as any,
          },
          {
            onSuccess: () => {
              toast.success(
                newPriority
                  ? `Priority set to ${priorityLabel(newPriority).toLowerCase()}`
                  : `Status set to ${statusLabel(newStatus).toLowerCase()}`,
              );
              resolve();
            },
            onError: reject,
          },
        );
      });
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast.error("Could not update the ticket. Try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy="true">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Ticket not found"
          body="It may have been removed, or it belongs to another account."
          action={
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft />
              Back to tickets
            </Button>
          }
        />
      </div>
    );
  }

  const { ticket, updates } = ticketData;

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <Button onClick={onBack} variant="ghost" size="sm" className="-ml-3 mb-4">
        <ArrowLeft />
        Back to tickets
      </Button>

      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mb-6"
      >
        <h1 className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
          {ticket.subject}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-foreground/90">
          <StatusBadge status={ticket.status} />
          <PriorityText priority={ticket.priority} />
          <span>{categoryLabel(ticket.category)}</span>
          <span className="tabular-nums text-muted-foreground">
            #{ticket._id.slice(-6)}
          </span>
        </div>
      </motion.header>

      {isAdminView && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mb-6 grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2"
          aria-label="Ticket settings"
        >
          <div className="space-y-2">
            <Label htmlFor="ticket-status">Status</Label>
            <Select
              value={ticket.status}
              onValueChange={(value) => void handleStatusChange(value)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger id="ticket-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["open", "in_progress", "resolved", "closed"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket-priority">Priority</Label>
            <Select
              value={ticket.priority}
              onValueChange={(value) =>
                void handleStatusChange(ticket.status, value)
              }
              disabled={isUpdatingStatus}
            >
              <SelectTrigger id="ticket-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["low", "medium", "high", "urgent"].map((p) => (
                  <SelectItem key={p} value={p}>
                    {priorityLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.section>
      )}

      {isAdminView && ticket.category === "donation" && ticket.donationReport && (
        <DonationConfirmPanel
          ticketId={ticket._id}
          username={ticket.username}
          report={ticket.donationReport}
        />
      )}

      <TicketThread ticket={ticket} updates={updates} />

      <div className="mt-6 border-t border-border pt-6">
        {ticket.status !== "closed" ? (
          <ReplyBox
            testId="send-message-button"
            value={newMessage}
            onChange={setNewMessage}
            onSend={() => void handleAddUpdate()}
            pending={isSubmitting}
          />
        ) : (
          <p className="text-sm text-foreground">
            This ticket is closed.
            {isAdminView ? " Change the status to reopen it." : ""}
          </p>
        )}
      </div>
    </div>
  );
}
