import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const resend: Resend = new Resend(components.resend, {
    testMode: false
});

export const sendEmailChangeVerification = internalAction({
  args: {
    currentEmail: v.string(),
    newEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate verification code using the same method as OTP
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    const length = 6;
    const verificationCode = generateRandomString(random, alphabet, length);

    await resend.sendEmail(ctx, {
      from: "Games of the Generals <noreply@csguild.tech>",
      to: args.currentEmail,
      subject: "Email Change Verification - Games of the Generals",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e293b; font-size: 28px; margin: 0; font-weight: bold;">Games of the Generals</h1>
              <p style="color: #64748b; margin: 5px 0 0 0; font-size: 16px;">Strategic Warfare Platform</p>
            </div>
            
            <h2 style="color: #334155; font-size: 24px; margin-bottom: 20px; text-align: center;">Email Change Request</h2>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              We received a request to change your email address from <strong>${args.currentEmail}</strong> to <strong>${args.newEmail}</strong>.
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              To complete this change, please use the verification code below:
            </p>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
              <div style="font-size: 32px; font-weight: bold; color: #1e293b; letter-spacing: 4px; font-family: 'Courier New', monospace;">${verificationCode}</div>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin: 25px 0; text-align: center;">
              This code will expire in 10 minutes for security reasons.
            </p>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 25px 0;">
              <p style="color: #dc2626; font-size: 14px; margin: 0; text-align: center;">
                <strong>Security Notice:</strong> If you didn't request this email change, please ignore this email and consider changing your password.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2025 Games of the Generals. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `Your email change verification code for Games of the Generals is: ${verificationCode}. We received a request to change your email from ${args.currentEmail} to ${args.newEmail}. This code will expire in 10 minutes. If you didn't request this email change, please ignore this email.`,
    });

    return verificationCode;
  },
});
