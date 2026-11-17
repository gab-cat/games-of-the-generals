// Every email with sample data, for the admin preview tab and "Send test".
import type { RenderedEmail } from "./layout";
import * as t from "./templates";

export type EmailGroup = "Announcements" | "Account" | "Moderation" | "Other";

export type CatalogEntry = {
  id: string;
  name: string;
  group: EmailGroup;
  /** When the app sends it. */
  trigger: string;
  render: () => RenderedEmail;
};

const sample = {
  username: "MarcoReyes",
  moderatorUsername: "gab-cat",
  reason: "Repeated insults toward other players in global chat.",
  day: 24 * 60 * 60 * 1000,
};

export const EMAIL_CATALOG: CatalogEntry[] = [
  {
    id: "relaunch",
    name: "Generals Online is back",
    group: "Announcements",
    trigger: "One-time send to players who finished at least one game",
    render: () =>
      t.relaunchEmail({
        username: sample.username,
        rank: "Lieutenant",
        gamesPlayed: 34,
        wins: 21,
        signInMethod: "google",
      }),
  },
  {
    id: "password-reset",
    name: "Password reset code",
    group: "Account",
    trigger: "Someone taps “Forgot password?” on the sign-in screen",
    render: () => t.passwordResetEmail("482913"),
  },
  {
    id: "email-change",
    name: "Email change code",
    group: "Account",
    trigger: "A player changes their email in Settings",
    render: () =>
      t.emailChangeEmail({
        code: "905127",
        currentEmail: "marco.reyes@gmail.com",
        newEmail: "marco@reyes.ph",
      }),
  },
  {
    id: "mute",
    name: "Chat mute",
    group: "Moderation",
    trigger: "A moderator mutes a player",
    render: () =>
      t.muteEmail({ ...sample, durationMs: sample.day }),
  },
  {
    id: "unmute",
    name: "Chat mute lifted",
    group: "Moderation",
    trigger: "A moderator lifts a mute",
    render: () => t.unmuteEmail({ ...sample, reason: "Mute served." }),
  },
  {
    id: "ban",
    name: "Account ban",
    group: "Moderation",
    trigger: "A moderator bans a player",
    render: () => t.banEmail({ ...sample, durationMs: 7 * sample.day }),
  },
  {
    id: "unban",
    name: "Ban lifted",
    group: "Moderation",
    trigger: "A moderator lifts a ban",
    render: () => t.unbanEmail({ ...sample, reason: "Appeal approved." }),
  },
  {
    id: "test",
    name: "Test email",
    group: "Other",
    trigger: "Run by hand to check that sending works",
    render: () => t.testEmail(),
  },
];

export function findCatalogEntry(id: string): CatalogEntry | undefined {
  return EMAIL_CATALOG.find((e) => e.id === id);
}
