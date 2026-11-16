/**
 * Plain wording for plan text. `pricing-tiers.ts` is the source of truth for
 * features, prices and limits; this only tidies how a feature line reads
 * (no "MK-2" codes, sentence case) without changing what it says.
 */
export function plainFeature(feature: string): string {
  const text = feature
    .replace(/\s*\(MK-\d\)/gi, "")
    .replace(/\bService Record\b/gi, "record")
    .trim();
  const lower = text.toLowerCase();
  const first = lower.charAt(0).toUpperCase() + lower.slice(1);
  return first
    .replace(/\bai\b/gi, "AI")
    .replace(/\bpro\+/g, "Pro+")
    .replace(/\bpro\b/g, "Pro")
    .replace(/\bstandard\b/g, "Standard");
}

export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString()}`;
}

export function pluralDays(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

export function formatLongDate(timestamp: number | null | undefined): string {
  if (!timestamp) return "Never";
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
