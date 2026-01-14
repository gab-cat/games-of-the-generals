import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

// Create a new support ticket
export const createSupportTicket = mutation({
  args: {
    category: v.union(
      v.literal("bug_report"),
      v.literal("feature_request"),
      v.literal("account_issue"),
      v.literal("game_issue"),
      v.literal("other")
    ),
    subject: v.string(),
    description: v.string(),
    attachmentUrl: v.optional(v.string()),
    attachmentStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get user profile for username
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("User profile not found");

    const now = Date.now();

    const ticketId = await ctx.db.insert("supportTickets", {
      userId,
      username: profile.username,
      category: args.category,
      subject: args.subject,
      description: args.description,
      status: "open",
      priority: "medium", // Default priority
      attachmentUrl: args.attachmentUrl,
      attachmentStorageId: args.attachmentStorageId,
      createdAt: now,
      updatedAt: now,
    });

    return ticketId;
  },
});

// Get support tickets for current user
export const getUserSupportTickets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // OPTIMIZED: Added limit to prevent excessive document scanning
    const tickets = await ctx.db
      .query("supportTickets")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100); // Reasonable limit - users rarely have more than 50 tickets

    return tickets;
  },
});

// Get a specific support ticket with updates
export const getSupportTicketWithUpdates = query({
  args: {
    ticketId: v.id("supportTickets"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the ticket
    const ticket = await ctx.db.get("supportTickets", args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    // Verify user owns this ticket (or is admin)
    if (ticket.userId !== userId) {
      // Check if user is admin/moderator
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      
      if (!profile?.adminRole) {
        throw new Error("Access denied");
      }
    }

    // Get all updates for this ticket
    // OPTIMIZED: Added limit to prevent excessive document scanning
    const updates = await ctx.db
      .query("supportTicketUpdates")
      .withIndex("by_ticket_timestamp", (q) => q.eq("ticketId", args.ticketId))
      .order("asc")
      .take(500); // Reasonable limit - tickets rarely have more than 100 updates

    return {
      ticket,
      updates,
    };
  },
});

// Add an update/comment to a support ticket
export const addSupportTicketUpdate = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    message: v.string(),
    attachmentUrl: v.optional(v.string()),
    attachmentStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the ticket
    const ticket = await ctx.db.get("supportTickets", args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    // Get user profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("User profile not found");

    // Verify user owns this ticket (or is admin)
    const isAdmin = !!profile.adminRole;
    if (ticket.userId !== userId && !isAdmin) {
      throw new Error("Access denied");
    }

    const now = Date.now();

    // Add the update
    const updateId = await ctx.db.insert("supportTicketUpdates", {
      ticketId: args.ticketId,
      userId,
      username: profile.username,
      message: args.message,
      isAdminResponse: isAdmin,
      attachmentUrl: args.attachmentUrl,
      attachmentStorageId: args.attachmentStorageId,
      timestamp: now,
    });

    // Update the ticket's updatedAt timestamp
    await ctx.db.patch(args.ticketId, {
      updatedAt: now,
    });

    // Send notification to ticket owner if admin replied
    if (isAdmin && ticket.userId !== userId) {
      const ticketLink = `${process.env.VITE_APP_URL || ''}/support/${args.ticketId}`;
      await ctx.runMutation(internal.notifications.sendNotification, {
        userId: ticket.userId,
        type: "ticket_update",
        ticketId: args.ticketId,
        action: "replied",
        message: `Admin ${profile.username} replied to your support ticket "${ticket.subject}"`,
        ticketLink,
      });
    }

    // Send notification to assigned person if ticket creator replied
    if (!isAdmin && ticket.assignedToId && ticket.assignedToId !== userId) {
      const ticketLink = `${process.env.VITE_APP_URL || ''}/support/${args.ticketId}`;
      await ctx.runMutation(internal.notifications.sendNotification, {
        userId: ticket.assignedToId,
        type: "ticket_update",
        ticketId: args.ticketId,
        action: "replied",
        message: `${profile.username} replied to support ticket "${ticket.subject}"`,
        ticketLink,
      });
    }

    return updateId;
  },
});

// Update support ticket status (admin only)
export const updateSupportTicketStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin/moderator
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!profile?.adminRole) {
      throw new Error("Access denied: Admin privileges required");
    }

    // Get the current ticket to compare old vs new values
    const currentTicket = await ctx.db.get(args.ticketId);
    if (!currentTicket) throw new Error("Ticket not found");

    const now = Date.now();
    const updateData: Partial<Doc<"supportTickets">> = {
      status: args.status,
      updatedAt: now,
      assignedToId: userId,
      assignedToUsername: profile.username,
    };

    if (args.priority) {
      updateData.priority = args.priority;
    }

    if (args.status === "closed" || args.status === "resolved") {
      updateData.closedAt = now;
    }

    // Create update entries for changes
    const updateMessages: string[] = [];

    // Check for status change
    if (currentTicket.status !== args.status) {
      updateMessages.push(`Status changed from ${currentTicket.status.toLocaleUpperCase()} to ${args.status.toLocaleUpperCase()}`);
    }

    // Check for priority change
    if (args.priority && currentTicket.priority !== args.priority) {
      updateMessages.push(`Priority changed from ${currentTicket.priority.toLocaleUpperCase()} to ${args.priority.toLocaleUpperCase()}`);
    }

    // Check for assignment change
    if (currentTicket.assignedToId !== userId) {
      updateMessages.push(`Ticket assigned to ${profile.username}`);
    }

    // Create update entries for each change
    for (const message of updateMessages) {
      await ctx.db.insert("supportTicketUpdates", {
        ticketId: args.ticketId,
        userId,
        username: profile.username,
        message,
        isAdminResponse: true,
        timestamp: now,
      });
    }

    // Update the ticket record
    await ctx.db.patch(args.ticketId, updateData);

    // Send notification to ticket owner about status change
    const ticketLink = `${process.env.VITE_APP_URL || ''}/support/${args.ticketId}`;
    const statusAction = args.status === "closed" ? "closed" :
                        args.status === "resolved" ? "status_changed" :
                        args.status === "in_progress" ? "status_changed" :
                        args.status === "open" ? "opened" : "status_changed";

    await ctx.runMutation(internal.notifications.sendNotification, {
      userId: currentTicket.userId,
      type: "ticket_update",
      ticketId: args.ticketId,
      action: statusAction,
      message: `Your support ticket "${currentTicket.subject}" status changed to ${args.status.replace("_", " ").toUpperCase()}`,
      ticketLink,
    });
  },
});

// Get all support tickets (admin only)
export const getAllSupportTickets = query({
  args: {
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("in_progress"), 
      v.literal("resolved"),
      v.literal("closed")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin/moderator
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!profile?.adminRole) {
      throw new Error("Access denied: Admin privileges required");
    }

    if (args.status) {
      const query = ctx.db
        .query("supportTickets")
        .withIndex("by_status_created", (q) => q.eq("status", args.status!))
        .order("desc");
      
      if (args.limit) {
        return await query.take(args.limit);
      }
      // OPTIMIZED: Added default limit to prevent excessive document scanning
      return await query.take(500); // Default limit for admin queries
    } else {
      const query = ctx.db
        .query("supportTickets")
        .order("desc");
      
      if (args.limit) {
        return await query.take(args.limit);
      }
      // OPTIMIZED: Added default limit to prevent excessive document scanning
      return await query.take(500); // Default limit for admin queries
    }
  },
});

// Process support ticket attachment upload
export const processSupportAttachmentUpload = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the file URL from storage
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    
    return {
      storageId: args.storageId,
      fileUrl,
    };
  },
});
