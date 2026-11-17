/**
 * The lobby's "host a tournament here" invite. Copy and rules live here so the
 * banner, the prefilled ticket and the tests all agree.
 */

export const TOURNAMENT_EMAIL = "gab@generalsonline.app";

export const TOURNAMENT_SUBJECT = "Hosting a tournament";

/** What the organizer should tell us, used as the ticket's details hint. */
export const TOURNAMENT_DETAILS_HINT =
  "Tournament name, dates, how many players, and the format you have in mind.";

export const TOURNAMENT_MAILTO = `mailto:${TOURNAMENT_EMAIL}?subject=${encodeURIComponent(
  TOURNAMENT_SUBJECT,
)}&body=${encodeURIComponent(`${TOURNAMENT_DETAILS_HINT}\n\n`)}`;

export const DISMISS_STORAGE_KEY = "tournament-invite-dismissed-until";

/** Dismissing hides the invite for 30 days, then it comes back once. */
export const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/** True while a stored dismissal is still in effect. Bad values count as not dismissed. */
export function isDismissed(stored: string | null, now: number): boolean {
  if (!stored) return false;
  const until = Number(stored);
  return Number.isFinite(until) && now < until;
}

export function dismissedUntil(now: number): string {
  return String(now + DISMISS_DURATION_MS);
}
