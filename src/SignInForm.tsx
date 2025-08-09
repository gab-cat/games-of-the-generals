"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import { Crown } from "lucide-react";
import Aurora from "./components/backgrounds/Aurora/Aurora";
import { PasswordResetForm } from "./PasswordResetForm";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp" | "resetPassword">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Premium Design Section */}
      <motion.div 
        className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Aurora Background */}
        <div className="absolute inset-0 opacity-30">
          <Aurora 
            colorStops={["#374151", "#4B5563", "#6B7280"]}
            blend={0.4}
            amplitude={0.8}
            speed={0.2}
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-gray-900/70 to-slate-900/90" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full px-12 max-w-2xl">
          <motion.div 
            className="space-y-10 text-left"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Logo/Icon */}
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center shadow-2xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div className="text-white/40 font-mono text-sm tracking-wider">
                TACTICAL WARFARE
              </div>
            </motion.div>
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-7xl font-display font-bold bg-gradient-to-r from-slate-300 via-gray-200 to-slate-300 bg-clip-text text-transparent leading-tight">
                Games of the
              </h1>
              <h1 className="text-7xl font-display font-bold bg-gradient-to-r from-gray-200 via-slate-100 to-gray-200 bg-clip-text text-transparent">
                Generals
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-slate-400 to-gray-500 mt-4"></div>
            </div>
            
            {/* Game Description */}
            <div className="space-y-6 text-white/80 font-body max-w-lg">
              <p className="text-base font-body font-light leading-relaxed">
                Master the ancient Filipino military strategy game where deception and tactical brilliance determine victory.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold font-display text-white/90 mb-1">Strategic Gameplay</h3>
                    <p className="text-sm text-white/70">Deploy 21 pieces with hidden ranks. Only you know your army's true strength.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold font-display text-white/90 mb-1">Mind Games</h3>
                    <p className="text-sm text-white/70">Bluff, deceive, and outmaneuver opponents through pure psychological warfare.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-semibold font-display text-white/90 mb-1">Global Competition</h3>
                    <p className="text-sm text-white/70">Challenge players worldwide in real-time strategic battles.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Game Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div>
                <div className="text-2xl font-display font-bold text-white">21</div>
                <div className="text-sm text-white/60 font-body">Unique Pieces</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-white">∞</div>
                <div className="text-sm text-white/60 font-body">Strategies</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-white">1v1</div>
                <div className="text-sm text-white/60 font-body">Battle Mode</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Floating Elements */}
        <motion.div 
          className="absolute top-20 left-20 w-2 h-2 bg-slate-400 rounded-full opacity-40"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-32 left-32 w-1 h-1 bg-gray-400 rounded-full opacity-30"
          animate={{ 
            y: [0, -15, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
        <motion.div 
          className="absolute top-40 right-40 w-1.5 h-1.5 bg-slate-300 rounded-full opacity-35"
          animate={{ 
            y: [0, -25, 0],
            opacity: [0.15, 0.35, 0.15]
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
        />
      </motion.div>

      {/* Right Side - Sign In Form */}
      <motion.div 
        className="flex-1 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <div className="w-full max-w-md px-8">
          {flow === "resetPassword" ? (
            <PasswordResetForm onBack={() => setFlow("signIn")} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-display font-bold text-white">
                  {flow === "signIn" ? "Welcome Back" : "Join the Battle"}
                </h2>
                <p className="text-white/60 text-lg font-body">
                  {flow === "signIn" 
                    ? "Continue your strategic journey" 
                    : "Create your commander profile"
                  }
                </p>
              </div>

              {/* Form */}
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitting(true);
                  const formData = new FormData(e.target as HTMLFormElement);
                  formData.set("flow", flow);
                  void signIn("password", formData).catch((error) => {
                    let toastTitle = "";
                    if (error.message.includes("Invalid password")) {
                      toastTitle = "Invalid password. Please try again.";
                    } else {
                      toastTitle =
                        flow === "signIn"
                          ? "Could not sign in, did you mean to sign up?"
                          : "Could not sign up, did you mean to sign in?";
                    }
                    toast.error(toastTitle);
                    setSubmitting(false);
                  });
                }}
              >
                <div className="space-y-5">
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
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="password" className="text-sm font-medium text-white/90 font-body">
                        Password
                      </label>
                      {flow === "signIn" && (
                        <button
                          type="button"
                          onClick={() => setFlow("resetPassword")}
                          className="text-sm text-white/60 hover:text-white/90 transition-colors duration-200 hover:underline underline-offset-4 font-body"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
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
                  {submitting ? "Processing..." : flow === "signIn" ? "Sign In" : "Create Account"}
                </Button>
              </form>
              
              {/* Toggle Flow */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
                  className="text-sm text-white/60 hover:text-white/90 transition-colors duration-200 hover:underline underline-offset-4 font-body"
                >
                  {flow === "signIn" 
                    ? "New to the battlefield? Create an account" 
                    : "Already a commander? Sign in"
                  }
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center">
                <Separator className="flex-1 bg-white/20" />
                <span className="mx-4 text-white/40 text-sm font-medium font-mono">OR</span>
                <Separator className="flex-1 bg-white/20" />
              </div>

              {/* Anonymous Sign In */}
              <Button 
                variant="outline" 
                className="w-full bg-white/5 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-200 py-3 rounded-full font-medium font-body" 
                onClick={() => void signIn("anonymous")}
              >
                Enter as Guest Commander
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
