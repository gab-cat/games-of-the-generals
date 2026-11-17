import { describe, expect, test } from "bun:test";
import { formatCentavos, quotePlan } from "../convex/lib/planPricing";

describe("quotePlan", () => {
  test("one month is the list price", () => {
    expect(quotePlan("pro", 1)).toMatchObject({ totalCentavos: 9900, savingsCentavos: 0, discountPercent: 0 });
    expect(quotePlan("pro_plus", 1).totalCentavos).toBe(19900);
  });

  test("longer terms get the published discounts", () => {
    expect(quotePlan("pro", 3)).toMatchObject({ totalCentavos: 25245, originalCentavos: 29700, discountPercent: 15 });
    expect(quotePlan("pro", 6)).toMatchObject({ totalCentavos: 47520, discountPercent: 20 });
    expect(quotePlan("pro", 12)).toMatchObject({ totalCentavos: 89100, savingsCentavos: 29700, discountPercent: 25 });
    expect(quotePlan("pro_plus", 12).totalCentavos).toBe(179100);
  });

  test("per month is the total spread over the term", () => {
    expect(quotePlan("pro", 12).perMonthCentavos).toBe(7425);
    expect(quotePlan("pro_plus", 3).perMonthCentavos).toBe(16915);
  });

  test("an unlisted term has no discount", () => {
    expect(quotePlan("pro", 2)).toMatchObject({ totalCentavos: 19800, discountPercent: 0 });
  });
});

describe("formatCentavos", () => {
  test("drops centavos only on whole pesos", () => {
    expect(formatCentavos(9900)).toBe("₱99");
    expect(formatCentavos(25245)).toBe("₱252.45");
    expect(formatCentavos(179100)).toBe("₱1,791");
    expect(formatCentavos(47520)).toBe("₱475.20");
  });
});
