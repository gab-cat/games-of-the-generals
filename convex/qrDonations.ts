import { mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { applyDonationToProfile } from "./subscriptions";
import {
  DONOR_THRESHOLD_CENTAVOS,
  MAX_PENDING_REPORTS,
  QR_METHOD_LABEL,
  cleanQrReport,
  formatPesos,
} from "./lib/qrDonation";

/*
 * QR Ph donations. The player scans Gab's QR in GCash, Maya or a bank app,
 * then reports the transfer here. That opens a "donation" support ticket, and
 * an admin confirms it once the money shows in the account, which records the
 * donation and turns on the donor badge the same way a PayMongo donation does.
 */

const methodValidator = v.union(
  v.literal("gcash"),
  v.literal("maya"),
  v.literal("bank"),
  v.literal("other"),
);

/** The player's report of a transfer they sent. Returns the new ticket's id. */
export const reportQrDonation = mutation({
  args: {
    amount: v.number(), // pesos
    method: methodValidator,
    reference: v.string(),
    note: v.optional(v.string()),
    receiptStorageId: v.optional(v.id("_storage")),
  },
  returns: v.id("supportTickets"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Sign in to report a donation.");

    const user = await ctx.db.get(userId);
    if (user?.isAnonymous) {
      // Guest accounts are deleted daily, and the donor badge with them.
      throw new ConvexError("Save your guest account first so your donor badge stays with you.");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new ConvexError("Finish setting up your profile first.");

    const cleaned = cleanQrReport(args);
    if (!cleaned.ok) throw new ConvexError(cleaned.error);
    const { amountCentavos, reference, note } = cleaned.value;

    // Bounded: a player's own recent tickets.
    const recent = await ctx.db
      .query("supportTickets")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    const waiting = recent.filter(
      (t) =>
        t.category === "donation" &&
        (t.status === "open" || t.status === "in_progress"),
    );
    if (waiting.some((t) => t.donationReport?.reference === reference)) {
      throw new ConvexError("You already reported this reference number. We'll check it soon.");
    }
    if (waiting.length >= MAX_PENDING_REPORTS) {
      throw new ConvexError(
        `You have ${MAX_PENDING_REPORTS} reports waiting. We'll check those first.`,
      );
    }

    const receiptUrl = args.receiptStorageId
      ? ((await ctx.storage.getUrl(args.receiptStorageId)) ?? undefined)
      : undefined;

    const amount = formatPesos(amountCentavos);
    const method = QR_METHOD_LABEL[args.method];
    const lines = [
      `Sent ${amount} by QR Ph with ${method}.`,
      `Reference number: ${reference}`,
    ];
    if (note) lines.push("", note);

    const now = Date.now();
    return await ctx.db.insert("supportTickets", {
      userId,
      username: profile.username,
      category: "donation",
      subject: `Donation of ${amount} by QR Ph`,
      description: lines.join("\n"),
      status: "open",
      priority: "high",
      attachmentUrl: receiptUrl,
      attachmentStorageId: receiptUrl ? args.receiptStorageId : undefined,
      donationReport: { amountCentavos, method: args.method, reference },
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Admin only: the money arrived. Records the donation, updates the player's
 * donor status, resolves the ticket and tells the player. Runs once per ticket.
 */
export const confirmQrDonation = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    amount: v.number(), // pesos actually received
  },
  returns: v.object({ totalDonated: v.number(), isDonor: v.boolean() }),
  handler: async (ctx, args) => {
    const adminId = await getAuthUserId(ctx);
    if (!adminId) throw new ConvexError("Not authenticated");
    const admin = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", adminId))
      .unique();
    // Crediting money is for admins, not moderators.
    if (admin?.adminRole !== "admin") {
      throw new ConvexError("Only admins can confirm donations.");
    }

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket || ticket.category !== "donation" || !ticket.donationReport) {
      throw new ConvexError("This ticket is not a donation report.");
    }
    if (ticket.donationReport.confirmedAt) {
      throw new ConvexError("This donation is already confirmed.");
    }
    if (!Number.isFinite(args.amount) || args.amount <= 0 || args.amount > 100_000) {
      throw new ConvexError("Enter the amount that arrived.");
    }
    const amountCentavos = Math.round(args.amount * 100);

    const now = Date.now();
    await ctx.db.insert("donations", {
      userId: ticket.userId,
      amount: amountCentavos,
      paymongoPaymentId: `qrph:${ticket._id}`,
      status: "succeeded",
      source: "qrph",
      createdAt: now,
    });
    const result = await applyDonationToProfile(ctx, ticket.userId, amountCentavos);
    if (!result) throw new ConvexError("That player's profile no longer exists.");

    await ctx.db.patch(ticket._id, {
      status: "resolved",
      closedAt: now,
      updatedAt: now,
      assignedToId: adminId,
      assignedToUsername: admin.username,
      donationReport: {
        ...ticket.donationReport,
        confirmedAt: now,
        confirmedAmountCentavos: amountCentavos,
        confirmedById: adminId,
      },
    });

    const amount = formatPesos(amountCentavos);
    const perk = result.isDonor
      ? "Your donor badge, name colour and profile frame are on. Pick them in Settings."
      : `Donations of ${formatPesos(DONOR_THRESHOLD_CENTAVOS)} or more in total get the donor badge.`;
    await ctx.db.insert("supportTicketUpdates", {
      ticketId: ticket._id,
      userId: adminId,
      username: admin.username,
      message: `We received your ${amount}. Thank you for keeping the game running.\n\n${perk}`,
      isAdminResponse: true,
      timestamp: now,
    });

    await ctx.runMutation(internal.notifications.sendNotification, {
      userId: ticket.userId,
      type: "ticket_update",
      ticketId: ticket._id,
      action: "status_changed",
      message: `Your donation of ${amount} is confirmed. Thank you!`,
      ticketLink: `${process.env.VITE_APP_URL || ""}/support/${ticket._id}`,
    });

    return result;
  },
});
