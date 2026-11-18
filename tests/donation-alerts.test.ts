import { describe, expect, test } from "bun:test";
import {
  BATCH_WINDOW_MS,
  MIN_GAP_MS,
  REMIND_AFTER_MS,
  type WaitingReport,
  digestPending,
  nextDigestAt,
  planDigest,
} from "../convex/lib/donationAlerts";
import { donationReportsEmail } from "../convex/emails/templates";

const now = Date.UTC(2026, 10, 18, 8, 0);
const report = (id: string, ageMs: number, alerted?: boolean): WaitingReport => ({
  ticketId: id,
  username: `player-${id}`,
  amountCentavos: 10000,
  method: "gcash",
  reference: `REF${id}`,
  createdAt: now - ageMs,
  alertedAt: alerted ? now - ageMs + 1 : undefined,
});

describe("nextDigestAt", () => {
  test("first report after a quiet spell waits for the batch window", () => {
    expect(nextDigestAt(now)).toBe(now + BATCH_WINDOW_MS);
    expect(nextDigestAt(now, now - 5 * MIN_GAP_MS)).toBe(now + BATCH_WINDOW_MS);
  });

  test("keeps at least an hour between emails", () => {
    expect(nextDigestAt(now, now - 20 * 60_000)).toBe(now - 20 * 60_000 + MIN_GAP_MS);
  });
});

describe("digestPending", () => {
  test("a send in the future is pending; none or a long-lost one is not", () => {
    expect(digestPending(now + 1000, now)).toBe(true);
    expect(digestPending(undefined, now)).toBe(false);
    expect(digestPending(now - 60 * 60_000, now)).toBe(false);
  });
});

describe("planDigest", () => {
  test("new mode skips when every report was already emailed", () => {
    expect(planDigest("new", [report("a", 5000, true)], now)).toBeNull();
    expect(planDigest("new", [], now)).toBeNull();
  });

  test("new mode lists new reports first, then older ones oldest first", () => {
    const plan = planDigest(
      "new",
      [report("old2", 2 * REMIND_AFTER_MS, true), report("new", 60_000), report("old1", 3 * REMIND_AFTER_MS, true)],
      now,
    );
    expect(plan?.reports.map((r) => r.ticketId)).toEqual(["new", "old1", "old2"]);
    expect(plan?.newIds).toEqual(["new"]);
    expect(plan?.overdueCount).toBe(2);
  });

  test("reminder mode sends only when something waited over a day", () => {
    expect(planDigest("reminder", [report("a", REMIND_AFTER_MS - 1, true)], now)).toBeNull();
    const plan = planDigest("reminder", [report("a", REMIND_AFTER_MS, true), report("b", 1000)], now);
    expect(plan?.overdueCount).toBe(1);
    expect(plan?.reports).toHaveLength(2);
    expect(plan?.newIds).toEqual(["b"]);
  });
});

describe("donationReportsEmail", () => {
  const base = { ticketId: "t1", username: "Marco", methodLabel: "GCash", reference: "123", createdAt: now - 12 * 60_000 };

  test("one new report names the player and amount", () => {
    const email = donationReportsEmail({
      mode: "new",
      now,
      overdueCount: 0,
      reports: [{ ...base, amountCentavos: 10000, isNew: true }],
    });
    expect(email.subject).toBe("New donation: ₱100 from Marco");
    expect(email.text).toContain("GCash · Ref 123 · 12 minutes ago");
    expect(email.text).toContain("/admin/tickets?ticketId=t1");
  });

  test("several new reports are summed in the subject", () => {
    const email = donationReportsEmail({
      mode: "new",
      now,
      overdueCount: 0,
      reports: [
        { ...base, amountCentavos: 10000, isNew: true },
        { ...base, ticketId: "t2", amountCentavos: 25050, isNew: true },
        { ...base, ticketId: "t3", amountCentavos: 5000, isNew: false },
      ],
    });
    expect(email.subject).toBe("2 new donation reports, ₱350.5 in total");
    expect(email.preheader).toBe("1 older report still waiting too.");
  });

  test("reminder subject counts overdue reports and escapes player names", () => {
    const email = donationReportsEmail({
      mode: "reminder",
      now,
      overdueCount: 1,
      reports: [{ ...base, username: "<b>x</b>", amountCentavos: 5000, isNew: false }],
    });
    expect(email.subject).toBe("1 donation report waiting over a day");
    expect(email.html).not.toContain("<b>x</b>");
  });
});
