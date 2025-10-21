import { useState } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  AlertCircle,
  RefreshCw
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
import { SupportDialog } from "@/components/SupportDialog";
import { SupportTicketDialog } from "@/components/SupportTicketDialog";
import { Id } from "../../../convex/_generated/dataModel";

interface SupportTicketsPageProps {
  initialTicketId?: string;
}

export function SupportTicketsPage({ initialTicketId }: SupportTicketsPageProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"supportTickets"> | null>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: tickets, isLoading, error } = useConvexQuery(
    api.supportTickets.getUserSupportTickets,
    {}
  );

  // Open ticket dialog if initialTicketId is provided
  useEffect(() => {
    if (initialTicketId && tickets && tickets.length > 0) {
      setSelectedTicketId(initialTicketId as Id<"supportTickets">);
      setIsTicketDialogOpen(true);
    }
  }, [initialTicketId, tickets]);

  // Filter tickets based on search and status
  const filteredTickets = tickets?.filter((ticket) => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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

  const handleTicketClick = (ticketId: Id<"supportTickets">) => {
    setSelectedTicketId(ticketId);
    setIsTicketDialogOpen(true);
  };

  const handleCloseTicketDialog = () => {
    setIsTicketDialogOpen(false);
    setSelectedTicketId(null);
  };

  return (
    <div className="min-h-screen space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-white/90 flex items-center gap-3">
                  <Ticket className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                  Support Tickets
                </CardTitle>
                <p className="text-white/60 mt-2 text-sm sm:text-base">
                  Track your support requests and get help with any issues
                </p>
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 shadow-lg w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">New Ticket</span>
                <span className="sm:hidden">Create Ticket</span>
              </Button>
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
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white transition-all duration-200"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white transition-all duration-200">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
                  <SelectItem value="all" className="text-white hover:bg-white/10">All Status</SelectItem>
                  <SelectItem value="open" className="text-white hover:bg-white/10">Open</SelectItem>
                  <SelectItem value="in_progress" className="text-white hover:bg-white/10">In Progress</SelectItem>
                  <SelectItem value="resolved" className="text-white hover:bg-white/10">Resolved</SelectItem>
                  <SelectItem value="closed" className="text-white hover:bg-white/10">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tickets List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {isLoading ? (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white/60 text-sm sm:text-base">Loading your tickets...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardContent className="p-6 sm:p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 text-sm sm:text-base">Failed to load tickets</p>
              <p className="text-white/60 text-xs sm:text-sm mt-2">Please try refreshing the page</p>
            </CardContent>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
            <CardContent className="p-6 sm:p-8 text-center">
              <Ticket className="w-10 h-10 sm:w-12 sm:h-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-white/80 mb-2">
                {tickets?.length === 0 ? "No tickets yet" : "No matching tickets"}
              </h3>
              <p className="text-white/60 mb-4 text-sm sm:text-base">
                {tickets?.length === 0
                  ? "Create your first support ticket to get help with any issues."
                  : "Try adjusting your search or filter criteria."}
              </p>
              {tickets?.length === 0 && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 shadow-lg w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Create First Ticket</span>
                  <span className="sm:hidden">Create Ticket</span>
                </Button>
              )}
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
                onClick={() => handleTicketClick(ticket._id)}
              >
                <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {getCategoryIcon(ticket.category)}
                          </span>
                          <div>
                            <h3 className="font-semibold text-white/90 line-clamp-1">
                              {ticket.subject}
                            </h3>
                            <p className="text-sm text-white/60">
                              #{ticket._id.slice(-8)} • {getCategoryLabel(ticket.category)}
                            </p>
                          </div>
                        </div>

                        {/* Description preview */}
                        <p className="text-sm text-white/70 line-clamp-2">
                          {ticket.description}
                        </p>

                        {/* Meta info */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-white/50">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="hidden sm:inline">{format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
                            <span className="sm:hidden">{format(new Date(ticket.createdAt), "MMM d")}</span>
                          </div>
                          {ticket.assignedToUsername && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="hidden sm:inline">Assigned to {ticket.assignedToUsername}</span>
                              <span className="sm:hidden">{ticket.assignedToUsername}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status and Priority */}
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace("_", " ").toUpperCase()}
                        </Badge>
                        <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                          {ticket.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Attachment indicator */}
                    {ticket.attachmentUrl && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1 text-xs text-white/60">
                          <MessageSquare className="w-3 h-3" />
                          Has attachment
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Create Support Dialog */}
      <SupportDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      {/* Support Ticket Details Dialog */}
      <SupportTicketDialog
        ticketId={selectedTicketId}
        isOpen={isTicketDialogOpen}
        onClose={handleCloseTicketDialog}
      />
    </div>
  );
}
