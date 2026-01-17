import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Plus,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  RefreshCw,
  Terminal,
  ChevronRight,
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

import { SupportDialog } from "@/components/SupportDialog";
import { SupportTicketDialog } from "@/components/SupportTicketDialog";
import { Id } from "../../../convex/_generated/dataModel";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";

interface SupportTicketsPageProps {
  initialTicketId?: string;
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

  // Open ticket dialog if initialTicketId is provided
  useEffect(() => {
    if (initialTicketId && tickets && tickets.length > 0) {
      setSelectedTicketId(initialTicketId as Id<"supportTickets">);
      setIsTicketDialogOpen(true);
    }
  }, [initialTicketId, tickets]);

  // Filter tickets
  const filteredTickets =
    tickets?.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="w-3.5 h-3.5" />;
      case "in_progress":
        return <RefreshCw className="w-3.5 h-3.5" />;
      case "resolved":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "closed":
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return <Ticket className="w-3.5 h-3.5" />;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "open":
        return {
          color: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
        };
      case "in_progress":
        return {
          color: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
        };
      case "resolved":
        return {
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        };
      case "closed":
        return {
          color: "text-zinc-400",
          bg: "bg-zinc-500/10",
          border: "border-zinc-500/20",
        };
      default:
        return {
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
        return <div className="text-red-400">🐛</div>;
      case "feature_request":
        return <div className="text-amber-400">✨</div>;
      case "account_issue":
        return <div className="text-blue-400">👤</div>;
      case "game_issue":
        return <div className="text-purple-400">🎮</div>;
      default:
        return <div className="text-zinc-400">💬</div>;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
    <div className="min-h-screen space-y-8 pb-10">
      {/* Tactical Header */}
      <div className="relative space-y-4 text-center py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="flex items-center gap-3 text-blue-400/60 font-mono text-xs tracking-[0.2em] uppercase bg-blue-500/5 border border-blue-500/10 px-3 py-1 rounded-full">
            <Terminal className="w-3.5 h-3.5" />
            <span>Command Uplink</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-display font-medium text-white tracking-tight"
        >
          Support <span className="text-zinc-600">Channels</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-500 text-sm max-w-2xl mx-auto leading-relaxed font-mono"
        >
          Submit operational reports, bug tracking, and feature requests. All
          transmissions are encrypted and logged for review.
        </motion.p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Controls Toolbar */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between"
        >
          <div className="flex flex-1 w-full md:w-auto gap-4">
            <div className="relative flex-1 md:max-w-md group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
              <Input
                placeholder="SEARCH LOGS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-900/40 border-zinc-800 focus:border-blue-500/50 text-white font-mono text-xs h-10 uppercase placeholder:text-zinc-600 transition-all"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-zinc-900/40 border-zinc-800 text-zinc-300 font-mono text-xs uppercase h-10">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-zinc-500" />
                  <SelectValue placeholder="STATUS" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800">
                <SelectItem
                  value="all"
                  className="font-mono text-xs uppercase text-zinc-300"
                >
                  All Status
                </SelectItem>
                <SelectItem
                  value="open"
                  className="font-mono text-xs uppercase text-blue-400"
                >
                  Open
                </SelectItem>
                <SelectItem
                  value="in_progress"
                  className="font-mono text-xs uppercase text-amber-400"
                >
                  In Progress
                </SelectItem>
                <SelectItem
                  value="resolved"
                  className="font-mono text-xs uppercase text-emerald-400"
                >
                  Resolved
                </SelectItem>
                <SelectItem
                  value="closed"
                  className="font-mono text-xs uppercase text-zinc-500"
                >
                  Closed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full md:w-auto bg-blue-600/90 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] border-0 h-10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Initialize Ticket
          </Button>
        </motion.div>

        {/* Tickets Grid */}
        <div className="space-y-4 min-h-[400px]">
          {isLoading ? (
            <LoadingSpinner size="md" />
          ) : error ? (
            <div className="border border-red-500/20 bg-red-500/5 rounded-sm p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-400 font-mono text-sm">
                CONNECTION FAILURE
              </p>
              <p className="text-zinc-500 text-xs mt-2">
                Remote server unreachable.
              </p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 border border-white/5 bg-zinc-900/20 rounded-sm"
            >
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6 border border-white/5">
                <Ticket className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-display text-zinc-300 mb-2">
                No Active Logs
              </h3>
              <p className="text-zinc-600 font-mono text-xs max-w-xs text-center mb-6">
                {tickets?.length === 0
                  ? "Frequency clear. Initiate a new support ticket to begin transmission."
                  : "No tickets match your filter parameters."}
              </p>
              {tickets?.length === 0 && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="outline"
                  className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 font-mono text-xs uppercase"
                >
                  Create First Ticket
                </Button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-3">
                {filteredTickets.map((ticket, index) => {
                  const status = getStatusConfig(ticket.status);
                  const priority = getPriorityConfig(ticket.priority);

                  return (
                    <motion.div
                      key={ticket._id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleTicketClick(ticket._id)}
                      className="group relative"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-white/5 group-hover:bg-blue-500/50 transition-colors duration-300 z-10" />

                      <div
                        className={cn(
                          "relative bg-zinc-900/40 border border-white/5 backdrop-blur-sm p-4 pl-6 cursor-pointer hover:bg-white/[0.02] hover:border-white/10 transition-all duration-300 overflow-hidden",
                        )}
                      >
                        {/* Decorative corners */}
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 group-hover:border-white/30 transition-colors" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 group-hover:border-white/30 transition-colors" />

                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between relative z-10">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-sm bg-black/40 border border-white/5 flex items-center justify-center text-lg mt-1">
                              {getCategoryIcon(ticket.category)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-zinc-200 group-hover:text-blue-400 transition-colors">
                                  {ticket.subject}
                                </h3>
                                {ticket.attachmentUrl && (
                                  <MessageSquare className="w-3 h-3 text-zinc-600" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 uppercase">
                                <span>ID: {ticket._id.slice(-6)}</span>
                                <span className="w-px h-3 bg-zinc-800" />
                                <span className="text-zinc-400">
                                  {getCategoryLabel(ticket.category)}
                                </span>
                                <span className="w-px h-3 bg-zinc-800" />
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(ticket.createdAt), "MMM dd")}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:self-center ml-14 sm:ml-0">
                            <div
                              className={cn(
                                "px-2 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5",
                                status.bg,
                                status.border,
                                status.color,
                              )}
                            >
                              {getStatusIcon(ticket.status)}
                              {ticket.status.replace("_", " ")}
                            </div>
                            <div
                              className={cn(
                                "px-2 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider bg-black/40 border border-white/5",
                                priority.color,
                              )}
                            >
                              PRIORITY: {ticket.priority}
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-500/50 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Dialogs */}
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
