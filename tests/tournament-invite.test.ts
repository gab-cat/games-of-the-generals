import { describe, expect, test } from "bun:test";
import {
  DISMISS_DURATION_MS,
  TOURNAMENT_EMAIL,
  TOURNAMENT_MAILTO,
  TOURNAMENT_SUBJECT,
  dismissedUntil,
  isDismissed,
} from "../src/lib/tournament-invite";

describe("isDismissed", () => {
  const now = 1_800_000_000_000;

  test("shows the invite when nothing is stored", () => {
    expect(isDismissed(null, now)).toBe(false);
    expect(isDismissed("", now)).toBe(false);
  });

  test("hides it until the stored time, then shows it again", () => {
    const until = dismissedUntil(now);
    expect(Number(until)).toBe(now + DISMISS_DURATION_MS);
    expect(isDismissed(until, now + 1)).toBe(true);
    expect(isDismissed(until, now + DISMISS_DURATION_MS)).toBe(false);
  });

  test("treats a broken value as not dismissed", () => {
    expect(isDismissed("soon", now)).toBe(false);
  });
});

describe("TOURNAMENT_MAILTO", () => {
  test("goes to Gab with the subject filled in", () => {
    const url = new URL(TOURNAMENT_MAILTO);
    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe(TOURNAMENT_EMAIL);
    expect(url.searchParams.get("subject")).toBe(TOURNAMENT_SUBJECT);
  });
});
