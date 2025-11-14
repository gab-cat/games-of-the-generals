"use client";
import { useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { ArrowRight, Github, Linkedin, Loader2, UserPlus } from "lucide-react";
import { Separator } from "../components/ui/separator";
import ImageBackground from "../components/backgrounds/ImageBackground";
import Squares from "../components/backgrounds/Squares/Squares";
import { PasswordResetForm } from "./PasswordResetForm";
import { useAuthMutation } from "../lib/convex-query-hooks";
import { useNavigate } from "@tanstack/react-router";

export function SignInForm() {
  const [flow, setFlow] = useState<"signIn" | "signUp" | "resetPassword">("signIn");
  const navigate = useNavigate();
  
  // Use the auth mutation hook for better error handling
  const authMutation = useAuthMutation({
    onSuccess: () => {
      toast.success(`Signing in...`);
    },
    onError: (error: any) => {
      console.log(error)
      let toastTitle = "";
      if (error.message.includes("Invalid password")) {
        toastTitle = "Invalid password. Please use a combination of letters, numbers, and special characters.";
      } else if (error.message.includes("already exists")) {
        toastTitle = "Account already exists. Please sign in instead.";
        setFlow("signIn");
      } else if (error.message.includes("User not found")) {
        toastTitle = "Account not found. Please sign up instead.";
        setFlow("signUp");
      } else {
        toastTitle = flow === "signIn"
          ? "Invalid credentials, please try again."
          : "Could not sign up, did you mean to sign in?";
      }
      toast.error(toastTitle);
    }
  });

  return (
    <div className="absolute inset-0 w-screen h-screen overflow-hidden">
      {/* Mobile Background */}
      <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <div className="absolute inset-0">
          <ImageBackground overlayOpacity={0.6} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-gray-900/80 to-slate-950/95" />
      </div>

      {/* Left Side - Premium Design Section */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full lg:w-1/2 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 overflow-hidden lg:block hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Image Background */}
        <div className="absolute inset-0">
          <ImageBackground overlayOpacity={0} leftFeatherOnly={true} />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-gray-900/75 to-slate-900/60" />
        
        {/* Scrollable Content Container */}
        <div className="relative pt-28 z-10 h-full overflow-y-auto overflow-x-hidden no-scrollbar">
          <div className="flex flex-col justify-center min-h-full px-4 sm:px-6 lg:px-12 max-w-2xl py-8 lg:py-12">
          <motion.div
            className="space-y-6 lg:space-y-10 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold bg-gradient-to-r from-slate-300 via-gray-200 to-slate-300 bg-clip-text text-transparent leading-tight">
                Games of the
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold bg-gradient-to-r from-gray-200 via-slate-100 to-gray-200 bg-clip-text text-transparent">
                Generals
              </h1>
              <div className="w-16 lg:w-24 h-1 bg-gradient-to-r from-slate-400 to-gray-500 mt-4"></div>
            </div>
            
            {/* Game Description */}
            <div className="space-y-4 lg:space-y-6 text-white/80 font-body max-w-lg">
              <p className="text-sm lg:text-base font-body font-light leading-relaxed">
                Master the ancient Filipino military strategy game where deception and tactical brilliance determine victory.
              </p>
              
              <div className="space-y-3 lg:space-y-4 hidden sm:block">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold font-display text-white/90 mb-1 text-sm lg:text-base">Strategic Gameplay</h3>
                    <p className="text-xs lg:text-sm text-white/70">Deploy 21 pieces with hidden ranks. Only you know your army's true strength.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold font-display text-white/90 mb-1 text-sm lg:text-base">Mind Games</h3>
                    <p className="text-xs lg:text-sm text-white/70">Bluff, deceive, and outmaneuver opponents through pure psychological warfare.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold font-display text-white/90 mb-1 text-sm lg:text-base">Global Competition</h3>
                    <p className="text-xs lg:text-sm text-white/70">Challenge players worldwide in real-time strategic battles.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Game Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-4 lg:gap-8 pt-6 lg:pt-8 border-t border-white/10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div>
                <div className="text-xl lg:text-2xl font-display font-bold text-white">21</div>
                <div className="text-xs lg:text-sm text-white/60 font-body">Unique Pieces</div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-display font-bold text-white">∞</div>
                <div className="text-xs lg:text-sm text-white/60 font-body">Strategies</div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-display font-bold text-white">1v1</div>
                <div className="text-xs lg:text-sm text-white/60 font-body">Battle Mode</div>
              </div>
            </motion.div>

            {/* Creator Credits & Open Source Message */}
            <motion.div 
              className="space-y-4 pt-8 lg:pt-10 border-t border-white/10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <div className="space-y-3">
                <h3 className="text-lg lg:text-xl font-display font-semibold text-white/90">
                  Crafted with Passion
                </h3>
                <div className="space-y-2 text-white/70 font-body text-sm lg:text-base leading-relaxed">
                  <p>
                    This platform was lovingly created by{" "}
                    <a 
                      href="https://github.com/gab-cat" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white/90 hover:text-white transition-colors duration-200 underline underline-offset-2 font-semibold"
                    >
                      Gabriel Catimbang
                    </a>
                    {" "}to preserve and modernize the beloved Filipino strategy game of Game of the Generals.
                  </p>
                  <p className="text-white/60 text-xs lg:text-sm">
                    Connect with Gabriel:{" "}
                    <a 
                      href="https://www.linkedin.com/in/gabrielcatimbang/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-white transition-colors duration-200 underline underline-offset-2 font-medium inline-flex items-center gap-1"
                    >
                      <Linkedin className="w-3 h-3" />
                      Visit my LinkedIn
                    </a>
                  </p>
                  <p className="text-white/60 text-xs lg:text-sm">
                    Born from a desire to bring this tactical masterpiece to the digital age, 
                    connecting players worldwide through strategic warfare and psychological brilliance.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-base lg:text-lg font-display font-medium text-white/80">
                  Open Source & Community Driven
                </h4>
                <p className="text-white/60 font-body text-xs lg:text-sm leading-relaxed">
                  This project is completely open source and welcomes contributions from developers, 
                  designers, and strategy enthusiasts. Join our mission to create the ultimate 
                  Game of the Generals experience.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <a 
                    href="https://github.com/gab-cat/games-of-the-generals" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-full text-xs text-white/80 hover:text-white transition-all duration-200 font-medium"
                  >
                    🚀 View Source Code
                  </a>
                  <a 
                    href="https://github.com/gab-cat/games-of-the-generals/issues" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-full text-xs text-white/80 hover:text-white transition-all duration-200 font-medium"
                  >
                    💡 Contribute Ideas
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
          </div>
        </div>
        
        {/* Floating Elements - Hidden on mobile */}
        <motion.div 
          className="absolute top-20 left-20 w-2 h-2 bg-slate-400 rounded-full opacity-40 hidden lg:block"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-32 left-32 w-1 h-1 bg-gray-400 rounded-full opacity-30 hidden lg:block"
          animate={{ 
            y: [0, -15, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
        <motion.div 
          className="absolute top-40 right-40 w-1.5 h-1.5 bg-slate-300 rounded-full opacity-35 hidden lg:block"
          animate={{ 
            y: [0, -25, 0],
            opacity: [0.15, 0.35, 0.15]
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
        />
      </motion.div>

      {/* Right Side - Sign In Form */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full lg:left-1/2 lg:w-1/2 flex items-center justify-center z-10 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        {/* Squares Background for Right Side */}
        <div className="absolute inset-0 opacity-20">
          <Squares 
            direction="diagonal"
            speed={0.5}
            borderColor="rgba(148, 163, 184, 0.3)"
            squareSize={60}
            hoverFillColor="rgba(148, 163, 184, 0.1)"
          />
        </div>
        
        <div className="w-full max-w-md px-4 sm:px-5 lg:px-6 py-6 lg:py-0 min-h-screen lg:min-h-full flex flex-col justify-center relative z-20">
          <AnimatePresence mode="wait" initial={false}>
            {flow === "resetPassword" ? (
              <motion.div
                key="resetPassword"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <PasswordResetForm onBack={() => setFlow("signIn")} />
              </motion.div>
            ) : (
              <motion.div
                key={flow}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-5 lg:space-y-6"
              >
                {/* Header */}
                <div className="text-center space-y-1.5 lg:space-y-2">
                  <h2 className="text-xl lg:text-2xl font-display font-bold text-white">
                    {flow === "signIn" ? "Welcome Back" : "Join the Battle"}
                  </h2>
                  <p className="text-white/60 text-sm lg:text-base font-body">
                    {flow === "signIn" 
                      ? "Continue your strategic journey" 
                      : "Create your commander profile"}
                  </p>
                </div>

                {/* Quick sign-in providers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    aria-label="Sign in with Google"
                    variant="outline"
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-200 py-2 sm:py-2.5 rounded-full font-medium font-body text-sm flex items-center justify-center gap-2"
                    onClick={() => authMutation.mutate({ provider: "google" })}
                    disabled={authMutation.isPending}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="w-5 h-5"
                      aria-hidden="true"
                    >
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.523 6.053 28.973 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.814C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.523 6.053 28.973 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                      <path fill="#4CAF50" d="M24 44c4.905 0 9.353-1.875 12.73-4.941l-5.873-4.961C28.777 35.875 26.519 36.667 24 36.667c-5.199 0-9.611-3.317-11.273-7.96l-6.536 5.036C9.5 39.556 16.227 44 24 44z"/>
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.793 2.238-2.231 4.166-4.173 5.556.001-.001 5.873 4.961 5.873 4.961C39.524 35.728 44 30.333 44 24c0-1.341-.138-2.651-.389-3.917z"/>
                    </svg>
                    <span>Google</span>
                  </Button>
                  <Button
                    aria-label="Sign in with GitHub"
                    variant="outline"
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-200 py-2 sm:py-2.5 rounded-full font-medium font-body text-sm flex items-center justify-center gap-2"
                    onClick={() => authMutation.mutate({ provider: "github" })}
                    disabled={authMutation.isPending}
                  >
                    <Github className="w-5 h-5" />
                    <span>GitHub</span>
                  </Button>
                </div>

                {/* Anonymous Sign In */}
                <Button 
                  variant="outline" 
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-200 py-2 sm:py-2.5 rounded-full font-medium font-body text-sm" 
                  onClick={() => authMutation.mutate({ provider: "anonymous" })}
                  disabled={authMutation.isPending}
                >
                  Enter as Guest Commander
                </Button>

                {/* Divider */}
                <div className="flex items-center">
                  <Separator className="flex-1 bg-white/20" />
                  <span className="mx-3 sm:mx-4 text-white/40 text-xs sm:text-sm font-medium font-mono">OR</span>
                  <Separator className="flex-1 bg-white/20" />
                </div>

                {/* Email/password form */}
                <form
                  className="space-y-4 lg:space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    formData.set("flow", flow);
                    authMutation.mutate({
                      provider: "password",
                      formData
                    });
                  }}
                >
                  <div className="space-y-3 lg:space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-white/90 font-body">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="commander@example.com"
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-200 hover:bg-white/10 font-body text-sm"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-white/90 font-body">
                        Password
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder={flow === "signIn" ? "Enter your password" : "Create a password"}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-200 hover:bg-white/10 font-body text-sm"
                        required
                      />
                      {flow === "signIn" && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => setFlow("resetPassword")}
                            className="text-xs sm:text-sm text-white/60 hover:text-white/90 transition-colors duration-200 underline underline-offset-4 font-body"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-slate-600 via-gray-600 to-slate-600 hover:from-slate-700 hover:via-gray-700 hover:to-slate-700 text-white font-semibold py-2 sm:py-2.5 px-5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-slate-500/25 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] font-body text-sm" 
                    disabled={authMutation.isPending}
                  >
                    {authMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : flow === "signIn" ? <ArrowRight className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {authMutation.isPending ? "Processing..." : flow === "signIn" ? "Sign In" : "Create Account"}
                  </Button>

                  {/* Compliance: Terms & Privacy Links */}
                  <p className="mt-3 text-center text-[11px] sm:text-xs text-white/60">
                    By continuing, you agree to our
                    <button onClick={() => void navigate({ to: "/terms" })} className="mx-1 underline underline-offset-2 text-white/80 hover:text-white">Terms</button>
                    and acknowledge our
                    <button onClick={() => void navigate({ to: "/privacy" })} className="ml-1 underline underline-offset-2 text-white/80 hover:text-white">Privacy Policy</button>.
                  </p>
                </form>

                {/* Toggle Flow */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
                    className="text-xs sm:text-sm text-white/60 underline hover:text-white/90 transition-colors duration-200 underline-offset-4 font-body"
                  >
                    {flow === "signIn" 
                      ? "New to the battlefield? Create an account" 
                      : "Already a commander? Sign in"}
                  </button>
                </div>

                {/* Credits */}
                <div className="text-center space-y-2 pt-3 border-t border-white/10">
                  <p className="text-xs text-white/50 font-body">
                    Created by {""}
                    <a 
                      href="https://github.com/gab-cat" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-white/90 transition-colors duration-200 underline underline-offset-2"
                    >
                      Gabriel Catimbang
                    </a>
                  </p>
                  <p className="text-xs text-white/40 font-body">
                    Connect: {""}
                    <a 
                      href="https://www.linkedin.com/in/gabrielcatimbang/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-white/80 transition-colors duration-200 underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      <Linkedin className="w-3 h-3" />
                      LinkedIn
                    </a>
                    {" • "}
                    <a 
                      href="https://github.com/gab-cat/games-of-the-generals" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-white/80 transition-colors duration-200 underline underline-offset-2"
                    >
                      Contribute on GitHub
                    </a>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
