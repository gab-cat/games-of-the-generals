import type { EmailConfig } from "@auth/core/providers/email";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { sendEmail } from "./cloudflareEmail";
import { passwordResetEmail } from "./emails/templates";

// Keep the id stable: verification codes already issued are stored under it.
const PROVIDER_ID = "resend-otp";

export const PasswordResetOTP: EmailConfig = {
  id: PROVIDER_ID,
  type: "email",
  name: "Password reset code",
  // Matches the "Expires in 10 minutes" line in the email.
  maxAge: 10 * 60,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };
    return generateRandomString(random, "0123456789", 6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    await sendEmail({ to: email, ...passwordResetEmail(token) });
  },
};
