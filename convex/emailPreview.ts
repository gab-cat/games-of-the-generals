import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  createBanEmailTemplate,
  createMuteEmailTemplate,
  createUnbanEmailTemplate,
  createUnmuteEmailTemplate,
  createPasswordResetEmailTemplate,
} from "./emailTemplates";

export const getEmailPreview = query({
  args: {
    type: v.union(
      v.literal("ban"),
      v.literal("mute"),
      v.literal("unban"),
      v.literal("unmute"),
      v.literal("reset"),
    ),
  },
  handler: async (ctx, args) => {
    const username = "TestGeneral";
    const moderatorUsername = "AdminCommand";
    const reason =
      "Violation of tactical protocols regarding respectful communication.";
    const duration = 24 * 60 * 60 * 1000; // 24 hours

    let result;

    switch (args.type) {
      case "ban":
        result = createBanEmailTemplate(
          username,
          moderatorUsername,
          reason,
          duration,
        );
        break;
      case "mute":
        result = createMuteEmailTemplate(
          username,
          moderatorUsername,
          reason,
          duration,
        );
        break;
      case "unban":
        result = createUnbanEmailTemplate(
          username,
          moderatorUsername,
          "Appeal approved.",
        );
        break;
      case "unmute":
        result = createUnmuteEmailTemplate(
          username,
          moderatorUsername,
          "Time served.",
        );
        break;
      case "reset":
        result = createPasswordResetEmailTemplate("123456");
        break;
    }

    return result;
  },
});
