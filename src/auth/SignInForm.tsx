"use client";
import { useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../components/ui/button";
import {
  Github,
  Linkedin,
  Loader2,
  Shield,
  Globe,
  Terminal,
  ChevronRight,
  Command,
} from "lucide-react";
import ImageBackground from "../components/backgrounds/ImageBackground";
import Squares from "../components/backgrounds/Squares/Squares";
import { PasswordResetForm } from "./PasswordResetForm";
import { useAuthMutation } from "../lib/convex-query-hooks";
import { useNavigate } from "@tanstack/react-router";
import packageJson from "../../package.json";

export function SignInForm() {
  const [flow, setFlow] = useState<"signIn" | "signUp" | "resetPassword">(
    "signIn",
  );
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Use the auth mutation hook for better error handling
  const authMutation = useAuthMutation({
    onSuccess: () => {
      toast.success(`Access granted. Initializing system...`);
    },
    onError: (error: any) => {
      console.log(error);
      let toastTitle = "";
      if (error.message.includes("Invalid password")) {
        toastTitle =
          "Authorization failed. Password complexity requirement not met.";
      } else if (error.message.includes("already exists")) {
        toastTitle = "Identity record exists. Proceed to authentication.";
        setFlow("signIn");
      } else if (error.message.includes("User not found")) {
        toastTitle = "Identity not found in database. Registration required.";
        setFlow("signUp");
      } else {
        toastTitle =
          flow === "signIn"
            ? "Authentication failed. check credentials."
            : "Registration failed. protocol error.";
      }
      toast.error(toastTitle);
    },
  });

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setIsLoading(true);
    try {
      authMutation.mutate({ provider });
    } catch (error) {
      console.error(error);
    }
  };

  const showLoadingSpinner = authMutation.isPending || isLoading;

  return (
    <div className="absolute inset-0 w-screen h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 selection:bg-amber-500/30">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="flex h-full w-full">
        {/* Left Panel - System Status / Briefing */}
        <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden border-r border-zinc-800">
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0">
            <ImageBackground overlayOpacity={0.7} />
            {/* Tactical Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          </div>

          {/* Decorative corner brackets */}
          <div className="absolute top-8 left-8 w-64 h-64 border-l border-t border-white/10 rounded-tl-lg z-10 pointer-events-none" />
          <div className="absolute bottom-8 right-8 w-64 h-64 border-r border-b border-white/10 rounded-br-lg z-10 pointer-events-none" />

          {/* Logo / Header */}
          <div className="z-10 space-y-6 mt-32">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-500/90 backdrop-blur-sm flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-white/10">
                <Command className="w-5 h-5 text-zinc-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight uppercase font-display text-white drop-shadow-md">
                  Games of the Generals
                </span>
                <span className="text-[10px] font-mono text-amber-500 tracking-[0.2em] uppercase">
                  Tactical Command System
                </span>
              </div>
            </div>

            <div className="space-y-4 max-w-lg">
              <h1 className="text-5xl font-semibold tracking-tight uppercase text-white leading-[1.1] font-display drop-shadow-lg">
                <span className="text-white/80">Dominate the</span> <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-400 to-rose-400">
                  Battlefield
                </span>
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-amber-500 to-transparent rounded-full" />
              <p className="text-zinc-300 text-lg leading-relaxed font-light border-l-2 border-amber-500/50 pl-6 bg-gradient-to-r from-zinc-900/50 to-transparent p-2 backdrop-blur-sm rounded-r-sm">
                Engage in high-stakes tactical warfare where information is your
                greatest weapon. Outthink. Outmaneuver. Outlast.
              </p>
            </div>
          </div>

          {/* Tactical Features List */}
          <div className="z-10 grid gap-5 max-w-md">
            {[
              {
                icon: Shield,
                title: "Fog of War",
                desc: "Hidden ranks require calculated strategic risks.",
              },
              {
                icon: Globe,
                title: "Global Operations",
                desc: "Real-time conflict across multiple theaters.",
              },
              {
                icon: Terminal,
                title: "Battle Analytics",
                desc: "Advanced telemetry for post-mission analysis.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex gap-4 items-center group p-3 rounded-md hover:bg-white/5 transition-all cursor-default border border-transparent hover:border-white/5"
              >
                <div className="h-10 w-10 flex-shrink-0 bg-zinc-950/50 border border-white/10 flex items-center justify-center rounded-sm group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-all shadow-lg backdrop-blur-md">
                  <feature.icon className="w-5 h-5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                </div>
                <div>
                  <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider group-hover:text-amber-500 transition-colors mb-0.5">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-snug font-sans group-hover:text-zinc-300 transition-colors">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* System Origins & Credits */}
          <div className="z-10 mt-auto pt-10">
            <div className="border-t border-white/5 pt-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-px w-3 bg-amber-500/50" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500/80">
                    System // Origins
                  </span>
                </div>
                <p className="text-sm text-zinc-400 font-light leading-relaxed">
                  Architected by{" "}
                  <span className="text-zinc-200 font-medium">
                    Gabriel Catimbang
                  </span>{" "}
                  to modernize the Filipino tactical warfare standard.
                  <span className="opacity-50 mx-1">|</span>
                  Mission: Preserve strategic heritage through digital
                  innovation.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-[11px] font-mono tracking-wide text-zinc-500 uppercase">
                <a
                  href="https://github.com/gab-cat/games-of-the-generals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-amber-500 transition-colors group"
                >
                  <Github className="w-3.5 h-3.5 group-hover:text-amber-500" />
                  <span>Source Code</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/gabriel-catimbang/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-blue-400 transition-colors group"
                >
                  <Linkedin className="w-3.5 h-3.5 group-hover:text-blue-400" />
                  <span>Connect</span>
                </a>
              </div>
            </div>

            {/* System Status Footer */}
            <div className="flex justify-between items-end mt-8 pt-4 border-t border-white/5 opacity-60">
              <div className="flex gap-4 text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  <span className="tracking-wider text-amber-500">ONLINE</span>
                </div>
                <span className="tracking-wider text-zinc-500">
                  V.{packageJson.version}
                </span>
              </div>
              <div className="text-[9px] font-mono text-zinc-600 tracking-widest">
                ID: {Math.random().toString(36).substring(7).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="flex-1 flex flex-col items-center justify-center relative bg-zinc-950 p-6 px-0 sm:p-12 overflow-hidden">
          {/* Geometric Background Elements */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Base Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Radial Gradient for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#09090b_100%)] opacity-80" />

            {/* Animated Geometric Shapes */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-zinc-700/50 rounded-full animate-[spin_60s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-dashed border-zinc-700/50 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-zinc-900/50 rounded-full opacity-40" />

            {/* Interactive Squares */}
            <Squares
              direction="diagonal"
              speed={0.2}
              borderColor="#27272a"
              squareSize={50}
              hoverFillColor="#3f3f46"
            />

            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-transparent to-zinc-950/80" />
          </div>

          <div className="w-full max-w-[420px] relative z-10">
            <AnimatePresence mode="wait">
              {flow === "resetPassword" ? (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PasswordResetForm onBack={() => setFlow("signIn")} />
                </motion.div>
              ) : (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-xl p-8 rounded-sm shadow-2xl relative overflow-hidden group"
                >
                  {/* Top Accent Line */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50" />

                  <div className="mb-8 space-y-2 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
                      {flow === "signIn" ? "System Access" : "New Registration"}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      {flow === "signIn"
                        ? "Commander Login"
                        : "Initialize Profile"}
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      {flow === "signIn"
                        ? "Enter credentials to access command network."
                        : "Begin your deployment sequence."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <Button
                      variant="outline"
                      className="bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 hover:text-white text-zinc-300 rounded-sm font-mono text-xs h-10 gap-2 transition-all relative overflow-hidden"
                      onClick={() => handleOAuthSignIn("google")}
                      disabled={showLoadingSpinner}
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
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
                      GOOGLE
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 hover:text-white text-zinc-300 rounded-sm font-mono text-xs h-10 gap-2 transition-all"
                      onClick={() => handleOAuthSignIn("github")}
                      disabled={showLoadingSpinner}
                    >
                      <Github className="w-4 h-4" />
                      GITHUB
                    </Button>
                  </div>

                  {/* Anonymous Sign In */}
                  <div className="mb-6">
                    <Button
                      variant="outline"
                      className="w-full bg-zinc-900/30 border-dashed border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 hover:text-white text-zinc-400 rounded-sm font-mono text-xs h-9 gap-2 transition-all uppercase tracking-wider"
                      onClick={() =>
                        authMutation.mutate({ provider: "anonymous" })
                      }
                      disabled={showLoadingSpinner}
                    >
                      Enter as Guest Commander
                    </Button>
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
                      <span className="bg-zinc-900/40 px-2 text-zinc-500 backdrop-blur-md">
                        Or proceed with credentials
                      </span>
                    </div>
                  </div>

                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(
                        e.target as HTMLFormElement,
                      );
                      formData.set("flow", flow);
                      authMutation.mutate({
                        provider: "password",
                        formData,
                      });
                    }}
                  >
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 font-medium ml-1">
                          Email Coordinates
                        </label>
                        <div className="relative group">
                          <input
                            name="email"
                            type="email"
                            placeholder="cmd@generals.io"
                            className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-100 px-4 py-2.5 rounded-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder:text-zinc-600 font-mono text-sm transition-all"
                            required
                          />
                          <div className="absolute inset-0 border border-transparent group-hover:border-zinc-700/50 pointer-events-none rounded-sm transition-colors" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                          <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 font-medium">
                            Security Key
                          </label>
                          {flow === "signIn" && (
                            <button
                              type="button"
                              onClick={() => setFlow("resetPassword")}
                              className="text-[10px] text-zinc-500 hover:text-amber-500 transition-colors uppercase tracking-wider font-mono"
                            >
                              Lost Key?
                            </button>
                          )}
                        </div>
                        <div className="relative group">
                          <input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-100 px-4 py-2.5 rounded-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder:text-zinc-600 font-mono text-sm transition-all"
                            required
                          />
                          <div className="absolute inset-0 border border-transparent group-hover:border-zinc-700/50 pointer-events-none rounded-sm transition-colors" />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded-sm h-11 uppercase tracking-wide font-sans text-xs transition-all mt-2 relative overflow-hidden group shadow-[0_0_20px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.4)]"
                      disabled={showLoadingSpinner}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      {showLoadingSpinner ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      )}
                      {showLoadingSpinner
                        ? "Processing..."
                        : flow === "signIn"
                          ? "Authenticate"
                          : "Register ID"}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setFlow(flow === "signIn" ? "signUp" : "signIn")
                      }
                      className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {flow === "signIn" ? (
                        <span className="flex items-center justify-center gap-2">
                          NO CLEARANCE?{" "}
                          <span className="text-amber-500 underline decoration-amber-500/30 underline-offset-4">
                            REQUEST ACCESS
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          ALREADY CLEARED?{" "}
                          <span className="text-amber-500 underline decoration-amber-500/30 underline-offset-4">
                            RETURN TO LOGIN
                          </span>
                        </span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Links */}
            <div className="mt-8 flex justify-center gap-6 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
              <button
                onClick={() => navigate({ to: "/terms" })}
                className="hover:text-amber-500 transition-colors"
              >
                Terms of Engagement
              </button>
              <div className="h-3 w-px bg-zinc-800" />
              <button
                onClick={() => navigate({ to: "/about" })}
                className="hover:text-amber-500 transition-colors"
              >
                About System
              </button>
              <div className="h-3 w-px bg-zinc-800" />
              <button
                onClick={() => navigate({ to: "/privacy" })}
                className="hover:text-amber-500 transition-colors"
              >
                Privacy Protocol
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
