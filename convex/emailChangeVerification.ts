import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { sendEmail } from "./cloudflareEmail";
import { emailChangeEmail } from "./emails/templates";

export const sendEmailChangeVerification = internalAction({
  args: {
    currentEmail: v.string(),
    newEmail: v.string(),
  },
  handler: async (_ctx, args) => {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };
    const code = generateRandomString(random, "0123456789", 6);

    await sendEmail({
      to: args.currentEmail,
      ...emailChangeEmail({ code, currentEmail: args.currentEmail, newEmail: args.newEmail }),
    });

    return code;
  },
});
