import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Filter,
  Search,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  Terminal,
  Paperclip,
  User,
  MoreHorizontal,
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
import { SupportTicketDetails } from "./01.support-ticket-details";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { cn } from "@/lib/utils";

export function SupportResolvePage() {
  const [selectedTicketId, setSelectedTicketId] =
    useState<Id<"supportTickets"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showResolved, setShowResolved] = useState(false);

  const {
    data: tickets,
    isLoading,
    error: _error,
  } = useConvexQuery(api.supportTickets.getAllSupportTickets, {});

  const updateTicketStatus = useMutation(
    api.supportTickets.updateSupportTicketStatus,
  );

  // Filter tickets based on search, status, and priority
  const filteredTickets =
    tickets?.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.username.toLowerCase().includes(searchQuery.toLowerCase());

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bug_report":
        return <Terminal className="w-4 h-4" />;
      case "account_issue":
        return <User className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const handleStatusChange = async (
    ticketId: Id<"supportTickets">,
    newStatus: string,
    newPriority?: string,
  ) => {
    try {
      await updateTicketStatus({
        ticketId,
        status: newStatus as any,
        priority: newPriority as any,
      });
      toast.success(`Protocol updated: ${newStatus}`);
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast.error("Failed to update protocol");
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
    <div className="min-h-screen space-y-6 px-2 sm:px-0 pb-20">
      {/* Tactical Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-zinc-900/40 backdrop-blur-md border-b border-white/5 pb-6">
          <div className="max-w-7xl mx-auto pt-6 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Link
                    to="/admin"
                    className="p-2 bg-amber-500/10 rounded-sm border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer group/back"
                  >
                    <Shield className="w-5 h-5 group-hover/back:scale-110 transition-transform" />
                  </Link>
                  <h1 className="text-2xl font-display font-bold text-white tracking-tight">
                    COMMAND OVERVIEW
                  </h1>
                </div>
                <p className="text-sm font-mono text-zinc-500 uppercase tracking-wider pl-12">
                  Administrative Control & Ticket Resolution
                </p>
              </div>

              <div className="flex items-center gap-4 pl-12 md:pl-0">
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-display font-bold text-white">
                    {filteredTickets.length}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Active Signals
                  </span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-display font-bold text-emerald-500">
                    {tickets?.filter((t) => t.status === "open").length || 0}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Pending Action
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Controls Toolbar */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4"
        >
          <div className="lg:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="SEARCH TRANSMISSIONS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900/40 border-zinc-800 text-zinc-300 placeholder:text-zinc-600 font-mono text-xs uppercase h-10 focus-visible:ring-1 focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50 transition-all rounded-sm"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-zinc-900/40 border-zinc-800 text-zinc-400 font-mono text-xs uppercase h-10 rounded-sm">
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3" />
                  <SelectValue placeholder="Status Protocol" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800">
                {["all", "open", "in_progress", "resolved", "closed"].map(
                  (s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="font-mono text-xs uppercase text-zinc-400 focus:text-white focus:bg-white/5 cursor-pointer"
                    >
                      {s.replace("_", " ")}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="bg-zinc-900/40 border-zinc-800 text-zinc-400 font-mono text-xs uppercase h-10 rounded-sm">
                <SelectValue placeholder="Priority Level" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800">
                {["all", "urgent", "high", "medium", "low"].map((p) => (
                  <SelectItem
                    key={p}
                    value={p}
                    className="font-mono text-xs uppercase text-zinc-400 focus:text-white focus:bg-white/5 cursor-pointer"
                  >
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowResolved(!showResolved)}
              className={cn(
                "h-10 border-zinc-800 font-mono text-xs uppercase rounded-sm transition-all",
                showResolved
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-white/5",
              )}
            >
              {showResolved ? (
                <EyeOff className="w-3 h-3 mr-2" />
              ) : (
                <Eye className="w-3 h-3 mr-2" />
              )}
              {showResolved ? "Hide Archives" : "Show Archives"}
            </Button>
          </div>
        </motion.div>

        {/* Status Board */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-zinc-500 font-mono text-xs animate-pulse">
                ESTABLISHING SECURE LINK...
              </div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="border border-dashed border-zinc-800 bg-zinc-900/20 rounded-sm p-12 text-center">
              <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                <Ticket className="w-6 h-6" />
              </div>
              <h3 className="text-white font-display text-lg mb-2">
                NO SIGNALS DETECTED
              </h3>
              <p className="text-zinc-500 font-mono text-sm max-w-sm mx-auto">
                No support requests match your current filter parameters.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTickets.map((ticket, index) => {
                const statusConfig = getStatusConfig(ticket.status);
                const priorityConfig = getPriorityConfig(ticket.priority);

                return (
                  <motion.div
                    key={ticket._id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedTicketId(ticket._id)}
                    className="group cursor-pointer relative pl-1"
                  >
                    {/* Left Accent Bar */}
                    <div
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300",
                        ticket.status === "open"
                          ? "bg-blue-500"
                          : ticket.status === "in_progress"
                            ? "bg-amber-500"
                            : "bg-zinc-700",
                      )}
                    />

                    <div className="bg-zinc-900/40 border border-white/5 p-4 hover:border-white/10 hover:bg-white/5 transition-all duration-300 relative overflow-hidden">
                      {/* Scanline */}
                      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 pointer-events-none" />

                      {/* Decorative Corners */}
                      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 flex items-center justify-center rounded-sm border",
                              statusConfig.bg,
                              statusConfig.border,
                              statusConfig.color,
                            )}
                          >
                            {getCategoryIcon(ticket.category)}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-white font-medium text-lg leading-none group-hover:text-amber-400 transition-colors">
                                {ticket.subject}
                              </h3>
                              {ticket.attachmentUrl && (
                                <Paperclip className="w-3 h-3 text-zinc-500" />
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                              <span className="text-white/60">
                                {ticket.username}
                              </span>
                              <span className="text-zinc-700">•</span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {format(
                                  new Date(ticket.createdAt),
                                  "MMM d, HH:mm",
                                )}
                              </span>
                              <span className="text-zinc-700">•</span>
                              <span className="text-zinc-400">
                                ID: {ticket._id.slice(-6)}
                              </span>
                              {ticket.assignedToUsername && (
                                <>
                                  <span className="text-zinc-700">•</span>
                                  <span className="text-amber-500">
                                    Handler: {ticket.assignedToUsername}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-center bg-black/20 p-2 rounded-sm border border-white/5">
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

                          <div className="h-4 w-px bg-white/10 mx-1" />

                          {/* Quick Actions */}
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ticket.status === "open" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleStatusChange(
                                    ticket._id,
                                    "in_progress",
                                  );
                                }}
                                className="h-6 w-6 p-0 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-sm"
                                title="Start Protocol"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {ticket.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleStatusChange(
                                    ticket._id,
                                    "resolved",
                                  );
                                }}
                                className="h-6 w-6 p-0 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-sm"
                                title="Mark Resolved"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-zinc-500 hover:text-white"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
