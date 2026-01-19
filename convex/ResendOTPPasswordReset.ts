import { createPasswordResetEmailTemplate } from "./emailTemplates";

import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const ResendOTPPasswordReset = Resend({
  id: "resend-otp",
  apiKey: process.env.RESEND_API_KEY,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    const length = 6;
    return generateRandomString(random, alphabet, length);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { html, text } = createPasswordResetEmailTemplate(token);

    const { error } = await resend.emails.send({
      from: "Games of the Generals <noreply@generalsonline.app>",
      to: [email],
      subject: "Reset your password - Games of the Generals",
      html,
      text,
    });

    if (error) {
      throw new Error("Could not send email: " + error.message);
    }
  },
});
