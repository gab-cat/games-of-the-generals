import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  User,
  Send,
  Loader2,
  Shield,
  ExternalLink,
  Settings,
  ArrowRight,
  UserPlus
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useConvexQuery, useConvexMutationWithQuery } from "@/lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "./ui/dialog";
import { Id } from "../../convex/_generated/dataModel";

interface SupportTicketDialogProps {
  ticketId: Id<"supportTickets"> | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SupportTicketDialog({ ticketId, isOpen, onClose }: SupportTicketDialogProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ticketData, isLoading, error } = useConvexQuery(
    api.supportTickets.getSupportTicketWithUpdates,
    ticketId ? { ticketId } : "skip"
  );

  const addUpdateMutation = useConvexMutationWithQuery(api.supportTickets.addSupportTicketUpdate);

  const handleAddUpdate = () => {
    if (!newMessage.trim() || !ticketId) {
      toast.error("Please enter a message");
      return;
    }

    const addUpdate = async () => {
      try {
        setIsSubmitting(true);
        await new Promise<string>((resolve, reject) => {
          addUpdateMutation.mutate({
            ticketId,
            message: newMessage.trim(),
          }, {
            onSuccess: resolve,
            onError: reject
          });
        });

        setNewMessage("");
        toast.success("Update added successfully!");
      } catch (error) {
        console.error("Error adding update:", error);
        toast.error("Failed to add update");
      } finally {
        setIsSubmitting(false);
      }
    };

    void addUpdate();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <RefreshCw className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "closed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "closed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bug_report":
        return "🐛";
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "bug_report":
        return "Bug Report";
      case "feature_request":
        return "Feature Request";
      case "account_issue":
        return "Account Issue";
      case "game_issue":
        return "Game Issue";
      default:
        return "Other";
    }
  };

  // Helper functions to detect and parse system changes
  const isSystemChange = (message: string) => {
    return message.startsWith("Status changed from") || 
           message.startsWith("Priority changed from") || 
           message.startsWith("Ticket assigned to");
  };

  const parseSystemChange = (message: string) => {
    if (message.startsWith("Status changed from")) {
      const match = message.match(/Status changed from (\w+) to (\w+)/);
      if (match && match[1] && match[2]) {
        return {
          type: "status" as const,
          from: match[1].toLowerCase(),
          to: match[2].toLowerCase()
        };
      }
    } else if (message.startsWith("Priority changed from")) {
      const match = message.match(/Priority changed from (\w+) to (\w+)/);
      if (match && match[1] && match[2]) {
        return {
          type: "priority" as const,
          from: match[1].toLowerCase(),
          to: match[2].toLowerCase()
        };
      }
    } else if (message.startsWith("Ticket assigned to")) {
      const match = message.match(/Ticket assigned to (.+)/);
      if (match && match[1]) {
        return {
          type: "assignment" as const,
          username: match[1]
        };
      }
    }
    return null;
  };

  const getSystemChangeIcon = (type: string) => {
    switch (type) {
      case "status":
        return <Settings className="w-4 h-4" />;
      case "priority":
        return <RefreshCw className="w-4 h-4" />;
      case "assignment":
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const handleClose = () => {
    setNewMessage("");
    onClose();
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-black/20 backdrop-blur-xl border border-white/10 text-white shadow-2xl shadow-black/20">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white/60">Loading ticket details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !ticketData) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg text-white">
          <div className="p-6 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/80 mb-2">
              Ticket Not Found
            </h3>
            <p className="text-white/60 mb-4">
              The ticket you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={handleClose} variant="outline" className="bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 transition-all duration-200">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { ticket, updates } = ticketData;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-black/20 backdrop-blur-xl border border-white/10 text-white shadow-2xl shadow-black/20 p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-4 space-y-4">
            {/* Compact Header */}
            <div className="border-b border-white/10 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getCategoryIcon(ticket.category)}</span>
                    <DialogTitle className="text-lg font-semibold text-white truncate">
                      {ticket.subject}
                    </DialogTitle>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/60">
                    <span>#{ticket._id.slice(-8)}</span>
                    <span>•</span>
                    <span>{getCategoryLabel(ticket.category)}</span>
                    <span>•</span>
                    <span>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1 text-xs px-2 py-1`}>
                    {getStatusIcon(ticket.status)}
                    <span className="hidden sm:inline">{ticket.status.replace("_", " ").toUpperCase()}</span>
                    <span className="sm:hidden">{ticket.status === "in_progress" ? "IN PROG" : ticket.status.toUpperCase()}</span>
                  </Badge>
                  <Badge className={`${getPriorityColor(ticket.priority)} text-xs px-2 py-1`}>
                    {ticket.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Original Request - Integrated */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <User className="w-4 h-4" />
                <span>Original Request</span>
                <span className="text-white/40">•</span>
                <span className="text-white/40">{format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                {ticket.assignedToUsername && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="text-white/40">Assigned to {ticket.assignedToUsername}</span>
                  </>
                )}
              </div>
              
              <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                
                {ticket.attachmentUrl && (
                  <div className="mt-3">
                    <img
                      src={ticket.attachmentUrl}
                      alt="Ticket attachment"
                      className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity max-h-40"
                      onClick={() => window.open(ticket.attachmentUrl, '_blank')}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-white/60 hover:text-white text-xs"
                      onClick={() => window.open(ticket.attachmentUrl, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open attachment
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <RefreshCw className="w-4 h-4" />
                <span>Conversation</span>
                {updates.length > 0 && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="text-white/40">{updates.length} {updates.length === 1 ? 'update' : 'updates'}</span>
                  </>
                )}
              </div>

              {updates.length === 0 ? (
                <div className="text-center py-6">
                  <RefreshCw className="w-6 h-6 text-white/30 mx-auto mb-2" />
                  <p className="text-white/50 text-sm">No updates yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {updates.map((update, index) => {
                    const systemChange = isSystemChange(update.message) ? parseSystemChange(update.message) : null;
                    
                    if (systemChange) {
                      // Render system change as a special message
                      return (
                        <motion.div
                          key={update._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex justify-end"
                        >
                          <div className="bg-gray-500/20 border border-gray-500/30 rounded-2xl px-4 py-3 max-w-[80%]">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gray-500/20 rounded-full flex items-center justify-center">
                                  {getSystemChangeIcon(systemChange.type)}
                                </div>

                                {systemChange.type === "status" && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Badge className={`${getStatusColor(systemChange.from)} text-xs`}>
                                      {getStatusIcon(systemChange.from.toLocaleUpperCase())}
                                      <span className="ml-1">{systemChange.from.replace("_", " ").toUpperCase()}</span>
                                    </Badge>
                                    <ArrowRight className="w-3 h-3 text-white/40" />
                                    <Badge className={`${getStatusColor(systemChange.to)} text-xs`}>
                                      {getStatusIcon(systemChange.to.toLocaleUpperCase())}
                                      <span className="ml-1">{systemChange.to.replace("_", " ").toUpperCase()}</span>
                                    </Badge>
                                  </div>
                                )}

                                {systemChange.type === "priority" && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Badge className={`${getPriorityColor(systemChange.from)} text-xs`}>
                                      {systemChange.from.toUpperCase()}
                                    </Badge>
                                    <ArrowRight className="w-3 h-3 text-white/40" />
                                    <Badge className={`${getPriorityColor(systemChange.to)} text-xs`}>
                                      {systemChange.to.toUpperCase()}
                                    </Badge>
                                  </div>
                                )}

                                {systemChange.type === "assignment" && (
                                  <div className="flex items-center gap-2 text-sm text-white/80">
                                    <span>Assigned to <span className="text-gray-300 font-medium">{systemChange.username}</span></span>
                                  </div>
                                )}
                              </div>

                              <span className="text-xs text-white/40 flex-shrink-0">
                                {format(new Date(update.timestamp), "MMM d, h:mm a")}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }
                    
                    // Render regular message
                    return (
                      <motion.div
                        key={update._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex gap-3 ${
                          update.isAdminResponse ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div className={`flex-1 max-w-[80%] ${
                          update.isAdminResponse ? "text-right" : "text-left"
                        }`}>
                          <div className={`inline-block rounded-2xl px-4 py-3 ${
                            update.isAdminResponse 
                              ? "bg-blue-600/20 border border-blue-500/30" 
                              : "bg-white/10 border border-white/10"
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              {update.isAdminResponse && (
                                <Shield className="w-3 h-3 text-blue-400" />
                              )}
                              <span className={`text-xs font-medium ${
                                update.isAdminResponse ? "text-blue-400" : "text-white/70"
                              }`}>
                                {update.username}
                                {update.isAdminResponse && " (Support)"}
                              </span>
                              <span className="text-xs text-white/40">
                                {format(new Date(update.timestamp), "MMM d, h:mm a")}
                              </span>
                            </div>
                            <p className="text-white/90 text-sm leading-relaxed">{update.message}</p>
                            
                            {update.attachmentUrl && (
                              <div className="mt-2">
                                <img
                                  src={update.attachmentUrl}
                                  alt="Update attachment"
                                  className="max-w-full h-auto rounded cursor-pointer hover:opacity-80 transition-opacity max-h-32"
                                  onClick={() => window.open(update.attachmentUrl, '_blank')}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Update - Streamlined */}
            {ticket.status !== "closed" && (
              <div className="border-t border-white/10 pt-4">
                <div className="space-y-3">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Add a comment or provide additional information..."
                    className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white placeholder:text-white/50 min-h-[80px] resize-none transition-all duration-200 text-sm"
                    maxLength={2000}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/50">
                      {newMessage.length}/2000
                    </div>
                    <Button
                      onClick={handleAddUpdate}
                      disabled={isSubmitting || !newMessage.trim()}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
