/*
 * Rules for QR Ph donation reports, shared by the Convex functions and the
 * report form so both reject the same input with the same words.
 */

export const QR_METHODS = ["gcash", "maya", "bank", "other"] as const;
export type QrMethod = (typeof QR_METHODS)[number];

export const QR_METHOD_LABEL: Record<QrMethod, string> = {
  gcash: "GCash",
  maya: "Maya",
  bank: "Bank app",
  other: "Other",
};

export const MIN_AMOUNT_PESOS = 1;
export const MAX_AMOUNT_PESOS = 100_000;
export const DONOR_THRESHOLD_CENTAVOS = 5_000; // ₱50, same as PayMongo donations
/** Reports a player can have waiting at once, so the queue can't be flooded. */
export const MAX_PENDING_REPORTS = 3;
export const MAX_NOTE_LENGTH = 500;

export type QrReportInput = {
  amount: number; // pesos, as typed
  reference: string;
  note?: string;
};

export type CleanQrReport = {
  amountCentavos: number;
  reference: string;
  note: string | undefined;
};

/** Validates and normalises a report. Returns the error to show, or the clean values. */
export function cleanQrReport(
  input: QrReportInput,
): { ok: true; value: CleanQrReport } | { ok: false; error: string } {
  if (!Number.isFinite(input.amount) || input.amount < MIN_AMOUNT_PESOS) {
    return { ok: false, error: "Enter the amount you sent, ₱1 or more." };
  }
  if (input.amount > MAX_AMOUNT_PESOS) {
    return { ok: false, error: "That amount is too high. Check it and try again." };
  }
  const amountCentavos = Math.round(input.amount * 100);

  // Apps show references with spaces or dashes; keep letters and digits only.
  const reference = input.reference.replace(/[\s-]/g, "").toUpperCase();
  if (reference.length < 4 || reference.length > 40 || !/^[A-Z0-9]+$/.test(reference)) {
    return {
      ok: false,
      error: "Enter the reference number from your receipt (letters and numbers).",
    };
  }

  const note = input.note?.trim() || undefined;
  if (note && note.length > MAX_NOTE_LENGTH) {
    return { ok: false, error: `Keep the note under ${MAX_NOTE_LENGTH} characters.` };
  }

  return { ok: true, value: { amountCentavos, reference, note } };
}

export function formatPesos(centavos: number): string {
  const pesos = centavos / 100;
  return `₱${pesos.toLocaleString("en-PH", {
    minimumFractionDigits: Number.isInteger(pesos) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
