import { useState, useRef, useEffect } from "react";

import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Send,
  Loader2,
  ArrowRight,
  Terminal,
  Paperclip,
  AlertCircle,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useConvexQuery,
  useConvexMutationWithQuery,
} from "@/lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

import { ScrollArea } from "./ui/scroll-area";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Id } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

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
      toast.error("Please enter a message");
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
        toast.success("Transmission sent successfully.");
      } catch (error) {
        console.error("Error adding update:", error);
        toast.error("Failed to add update");
      } finally {
        setIsSubmitting(false);
      }
    };

    void addUpdate();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "open":
        return {
          icon: <Clock className="w-3.5 h-3.5" />,
          color: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
        };
      case "in_progress":
        return {
          icon: <RefreshCw className="w-3.5 h-3.5" />,
          color: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
        };
      case "resolved":
        return {
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        };
      case "closed":
        return {
          icon: <XCircle className="w-3.5 h-3.5" />,
          color: "text-zinc-400",
          bg: "bg-zinc-500/10",
          border: "border-zinc-500/20",
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5" />,
          color: "text-zinc-400",
          bg: "bg-zinc-500/10",
          border: "border-zinc-500/20",
        };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "urgent":
        return { color: "text-red-400", bg: "bg-red-500/10" };
      case "high":
        return { color: "text-orange-400", bg: "bg-orange-500/10" };
      case "medium":
        return { color: "text-yellow-400", bg: "bg-yellow-500/10" };
      case "low":
        return { color: "text-blue-400", bg: "bg-blue-500/10" };
      default:
        return { color: "text-zinc-400", bg: "bg-zinc-500/10" };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bug_report":
        return "🐞";
      case "feature_request":
        return "✨";
      case "account_issue":
        return "👤";
      case "game_issue":
        return "🎮";
      default:
        return "💬";
    }
  };

  // Helper functions to detect and parse system changes
  const isSystemChange = (message: string) => {
    return (
      message.startsWith("Status changed from") ||
      message.startsWith("Priority changed from") ||
      message.startsWith("Ticket assigned to")
    );
  };

  const parseSystemChange = (message: string) => {
    if (message.startsWith("Status changed from")) {
      const match = message.match(/Status changed from (\w+) to (\w+)/);
      if (match && match[1] && match[2]) {
        return {
          type: "status" as const,
          from: match[1].toLowerCase(),
          to: match[2].toLowerCase(),
        };
      }
    } else if (message.startsWith("Priority changed from")) {
      const match = message.match(/Priority changed from (\w+) to (\w+)/);
      if (match && match[1] && match[2]) {
        return {
          type: "priority" as const,
          from: match[1].toLowerCase(),
          to: match[2].toLowerCase(),
        };
      }
    } else if (message.startsWith("Ticket assigned to")) {
      const match = message.match(/Ticket assigned to (.+)/);
      if (match && match[1]) {
        return { type: "assignment" as const, username: match[1] };
      }
    }
    return null;
  };

  const handleClose = () => {
    setNewMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] h-[90vh] flex flex-col bg-zinc-900 border border-white/10 text-white shadow-2xl p-0 overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 z-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20 z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/20 z-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 z-20 pointer-events-none" />

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : error || !ticketData ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-display text-lg text-white">
                Transmission Failed
              </h3>
              <p className="font-mono text-xs text-zinc-500 mt-1">
                LOG ACCESS DENIED OR NOT FOUND
              </p>
            </div>
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10"
            >
              Return to Base
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getCategoryIcon(ticketData.ticket.category)}
                    </span>
                    <DialogTitle className="font-display text-xl sm:text-2xl font-medium tracking-tight text-white uppercase">
                      {ticketData.ticket.subject}
                    </DialogTitle>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider pl-1">
                    <span>ID: #{ticketData.ticket._id.slice(-6)}</span>
                    <span className="text-zinc-700">|</span>
                    <span>
                      {format(
                        new Date(ticketData.ticket.createdAt),
                        "yyyy-MM-dd HH:mm",
                      )}
                    </span>
                    <span className="text-zinc-700">|</span>
                    <span>OP: {ticketData.ticket.username}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-end">
                  {(() => {
                    const status = getStatusConfig(ticketData.ticket.status);
                    const priority = getPriorityConfig(
                      ticketData.ticket.priority,
                    );
                    return (
                      <>
                        <div
                          className={cn(
                            "px-2 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5",
                            status.bg,
                            status.border,
                            status.color,
                          )}
                        >
                          {status.icon}
                          {ticketData.ticket.status.replace("_", " ")}
                        </div>
                        <div
                          className={cn(
                            "px-2 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider",
                            priority.bg,
                            priority.color,
                          )}
                        >
                          PRIORITY: {ticketData.ticket.priority}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Content Area - Single Column Layout */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 bg-zinc-900/20">
                <div className="min-h-full p-8 space-y-10">
                  {/* Initial Request Card */}
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/30 group-hover:bg-blue-500/60 transition-colors" />
                    <div className="ml-6 space-y-4">
                      <div className="flex items-center gap-2 font-mono text-xs text-blue-400 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5" />
                        <span>Initial Transmission</span>
                      </div>
                      <div className="bg-zinc-900/50 border border-white/5 p-6 backdrop-blur-sm text-zinc-300 leading-relaxed text-sm">
                        {ticketData.ticket.description}
                      </div>
                      {ticketData.ticket.attachmentUrl && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                ticketData.ticket.attachmentUrl,
                                "_blank",
                              )
                            }
                            className="bg-zinc-900/40 border-dashed border-zinc-700 hover:border-blue-500/50 hover:bg-blue-500/10 text-zinc-400 hover:text-blue-400 h-9 font-mono text-xs uppercase"
                          >
                            <Paperclip className="w-3.5 h-3.5 mr-2" />
                            View Attachment
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                      Communication Log
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>

                  {/* Updates / Conversation */}
                  <div className="space-y-8 pb-6">
                    {ticketData.updates.map((update) => {
                      const systemChange = isSystemChange(update.message)
                        ? parseSystemChange(update.message)
                        : null;

                      if (systemChange) {
                        return (
                          <div
                            key={update._id}
                            className="flex justify-center my-6"
                          >
                            <div className="bg-white/5 border border-white/5 rounded-full px-5 py-2 flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                              <Terminal className="w-3 h-3 text-zinc-600" />
                              <span>System Event:</span>
                              {systemChange.type === "status" && (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      getStatusConfig(systemChange.from).color
                                    }
                                  >
                                    {systemChange.from.replace("_", " ")}
                                  </span>
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                  <span
                                    className={
                                      getStatusConfig(systemChange.to).color
                                    }
                                  >
                                    {systemChange.to.replace("_", " ")}
                                  </span>
                                </div>
                              )}
                              {systemChange.type === "priority" && (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      getPriorityConfig(systemChange.from).color
                                    }
                                  >
                                    {systemChange.from}
                                  </span>
                                  <ArrowRight className="w-3 h-3 opacity-50" />
                                  <span
                                    className={
                                      getPriorityConfig(systemChange.to).color
                                    }
                                  >
                                    {systemChange.to}
                                  </span>
                                </div>
                              )}
                              {systemChange.type === "assignment" && (
                                <span className="text-zinc-300">
                                  Assigned to {systemChange.username}
                                </span>
                              )}
                              <span className="text-zinc-600 pl-2">
                                [{format(new Date(update.timestamp), "HH:mm")}]
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Admin messages: Left aligned. User messages: Right aligned.
                      const isUserMessage = !update.isAdminResponse;

                      return (
                        <div
                          key={update._id}
                          className={cn(
                            "flex gap-4 max-w-[80%]",
                            isUserMessage ? "ml-auto flex-row-reverse" : "",
                          )}
                        >
                          <div
                            className={cn(
                              "w-9 h-9 flex items-center justify-center border flex-shrink-0 mt-1",
                              isUserMessage
                                ? "bg-zinc-900 border-zinc-700 text-zinc-500"
                                : "bg-amber-950/30 border-amber-500/20 text-amber-500",
                            )}
                          >
                            {isUserMessage ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                          </div>
                          <div className="space-y-2 min-w-0">
                            <div
                              className={cn(
                                "flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider",
                                isUserMessage
                                  ? "justify-end text-zinc-500"
                                  : "text-amber-500/60",
                              )}
                            >
                              <span
                                className={
                                  isUserMessage
                                    ? "text-zinc-300"
                                    : "text-amber-500"
                                }
                              >
                                {update.username}
                                {!isUserMessage && " (Support)"}
                              </span>
                              <span>•</span>
                              <span>
                                {format(
                                  new Date(update.timestamp),
                                  "MMM dd, HH:mm",
                                )}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "p-5 border text-sm leading-relaxed whitespace-pre-wrap",
                                isUserMessage
                                  ? "bg-zinc-900/60 border-white/5 text-zinc-300"
                                  : "bg-amber-950/10 border-amber-500/10 text-amber-100/90",
                              )}
                            >
                              {update.message}
                            </div>
                            {update.attachmentUrl && (
                              <div
                                className={cn(
                                  "pt-1",
                                  isUserMessage && "text-right",
                                )}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(update.attachmentUrl, "_blank")
                                  }
                                  className="h-8 text-[10px] text-zinc-500 hover:text-white"
                                >
                                  <Paperclip className="w-3 h-3 mr-2" />
                                  Attachment
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={scrollRef} />
                  </div>
                </div>
              </ScrollArea>

              {/* Input Area (Bottom docked) */}
              {ticketData.ticket.status !== "closed" && (
                <div className="p-5 bg-zinc-900 border-t border-white/10 flex-shrink-0">
                  <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between px-1">
                      <span className="font-mono text-[10px] text-blue-400/60 uppercase tracking-[0.2em] animate-pulse">
                        Secure Channel Active
                      </span>
                      <span className="font-mono text-[10px] text-zinc-600">
                        {newMessage.length} / 2000
                      </span>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity blur duration-500" />
                      <div className="relative flex gap-0">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Enter transmission message..."
                          className="min-h-[70px] max-h-[150px] bg-black/40 border-zinc-800 focus:border-blue-500/50 rounded-r-none resize-none font-mono text-sm placeholder:text-zinc-700 py-4 px-4"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (newMessage.trim()) handleAddUpdate();
                            }
                          }}
                        />
                        <Button
                          onClick={handleAddUpdate}
                          disabled={isSubmitting || !newMessage.trim()}
                          className="rounded-l-none h-auto px-7 bg-blue-600/90 hover:bg-blue-500 border-l border-white/10"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
