import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "./components/ui/button";
import { ArrowLeft, Mail, Key, Shield } from "lucide-react";

export function PasswordResetForm({ onBack }: { onBack: () => void }) {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"forgot" | { email: string }>("forgot");
  const [submitting, setSubmitting] = useState(false);

  return (
    <motion.div 
      className="w-full max-w-md space-y-8"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center shadow-lg"
        >
          {step === "forgot" ? (
            <Mail className="w-8 h-8 text-white" />
          ) : (
            <Key className="w-8 h-8 text-white" />
          )}
        </motion.div>
        
        <h2 className="text-3xl font-display font-bold text-white">
          {step === "forgot" ? "Reset Password" : "Enter Verification Code"}
        </h2>
        <p className="text-white/60 text-lg font-body">
          {step === "forgot" 
            ? "Enter your email to receive a reset code"
            : `We sent a 6-digit code to ${step.email}`
          }
        </p>
      </div>

      {step === "forgot" ? (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("flow", "reset");
            
            signIn("password", formData)
              .then(() => {
                const email = formData.get("email") as string;
                setStep({ email });
                toast.success("Verification code sent to your email!");
                setSubmitting(false);
              })
              .catch((error) => {
                console.error("Password reset error:", error);
                if (error.message.includes("Account not found")) {
                  toast.error("No account found with this email address.");
                } else {
                  toast.error("Failed to send reset email. Please try again.");
                }
                setSubmitting(false);
              });
          }}
        >
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-white/90 font-body">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="commander@example.com"
              className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-200 hover:bg-white/10 font-body"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-slate-600 via-gray-600 to-slate-600 hover:from-slate-700 hover:via-gray-700 hover:to-slate-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-slate-500/25 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] font-body" 
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send Reset Code"}
          </Button>
        </motion.form>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("flow", "reset-verification");
            formData.set("email", step.email);
            
            signIn("password", formData)
              .then(() => {
                toast.success("Password reset successfully! You are now signed in.");
                setSubmitting(false);
              })
              .catch((error) => {
                console.error("Password reset verification error:", error);
                if (error.message.includes("Invalid code")) {
                  toast.error("Invalid verification code. Please check and try again.");
                } else if (error.message.includes("Code expired")) {
                  toast.error("Verification code has expired. Please request a new one.");
                  setStep("forgot");
                } else {
                  toast.error("Failed to reset password. Please try again.");
                }
                setSubmitting(false);
              });
          }}
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium text-white/90 font-body">
                Verification Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-200 hover:bg-white/10 text-center text-xl tracking-wider font-mono"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-white/90 font-body">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Enter your new password"
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-200 hover:bg-white/10 font-body"
                required
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-slate-600 via-gray-600 to-slate-600 hover:from-slate-700 hover:via-gray-700 hover:to-slate-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-slate-500/25 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] font-body" 
            disabled={submitting}
          >
            <Shield className="w-4 h-4 mr-2" />
            {submitting ? "Resetting..." : "Reset Password"}
          </Button>
          
          <Button 
            type="button"
            variant="outline"
            className="w-full bg-white/5 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-200 py-3 rounded-full font-medium font-body"
            onClick={() => setStep("forgot")}
          >
            Send New Code
          </Button>
        </motion.form>
      )}

      {/* Back to Sign In */}
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center text-sm text-white/60 hover:text-white/90 transition-colors duration-200 hover:underline underline-offset-4 font-body"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign In
        </button>
      </div>
    </motion.div>
  );
}
