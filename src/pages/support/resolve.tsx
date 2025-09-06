import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Filter,
  Search,
  AlertCircle,
  RefreshCw,
  Shield,
  Eye,
  EyeOff
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupportTicketDetails } from "./01.support-ticket-details";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useMutation } from "convex/react";

// SupportTicket type is inferred from the API response

export function SupportResolvePage() {
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"supportTickets"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showResolved, setShowResolved] = useState(false);

  const { data: tickets, isLoading, error } = useConvexQuery(
    api.supportTickets.getAllSupportTickets,
    {}
  );

  const updateTicketStatus = useMutation(api.supportTickets.updateSupportTicketStatus);

  // Filter tickets based on search, status, and priority
  const filteredTickets = tickets?.filter((ticket) => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesResolved = showResolved || (ticket.status !== "resolved" && ticket.status !== "closed");
    
    return matchesSearch && matchesStatus && matchesPriority && matchesResolved;
  }) || [];

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
        return <Ticket className="w-4 h-4" />;
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


  const handleStatusChange = async (ticketId: Id<"supportTickets">, newStatus: string, newPriority?: string) => {
    try {
      await updateTicketStatus({
        ticketId,
        status: newStatus as any,
        priority: newPriority as any,
      });
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast.error("Failed to update ticket status");
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
    <div className="min-h-screen space-y-3">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
          <CardHeader className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-white/90 flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300" />
                  </div>
                  Admin Support Center
                </CardTitle>
                <p className="text-white/60 mt-1 text-sm">
                  Manage and resolve support tickets from all users
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Admin Access
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {filteredTickets.length} tickets
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
          <CardContent className="p-3">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Search tickets, users, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-white/5 border border-white/10 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 backdrop-blur-lg border-white/20">
                    <SelectItem value="all" className="text-white hover:bg-white/10">All Status</SelectItem>
                    <SelectItem value="open" className="text-white hover:bg-white/10">Open</SelectItem>
                    <SelectItem value="in_progress" className="text-white hover:bg-white/10">In Progress</SelectItem>
                    <SelectItem value="resolved" className="text-white hover:bg-white/10">Resolved</SelectItem>
                    <SelectItem value="closed" className="text-white hover:bg-white/10">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-white/5 border border-white/10 text-white">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 backdrop-blur-lg border-white/20">
                    <SelectItem value="all" className="text-white hover:bg-white/10">All Priority</SelectItem>
                    <SelectItem value="urgent" className="text-white hover:bg-white/10">Urgent</SelectItem>
                    <SelectItem value="high" className="text-white hover:bg-white/10">High</SelectItem>
                    <SelectItem value="medium" className="text-white hover:bg-white/10">Medium</SelectItem>
                    <SelectItem value="low" className="text-white hover:bg-white/10">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResolved(!showResolved)}
                  className="bg-white/5 border border-white/10 text-white hover:bg-white/10"
                >
                  {showResolved ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showResolved ? "Hide Resolved" : "Show Resolved"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tickets List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        {isLoading ? (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white/60">Loading support tickets...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <p className="text-red-400">Failed to load tickets</p>
              <p className="text-white/60 text-sm mt-2">Please try refreshing the page</p>
            </CardContent>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
            <CardContent className="p-6 text-center">
              <Ticket className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white/80 mb-2">
                {tickets?.length === 0 ? "No tickets found" : "No matching tickets"}
              </h3>
              <p className="text-white/60 mb-4">
                {tickets?.length === 0
                  ? "No support tickets have been submitted yet."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                className="cursor-pointer"
                onClick={() => setSelectedTicketId(ticket._id)}
              >
                <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-200">
                  <CardContent className="p-4">
                    {/* Header with user info and status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">{getCategoryIcon(ticket.category)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white/90 line-clamp-1 mb-1">
                            {ticket.subject}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-white/60">
                            <span>by {ticket.username}</span>
                            <span>•</span>
                            <span>{format(new Date(ticket.createdAt), "MMM d, h:mm a")}</span>
                            {ticket.attachmentUrl && (
                              <>
                                <span>•</span>
                                <MessageSquare className="w-3 h-3" />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1 text-xs`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace("_", " ").toUpperCase()}
                        </Badge>
                        <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                          {ticket.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Description preview */}
                    <div className="mb-3">
                      <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>
                    </div>

                    {/* Footer with actions and metadata */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-white/50">
                        <span>#{ticket._id.slice(-8)}</span>
                        {ticket.assignedToUsername && (
                          <>
                            <span>•</span>
                            <span>Assigned to {ticket.assignedToUsername}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Quick action buttons */}
                      <div className="flex gap-1">
                        {ticket.status === "open" && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleStatusChange(ticket._id, "in_progress");
                            }}
                            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white text-xs h-6 px-2"
                          >
                            Start
                          </Button>
                        )}
                        {ticket.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleStatusChange(ticket._id, "resolved");
                            }}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs h-6 px-2"
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}
