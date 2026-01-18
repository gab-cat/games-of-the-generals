import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Key, Shield, Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PasswordResetForm({ onBack }: { onBack: () => void }) {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"forgot" | { email: string }>("forgot");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-xl p-8 rounded-sm shadow-2xl relative overflow-hidden group w-full">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50" />

      <div className="mb-8 space-y-2 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
          {step === "forgot" ? "Account Recovery" : "Security Verification"}
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {step === "forgot" ? "Reset Password" : "Verify Identity"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {step === "forgot"
            ? "Enter coordinates to receive a reset code."
            : `Code sent to ${step.email}. Authenticate to proceed.`}
        </p>
      </div>

      {step === "forgot" ? (
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("flow", "reset");

            signIn("password", formData)
              .then(() => {
                const email = formData.get("email") as string;
                setStep({ email });
                toast.success(
                  "Verification code dispatched to email frequency.",
                );
                setSubmitting(false);
              })
              .catch((error) => {
                console.error("Password reset error:", error);
                if (error.message.includes("Account not found")) {
                  toast.error("Target identity not found in database.");
                } else {
                  toast.error("Transmission failed. Retry sequence.");
                }
                setSubmitting(false);
              });
          }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 font-medium ml-1"
            >
              Email Coordinates
            </label>
            <div className="relative group">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="cmd@generals.io"
                className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-100 px-4 py-2.5 rounded-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder:text-zinc-600 font-mono text-sm transition-all"
                required
              />
              <div className="absolute inset-0 border border-transparent group-hover:border-zinc-700/50 pointer-events-none rounded-sm transition-colors" />
              <Mail className="absolute right-3 top-2.5 w-4 h-4 text-zinc-600" />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded-sm h-11 uppercase tracking-wide font-sans text-xs transition-all mt-4 relative overflow-hidden group shadow-[0_0_20px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.4)]"
            disabled={submitting}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Key className="w-4 h-4 mr-2" />
            )}
            {submitting ? "Processing..." : "Send Reset Code"}
          </Button>
        </motion.form>
      ) : (
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("flow", "reset-verification");
            formData.set("email", step.email);

            signIn("password", formData)
              .then(() => {
                toast.success("Security clearance restored. Access granted.");
                setSubmitting(false);
              })
              .catch((error) => {
                console.error("Password reset verification error:", error);
                if (error.message.includes("Invalid code")) {
                  toast.error("Invalid verification code. Access denied.");
                } else if (error.message.includes("Code expired")) {
                  toast.error("Code expired. Re-initiate sequence.");
                  setStep("forgot");
                } else {
                  toast.error("Reset failed. System error.");
                }
                setSubmitting(false);
              });
          }}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="code"
                className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 font-medium ml-1"
              >
                Verification Code
              </label>
              <div className="relative group">
                <input
                  id="code"
                  name="code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-100 px-4 py-2.5 rounded-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder:text-zinc-600 font-mono text-center text-lg tracking-[0.5em] transition-all"
                  required
                />
                <div className="absolute inset-0 border border-transparent group-hover:border-zinc-700/50 pointer-events-none rounded-sm transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="newPassword"
                className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 font-medium ml-1"
              >
                New Password
              </label>
              <div className="relative group">
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-100 px-4 py-2.5 rounded-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder:text-zinc-600 font-mono text-sm transition-all"
                  required
                />
                <div className="absolute inset-0 border border-transparent group-hover:border-zinc-700/50 pointer-events-none rounded-sm transition-colors" />
                <Lock className="absolute right-3 top-2.5 w-4 h-4 text-zinc-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-6">
            <Button
              type="submit"
              className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded-sm h-11 uppercase tracking-wide font-sans text-xs transition-all relative overflow-hidden group shadow-[0_0_20px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.4)]"
              disabled={submitting}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              {submitting ? "Updating..." : "Confirm Reset"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-zinc-900/30 border-dashed border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 hover:text-white text-zinc-400 rounded-sm font-mono text-xs h-9 gap-2 transition-all uppercase tracking-wider"
              onClick={() => setStep("forgot")}
            >
              Resend Code
            </Button>
          </div>
        </motion.form>
      )}

      {/* Back Button */}
      <div className="mt-8 text-center pt-6 border-t border-zinc-800/50">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-2 group"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          ABORT SEQUENCE
        </button>
      </div>
    </div>
  );
}
