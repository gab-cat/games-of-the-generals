// Backs the admin Emails tab. Previews render in the browser from emails/catalog;
// this file only sends a sample, to the admin's own address or one they type in.
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalQuery, query, type QueryCtx } from "./_generated/server";
import { sendEmail } from "./cloudflareEmail";
import { findCatalogEntry } from "./emails/catalog";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function adminUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (!profile?.adminRole) return null;
  return await ctx.db.get("users", userId);
}

// Default recipient for the "Send test" field. Null for non-admins.
export const getTestRecipient = query({
  args: {},
  handler: async (ctx) => {
    const user = await adminUser(ctx);
    return user ? { email: user.email ?? null } : null;
  },
});

export const getAdminEmail = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const user = await adminUser(ctx);
    if (!user) throw new Error("Only admins can send test emails");
    return user.email ?? null;
  },
});

export const sendTestEmail = action({
  args: { emailId: v.string(), to: v.optional(v.string()) },
  handler: async (ctx, { emailId, to }): Promise<{ sentTo: string; messageId: string }> => {
    // Runs the admin check even when a recipient is given.
    const adminEmail: string | null = await ctx.runQuery(internal.emailPreview.getAdminEmail, {});

    const recipient = (to?.trim() || adminEmail || "").toLowerCase();
    if (!recipient) throw new Error("Your account has no email address. Type one in.");
    if (!EMAIL.test(recipient)) throw new Error(`${recipient} isn't a valid email address`);

    const entry = findCatalogEntry(emailId);
    if (!entry) throw new Error(`Unknown email: ${emailId}`);

    const email = entry.render();
    const messageId = await sendEmail({ ...email, to: recipient, subject: `[Test] ${email.subject}` });
    console.log(`[email test] ${emailId} sent to ${recipient} (${messageId})`);
    return { sentTo: recipient, messageId };
  },
});
