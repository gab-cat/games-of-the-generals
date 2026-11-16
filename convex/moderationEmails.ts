import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { sendEmail } from "./cloudflareEmail";
import { banEmail, muteEmail, unbanEmail, unmuteEmail } from "./emails/templates";

const moderationArgs = {
  targetEmail: v.string(),
  targetUsername: v.string(),
  moderatorUsername: v.string(),
  reason: v.optional(v.string()),
};

export const sendMuteEmail = internalAction({
  args: { ...moderationArgs, duration: v.optional(v.number()) },
  handler: async (_ctx, args) => {
    await sendEmail({
      to: args.targetEmail,
      ...muteEmail({
        username: args.targetUsername,
        moderatorUsername: args.moderatorUsername,
        reason: args.reason,
        durationMs: args.duration,
      }),
    });
  },
});

export const sendBanEmail = internalAction({
  args: { ...moderationArgs, duration: v.optional(v.number()) },
  handler: async (_ctx, args) => {
    await sendEmail({
      to: args.targetEmail,
      ...banEmail({
        username: args.targetUsername,
        moderatorUsername: args.moderatorUsername,
        reason: args.reason,
        durationMs: args.duration,
      }),
    });
  },
});

export const sendUnmuteEmail = internalAction({
  args: moderationArgs,
  handler: async (_ctx, args) => {
    await sendEmail({
      to: args.targetEmail,
      ...unmuteEmail({
        username: args.targetUsername,
        moderatorUsername: args.moderatorUsername,
        reason: args.reason,
      }),
    });
  },
});

export const sendUnbanEmail = internalAction({
  args: moderationArgs,
  handler: async (_ctx, args) => {
    await sendEmail({
      to: args.targetEmail,
      ...unbanEmail({
        username: args.targetUsername,
        moderatorUsername: args.moderatorUsername,
        reason: args.reason,
      }),
    });
  },
});
