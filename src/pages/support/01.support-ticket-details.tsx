import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Send,
  Loader2,
  Shield,
  ExternalLink,
  Terminal,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useConvexQuery,
  useConvexMutationWithQuery,
} from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

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
      toast.error("Please enter a message");
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
      toast.success("Update recorded.");
    } catch (error) {
      console.error("Error adding update:", error);
      toast.error("Failed to add update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    newStatus: string,
    newPriority?: string,
  ) => {
    try {
      await new Promise<void>((resolve, reject) => {
        updateTicketStatusMutation.mutate(
          {
            ticketId,
            status: newStatus as any,
            priority: newPriority as any,
          },
          {
            onSuccess: () => {
              toast.success(`Protocol updated: ${newStatus}`);
              resolve();
            },
            onError: reject,
          },
        );
      });
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast.error("Failed to update ticket status");
    }
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
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
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
        return {
          color: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
        };
      case "high":
        return {
          color: "text-orange-400",
          bg: "bg-orange-500/10",
          border: "border-orange-500/20",
        };
      case "medium":
        return {
          color: "text-yellow-400",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
        };
      case "low":
        return {
          color: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
        };
      default:
        return {
          color: "text-zinc-400",
          bg: "bg-zinc-500/10",
          border: "border-zinc-500/20",
        };
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-zinc-500 font-mono text-xs animate-pulse">
            RETRIEVING LOGS...
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/40 border border-red-500/20 p-8 rounded-sm text-center backdrop-blur-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-display text-white mb-2">
            ACCESS DENIED
          </h3>
          <p className="text-zinc-500 text-sm font-mono mb-6">
            Restricted protocol or invalid ID.
          </p>
          <Button
            onClick={onBack}
            variant="outline"
            className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 font-mono text-xs uppercase w-full"
          >
            <ArrowLeft className="w-3 h-3 mr-2" />
            Return to Base
          </Button>
        </div>
      </div>
    );
  }

  const { ticket, updates } = ticketData;
  const statusConfig = getStatusConfig(ticket.status);
  const priorityConfig = getPriorityConfig(ticket.priority);

  return (
    <div className="min-h-screen space-y-6 px-2 sm:px-0 pb-20">
      {/* Tactical Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-zinc-900/40 backdrop-blur-md border-b border-white/5 pb-6">
          <div className="max-w-5xl mx-auto pt-6 px-2 sm:px-4">
            <div className="flex flex-col gap-6">
              <Button
                onClick={onBack}
                variant="ghost"
                className="self-start text-zinc-500 hover:text-white pl-0 hover:bg-transparent transition-colors font-mono text-xs uppercase"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to List
              </Button>

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-1 bg-white/5 rounded-sm border border-white/10 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                      Ticket #{ticket._id.slice(-6)}
                    </div>
                    <div className="h-px bg-white/10 w-12" />
                    <div className="text-xs font-mono text-zinc-500 uppercase flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {format(new Date(ticket.createdAt), "MMM d, HH:mm")}
                    </div>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">
                    {ticket.subject}
                  </h1>

                  {/* Ticket Tags */}
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "px-2 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5",
                        statusConfig.bg,
                        statusConfig.border,
                        statusConfig.color,
                      )}
                    >
                      {statusConfig.icon}
                      {ticket.status.replace("_", " ")}
                    </div>

                    <div
                      className={cn(
                        "px-2 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider",
                        priorityConfig.bg,
                        priorityConfig.border,
                        priorityConfig.color,
                      )}
                    >
                      PRIORITY: {ticket.priority}
                    </div>

                    <div className="px-2 py-0.5 rounded-sm border border-zinc-800 bg-zinc-900 text-zinc-400 text-[10px] font-mono uppercase tracking-wider">
                      {ticket.category.replace("_", " ")}
                    </div>
                  </div>
                </div>

                {/* Admin Quick Actions */}
                {isAdminView && (
                  <div className="flex flex-col gap-3 min-w-[200px] bg-white/5 p-4 rounded-sm border border-white/5">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider pb-2 border-b border-white/5 mb-1">
                      <Shield className="w-3 h-3" /> Admin Controls
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-600 uppercase">
                          Status Protocol
                        </label>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) =>
                            void handleStatusChange(value)
                          }
                        >
                          <SelectTrigger className="bg-black/20 border-white/10 h-8 text-xs font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-zinc-800">
                            {["open", "in_progress", "resolved", "closed"].map(
                              (s) => (
                                <SelectItem
                                  key={s}
                                  value={s}
                                  className="font-mono text-xs uppercase"
                                >
                                  {s.replace("_", " ")}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-600 uppercase">
                          Priority Level
                        </label>
                        <Select
                          value={ticket.priority}
                          onValueChange={(value) =>
                            void handleStatusChange(ticket.status, value)
                          }
                        >
                          <SelectTrigger className="bg-black/20 border-white/10 h-8 text-xs font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-zinc-800">
                            {["low", "medium", "high", "urgent"].map((p) => (
                              <SelectItem
                                key={p}
                                value={p}
                                className="font-mono text-xs uppercase"
                              >
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-2 sm:px-4 space-y-8">
        {/* Initial Request Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/20 border border-white/5 rounded-sm p-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30" />
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-sm flex items-center justify-center border border-blue-500/20 text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium text-white">
                    {ticket.username}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    INITIATED REQUEST
                  </span>
                </div>
              </div>
              <div className="bg-black/20 rounded-sm p-4 border border-white/5 text-zinc-300 leading-relaxed text-sm">
                {ticket.description}
              </div>
              {ticket.attachmentUrl && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(ticket.attachmentUrl, "_blank")}
                    className="bg-white/5 border-white/10 text-xs font-mono uppercase text-zinc-400 hover:text-white hover:bg-white/10 h-8"
                  >
                    <Paperclip className="w-3 h-3 mr-2" />
                    Attached Evidence
                    <ExternalLink className="w-2.5 h-2.5 ml-2 opacity-50" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Communication Log */}
        <div className="relative">
          <div className="absolute left-[27px] top-0 bottom-0 w-px bg-white/5 -z-10" />

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-14 flex justify-center">
                <div className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700" />
              </div>
              <div className="h-px bg-white/5 flex-1" />
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest px-2">
                Log Start
              </span>
              <div className="h-px bg-white/5 flex-1" />
            </div>

            {updates.map((update, index) => {
              const systemChange = isSystemChange(update.message)
                ? parseSystemChange(update.message)
                : null;

              if (systemChange) {
                return (
                  <motion.div
                    key={update._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center my-4"
                  >
                    <div className="bg-white/5 border border-white/5 rounded-full px-4 py-1 flex items-center gap-3">
                      <Terminal className="w-3 h-3 text-zinc-500" />
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                        <span className="text-zinc-500 mr-2">
                          {format(new Date(update.timestamp), "HH:mm")}
                        </span>
                        {update.message}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              const isAdmin = update.isAdminResponse;

              return (
                <motion.div
                  key={update._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-4 group"
                >
                  <div className="w-14 flex-shrink-0 flex justify-center pt-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-sm flex items-center justify-center border text-xs",
                        isAdmin
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          : "bg-zinc-800/40 border-white/5 text-zinc-500",
                      )}
                    >
                      {isAdmin ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 max-w-3xl">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isAdmin ? "text-amber-500" : "text-zinc-400",
                          )}
                        >
                          {update.username}{" "}
                          {isAdmin && (
                            <span className="text-[10px] font-mono uppercase bg-amber-500/10 border border-amber-500/20 px-1 rounded-sm ml-2">
                              Official
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600">
                        {format(new Date(update.timestamp), "MMM d, HH:mm")}
                      </span>
                    </div>

                    <div
                      className={cn(
                        "p-4 rounded-sm border text-sm leading-relaxed backdrop-blur-sm relative",
                        isAdmin
                          ? "bg-amber-950/10 border-amber-500/10 text-zinc-300"
                          : "bg-zinc-900/40 border-white/5 text-zinc-300",
                      )}
                    >
                      {/* Decorative corner for admin messages */}
                      {isAdmin && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/20" />
                      )}

                      <div className="whitespace-pre-wrap">
                        {update.message}
                      </div>

                      {update.attachmentUrl && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <img
                            src={update.attachmentUrl}
                            alt="Attachment"
                            className="max-w-sm rounded-sm border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                              window.open(update.attachmentUrl, "_blank")
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {updates.length === 0 && (
              <div className="flex justify-center py-8">
                <div className="text-zinc-600 font-mono text-xs italic">
                  // AWAITING RESPONSE PROTOCOL
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        {ticket.status !== "closed" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4 sticky bottom-6"
          >
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-1 pl-1 pr-1 rounded-md shadow-2xl flex items-end gap-2">
              <div className="flex-1">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Input transmission..."
                  className="bg-transparent border-0 focus-visible:ring-0 resize-none min-h-[40px] max-h-[200px] py-3 px-4 text-zinc-300 placeholder:text-zinc-600 font-sans"
                />
              </div>

              <Button
                data-testid="send-message-button"
                onClick={() => void handleAddUpdate()}
                disabled={!newMessage.trim() || isSubmitting}
                className="h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-sm font-mono text-xs uppercase tracking-wider mb-1 mr-1 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="mt-2 text-center">
              <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                SECURE CHANNEL ACTIVE • ENCRYPTED
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
