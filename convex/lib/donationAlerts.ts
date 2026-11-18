/*
 * When admins get an email about QR Ph donation reports, and what it lists.
 * Pure functions, so the timing rules are tested without a backend.
 *
 * - The first report after a quiet spell opens a 10-minute window; anything
 *   reported in it joins the same email, so a burst is one email.
 * - Alert emails go out at most once an hour.
 * - Every morning, reports waiting longer than a day get one reminder.
 * Each email lists everything still waiting, newest reports first, so it
 * works as a checklist against the Maya transaction history.
 */
import type { QrMethod } from "./qrDonation";

export const BATCH_WINDOW_MS = 10 * 60_000;
export const MIN_GAP_MS = 60 * 60_000;
export const REMIND_AFTER_MS = 24 * 60 * 60_000;
/** A scheduled send this far in the past never ran (e.g. a deploy dropped it); schedule again. */
const LOST_AFTER_MS = 15 * 60_000;

export function nextDigestAt(now: number, lastSentAt?: number): number {
  return Math.max(now + BATCH_WINDOW_MS, (lastSentAt ?? 0) + MIN_GAP_MS);
}

export function digestPending(scheduledFor: number | undefined, now: number): boolean {
  return scheduledFor !== undefined && scheduledFor > now - LOST_AFTER_MS;
}

export type WaitingReport = {
  ticketId: string;
  username: string;
  amountCentavos: number;
  method: QrMethod;
  reference: string;
  createdAt: number;
  alertedAt?: number;
};

export type DigestMode = "new" | "reminder";

export type DigestPlan = {
  mode: DigestMode;
  /** Everything waiting: reports not in an email yet first, then oldest first. */
  reports: Array<WaitingReport & { isNew: boolean }>;
  /** Reports this email is the first to mention; they get marked as alerted. */
  newIds: string[];
  overdueCount: number;
};

/** What to send, or null when there's nothing worth an email. */
export function planDigest(
  mode: DigestMode,
  waiting: WaitingReport[],
  now: number,
): DigestPlan | null {
  const newIds = waiting.filter((r) => r.alertedAt === undefined).map((r) => r.ticketId);
  const overdueCount = waiting.filter((r) => r.createdAt <= now - REMIND_AFTER_MS).length;

  if (mode === "new" && newIds.length === 0) return null;
  if (mode === "reminder" && overdueCount === 0) return null;

  const reports = waiting
    .map((r) => ({ ...r, isNew: r.alertedAt === undefined }))
    .sort((a, b) => Number(b.isNew) - Number(a.isNew) || a.createdAt - b.createdAt);

  return { mode, reports, newIds, overdueCount };
}
