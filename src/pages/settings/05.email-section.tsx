import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  useConvexQuery,
  useConvexMutationWithQuery,
} from "../../lib/convex-query-hooks";
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { getRouteApi } from "@tanstack/react-router";
import {
  Field,
  SaveMessage,
  SettingsCard,
  plainError,
  type SaveStatus,
} from "./components/SettingsCard";
import { PasswordInput } from "./components/PasswordInput";

const route = getRouteApi("/settings");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailSectionProps {
  currentEmail?: string;
}

export function EmailSection({ currentEmail }: EmailSectionProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [status, setStatus] = useState<SaveStatus>(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isRequestingEmailChange, setIsRequestingEmailChange] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const search = route.useSearch();
  const { data: userSettings } = useConvexQuery(api.settings.getUserSettings);
  const { data: pendingEmailChange } = useConvexQuery(
    api.settings.getPendingEmailChange,
  );

  const requestEmailChange = useConvexAction(api.settings.requestEmailChange);

  const verifyEmailChange = useConvexMutationWithQuery(
    api.settings.verifyEmailChange,
    {
      onSuccess: (result: any) => {
        setStatus({
          kind: "success",
          message: result?.message || "Email changed.",
        });
        setShowVerificationForm(false);
        setVerificationCode("");
      },
      onError: (err: any) => {
        setStatus({
          kind: "error",
          message: plainError(
            err,
            "That code did not work. Check it and try again.",
          ),
        });
      },
    },
  );

  const cancelEmailChange = useConvexMutationWithQuery(
    api.settings.cancelEmailChange,
    {
      onSuccess: () => {
        setShowVerificationForm(false);
        setVerificationCode("");
        setStatus({ kind: "success", message: "Email change cancelled." });
      },
      onError: (err: any) => {
        setStatus({
          kind: "error",
          message: plainError(err, "Could not cancel the change. Try again."),
        });
      },
    },
  );

  const convertAnonymousAccount = useConvexAction(
    api.settings.convertAnonymousAccount,
  );

  // A pending change keeps the code form open, also after a reload.
  useEffect(() => {
    if (pendingEmailChange) {
      setShowVerificationForm(true);
      setShowEmailChange(false);
    }
  }, [pendingEmailChange]);

  const isAnonymous = userSettings?.isAnonymous;
  const trimmedEmail = email.trim();
  const emailError =
    touched.email && !trimmedEmail
      ? "Enter an email address."
      : touched.email && !EMAIL_PATTERN.test(trimmedEmail)
        ? "That does not look like an email address."
        : null;
  const passwordError =
    touched.password && !password
      ? "Choose a password."
      : touched.password && password.length < 8
        ? "Use at least 8 characters."
        : null;

  const handleRequestEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched((t) => ({ ...t, email: true }));
    setStatus(null);
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) return;

    setIsRequestingEmailChange(true);
    requestEmailChange({ newEmail: trimmedEmail })
      .then((result) => {
        setStatus({ kind: "success", message: result.message });
        setShowEmailChange(false);
        setShowVerificationForm(true);
        setEmail("");
        setTouched({ email: false, password: false });
      })
      .catch((err) => {
        setStatus({
          kind: "error",
          message: plainError(err, "Could not send the code. Try again."),
        });
      })
      .finally(() => {
        setIsRequestingEmailChange(false);
      });
  };

  const handleVerifyEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!verificationCode.trim()) {
      setStatus({ kind: "error", message: "Enter the code from the email." });
      return;
    }
    verifyEmailChange.mutate({ verificationCode: verificationCode.trim() });
  };

  const handleCancelEmailChange = () => {
    setStatus(null);
    cancelEmailChange.mutate({});
  };

  const handleConvertAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setStatus(null);
    if (
      !trimmedEmail ||
      !EMAIL_PATTERN.test(trimmedEmail) ||
      password.length < 8
    ) {
      return;
    }

    setIsConverting(true);
    convertAnonymousAccount({
      email: trimmedEmail,
      password: password.trim(),
    })
      .then((result) => {
        setStatus({ kind: "success", message: result.message });
        setEmail("");
        setPassword("");
        // Reload so the page shows the full account settings.
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      })
      .catch((err) => {
        setStatus({
          kind: "error",
          message: plainError(err, "Could not save the account. Try again."),
        });
        setIsConverting(false);
      });
  };

  if (isAnonymous) {
    return (
      <SettingsCard
        id="keep-account"
        title="Keep this account"
        description="Add an email and password to keep this account. Guest accounts are deleted every day at 00:00 UTC."
      >
        <form onSubmit={handleConvertAccount} className="space-y-4" noValidate>
          <Field
            label="Email"
            htmlFor="settings-convert-email"
            error={emailError}
          >
            <Input
              id="settings-convert-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus={search.convert === "1"}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus(null);
              }}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={!!emailError}
              disabled={isConverting}
            />
          </Field>
          <Field
            label="Password"
            htmlFor="settings-convert-password"
            hint="At least 8 characters."
            error={passwordError}
          >
            <PasswordInput
              id="settings-convert-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setStatus(null);
              }}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              aria-invalid={!!passwordError}
              disabled={isConverting}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isConverting}>
              {isConverting && <Loader2 className="animate-spin" />}
              {isConverting ? "Saving" : "Keep this account"}
            </Button>
            <SaveMessage status={status} />
          </div>
        </form>
      </SettingsCard>
    );
  }

  const busy =
    isRequestingEmailChange ||
    verifyEmailChange.isPending ||
    cancelEmailChange.isPending;

  return (
    <SettingsCard
      title="Email"
      description="We use it for sign in and account recovery."
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="text-[13px] font-medium text-foreground">
            Current email
          </div>
          <div className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-white/[0.02] px-3 py-2 text-sm text-foreground">
            <Check className="size-4 shrink-0 text-emerald-400" />
            <span className="min-w-0 break-all">
              {currentEmail || "No email set"}
            </span>
          </div>
        </div>

        {pendingEmailChange && (
          <div className="rounded-md border border-gold-500/30 bg-gold-500/10 p-3 text-sm text-foreground">
            <p>
              We sent a code to your current address to confirm the change to{" "}
              <strong className="break-all font-semibold">
                {pendingEmailChange.newEmail}
              </strong>
              .
            </p>
            <p className="mt-1 text-xs text-foreground/80">
              The code expires at{" "}
              {new Date(pendingEmailChange.expiresAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
              .
            </p>
          </div>
        )}

        {showVerificationForm ? (
          <form
            onSubmit={handleVerifyEmailChange}
            className="space-y-4"
            noValidate
          >
            <Field label="Code from the email" htmlFor="settings-email-code">
              <Input
                id="settings-email-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                  setStatus(null);
                }}
                maxLength={6}
                className="tabular-nums tracking-[0.3em] sm:max-w-[10rem]"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="secondary" disabled={busy}>
                {verifyEmailChange.isPending && (
                  <Loader2 className="animate-spin" />
                )}
                {verifyEmailChange.isPending ? "Checking" : "Confirm change"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelEmailChange}
                disabled={busy}
              >
                {cancelEmailChange.isPending
                  ? "Cancelling"
                  : "Cancel the change"}
              </Button>
              <SaveMessage status={status} />
            </div>
          </form>
        ) : showEmailChange ? (
          <form
            onSubmit={handleRequestEmailChange}
            className="space-y-4"
            noValidate
          >
            <Field
              label="New email"
              htmlFor="settings-new-email"
              hint="We email a code to your current address to confirm."
              error={emailError}
            >
              <Input
                id="settings-new-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setStatus(null);
                }}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                aria-invalid={!!emailError}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="secondary" disabled={busy}>
                {isRequestingEmailChange && (
                  <Loader2 className="animate-spin" />
                )}
                {isRequestingEmailChange ? "Sending" : "Send code"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowEmailChange(false);
                  setEmail("");
                  setStatus(null);
                  setTouched({ email: false, password: false });
                }}
              >
                Cancel
              </Button>
              <SaveMessage status={status} />
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setStatus(null);
                setShowEmailChange(true);
              }}
              disabled={!!pendingEmailChange}
            >
              Change email
            </Button>
            <SaveMessage status={status} />
          </div>
        )}
      </div>
    </SettingsCard>
  );
}
