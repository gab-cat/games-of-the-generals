import { ReactNode } from "react";
import { AlertCircle, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";

interface SettingsCardProps {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "danger";
  className?: string;
  id?: string;
}

/**
 * One section of the settings page: a flat card with a plain title, one line
 * of help and the controls. Rises in as a child of the page's stagger.
 */
export function SettingsCard({
  children,
  title,
  description,
  action,
  className,
  variant = "default",
  id,
}: SettingsCardProps) {
  return (
    <motion.section
      id={id}
      variants={fadeUp}
      className={cn(
        "rounded-lg border bg-card",
        variant === "danger" ? "border-red-500/30" : "border-border",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-foreground/80">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </motion.section>
  );
}

interface FieldProps {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}

/** A label, the control, then a hint or an inline error under it. */
export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-medium text-foreground"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-xs text-red-400"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-foreground/70">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type SaveStatus = { kind: "success" | "error"; message: string } | null;

/** Result of the last save, shown next to the button. */
export function SaveMessage({ status }: { status: SaveStatus }) {
  if (!status) return null;
  const ok = status.kind === "success";
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-1.5 text-sm",
        ok ? "text-emerald-400" : "text-red-400",
      )}
    >
      {ok ? (
        <Check className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{status.message}</span>
    </p>
  );
}

/** Raw backend errors are never shown. Map the ones we know, else a fallback. */
export function plainError(error: unknown, fallback: string): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const lower = raw.toLowerCase();
  if (lower.includes("already taken") || lower.includes("already exists"))
    return "That one is already taken. Try another.";
  if (lower.includes("between 3 and 20")) return "Use 3 to 20 characters.";
  if (lower.includes("can only contain"))
    return "Use letters, numbers, underscores and hyphens only.";
  if (lower.includes("not authenticated"))
    return "You are signed out. Sign in again and retry.";
  if (lower.includes("rate") && lower.includes("limit"))
    return "Too many tries. Wait a minute and try again.";
  if (
    raw &&
    raw.length < 140 &&
    !/convex|server error|request id|\[|uncaught|\bat\b.*:\d+/i.test(raw)
  )
    return raw;
  return fallback;
}
