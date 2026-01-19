import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import {
  createBanEmailTemplate,
  createMuteEmailTemplate,
  createUnbanEmailTemplate,
  createUnmuteEmailTemplate,
} from "./emailTemplates";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});

// Internal actions to send moderation emails
export const sendMuteEmail = internalAction({
  args: {
    targetEmail: v.string(),
    targetUsername: v.string(),
    moderatorUsername: v.string(),
    reason: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { html, text } = createMuteEmailTemplate(
      args.targetUsername,
      args.moderatorUsername,
      args.reason,
      args.duration,
    );

    await resend.sendEmail(ctx, {
      from: "Games of the Generals <noreply@generalsonline.app>",
      to: args.targetEmail,
      subject: "Chat Mute Notice - Games of the Generals",
      html,
      text,
    });
  },
});

export const sendBanEmail = internalAction({
  args: {
    targetEmail: v.string(),
    targetUsername: v.string(),
    moderatorUsername: v.string(),
    reason: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { html, text } = createBanEmailTemplate(
      args.targetUsername,
      args.moderatorUsername,
      args.reason,
      args.duration,
    );

    await resend.sendEmail(ctx, {
      from: "Games of the Generals <noreply@generalsonline.app>",
      to: args.targetEmail,
      subject: "Game Ban Notice - Games of the Generals",
      html,
      text,
    });
  },
});

export const sendUnmuteEmail = internalAction({
  args: {
    targetEmail: v.string(),
    targetUsername: v.string(),
    moderatorUsername: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { html, text } = createUnmuteEmailTemplate(
      args.targetUsername,
      args.moderatorUsername,
      args.reason,
    );

    await resend.sendEmail(ctx, {
      from: "Games of the Generals <noreply@generalsonline.app>",
      to: args.targetEmail,
      subject: "Chat Mute Lifted - Games of the Generals",
      html,
      text,
    });
  },
});

export const sendUnbanEmail = internalAction({
  args: {
    targetEmail: v.string(),
    targetUsername: v.string(),
    moderatorUsername: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { html, text } = createUnbanEmailTemplate(
      args.targetUsername,
      args.moderatorUsername,
      args.reason,
    );

    await resend.sendEmail(ctx, {
      from: "Games of the Generals <noreply@generalsonline.app>",
      to: args.targetEmail,
      subject: "Game Ban Lifted - Games of the Generals",
      html,
      text,
    });
  },
});
