/**
 * Plan prices and term discounts. The server charges with `quotePlan` and the
 * pricing page and payment dialog show the same numbers, so what players see is
 * what PayMongo charges, to the centavo. Pure module: no Convex imports.
 */

export type PaidTier = "pro" | "pro_plus";

/** Monthly price in centavos. */
export const TIER_PRICE_CENTAVOS: Record<PaidTier, number> = {
  pro: 9900, // ₱99
  pro_plus: 19900, // ₱199
};

/** The terms players can pick. `monthsToPay` is what the term costs in months. */
export const PLAN_TERMS = [
  { months: 1, monthsToPay: 1, discountPercent: 0 },
  { months: 3, monthsToPay: 2.55, discountPercent: 15 },
  { months: 6, monthsToPay: 4.8, discountPercent: 20 },
  { months: 12, monthsToPay: 9, discountPercent: 25 },
] as const;

export type PlanMonths = (typeof PLAN_TERMS)[number]["months"];

export interface PlanQuote {
  months: number;
  /** Full price without the discount, in centavos. */
  originalCentavos: number;
  /** What the player pays, in centavos. */
  totalCentavos: number;
  savingsCentavos: number;
  discountPercent: number;
  /** The total spread over the months, rounded to the centavo. */
  perMonthCentavos: number;
}

export function quotePlan(tier: PaidTier, months: number): PlanQuote {
  const base = TIER_PRICE_CENTAVOS[tier];
  const term = PLAN_TERMS.find((t) => t.months === months);
  // Any other month count is allowed by the server and gets no discount.
  const monthsToPay = term ? term.monthsToPay : months;
  const originalCentavos = base * months;
  const totalCentavos = Math.round(base * monthsToPay);
  return {
    months,
    originalCentavos,
    totalCentavos,
    savingsCentavos: originalCentavos - totalCentavos,
    discountPercent: term ? term.discountPercent : 0,
    perMonthCentavos: Math.round(totalCentavos / months),
  };
}

/** "₱99", "₱252.45", "₱1,791". Whole pesos drop the centavos. */
export function formatCentavos(centavos: number): string {
  const pesos = centavos / 100;
  const whole = centavos % 100 === 0;
  return `₱${pesos.toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
