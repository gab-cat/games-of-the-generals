"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Shield, Target } from "lucide-react";
import { Progress } from "./ui/progress";
import Squares from "./backgrounds/Squares/Squares";
import { useSound } from "../lib/SoundProvider";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const { playSFX } = useSound();

  const phases = [
    "Initializing battlefield...",
    "Preparing for combat..."
  ];

  useEffect(() => {
    // Delay sound effect to avoid blocking initial render
    const soundTimer = setTimeout(() => playSFX("intro"), 100);

    // Show content immediately for better LCP
    const showTimer = setTimeout(() => setShowContent(true), 50);

    // Faster progress animation for quicker completion
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 2.5; // Increased speed

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
    }, 25); // Faster interval

    // Shorter duration for better LCP (1.5s instead of 2s)
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
      // Complete after fade out animation finishes
      setTimeout(() => {
        onComplete();
      }, 300); // Shorter fade out
    }, 1500);

    return () => {
      clearTimeout(soundTimer);
      clearTimeout(showTimer);
      clearTimeout(fadeOutTimer);
      clearInterval(progressInterval);
    };
  }, [onComplete, currentPhase, playSFX]);

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
        {/* Deferred Squares Background for LCP optimization */}
        {showContent && (
          <div className="absolute inset-0">
            <Squares
              direction="diagonal"
              speed={0.3} // Reduced speed
              borderColor="rgba(148, 163, 184, 0.08)" // More subtle
              squareSize={80} // Larger squares, less processing
              hoverFillColor="rgba(59, 130, 246, 0.03)" // More subtle
            />
          </div>
        )}

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-slate-900/20 to-purple-900/10" />

        {/* Simplified floating military icons for LCP */}
        {showContent && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { Icon: Shield, color: "text-blue-400", size: 24 },
              { Icon: Target, color: "text-purple-400", size: 20 }
            ].map(({ Icon, color, size }, i) => (
              <motion.div
                key={i}
                className={`absolute ${color} opacity-5`} // Reduced opacity
                initial={{
                  x: (i * 200) + 100, // Fixed positions instead of random
                  y: window.innerHeight + 30,
                  opacity: 0
                }}
                animate={{
                  y: -30,
                  opacity: [0, 0.08, 0]
                }}
                transition={{
                  duration: 4, // Shorter duration
                  repeat: Infinity,
                  delay: i * 1.5, // Reduced delay
                  ease: "linear" // Simpler easing
                }}
              >
                <Icon size={size} />
              </motion.div>
            ))}
          </div>
        )}

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
                  {/* Simplified Logo Container for LCP */}
                  <motion.div
                    className="relative"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }} // Simplified animation
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl flex items-center justify-center">
                      <Gamepad2 className="w-10 h-10 text-white" />
                    </div>
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

                  {/* Simplified Progress Bar for LCP */}
                  <motion.div
                    className="w-80 space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }} // Simplified animation
                  >
                    <div className="relative">
                      <Progress
                        value={progress}
                        className="h-2 bg-white/10"
                      />
                      <div
                        className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-75 ease-linear"
                        style={{ width: `${progress}%` }}
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
