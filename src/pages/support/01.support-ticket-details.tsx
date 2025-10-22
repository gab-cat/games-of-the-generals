import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
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
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Id } from "../../../convex/_generated/dataModel";

interface SupportTicketDetailsProps {
  ticketId: Id<"supportTickets">;
  onBack: () => void;
  isAdminView?: boolean;
}

export function SupportTicketDetails({ ticketId, onBack, isAdminView = false }: SupportTicketDetailsProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ticketData, isLoading, error } = useConvexQuery(
    api.supportTickets.getSupportTicketWithUpdates,
    { ticketId }
  );

  const addUpdateMutation = useConvexMutationWithQuery(api.supportTickets.addSupportTicketUpdate);
  const updateTicketStatusMutation = useConvexMutationWithQuery(api.supportTickets.updateSupportTicketStatus);

  const handleAddUpdate = async () => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

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

  const handleStatusChange = async (newStatus: string, newPriority?: string) => {
    try {
      await new Promise<void>((resolve, reject) => {
        updateTicketStatusMutation.mutate({
          ticketId,
          status: newStatus as any,
          priority: newPriority as any,
        }, {
          onSuccess: () => {
            toast.success(`Ticket status updated to ${newStatus}`);
            resolve();
          },
          onError: reject
        });
      });
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast.error("Failed to update ticket status");
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white/60">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/80 mb-2">
              Ticket Not Found
            </h3>
            <p className="text-white/60 mb-4">
              The ticket you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={onBack} variant="outline" className="bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 transition-all duration-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { ticket, updates } = ticketData;

  return (
    <div className="min-h-screen space-y-3 px-2 sm:px-0">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardHeader className="p-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg sm:text-xl flex-shrink-0">
                      {getCategoryIcon(ticket.category)}
                    </span>
                    <CardTitle className="text-lg sm:text-xl font-bold text-white/90 truncate">
                      {ticket.subject}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1 text-xs`}>
                      {getStatusIcon(ticket.status)}
                      <span className="hidden sm:inline">{ticket.status.replace("_", " ").toUpperCase()}</span>
                      <span className="sm:hidden">{ticket.status === "in_progress" ? "IN PROG" : ticket.status.toUpperCase()}</span>
                    </Badge>
                    <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                      {ticket.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-white/60 pl-0 sm:pl-10">
                <span>#{ticket._id.slice(-8)}</span>
                <span className="hidden sm:inline">•</span>
                <span>{getCategoryLabel(ticket.category)}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Created {format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                <span className="sm:hidden">Created {format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Ticket Details */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardContent className="p-4">
            {/* User info and timestamp in a sleek header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90">{ticket.username}</div>
                  <div className="text-xs text-white/50">{format(new Date(ticket.createdAt), "MMM d, h:mm a")}</div>
                </div>
              </div>
              {ticket.assignedToUsername && (
                <div className="text-xs text-white/50">
                  Assigned to <span className="text-white/70">{ticket.assignedToUsername}</span>
                </div>
              )}
            </div>

            {/* Message content */}
            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </div>
            
            {/* Attachment - integrated seamlessly */}
            {ticket.attachmentUrl && (
              <div className="mb-3">
                <img
                  src={ticket.attachmentUrl}
                  alt="Attachment"
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-white/10"
                  onClick={() => window.open(ticket.attachmentUrl, '_blank')}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-white/60 hover:text-white text-xs"
                  onClick={() => window.open(ticket.attachmentUrl, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open full size
                </Button>
              </div>
            )}

            {/* Subtle metadata */}
            <div className="flex items-center gap-4 text-xs text-white/40">
              <span>#{ticket._id.slice(-8)}</span>
              <span>•</span>
              <span>Updated {format(new Date(ticket.updatedAt), "MMM d, h:mm a")}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Admin Controls */}
      {isAdminView && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 shadow-lg">
            <CardContent className="p-4">
              {/* Quick actions header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-purple-300" />
                </div>
                <span className="text-sm font-medium text-purple-300">Admin Actions</span>
              </div>

              {/* Status and priority in a compact row */}
              <div className="flex gap-2 mb-3">
                <Select value={ticket.status} onValueChange={(value) => void handleStatusChange(value)}>
                  <SelectTrigger className="bg-white/5 border border-white/10 text-white text-sm h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 backdrop-blur-lg border-white/20">
                    <SelectItem value="open" className="text-white hover:bg-white/10">Open</SelectItem>
                    <SelectItem value="in_progress" className="text-white hover:bg-white/10">In Progress</SelectItem>
                    <SelectItem value="resolved" className="text-white hover:bg-white/10">Resolved</SelectItem>
                    <SelectItem value="closed" className="text-white hover:bg-white/10">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ticket.priority} onValueChange={(value) => void handleStatusChange(ticket.status, value)}>
                  <SelectTrigger className="bg-white/5 border border-white/10 text-white text-sm h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 backdrop-blur-lg border-white/20">
                    <SelectItem value="low" className="text-white hover:bg-white/10">Low</SelectItem>
                    <SelectItem value="medium" className="text-white hover:bg-white/10">Medium</SelectItem>
                    <SelectItem value="high" className="text-white hover:bg-white/10">High</SelectItem>
                    <SelectItem value="urgent" className="text-white hover:bg-white/10">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick action buttons */}
              <div className="flex gap-2">
                {ticket.status === "open" && (
                  <Button
                    size="sm"
                    onClick={() => void handleStatusChange("in_progress")}
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white text-xs h-7 px-3"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Start
                  </Button>
                )}
                {ticket.status === "in_progress" && (
                  <Button
                    size="sm"
                    onClick={() => void handleStatusChange("resolved")}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs h-7 px-3"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolve
                  </Button>
                )}
                {ticket.status === "resolved" && (
                  <Button
                    size="sm"
                    onClick={() => void handleStatusChange("closed")}
                    className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white text-xs h-7 px-3"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Close
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Updates/Conversation */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardContent className="p-4">
            {updates.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <RefreshCw className="w-6 h-6 text-white/40" />
                </div>
                <p className="text-white/60 text-sm">No responses yet</p>
                <p className="text-white/40 text-xs">Support team responses will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((update, index) => {
                  const systemChange = isSystemChange(update.message) ? parseSystemChange(update.message) : null;
                  
                  if (systemChange) {
                    // Render system change as a special message
                    return (
                      <motion.div
                        key={update._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
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
                              {format(new Date(update.timestamp), "h:mm a")}
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
                      transition={{ delay: index * 0.1 }}
                      className={`flex gap-3 ${
                        update.isAdminResponse ? "flex-row-reverse" : ""
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        update.isAdminResponse 
                          ? "bg-blue-500/20" 
                          : "bg-white/10"
                      }`}>
                        {update.isAdminResponse ? (
                          <Shield className="w-4 h-4 text-blue-300" />
                        ) : (
                          <User className="w-4 h-4 text-white/60" />
                        )}
                      </div>

                      {/* Message bubble */}
                      <div className={`flex-1 max-w-[80%] ${
                        update.isAdminResponse ? "text-right" : ""
                      }`}>
                        <div className={`inline-block rounded-2xl px-4 py-3 ${
                          update.isAdminResponse 
                            ? "bg-blue-500/20 border border-blue-500/30" 
                            : "bg-white/10 border border-white/10"
                        }`}>
                          <div className={`flex items-center gap-2 mb-1 ${
                            update.isAdminResponse ? "justify-end" : ""
                          }`}>
                            <span className={`text-xs font-medium ${
                              update.isAdminResponse ? "text-blue-300" : "text-white/70"
                            }`}>
                              {update.username}
                              {update.isAdminResponse && " • Support"}
                            </span>
                            <span className="text-xs text-white/40">
                              {format(new Date(update.timestamp), "h:mm a")}
                            </span>
                          </div>
                          <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                            {update.message}
                          </p>
                        </div>

                        {/* Attachment */}
                        {update.attachmentUrl && (
                          <div className="mt-2">
                            <img
                              src={update.attachmentUrl}
                              alt="Attachment"
                              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-white/10"
                              onClick={() => window.open(update.attachmentUrl, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Update (only if ticket is not closed) */}
      {ticket.status !== "closed" && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardContent className="p-4">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4 text-blue-300" />
                </div>

                {/* Input area */}
                <div className="flex-1">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your response..."
                    className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white placeholder:text-white/50 min-h-[60px] resize-none transition-all duration-200 rounded-2xl"
                    maxLength={2000}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-white/40">
                      {newMessage.length}/2000
                    </div>
                    <Button
                      onClick={() => void handleAddUpdate()}
                      disabled={isSubmitting || !newMessage.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 shadow-lg text-sm h-8 px-4"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-1" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
