// Email entry points. Password reset codes are sent by the auth provider (PasswordResetOTP).
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { sendEmail } from "./cloudflareEmail";
import { testEmail } from "./emails/templates";

export { sendMuteEmail, sendBanEmail, sendUnmuteEmail, sendUnbanEmail } from "./moderationEmails";

// Checks the email setup on a deployment:
// npx convex run sendEmails:sendTestEmail '{"to":"you@example.com"}'
export const sendTestEmail = internalAction({
  args: { to: v.string() },
  handler: async (_ctx, { to }) => {
    const messageId = await sendEmail({ to, ...testEmail() });
    return { messageId };
  },
});
