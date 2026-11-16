// Every email the app sends. Each returns { subject, preheader, html, text }.
import { renderEmail, SITE_URL, type Block, type RenderedEmail } from "./layout";

const CODE_MINUTES = 10;

/** "1 day", "3 hours", "15 minutes". Undefined means no end date. */
export function formatDuration(durationMs?: number): string | undefined {
  if (!durationMs) return undefined;
  const minutes = Math.round(durationMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
  if (days > 0) return plural(days, "day");
  if (hours > 0) return plural(hours, "hour");
  return plural(Math.max(minutes, 1), "minute");
}

const reasonBlock = (reason?: string): Block[] =>
  reason?.trim() ? [{ kind: "quote", label: "Reason", text: reason.trim() }] : [];

// ---------------------------------------------------------------------------
// Account

export function passwordResetEmail(code: string): RenderedEmail {
  return renderEmail({
    subject: "Your password reset code",
    preheader: `Use ${code} to reset your password. It expires in ${CODE_MINUTES} minutes.`,
    blocks: [
      { kind: "heading", text: "Reset your", accent: "password" },
      { kind: "paragraph", text: "Enter this code on the reset screen to choose a new password." },
      { kind: "code", code, caption: `Expires in ${CODE_MINUTES} minutes` },
      {
        kind: "note",
        text: "If you didn't ask to reset your password, you can ignore this email. Your password stays the same.",
      },
    ],
    reason: "You got this email because someone asked to reset the password for this address.",
  });
}

export function emailChangeEmail(args: {
  code: string;
  currentEmail: string;
  newEmail: string;
}): RenderedEmail {
  return renderEmail({
    subject: "Confirm your new email address",
    preheader: `Use ${args.code} to confirm the change. It expires in ${CODE_MINUTES} minutes.`,
    blocks: [
      { kind: "heading", text: "Confirm your", accent: "new email" },
      {
        kind: "paragraph",
        text: `Someone asked to change the email on your account from **${args.currentEmail}** to **${args.newEmail}**. Enter this code in Settings to confirm.`,
      },
      { kind: "code", code: args.code, caption: `Expires in ${CODE_MINUTES} minutes` },
      {
        kind: "note",
        text: "If this wasn't you, ignore this email and change your password. Your email stays the same until the code is entered.",
      },
    ],
    reason: "You got this email because an email change was requested for your account.",
  });
}

// ---------------------------------------------------------------------------
// Moderation

type ModerationArgs = {
  username: string;
  moderatorUsername: string;
  reason?: string;
  durationMs?: number;
};

const MODERATION_REASON = "You got this email because a moderator changed your account's status.";

export function muteEmail(a: ModerationArgs): RenderedEmail {
  const duration = formatDuration(a.durationMs);
  return renderEmail({
    subject: "You've been muted in chat",
    preheader: duration
      ? `You can't post in global chat for ${duration}. You can still play games.`
      : "You can't post in global chat until a moderator lifts the mute. You can still play games.",
    blocks: [
      { kind: "heading", text: "You've been muted", accent: "in chat" },
      {
        kind: "paragraph",
        text: `Hi ${a.username}, a moderator muted you in global chat. You can still play games and use the rest of the app.`,
      },
      {
        kind: "details",
        rows: [
          { label: "Muted for", value: duration ?? "Until a moderator lifts it", tone: "brass" },
          { label: "Moderator", value: a.moderatorUsername },
        ],
      },
      ...reasonBlock(a.reason),
      { kind: "paragraph", text: "If you think this is a mistake, contact support." },
      { kind: "button", label: "Contact support", href: `${SITE_URL}/support` },
    ],
    reason: MODERATION_REASON,
  });
}

export function unmuteEmail(a: Omit<ModerationArgs, "durationMs">): RenderedEmail {
  return renderEmail({
    subject: "You can chat again",
    preheader: "Your chat mute has been lifted.",
    blocks: [
      { kind: "heading", text: "You can chat", accent: "again" },
      {
        kind: "paragraph",
        text: `Hi ${a.username}, ${a.moderatorUsername} lifted your chat mute. You can post in global chat again.`,
      },
      ...reasonBlock(a.reason),
      { kind: "button", label: "Open Generals Online", href: SITE_URL },
    ],
    reason: MODERATION_REASON,
  });
}

export function banEmail(a: ModerationArgs): RenderedEmail {
  const duration = formatDuration(a.durationMs);
  return renderEmail({
    subject: "Your account has been banned",
    preheader: duration
      ? `You can't play for ${duration}. Sign in to see the details or send an appeal.`
      : "You can't play until the ban is lifted. Sign in to see the details or send an appeal.",
    blocks: [
      { kind: "heading", text: "Your account", accent: "is banned" },
      {
        kind: "paragraph",
        text: `Hi ${a.username}, a moderator banned your account. You can't play games until the ban ${duration ? "ends" : "is lifted"}.`,
      },
      {
        kind: "details",
        rows: [
          { label: "Banned for", value: duration ?? "No end date", tone: "danger" },
          { label: "Moderator", value: a.moderatorUsername },
        ],
      },
      ...reasonBlock(a.reason),
      {
        kind: "paragraph",
        text: "To appeal, sign in. The ban screen has a form that goes straight to the moderators.",
      },
      { kind: "button", label: "Send an appeal", href: SITE_URL },
    ],
    reason: MODERATION_REASON,
  });
}

export function unbanEmail(a: Omit<ModerationArgs, "durationMs">): RenderedEmail {
  return renderEmail({
    subject: "Your ban has been lifted",
    preheader: "You can sign in and play again.",
    blocks: [
      { kind: "heading", text: "Your ban", accent: "is lifted" },
      {
        kind: "paragraph",
        text: `Hi ${a.username}, ${a.moderatorUsername} lifted the ban on your account. You can sign in and play again.`,
      },
      ...reasonBlock(a.reason),
      { kind: "button", label: "Play now", href: SITE_URL },
    ],
    reason: MODERATION_REASON,
  });
}

// ---------------------------------------------------------------------------
// Announcements

export type SignInMethod = "google" | "github" | "password";

const SIGN_IN_LINE: Record<SignInMethod, string> = {
  google: "Sign in with Google, the same way as before.",
  github: "Sign in with GitHub, the same way as before.",
  password: "Sign in with your email and password. If you forgot it, use “Forgot password?” on the sign-in screen.",
};

export function relaunchEmail(a: {
  username: string;
  rank: string;
  gamesPlayed: number;
  wins: number;
  signInMethod?: SignInMethod;
}): RenderedEmail {
  return renderEmail({
    subject: "Generals Online is back",
    preheader: "Season 3 starts fresh. Your old record is saved on your profile.",
    hero: {
      src: `${SITE_URL}/email/relaunch-hero.jpg`,
      alt: "Painting of a general raising his fist over an army crossing an open field",
    },
    blocks: [
      { kind: "heading", text: "Generals Online", accent: "is back." },
      {
        kind: "paragraph",
        text: `Hi ${a.username}, the servers are back up and Season 3 starts fresh for every player. Your record from before is saved on your profile.`,
      },
      {
        kind: "stats",
        items: [
          { label: "Final rank", value: a.rank },
          { label: "Games", value: a.gamesPlayed.toLocaleString("en-US") },
          { label: "Wins", value: a.wins.toLocaleString("en-US") },
        ],
      },
      { kind: "button", label: "Play now", href: SITE_URL },
      { kind: "note", text: SIGN_IN_LINE[a.signInMethod ?? "google"] },
      { kind: "signature", lines: ["See you on the board,", "Gabriel"] },
    ],
    reason: "You got this email because you've played Games of the Generals at generalsonline.app.",
  });
}

// ---------------------------------------------------------------------------
// Internal

export function testEmail(): RenderedEmail {
  return renderEmail({
    subject: "Test email",
    preheader: "Email sending works.",
    blocks: [
      { kind: "heading", text: "Email sending", accent: "works" },
      { kind: "paragraph", text: "This test was sent from Convex through Cloudflare Email Sending." },
    ],
    reason: "You got this email because someone ran the email test.",
  });
}
