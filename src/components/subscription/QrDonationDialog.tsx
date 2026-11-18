import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Download, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  DONOR_THRESHOLD_CENTAVOS,
  MAX_NOTE_LENGTH,
  QR_METHODS,
  QR_METHOD_LABEL,
  type QrMethod,
  cleanQrReport,
  formatPesos,
} from "../../../convex/lib/qrDonation";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/*
 * Donate by QR Ph: GCash, Maya and bank apps all scan the same InstaPay code.
 * 1. "scan": the QR, with a download for players on a phone.
 * 2. "report": what they sent, which opens a donation ticket.
 * 3. "done": the ticket link and what happens next.
 * An admin confirms the ticket (confirmQrDonation) once the money arrives.
 */

const QR_SRC = "/donate/qrph.jpg";
const QUICK_AMOUNTS = [50, 100, 200, 500];

type Step = "scan" | "report" | "done";

function errorText(error: unknown, fallback: string) {
  return error instanceof ConvexError && typeof error.data === "string"
    ? error.data
    : fallback;
}

export function QrDonationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<Step>("scan");
  const [ticketId, setTicketId] = useState<Id<"supportTickets"> | null>(null);
  const [sentAmount, setSentAmount] = useState(0);

  // Start over each time it opens.
  useEffect(() => {
    if (open) {
      setStep("scan");
      setTicketId(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92dvh] overflow-y-auto outline-none sm:max-w-md"
        // Focus the dialog, not the first button, so no ring shows before
        // anyone touches the keyboard. Steps swap content, so focus lands here too.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: step === "scan" ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {step === "scan" && <ScanStep onSent={() => setStep("report")} />}
            {step === "report" && (
              <ReportStep
                onBack={() => setStep("scan")}
                onReported={(id, amount) => {
                  setTicketId(id);
                  setSentAmount(amount);
                  setStep("done");
                }}
              />
            )}
            {step === "done" && ticketId && (
              <DoneStep
                ticketId={ticketId}
                amountCentavos={sentAmount}
                onClose={() => onOpenChange(false)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function ScanStep({ onSent }: { onSent: () => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Donate with QR Ph</DialogTitle>
        <DialogDescription className="text-foreground">
          Scan with GCash, Maya or any bank app. Send any amount, then tell us
          what you sent. ₱50 or more gets the donor badge and profile frame.
        </DialogDescription>
      </DialogHeader>

      <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-md border border-border bg-white">
        <img
          src={QR_SRC}
          alt="QR Ph code for Gabriel Angelo Catimbang's Maya account"
          width={890}
          height={1000}
          className="block h-auto w-full"
        />
      </div>

      <p className="text-sm text-foreground">
        On your phone? Save the image, then use Upload QR in your app's
        scanner.
      </p>

      {/* On phones "Save QR image" comes first, since that's the first step there. */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row-reverse">
        <Button onClick={onSent} className="sm:flex-1">
          I sent it
        </Button>
        <Button variant="secondary" asChild className="sm:flex-1">
          <a href={QR_SRC} download="games-of-the-generals-qrph.jpg">
            <Download />
            Save QR image
          </a>
        </Button>
      </div>
    </>
  );
}

function ReportStep({
  onBack,
  onReported,
}: {
  onBack: () => void;
  onReported: (ticketId: Id<"supportTickets">, amountCentavos: number) => void;
}) {
  const ids = useId();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<QrMethod>("gcash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: settings } = useConvexQuery(api.settings.getUserSettings);
  const isGuest = settings?.isAnonymous === true;

  const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl);
  const reportQrDonation = useMutation(api.qrDonations.reportQrDonation);

  useEffect(
    () => () => {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    },
    [receiptPreview],
  );

  const pickReceipt = async (file: File) => {
    const { validateImageFile, compressImage } = await import("@/lib/image-utils");
    const check = validateImageFile(file);
    if (!check.valid) {
      toast.error(check.error);
      return;
    }
    try {
      const blob = await compressImage(file, 1000, 0.8, "fit");
      setReceipt(new File([blob], file.name, { type: blob.type }));
      setReceiptPreview(URL.createObjectURL(blob));
    } catch {
      toast.error("Could not read that image. Try another one.");
    }
  };

  const removeReceipt = () => {
    setReceipt(null);
    setReceiptPreview(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pesos = Number(amount);
    const cleaned = cleanQrReport({ amount: pesos, reference, note });
    if (!cleaned.ok) {
      setError(cleaned.error);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      let receiptStorageId: Id<"_storage"> | undefined;
      if (receipt) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": receipt.type },
          body: receipt,
        });
        if (!res.ok) throw new Error("upload failed");
        receiptStorageId = ((await res.json()) as { storageId: Id<"_storage"> }).storageId;
      }
      const ticketId = await reportQrDonation({
        amount: pesos,
        method,
        reference,
        note: note.trim() || undefined,
        receiptStorageId,
      });
      onReported(ticketId, cleaned.value.amountCentavos);
    } catch (err) {
      setError(errorText(err, "Could not send your report. Check your connection and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const label = "block text-[13px] font-medium text-foreground";

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle>Tell us what you sent</DialogTitle>
        <DialogDescription className="text-foreground">
          We match it with the transfer, usually within a day, then turn on
          your donor badge.
        </DialogDescription>
      </DialogHeader>

      {isGuest && (
        <p role="alert" className="rounded-md border border-gold-500/40 bg-gold-500/10 p-3 text-sm text-foreground">
          Guest accounts are deleted every day. Save your account first so your
          donor badge stays with you.
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor={`${ids}-amount`} className={label}>
          Amount sent
        </label>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={amount === String(value)}
              onClick={() => setAmount(String(value))}
              className={cn(
                "h-10 rounded-md border text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]",
                amount === String(value)
                  ? "border-gold-500/60 bg-gold-500/10 text-foreground"
                  : "border-border bg-white/[0.04] text-foreground hover:border-border-strong hover:bg-white/[0.08]",
              )}
            >
              ₱{value}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-foreground/70">
            ₱
          </span>
          <Input
            id={`${ids}-amount`}
            type="number"
            inputMode="decimal"
            min={1}
            step="0.01"
            placeholder="Another amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-7 tabular-nums"
            required
          />
        </div>
      </div>

      <fieldset className="space-y-1.5">
        <legend className={cn(label, "mb-1.5")}>Paid with</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
          {QR_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={method === m}
              onClick={() => setMethod(m)}
              className={cn(
                "h-10 rounded-md border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-[0.98]",
                method === m
                  ? "border-gold-500/60 bg-gold-500/10 font-medium text-foreground"
                  : "border-border bg-white/[0.04] text-foreground hover:border-border-strong hover:bg-white/[0.08]",
              )}
            >
              {QR_METHOD_LABEL[m]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor={`${ids}-ref`} className={label}>
          Reference number
        </label>
        <Input
          id={`${ids}-ref`}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="From your receipt, e.g. 1234 567 890123"
          autoComplete="off"
          maxLength={60}
          required
        />
      </div>

      <div className="space-y-1.5">
        <span className={label}>Receipt screenshot (optional)</span>
        {receiptPreview ? (
          <div className="flex items-center gap-3 rounded-md border border-border p-2">
            <img
              src={receiptPreview}
              alt="Your receipt"
              className="h-14 w-10 rounded-[4px] object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {receipt?.name}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={removeReceipt}>
              <X />
              Remove
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlus />
            Add screenshot
          </Button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pickReceipt(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${ids}-note`} className={label}>
          Note (optional)
        </label>
        <Textarea
          id={`${ids}-note`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          placeholder="Anything we should know"
          className="min-h-[64px] resize-none"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button type="submit" disabled={submitting || isGuest} className="sm:flex-1">
          {submitting ? (
            <>
              <Loader2 className="animate-spin" />
              Sending
            </>
          ) : (
            "Send report"
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          <ArrowLeft />
          Back to QR
        </Button>
      </div>
    </form>
  );
}

function DoneStep({
  ticketId,
  amountCentavos,
  onClose,
}: {
  ticketId: Id<"supportTickets">;
  amountCentavos: number;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="mb-1 inline-flex size-10 items-center justify-center self-start text-gold-400"
          aria-hidden="true"
        >
          <Check className="size-8" strokeWidth={2.5} />
        </motion.span>
        <DialogTitle>Thank you</DialogTitle>
        <DialogDescription className="text-foreground">
          We got your report of {formatPesos(amountCentavos)}. Once we see it
          in the account, usually within a day, we'll confirm it in your
          support ticket
          {amountCentavos >= DONOR_THRESHOLD_CENTAVOS ? " and turn on your donor badge" : ""}.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button onClick={onClose} className="sm:flex-1">
          Done
        </Button>
        <Button variant="secondary" asChild className="sm:flex-1">
          <Link to="/support" search={{ ticketId }} onClick={onClose}>
            View ticket
          </Link>
        </Button>
      </div>
    </>
  );
}
