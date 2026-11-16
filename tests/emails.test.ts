import { describe, expect, test } from "bun:test";
import { EMAIL_CATALOG } from "../convex/emails/catalog";
import { escapeHtml } from "../convex/emails/layout";
import { banEmail, formatDuration, muteEmail, relaunchEmail } from "../convex/emails/templates";

describe("formatDuration", () => {
  test("rounds to the largest whole unit", () => {
    expect(formatDuration(15 * 60_000)).toBe("15 minutes");
    expect(formatDuration(60 * 60_000)).toBe("1 hour");
    expect(formatDuration(3 * 60 * 60_000)).toBe("3 hours");
    expect(formatDuration(24 * 60 * 60_000)).toBe("1 day");
    expect(formatDuration(7 * 24 * 60 * 60_000)).toBe("7 days");
  });

  test("no duration means no end date", () => {
    expect(formatDuration(undefined)).toBeUndefined();
    expect(formatDuration(0)).toBeUndefined();
  });
});

describe("every catalog email", () => {
  for (const entry of EMAIL_CATALOG) {
    test(`${entry.id} renders complete HTML and text`, () => {
      const email = entry.render();
      expect(email.subject.length).toBeGreaterThan(0);
      expect(email.preheader.length).toBeGreaterThan(0);
      expect(email.html).toStartWith("<!DOCTYPE html>");
      expect(email.html).toContain(escapeHtml(email.preheader));
      // Bold markers are converted, never shown raw.
      expect(email.html).not.toContain("**");
      expect(email.text).not.toContain("**");
      expect(email.text).not.toContain("<");
      expect(email.text).toContain("generalsonline.app");
    });
  }

  test("ids are unique", () => {
    const ids = EMAIL_CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("user-provided text is escaped", () => {
  test("usernames and reasons cannot inject HTML", () => {
    const email = banEmail({
      username: "<img src=x onerror=alert(1)>",
      moderatorUsername: "mod",
      reason: "<script>alert(1)</script>",
    });
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain(escapeHtml("<script>alert(1)</script>"));
  });
});

describe("copy follows the facts", () => {
  test("a permanent ban says there is no end date", () => {
    const email = banEmail({ username: "a", moderatorUsername: "b" });
    expect(email.text).toContain("No end date");
    expect(email.text).toContain("until the ban is lifted");
  });

  test("a mute without a reason has no reason block", () => {
    const email = muteEmail({ username: "a", moderatorUsername: "b", durationMs: 60 * 60_000 });
    expect(email.text).not.toContain("Reason:");
    expect(email.text).toContain("Muted for: 1 hour");
  });

  test("the relaunch email uses the player's own record and sign-in method", () => {
    const email = relaunchEmail({
      username: "Rizal",
      rank: "Captain",
      gamesPlayed: 1203,
      wins: 640,
      signInMethod: "password",
    });
    expect(email.text).toContain("Hi Rizal,");
    expect(email.text).toContain("Your rank: Captain");
    expect(email.text).toContain("Games: 1,203");
    expect(email.text).toContain("Forgot password?");
  });
});
