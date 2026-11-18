import { describe, expect, test } from "bun:test";
import { cleanQrReport, formatPesos } from "../convex/lib/qrDonation";

describe("cleanQrReport", () => {
  test("accepts a normal report and converts pesos to centavos", () => {
    const r = cleanQrReport({ amount: 150.5, reference: "1234 567 890", note: "  keep it up " });
    expect(r).toEqual({
      ok: true,
      value: { amountCentavos: 15050, reference: "1234567890", note: "keep it up" },
    });
  });

  test("normalises reference spacing, dashes and case", () => {
    const r = cleanQrReport({ amount: 50, reference: "ab-12 cd-34" });
    expect(r.ok && r.value.reference).toBe("AB12CD34");
  });

  test("drops an empty note", () => {
    const r = cleanQrReport({ amount: 50, reference: "ABCD", note: "   " });
    expect(r.ok && r.value.note).toBeUndefined();
  });

  test.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY, 0.5])(
    "rejects amount %p",
    (amount) => {
      expect(cleanQrReport({ amount, reference: "ABCD1234" }).ok).toBe(false);
    },
  );

  test("rejects amounts over the cap", () => {
    expect(cleanQrReport({ amount: 100_001, reference: "ABCD1234" }).ok).toBe(false);
  });

  test.each(["", "12", "ref#123!", "x".repeat(41)])("rejects reference %p", (reference) => {
    expect(cleanQrReport({ amount: 100, reference }).ok).toBe(false);
  });

  test("rejects a note that is too long", () => {
    expect(cleanQrReport({ amount: 100, reference: "ABCD", note: "a".repeat(501) }).ok).toBe(false);
  });
});

describe("formatPesos", () => {
  test("whole and fractional amounts", () => {
    expect(formatPesos(5000)).toBe("₱50");
    expect(formatPesos(15050)).toBe("₱150.50");
    expect(formatPesos(123456700)).toBe("₱1,234,567");
  });
});
