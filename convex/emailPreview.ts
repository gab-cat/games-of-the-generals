// Backs the admin Emails tab. Previews render in the browser from emails/catalog;
// this file only sends a sample to the signed-in admin's own address.
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalQuery } from "./_generated/server";
import { sendEmail } from "./cloudflareEmail";
import { findCatalogEntry } from "./emails/catalog";

export const getAdminEmail = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.adminRole) throw new Error("Only admins can send test emails");

    const user = await ctx.db.get("users", userId);
    if (!user?.email) throw new Error("Your account has no email address");
    return user.email;
  },
});

export const sendPreviewToMe = action({
  args: { emailId: v.string() },
  handler: async (ctx, { emailId }): Promise<{ sentTo: string }> => {
    const to: string = await ctx.runQuery(internal.emailPreview.getAdminEmail, {});
    const entry = findCatalogEntry(emailId);
    if (!entry) throw new Error(`Unknown email: ${emailId}`);

    const email = entry.render();
    await sendEmail({ ...email, to, subject: `[Test] ${email.subject}` });
    return { sentTo: to };
  },
});
