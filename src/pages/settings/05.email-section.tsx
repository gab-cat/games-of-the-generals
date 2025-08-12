import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useConvexQuery, useConvexMutationWithQuery } from "../../lib/convex-query-hooks";
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { getRouteApi } from "@tanstack/react-router";

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
  const { data: pendingEmailChange } = useConvexQuery(api.settings.getPendingEmailChange);
  
  const requestEmailChange = useConvexAction(api.settings.requestEmailChange);
  
  const verifyEmailChange = useConvexMutationWithQuery(api.settings.verifyEmailChange, {
    onSuccess: (result: any) => {
      setSuccess(result.message);
      setShowVerificationForm(false);
      setVerificationCode("");
    },
    onError: (err: any) => {
      setError(err instanceof Error ? err.message : "Failed to verify email change");
    }
  });
  
  const cancelEmailChange = useConvexMutationWithQuery(api.settings.cancelEmailChange, {
    onSuccess: () => {
      setShowVerificationForm(false);
      setVerificationCode("");
      setSuccess("Email change request cancelled");
    },
    onError: (err: any) => {
      setError(err instanceof Error ? err.message : "Failed to cancel email change");
    }
  });

  const convertAnonymousAccount = useConvexAction(api.settings.convertAnonymousAccount);

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
        setError(err instanceof Error ? err.message : "Failed to request email change");
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
      password: password.trim() 
    }).then((result) => {
      setSuccess(result.message);
      setShowConvertForm(false);
      setEmail("");
      setPassword("");
      
      // Refresh the page to reflect the changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to convert account");
    });
  };

  const isAnonymous = userSettings?.isAnonymous;
  const isLoading = isRequestingEmailChange || verifyEmailChange.isPending || cancelEmailChange.isPending;

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="rounded-xl border border-white/10 bg-black/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {isAnonymous ? "Convert Account" : "Email Address"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20"
            >
              <Check className="w-4 h-4 flex-shrink-0" />
              {success}
            </motion.div>
          )}

          {isAnonymous ? (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
                <p className="text-blue-200 text-sm mb-2">
                  <strong>Anonymous Account</strong>
                </p>
                <p className="text-blue-100 text-xs">
                  Set an email and password to save your progress permanently and access your account from any device.
                </p>
              </div>

              {!showConvertForm ? (
                <Button
                  onClick={() => setShowConvertForm(true)}
                    className="w-full flex-1"
                  variant="gradient"
                >
                  Convert to Regular Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                    <p className="text-xs text-gray-400">
                      Password must be at least 8 characters with uppercase, lowercase, and number.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleConvertAccount}
                      disabled={isLoading}
                        className="flex-1"
                      variant="gradient"
                    >
                      {isLoading ? "Converting..." : "Convert Account"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowConvertForm(false);
                        setEmail("");
                        setPassword("");
                        setError("");
                      }}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Current Email</label>
                <div className="text-white font-medium">{currentEmail || "No email set"}</div>
              </div>

              {pendingEmailChange && (
                <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm mb-2">
                    <strong>Pending Email Change</strong>
                  </p>
                  <p className="text-yellow-100 text-xs mb-3">
                    Email change to <strong>{pendingEmailChange.newEmail}</strong> is pending verification.
                    Check your current email for the verification code.
                  </p>
                  <p className="text-yellow-100 text-xs">
                    Expires: {new Date(pendingEmailChange.expiresAt).toLocaleString()}
                  </p>
                </div>
              )}

              {showVerificationForm ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Verification Code</label>
                    <Input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleVerifyEmailChange}
                      disabled={isLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading ? "Verifying..." : "Verify Email"}
                    </Button>
                    <Button
                      onClick={handleCancelEmailChange}
                      disabled={isLoading}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : showEmailChange ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">New Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter new email address"
                      className="bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRequestEmailChange}
                      disabled={isLoading}
                      className="flex-1"
                      variant="gradient"
                    >
                      {isLoading ? "Sending..." : "Send Verification Code"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowEmailChange(false);
                        setEmail("");
                        setError("");
                      }}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowEmailChange(true)}
                  className="w-full flex-1"
                  variant="gradient"
                  disabled={!!pendingEmailChange}
                >
                  Change Email Address
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
