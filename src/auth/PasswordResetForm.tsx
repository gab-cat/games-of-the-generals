import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordResetForm({ onBack }: { onBack: () => void }) {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"forgot" | { email: string }>("forgot");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToStep = (next: "forgot" | { email: string }) => {
    setError(null);
    setStep(next);
  };

  return (
    <div className="w-full">
      <h2 className="font-display text-2xl font-semibold text-foreground">
        {step === "forgot" ? "Reset your password" : "Enter the code"}
      </h2>
      <p className="mt-1.5 text-sm text-foreground/80">
        {step === "forgot"
          ? "Enter your email and we will send you a 6-digit code."
          : `We sent a code to ${step.email}. Enter it with your new password.`}
      </p>

      {step === "forgot" ? (
        <motion.form
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            setError(null);
            const formData = new FormData(e.currentTarget);
            formData.set("flow", "reset");

            signIn("password", formData)
              .then(() => {
                const email = formData.get("email") as string;
                setStep({ email });
                toast.success("Code sent. Check your email.");
                setSubmitting(false);
              })
              .catch((err) => {
                console.error("Password reset error:", err);
                setError(
                  String(err?.message ?? "").includes("Account not found")
                    ? "No account uses this email."
                    : "Couldn't send the code. Try again in a moment.",
                );
                setSubmitting(false);
              });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={submitting}
              aria-invalid={error ? true : undefined}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting && <Loader2 className="animate-spin" />}
            {submitting ? "Sending code" : "Send code"}
          </Button>
        </motion.form>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            setError(null);
            const formData = new FormData(e.currentTarget);
            formData.set("flow", "reset-verification");
            formData.set("email", step.email);

            signIn("password", formData)
              .then(() => {
                toast.success("Password updated. You're signed in.");
                setSubmitting(false);
              })
              .catch((err) => {
                console.error("Password reset verification error:", err);
                const message = String(err?.message ?? "");
                if (message.includes("Invalid code")) {
                  setError("That code is wrong. Check it and try again.");
                } else if (message.includes("Code expired")) {
                  setStep("forgot");
                  setError("That code has expired. Request a new one.");
                } else {
                  setError("Couldn't reset the password. Try again.");
                }
                setSubmitting(false);
              });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="reset-code">Code</Label>
            <Input
              id="reset-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              required
              disabled={submitting}
              aria-invalid={error ? true : undefined}
              className="text-center text-lg tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reset-new-password">New password</Label>
            <Input
              id="reset-new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              required
              disabled={submitting}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          <div className="grid gap-3">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? "Updating password" : "Reset password"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={submitting}
              onClick={() => goToStep("forgot")}
            >
              Send a new code
            </Button>
          </div>
        </motion.form>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={submitting}
          className="-ml-2"
        >
          <ArrowLeft />
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
