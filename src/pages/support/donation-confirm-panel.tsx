import { useId, useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { format } from "date-fns";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { QR_METHOD_LABEL, formatPesos } from "../../../convex/lib/qrDonation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp } from "@/lib/motion";

type Report = NonNullable<Doc<"supportTickets">["donationReport"]>;

/**
 * Admin view of a QR Ph donation report. Check the reference in the Maya app,
 * then confirm the amount that actually arrived.
 */
export function DonationConfirmPanel({
  ticketId,
  username,
  report,
}: {
  ticketId: Id<"supportTickets">;
  username: string;
  report: Report;
}) {
  const id = useId();
  const [amount, setAmount] = useState(String(report.amountCentavos / 100));
  const [pending, setPending] = useState(false);
  const confirm = useMutation(api.qrDonations.confirmQrDonation);

  const handleConfirm = async () => {
    setPending(true);
    try {
      const result = await confirm({ ticketId, amount: Number(amount) });
      toast.success(
        result.isDonor
          ? `Confirmed. ${username} is a donor now.`
          : `Confirmed. ${username} has given ${formatPesos(result.totalDonated)} in total.`,
      );
    } catch (error) {
      toast.error(
        error instanceof ConvexError && typeof error.data === "string"
          ? error.data
          : "Could not confirm the donation. Try again.",
      );
    } finally {
      setPending(false);
    }
  };

  const rows: Array<[string, string]> = [
    ["Reported", formatPesos(report.amountCentavos)],
    ["Paid with", QR_METHOD_LABEL[report.method]],
    ["Reference", report.reference],
  ];

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="show"
      aria-label="Donation report"
      className="mb-6 rounded-lg border border-border bg-card p-4"
    >
      <dl className="grid grid-cols-3 gap-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-foreground/75">{label}</dt>
            <dd className="mt-0.5 break-all font-medium tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      {report.confirmedAt ? (
        <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-foreground">
          <Check className="size-4 text-emerald-400" aria-hidden="true" />
          Confirmed {formatPesos(report.confirmedAmountCentavos ?? report.amountCentavos)} on{" "}
          {format(new Date(report.confirmedAt), "MMM d, yyyy, h:mm a")}
        </p>
      ) : (
        <form
          className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void handleConfirm();
          }}
        >
          <div className="flex-1 space-y-1.5">
            <label htmlFor={`${id}-amount`} className="block text-[13px] font-medium text-foreground">
              Amount that arrived
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-foreground/70">
                ₱
              </span>
              <Input
                id={`${id}-amount`}
                type="number"
                inputMode="decimal"
                min={1}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 tabular-nums"
                disabled={pending}
              />
            </div>
          </div>
          <Button type="submit" disabled={pending || !(Number(amount) > 0)}>
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            {pending ? "Confirming" : "Confirm donation"}
          </Button>
        </form>
      )}
      {!report.confirmedAt && (
        <p className="mt-2 text-xs text-foreground/75">
          Not in the account? Reply in the thread below and close the ticket.
        </p>
      )}
    </motion.section>
  );
}
