"use client";

import { motion } from "framer-motion";
import { Swords, Shield, Target, Zap, Crown } from "lucide-react";
import { cn } from "../lib/utils";

interface LoadingSpinnerProps {
  /** Whether to show full-screen mode with background gradient */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size variant for the spinner */
  size?: "sm" | "md" | "lg";
}

const sizeVariants = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

const loadingMessages = [
  "Deploying forces...",
  "Analyzing battlefield...",
  "Coordinating strategy...",
  "Mobilizing units...",
  "Establishing command...",
  "Scanning for threats...",
  "Calculating maneuvers...",
  "Preparing for battle...",
];

const militaryIcons = [Swords, Shield, Target, Zap, Crown];

export function LoadingSpinner({
  fullScreen = false,
  className,
  size = "md"
}: LoadingSpinnerProps) {
  const containerClasses = cn(
    "flex justify-center items-center",
    fullScreen
      ? "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden"
      : "min-h-[60vh]",
    className
  );

  const spinnerSize = sizeVariants[size];

  if (!fullScreen) {
    // Enhanced simple spinner for partial loading
    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center space-y-3">
          {/* Spinner with tactical elements */}
          <div className="relative">
            {/* Outer tactical rings */}
            {[0, 1, 2].map((ring) => (
              <motion.div
                key={ring}
                className={cn(
                  "absolute rounded-full border border-primary/20",
                  spinnerSize
                )}
                style={{
                  padding: `${ring * 4}px`,
                  margin: `-${ring * 4}px`,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 2.5 + ring * 0.3,
                  repeat: Infinity,
                  delay: ring * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Primary rotating ring */}
            <motion.div
              className={cn(
                "absolute rounded-full border-2 border-transparent",
                spinnerSize
              )}
              style={{
                background: "conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent)",
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Inner command core */}
            <motion.div
              className={cn(
                "rounded-full border-2 border-primary bg-primary/15 flex items-center justify-center",
                spinnerSize
              )}
              animate={{
                boxShadow: [
                  "0 0 12px hsl(var(--primary) / 0.4)",
                  "0 0 24px hsl(var(--primary) / 0.7)",
                  "0 0 12px hsl(var(--primary) / 0.4)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Strategic target icon */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, 15, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Target className={cn(
                  size === "sm" ? "w-3 h-3" : size === "lg" ? "w-6 h-6" : "w-4 h-4",
                  "text-primary"
                )} />
              </motion.div>
            </motion.div>

            {/* Orbital command dots */}
            {[0, 1, 2, 3].map((orbit) => (
              <motion.div
                key={orbit}
                className="absolute w-1.5 h-1.5 bg-primary/70 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  rotate: 360,
                  x: Math.cos(orbit * Math.PI / 2) * (size === "sm" ? 20 : size === "lg" ? 32 : 26),
                  y: Math.sin(orbit * Math.PI / 2) * (size === "sm" ? 20 : size === "lg" ? 32 : 26),
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: orbit * 0.15,
                  ease: "linear",
                }}
              />
            ))}

            {/* Tactical pulse overlay */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full border-2 border-primary/30",
                spinnerSize
              )}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Loading indicator with cycling messages */}
          <motion.div
            className="flex flex-col items-center space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div
              key={Math.floor(Date.now() / 2000) % 4}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-primary font-medium text-sm"
            >
              {["Loading...", "Command...", "Tactical...", "Strategy..."][Math.floor(Date.now() / 2000) % 4]}
            </motion.div>

            {/* Subtle pulsing dots */}
            <motion.div
              className="flex space-x-1"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {[0, 1, 2].map((dot) => (
                <motion.div
                  key={dot}
                  className="w-1 h-1 bg-primary/60 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: dot * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Enhanced full-screen loading screen
  return (
    <div className={containerClasses}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating military icons */}
        {militaryIcons.map((Icon, index) => (
          <motion.div
            key={index}
            className="absolute opacity-10 text-primary"
            style={{
              left: `${10 + (index * 20)}%`,
              top: `${20 + (index * 15)}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 4 + index,
              repeat: Infinity,
              delay: index * 0.5,
              ease: "easeInOut",
            }}
          >
            <Icon size={40 + index * 8} />
          </motion.div>
        ))}

        {/* Tactical grid overlay */}
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '50px 50px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Main loading content */}
      <motion.div
        className="relative z-10 flex flex-col items-center space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Strategic command center */}
        <div className="relative">
          {/* Outer tactical rings */}
          {[0, 1, 2].map((ring) => (
            <motion.div
              key={ring}
              className="absolute inset-0 rounded-full border border-primary/20"
              style={{
                width: `${120 + ring * 40}px`,
                height: `${120 + ring * 40}px`,
                marginLeft: `-${20 + ring * 20}px`,
                marginTop: `-${20 + ring * 20}px`,
              }}
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + ring * 0.5,
                repeat: Infinity,
                delay: ring * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Main spinner */}
          <div className="relative w-24 h-24">
            {/* Rotating tactical ring */}
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-transparent"
              style={{
                background: "conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent)",
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Pulsing core */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 20px hsl(var(--primary) / 0.3)",
                  "0 0 40px hsl(var(--primary) / 0.6)",
                  "0 0 20px hsl(var(--primary) / 0.3)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Strategic icon */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Target className="w-8 h-8 text-primary" />
              </motion.div>
            </motion.div>
          </div>

          {/* Orbital elements */}
          {[0, 1, 2, 3].map((orbit) => (
            <motion.div
              key={orbit}
              className="absolute w-3 h-3 bg-primary/60 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                rotate: 360,
                x: Math.cos(orbit * Math.PI / 2) * 60,
                y: Math.sin(orbit * Math.PI / 2) * 60,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: orbit * 0.2,
                ease: "linear",
              }}
            />
          ))}
        </div>

        {/* Loading messages */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.h3
            className="text-xl font-display font-bold text-white/90"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Games of the Generals
          </motion.h3>

          <motion.div
            key={Math.floor(Date.now() / 3000) % loadingMessages.length}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-primary font-medium"
          >
            {loadingMessages[Math.floor(Date.now() / 3000) % loadingMessages.length]}
          </motion.div>

          <motion.div
            className="flex items-center justify-center space-x-1 text-white/60 text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="flex space-x-1">
              {[0, 1, 2].map((dot) => (
                <motion.div
                  key={dot}
                  className="w-1 h-1 bg-primary rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: dot * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Tactical indicators */}
        <motion.div
          className="flex items-center space-x-6 text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="w-5 h-5" />
          </motion.div>

          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          >
            <Swords className="w-5 h-5" />
          </motion.div>

          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          >
            <Zap className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
