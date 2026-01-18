"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  Shield,
  Target,
  Zap,
  Crown,
  Terminal,
  Activity,
  Cpu,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";

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
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

const loadingMessages = [
  "INITIALIZING_BATTLEFIELD_DATA",
  "DECODING_ENEMY_TRANSMISSIONS",
  "CALCULATING_OPTIMAL_VECTORS",
  "SYNCHRONIZING_COMMAND_NODES",
  "CALIBRATING_TACTICAL_ARRAYS",
  "ESTABLISHING_ENCRYPTED_LINK",
  "SCANNING_TERRAIN_TOPOLOGY",
  "MOBILIZING_ELITE_UNITS",
];

const militaryIcons = [Swords, Shield, Target, Zap, Crown];

export function LoadingSpinner({
  fullScreen = false,
  className,
  size = "md",
}: LoadingSpinnerProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const containerClasses = cn(
    "flex flex-col justify-center items-center select-none",
    fullScreen
      ? "fixed inset-0 z-[100] bg-[#050505] overflow-hidden"
      : "min-h-[60vh] relative",
    className,
  );

  const spinnerSize = sizeVariants[size];

  // Tactical Radar / Scanner View
  const RadarSpinner = () => (
    <div className="relative flex items-center justify-center">
      {/* Dynamic Scanline Circles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-amber-500/10"
          style={{
            width: `calc(100% + ${i * 40}px)`,
            height: `calc(100% + ${i * 40}px)`,
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main Spinner Container */}
      <div
        className={cn(
          "relative rounded-full p-2 bg-zinc-900/50 border border-white/5 backdrop-blur-sm",
          spinnerSize,
        )}
      >
        {/* Conic Gradient Scanner Beam */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, transparent 70%, rgba(245, 158, 11, 0.4) 100%)",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Static Radar Ticks */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/5" />

        {/* Central Tactical Core */}
        <div className="absolute inset-1 rounded-full bg-zinc-950 flex items-center justify-center border border-white/10 group overflow-hidden">
          {/* Pulsing Core */}
          <motion.div
            className="absolute inset-0 bg-amber-500/5"
            animate={{ opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <Target
            className={cn(
              "text-amber-500/80 relative z-10",
              size === "sm" ? "w-3 h-3" : size === "lg" ? "w-8 h-8" : "w-5 h-5",
            )}
          />
        </div>

        {/* Orbital Blips */}
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245, 158, 11, 0.8)]"
            animate={{
              rotate: 360,
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              rotate: { duration: 3 + i, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity },
              opacity: { duration: 1.5, repeat: Infinity },
            }}
            style={{
              top: "50%",
              left: "50%",
              marginLeft: "-0.75px",
              marginTop: "-0.75px",
              transformOrigin: `${size === "sm" ? 16 : size === "lg" ? 40 : 28}px center`,
            }}
          />
        ))}
      </div>

      {/* Crosshair Elements */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-px h-full bg-amber-500/5" />
        <div className="h-px w-full bg-amber-500/5" />
      </div>
    </div>
  );

  return (
    <div className={containerClasses}>
      {fullScreen && (
        <>
          {/* Tactical Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />
            {/* Ambient vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            {/* Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,.03),rgba(0,255,0,.01),rgba(0,0,255,.03))] bg-[length:100%_4px,3px_100%] z-20 pointer-events-none" />
          </div>

          {/* HUD Corner Elements */}
          <div className="absolute top-8 left-8 flex flex-col gap-2 font-mono text-[10px] text-zinc-500 tracking-widest opacity-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>SYSTEM_CALIBRATION_ACTIVE</span>
            </div>
            <div>LOC_SIG: 127.0.0.1:8080</div>
            <div>AUTH_LEVEL: GENERAL_HQ</div>
          </div>

          <div className="absolute bottom-8 right-8 text-right font-mono text-[10px] text-zinc-500 tracking-widest opacity-50">
            <div>ENCRYPTION: AES-256-GCM</div>
            <div>LATENCY: 24MS</div>
            <div className="mt-1 flex justify-end gap-1">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-4 h-1 bg-amber-500/20"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Main Content Vertical Stack */}
      <div className="relative z-10 flex flex-col items-center gap-12">
        <RadarSpinner />

        <div className="flex flex-col items-center gap-4 text-center">
          {/* Brand/App Title */}
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="flex items-center gap-3"
          >
            <div className="h-[1px] w-8 bg-amber-500/20" />
            <h3 className="text-zinc-500 font-mono text-xs tracking-[0.3em] uppercase">
              Games of the Generals
            </h3>
            <div className="h-[1px] w-8 bg-amber-500/20" />
          </motion.div>

          {/* Terminal Message Display */}
          <div className="h-6 flex items-center justify-center font-mono">
            <AnimatePresence mode="wait">
              <motion.div
                key={messageIndex}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-center gap-3 text-amber-400/90 text-[10px] sm:text-xs tracking-[0.15em] font-bold"
              >
                <Terminal size={12} className="opacity-50" />
                <span>{loadingMessages[messageIndex]}</span>
                <motion.span
                  animate={{ opacity: [1, 1, 0, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    times: [0, 0.5, 0.5, 1],
                    ease: "linear",
                  }}
                  className="w-[2px] h-3 bg-amber-500"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tactical Icon Grid */}
          <motion.div
            className="flex items-center gap-6 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[Activity, Cpu, Shield, Swords].map((Icon, i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              >
                <Icon className="text-white w-4 h-4" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Background Ambience Icons for Fullscreen Only */}
      {fullScreen && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
          {militaryIcons.map((Icon, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                rotate: Math.random() * 360,
              }}
              animate={{
                y: ["-10%", "110%"],
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "linear",
                delay: -i * 10,
              }}
            >
              <Icon size={120} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
