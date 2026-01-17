import { useState, useEffect } from "react";
import { Mail, Check, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  useConvexQuery,
  useConvexMutationWithQuery,
} from "../../lib/convex-query-hooks";
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { getRouteApi } from "@tanstack/react-router";
import { SettingsCard } from "./components/SettingsCard";

const route = getRouteApi("/settings");

interface EmailSectionProps {
  currentEmail?: string;
}

export function EmailSection({ currentEmail }: EmailSectionProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRequestingEmailChange, setIsRequestingEmailChange] = useState(false);

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
        setSuccess(result.message);
        setShowVerificationForm(false);
        setVerificationCode("");
      },
      onError: (err: any) => {
        setError(
          err instanceof Error ? err.message : "Failed to verify email change",
        );
      },
    },
  );

  const cancelEmailChange = useConvexMutationWithQuery(
    api.settings.cancelEmailChange,
    {
      onSuccess: () => {
        setShowVerificationForm(false);
        setVerificationCode("");
        setSuccess("Email change request cancelled");
      },
      onError: (err: any) => {
        setError(
          err instanceof Error ? err.message : "Failed to cancel email change",
        );
      },
    },
  );

  const convertAnonymousAccount = useConvexAction(
    api.settings.convertAnonymousAccount,
  );

  // Check if we should show the convert form based on URL parameter
  useEffect(() => {
    if (search.convert === "1" && userSettings?.isAnonymous) {
      setShowConvertForm(true);
    }
  }, [search.convert, userSettings?.isAnonymous]);

  // Check if there's a pending email change
  useEffect(() => {
    if (pendingEmailChange) {
      setShowVerificationForm(true);
      setShowEmailChange(false);
    }
  }, [pendingEmailChange]);

  const handleRequestEmailChange = () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setError("");
    setSuccess("");
    setIsRequestingEmailChange(true);

    requestEmailChange({ newEmail: email.trim() })
      .then((result) => {
        setSuccess(result.message);
        setShowEmailChange(false);
        setShowVerificationForm(true);
        setEmail("");
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to request email change",
        );
      })
      .finally(() => {
        setIsRequestingEmailChange(false);
      });
  };

  const handleVerifyEmailChange = () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setError("");
    setSuccess("");
    verifyEmailChange.mutate({ verificationCode: verificationCode.trim() });
  };

  const handleCancelEmailChange = () => {
    setError("");
    cancelEmailChange.mutate({});
  };

  const handleConvertAccount = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setSuccess("");

    convertAnonymousAccount({
      email: email.trim(),
      password: password.trim(),
    })
      .then((result) => {
        setSuccess(result.message);
        setShowConvertForm(false);
        setEmail("");
        setPassword("");

        // Refresh the page to reflect the changes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to convert account",
        );
      });
  };

  const isAnonymous = userSettings?.isAnonymous;
  const isLoading =
    isRequestingEmailChange ||
    verifyEmailChange.isPending ||
    cancelEmailChange.isPending;

  return (
    <SettingsCard
      title="Communication Link"
      description="Mission updates and account recovery channel."
      icon={<Mail className="w-5 h-5" />}
      delay={0.3}
      variant={isAnonymous ? "danger" : "default"}
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs font-mono bg-red-400/10 p-3 rounded-sm border border-red-400/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-400 text-xs font-mono bg-green-400/10 p-3 rounded-sm border border-green-400/20">
            <Check className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {isAnonymous ? (
          <div className="space-y-4">
            <div className="bg-red-900/10 border border-red-400/30 rounded-sm p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(239,68,68,0.05)_1px,transparent_1px)] bg-[size:10px_10px]" />
              <p className="text-red-300 font-mono text-sm mb-1 uppercase tracking-widest relative z-10">
                ⚠️ Unsecured Channel
              </p>
              <p className="text-red-200/60 text-xs font-mono relative z-10">
                Anonymous accounts are volatile. Link an email to permanentize
                your service record.
              </p>
            </div>

            {!showConvertForm ? (
              <Button
                onClick={() => setShowConvertForm(true)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase tracking-wider h-10 shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-pulse"
              >
                Initiate Link Protocol
              </Button>
            ) : (
              <div className="space-y-4 pt-2 border-t border-red-500/20">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-red-300">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter secure email"
                    className="bg-black/40 border-red-500/20 text-white placeholder:text-white/20 focus:border-red-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-red-300">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create secure password"
                    className="bg-black/40 border-red-500/20 text-white placeholder:text-white/20 focus:border-red-500/50"
                  />
                  <p className="text-[10px] text-red-400/60 font-mono">
                    * Minimum 8 characters required
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleConvertAccount}
                    disabled={isLoading}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase tracking-wider h-9"
                  >
                    {isLoading ? "Linking..." : "Confirm Link"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowConvertForm(false);
                      setEmail("");
                      setPassword("");
                      setError("");
                    }}
                    variant="outline"
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 font-mono text-xs uppercase tracking-wider h-9"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
                Registered Email
              </label>
              <div className="bg-black/40 border border-white/5 p-3 rounded-sm text-zinc-300 font-mono flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-500" />
                {currentEmail || "No email set"}
              </div>
            </div>

            {pendingEmailChange && (
              <div className="bg-amber-900/10 border border-amber-500/30 rounded-sm p-4">
                <p className="text-amber-400 font-mono text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Verification Pending
                </p>
                <p className="text-amber-200/60 text-xs font-mono mb-2">
                  Transfer to <strong>{pendingEmailChange.newEmail}</strong>{" "}
                  requires confirmation code sent to current address.
                </p>
                <p className="text-amber-200/40 text-[10px] font-mono">
                  EXPIRES:{" "}
                  {new Date(pendingEmailChange.expiresAt).toLocaleTimeString()}
                </p>
              </div>
            )}

            {showVerificationForm ? (
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
                    Verification Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="XXXXXX"
                      maxLength={6}
                      className="bg-black/20 border-white/10 text-white font-mono tracking-[0.5em] text-center"
                    />
                    <Button
                      onClick={handleVerifyEmailChange}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-500 text-white font-mono text-xs uppercase tracking-wider px-6"
                    >
                      {isLoading ? "..." : "Verify"}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleCancelEmailChange}
                  disabled={isLoading}
                  variant="ghost"
                  className="w-full text-zinc-500 hover:text-white font-mono text-[10px] uppercase tracking-wider h-6"
                >
                  Abort Transfer
                </Button>
              </div>
            ) : showEmailChange ? (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
                    New Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter new email address"
                    className="bg-black/20 border-white/10 text-white font-mono"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleRequestEmailChange}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider h-9"
                  >
                    {isLoading ? "Processing..." : "Send Code"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowEmailChange(false);
                      setEmail("");
                      setError("");
                    }}
                    variant="outline"
                    className="border-white/10 text-zinc-400 hover:bg-white/5 font-mono text-xs uppercase tracking-wider h-9"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowEmailChange(true)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs uppercase tracking-wider h-10 border border-white/10 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
                disabled={!!pendingEmailChange}
              >
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Initiate Transfer</span>
                </div>
              </Button>
            )}
          </div>
        )}
      </div>
    </SettingsCard>
  );
}
