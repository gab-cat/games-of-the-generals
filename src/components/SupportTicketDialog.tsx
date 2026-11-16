import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  useConvexQuery,
  useConvexMutationWithQuery,
} from "@/lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Id } from "../../convex/_generated/dataModel";
import {
  PriorityText,
  ReplyBox,
  StatusBadge,
  TicketThread,
  categoryLabel,
} from "@/pages/support/support-ui";

interface SupportTicketDialogProps {
  ticketId: Id<"supportTickets"> | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SupportTicketDialog({
  ticketId,
  isOpen,
  onClose,
}: SupportTicketDialogProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data: ticketData,
    isLoading,
    error,
  } = useConvexQuery(
    api.supportTickets.getSupportTicketWithUpdates,
    ticketId ? { ticketId } : "skip",
  );

  const addUpdateMutation = useConvexMutationWithQuery(
    api.supportTickets.addSupportTicketUpdate,
  );

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (ticketData?.updates && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticketData?.updates, isOpen]);

  const handleAddUpdate = () => {
    if (!newMessage.trim() || !ticketId) {
      toast.error("Write a reply first.");
      return;
    }

    const addUpdate = async () => {
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

    void addUpdate();
  };

  const handleClose = () => {
    setNewMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex h-[90dvh] max-w-3xl flex-col gap-0 p-0">
        {isLoading ? (
          <div className="flex-1 space-y-4 p-6" aria-busy="true">
            <DialogTitle className="sr-only">Loading ticket</DialogTitle>
            <DialogDescription className="sr-only">Loading</DialogDescription>
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error || !ticketData ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <DialogTitle>Ticket not found</DialogTitle>
            <DialogDescription>
              It may have been removed, or it belongs to another account.
            </DialogDescription>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-border p-5 pr-14 sm:p-6 sm:pr-16">
              <DialogTitle className="text-xl sm:text-2xl">
                {ticketData.ticket.subject}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Ticket conversation
              </DialogDescription>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <StatusBadge status={ticketData.ticket.status} />
                <PriorityText priority={ticketData.ticket.priority} />
                <span className="text-xs text-foreground/80">
                  {categoryLabel(ticketData.ticket.category)}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  #{ticketData.ticket._id.slice(-6)}
                </span>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="p-5 sm:p-6">
                <TicketThread
                  ticket={ticketData.ticket}
                  updates={ticketData.updates}
                />
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="shrink-0 border-t border-border p-5 sm:px-6">
              {ticketData.ticket.status !== "closed" ? (
                <ReplyBox
                  value={newMessage}
                  onChange={setNewMessage}
                  onSend={handleAddUpdate}
                  pending={isSubmitting}
                />
              ) : (
                <p className="text-sm text-foreground">
                  This ticket is closed. Open a new ticket if you still need
                  help.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
