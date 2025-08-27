"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Shield, Swords, Crown, Target, Zap } from "lucide-react";
import { Progress } from "./ui/progress";
import Squares from "./backgrounds/Squares/Squares";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const phases = [
    "Initializing battlefield...",
    "Preparing for combat..."
  ];

  useEffect(() => {
    // Show content after a brief delay for smooth entrance
    const showTimer = setTimeout(() => setShowContent(true), 200);

    // Progress and phase animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1.5;

        // Change phases at different progress levels
        if (newProgress >= 50 && currentPhase === 0) {
          setCurrentPhase(1);
        }

        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newProgress;
      });
    }, 35);

    // Start fade out after 2 seconds (leaving 0.5s for fade out animation)
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
      // Complete after fade out animation finishes
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 2000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeOutTimer);
      clearInterval(progressInterval);
    };
  }, [onComplete, currentPhase]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isFadingOut ? 0 : 1
        }}
        transition={{
          opacity: {
            duration: isFadingOut ? 0.5 : 0.6,
            ease: "easeInOut"
          }
        }}
      >
        {/* Animated Squares Background */}
        <div className="absolute inset-0">
          <Squares
            direction="diagonal"
            speed={0.5}
            borderColor="rgba(148, 163, 184, 0.1)"
            squareSize={60}
            hoverFillColor="rgba(59, 130, 246, 0.05)"
          />
        </div>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-slate-900/20 to-purple-900/10" />

        {/* Floating military icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { Icon: Shield, color: "text-blue-400", size: 20 },
            { Icon: Target, color: "text-purple-400", size: 18 }
          ].map(({ Icon, color, size }, i) => (
            <motion.div
              key={i}
              className={`absolute ${color} opacity-10`}
              initial={{
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 50,
                opacity: 0
              }}
              animate={{
                y: -50,
                opacity: [0, 0.1, 0]
              }}
              transition={{
                duration: 6 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 2,
                ease: "easeInOut"
              }}
            >
              <Icon size={size} />
            </motion.div>
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4">
          <AnimatePresence>
            {showContent && (
              <motion.div
                className="flex flex-col items-center space-y-8 text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                {/* Hero Logo Section */}
                <motion.div
                  className="flex flex-col items-center space-y-6"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  {/* Animated Logo Container */}
                  <motion.div
                    className="relative"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200 }}
                  >
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl flex items-center justify-center"
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(255, 255, 255, 0.1)",
                          "0 0 30px rgba(59, 130, 246, 0.15)",
                          "0 0 20px rgba(255, 255, 255, 0.1)"
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <motion.div
                        animate={{
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5
                        }}
                      >
                        <Gamepad2 className="w-10 h-10 text-white" />
                      </motion.div>
                    </motion.div>

                    {/* Single subtle pulsing ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border border-blue-400/20"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                      }}
                    />
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    className="space-y-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                  >
                    <motion.h1
                      className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent leading-tight"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                    >
                      Games of the
                    </motion.h1>
                    <motion.h1
                      className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                    >
                      Generals
                    </motion.h1>
                  </motion.div>
                </motion.div>

                {/* Dynamic Status */}
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  <motion.div
                    className="text-white/80 font-body text-lg font-medium"
                    key={currentPhase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {phases[currentPhase]}
                  </motion.div>

                  {/* Enhanced Progress Bar */}
                  <motion.div
                    className="w-80 space-y-3"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                  >
                    <div className="relative">
                      <Progress
                        value={progress}
                        className="h-2 bg-white/10"
                      />
                      <motion.div
                        className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full"
                        style={{ width: `${progress}%` }}
                        animate={{
                          background: [
                            "linear-gradient(to right, #3b82f6, #8b5cf6, #3b82f6)",
                            "linear-gradient(to right, #8b5cf6, #3b82f6, #8b5cf6)",
                            "linear-gradient(to right, #3b82f6, #8b5cf6, #3b82f6)"
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-white/60 font-mono">
                      <span>Battlefield</span>
                      <span>{Math.round(progress)}%</span>
                      <span>Ready</span>
                    </div>
                  </motion.div>
                </motion.div>


              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </motion.div>
    </AnimatePresence>
  );
}
