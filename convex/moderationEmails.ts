import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const resend: Resend = new Resend(components.resend, {
  testMode: false
});

// Helper function to format duration
const formatDuration = (durationMs?: number): string => {
  if (!durationMs) return "permanent";

  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    const minutes = Math.floor(durationMs / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};

// Email template for mute notification
const createMuteEmailTemplate = (
  username: string,
  moderatorUsername: string,
  reason?: string,
  duration?: number
): { html: string; text: string } => {
  const durationText = formatDuration(duration);
  const reasonText = reason ? `Reason: ${reason}` : "No reason provided.";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e293b; font-size: 28px; margin: 0; font-weight: bold;">Games of the Generals</h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 16px;">Strategic Warfare Platform</p>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h2 style="color: #92400e; font-size: 20px; margin: 0 0 15px 0; text-align: center;">Chat Mute Notice</h2>
          <p style="color: #92400e; font-size: 16px; line-height: 1.6; margin: 0;">
            Hello ${username}, you have been muted in the chat.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #334155; font-size: 18px; margin: 0 0 15px 0;">Moderation Details:</h3>
          <ul style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li><strong>Action:</strong> Chat Mute</li>
            <li><strong>Moderator:</strong> ${moderatorUsername}</li>
            <li><strong>Duration:</strong> ${durationText}</li>
            <li><strong>${reasonText}</strong></li>
          </ul>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 25px 0;">
          <p style="color: #dc2626; font-size: 14px; margin: 0; text-align: center;">
            <strong>Important:</strong> During your mute period, you will not be able to send messages in the global chat.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © 2025 Games of the Generals. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
Games of the Generals - Chat Mute Notice

Hello ${username},

You have been muted in the chat.

Moderation Details:
- Action: Chat Mute
- Moderator: ${moderatorUsername}
- Duration: ${durationText}
- ${reasonText}

Important: During your mute period, you will not be able to send messages in the global chat.

© 2025 Games of the Generals. All rights reserved.
  `.trim();

  return { html, text };
};

// Email template for ban notification
const createBanEmailTemplate = (
  username: string,
  moderatorUsername: string,
  reason?: string,
  duration?: number
): { html: string; text: string } => {
  const durationText = formatDuration(duration);
  const reasonText = reason ? `Reason: ${reason}` : "No reason provided.";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e293b; font-size: 28px; margin: 0; font-weight: bold;">Games of the Generals</h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 16px;">Strategic Warfare Platform</p>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h2 style="color: #dc2626; font-size: 20px; margin: 0 0 15px 0; text-align: center;">Game Ban Notice</h2>
          <p style="color: #dc2626; font-size: 16px; line-height: 1.6; margin: 0;">
            Hello ${username}, you have been banned from Games of the Generals.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #334155; font-size: 18px; margin: 0 0 15px 0;">Moderation Details:</h3>
          <ul style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li><strong>Action:</strong> Game Ban</li>
            <li><strong>Moderator:</strong> ${moderatorUsername}</li>
            <li><strong>Duration:</strong> ${durationText}</li>
            <li><strong>${reasonText}</strong></li>
          </ul>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 25px 0;">
          <p style="color: #dc2626; font-size: 14px; margin: 0; text-align: center;">
            <strong>Important:</strong> During your ban period, you will not be able to access or play Games of the Generals, including all game features and chat. ${duration ? `Your ban will expire in ${durationText}.` : 'This ban is permanent and requires moderator intervention to be lifted.'}
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © 2025 Games of the Generals. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
Games of the Generals - Game Ban Notice

Hello ${username},

You have been banned from Games of the Generals.

Moderation Details:
- Action: Game Ban
- Moderator: ${moderatorUsername}
- Duration: ${durationText}
- ${reasonText}

Important: During your ban period, you will not be able to access or play Games of the Generals, including all game features and chat. ${duration ? `Your ban will expire in ${durationText}.` : 'This ban is permanent and requires moderator intervention to be lifted.'}

© 2025 Games of the Generals. All rights reserved.
  `.trim();

  return { html, text };
};

// Email template for unmute notification
const createUnmuteEmailTemplate = (
  username: string,
  moderatorUsername: string,
  reason?: string
): { html: string; text: string } => {
  const reasonText = reason ? `Reason: ${reason}` : "No reason provided.";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e293b; font-size: 28px; margin: 0; font-weight: bold;">Games of the Generals</h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 16px;">Strategic Warfare Platform</p>
        </div>

        <div style="background-color: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h2 style="color: #047857; font-size: 20px; margin: 0 0 15px 0; text-align: center;">Chat Mute Lifted</h2>
          <p style="color: #047857; font-size: 16px; line-height: 1.6; margin: 0;">
            Good news ${username}! Your chat mute has been lifted.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #334155; font-size: 18px; margin: 0 0 15px 0;">Moderation Details:</h3>
          <ul style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li><strong>Action:</strong> Chat Unmute</li>
            <li><strong>Moderator:</strong> ${moderatorUsername}</li>
            <li><strong>${reasonText}</strong></li>
          </ul>
        </div>

        <div style="background-color: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin: 25px 0;">
          <p style="color: #047857; font-size: 14px; margin: 0; text-align: center;">
            <strong>Great!</strong> You can now send messages in the global chat again.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © 2025 Games of the Generals. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
Games of the Generals - Chat Mute Lifted

Good news ${username}! Your chat mute has been lifted.

Moderation Details:
- Action: Chat Unmute
- Moderator: ${moderatorUsername}
- ${reasonText}

Great! You can now send messages in the global chat again.

© 2025 Games of the Generals. All rights reserved.
  `.trim();

  return { html, text };
};

// Email template for unban notification
const createUnbanEmailTemplate = (
  username: string,
  moderatorUsername: string,
  reason?: string
): { html: string; text: string } => {
  const reasonText = reason ? `Reason: ${reason}` : "No reason provided.";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e293b; font-size: 28px; margin: 0; font-weight: bold;">Games of the Generals</h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 16px;">Strategic Warfare Platform</p>
        </div>

        <div style="background-color: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h2 style="color: #047857; font-size: 20px; margin: 0 0 15px 0; text-align: center;">Game Ban Lifted</h2>
          <p style="color: #047857; font-size: 16px; line-height: 1.6; margin: 0;">
            Great news ${username}! Your game ban has been lifted.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #334155; font-size: 18px; margin: 0 0 15px 0;">Moderation Details:</h3>
          <ul style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li><strong>Action:</strong> Game Unban</li>
            <li><strong>Moderator:</strong> ${moderatorUsername}</li>
            <li><strong>${reasonText}</strong></li>
          </ul>
        </div>

        <div style="background-color: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin: 25px 0;">
          <p style="color: #047857; font-size: 14px; margin: 0; text-align: center;">
            <strong>Welcome back!</strong> You can now access and play Games of the Generals again.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © 2025 Games of the Generals. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
Games of the Generals - Game Ban Lifted

Great news ${username}! Your game ban has been lifted.

Moderation Details:
- Action: Game Unban
- Moderator: ${moderatorUsername}
- ${reasonText}

Welcome back! You can now access and play Games of the Generals again.

© 2025 Games of the Generals. All rights reserved.
  `.trim();

  return { html, text };
};

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
      args.duration
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
      args.duration
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
      args.reason
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
      args.reason
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
