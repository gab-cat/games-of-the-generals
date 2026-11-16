"use client";
import { useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Github, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { SignInHero } from "./SignInHero";
import { PasswordResetForm } from "./PasswordResetForm";
import { useAuthMutation } from "../lib/convex-query-hooks";

type Flow = "signIn" | "signUp" | "resetPassword";
type Provider = "password" | "anonymous" | "google" | "github";

const PROVIDER_NAME: Record<Provider, string> = {
  password: "your email",
  anonymous: "a guest account",
  google: "Google",
  github: "GitHub",
};

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function SignInForm() {
  const [flow, setFlow] = useState<Flow>("signIn");
  // What the player last asked for, so only that button shows "pending".
  const [pending, setPending] = useState<Provider | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const authMutation = useAuthMutation({
    onSuccess: () => {
      // The page swaps to the lobby on its own; keep buttons locked until then.
    },
    onError: (error: any, variables: { provider: Provider }) => {
      console.error(error);
      setPending(null);
      const message = String(error?.message ?? "");
      const provider = variables?.provider ?? "password";

      if (provider !== "password") {
        toast.error(
          `Couldn't sign in with ${PROVIDER_NAME[provider]}. Try again.`,
        );
        return;
      }

      let text: string;
      if (message.includes("Invalid password")) {
        text =
          flow === "signUp"
            ? "Use a password of at least 8 characters."
            : "That email and password don't match.";
      } else if (message.includes("already exists")) {
        text = "An account with this email already exists. Sign in instead.";
        setFlow("signIn");
      } else if (message.includes("User not found")) {
        text = "No account uses this email yet. Create one to continue.";
        setFlow("signUp");
      } else {
        text =
          flow === "signIn"
            ? "Couldn't sign you in. Check your email and password."
            : "Couldn't create your account. Try again in a moment.";
      }
      setFormError(text);
    },
  });

  const busy = authMutation.isPending || pending !== null;

  const start = (provider: Provider, formData?: FormData) => {
    setFormError(null);
    setPending(provider);
    authMutation.mutate({ provider, formData });
  };

  const isSignIn = flow === "signIn";

  return (
    <div className="grid lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <SignInHero />

      <div className="flex min-w-0 items-center justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-12">
        <div className="w-full max-w-[400px]">
          <AnimatePresence mode="wait" initial={false}>
            {flow === "resetPassword" ? (
              <motion.div
                key="reset"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <PasswordResetForm onBack={() => setFlow("signIn")} />
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-foreground">
                  {isSignIn ? "Sign in" : "Create an account"}
                </h2>
                {!isSignIn && (
                  <p className="mt-1.5 text-sm text-foreground/80">
                    You pick a username on the next screen.
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => start("google")}
                    disabled={busy}
                  >
                    {pending === "google" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <GoogleMark />
                    )}
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => start("github")}
                    disabled={busy}
                  >
                    {pending === "github" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Github />
                    )}
                    GitHub
                  </Button>
                </div>

                <div className="my-5 flex items-center gap-3 text-xs text-foreground/70">
                  <span className="h-px flex-1 bg-border" />
                  or use your email
                  <span className="h-px flex-1 bg-border" />
                </div>

                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    formData.set("flow", flow);
                    start("password", formData);
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      disabled={busy}
                      aria-invalid={formError ? true : undefined}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="signin-password">Password</Label>
                      {isSignIn && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormError(null);
                            setFlow("resetPassword");
                          }}
                          className="-my-2 rounded px-1 py-2 text-sm text-gold-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      autoComplete={
                        isSignIn ? "current-password" : "new-password"
                      }
                      placeholder={
                        isSignIn ? "Your password" : "At least 8 characters"
                      }
                      required
                      minLength={isSignIn ? undefined : 8}
                      disabled={busy}
                      aria-invalid={formError ? true : undefined}
                    />
                  </div>

                  {formError && (
                    <p
                      role="alert"
                      className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                    >
                      {formError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={busy}
                  >
                    {pending === "password" ? (
                      <>
                        <Loader2 className="animate-spin" />
                        {isSignIn ? "Signing in" : "Creating account"}
                      </>
                    ) : isSignIn ? (
                      "Sign in"
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </form>

                <p className="mt-4 text-center text-sm text-foreground/80">
                  {isSignIn ? "New here?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setFlow(isSignIn ? "signUp" : "signIn");
                    }}
                    disabled={busy}
                    className="rounded px-1 py-2 font-medium text-gold-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:opacity-50"
                  >
                    {isSignIn ? "Create an account" : "Sign in"}
                  </button>
                </p>

                <div className="mt-4 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => start("anonymous")}
                    disabled={busy}
                  >
                    {pending === "anonymous" && (
                      <Loader2 className="animate-spin" />
                    )}
                    {pending === "anonymous"
                      ? "Starting guest session"
                      : "Continue as guest"}
                  </Button>
                  <p className="mt-2 text-center text-xs text-foreground/70">
                    Guest accounts are deleted every day at 00:00 UTC.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-4 text-center text-xs text-foreground/70 lg:text-left">
            By continuing you agree to the{" "}
            <Link
              to="/terms"
              className="underline underline-offset-2 hover:text-foreground"
            >
              terms
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
