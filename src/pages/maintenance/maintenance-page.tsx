import { motion } from "framer-motion";
import {
  AlertTriangle,
  Terminal,
  RefreshCw,
  ShieldAlert,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Squares from "@/components/backgrounds/Squares/Squares";

export function MaintenancePage() {
  const handleRefresh = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-zinc-800 text-zinc-100 font-mono relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <Squares
          direction="diagonal"
          speed={0.5}
          squareSize={40}
          borderColor="#333"
          hoverFillColor="#222"
        />
      </div>

      {/* Vignette & texture over background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />

      {/* Grid Pattern Overlay per user request for creative vibe */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-2xl overflow-hidden relative"
        >
          {/* Top Decorative Bar */}
          <div className="bg-zinc-950/50 p-3 flex items-center justify-between border-b border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs text-amber-500 font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>System Override /// Active</span>
            </div>
            <div className="flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-pulse" />
              <div className="h-4 w-[1px] bg-zinc-800" />
              <div className="text-[10px] text-zinc-500 font-mono">ERR_503</div>
            </div>
          </div>

          <div className="p-8 md:p-12 relative">
            {/* Subtle animated scanline */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.5)] z-20 pointer-events-none"
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            <div className="flex flex-col items-center text-center space-y-8">
              {/* Central Graphic */}
              <div className="relative group">
                <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                <div className="bg-zinc-950 p-6 rounded-full border border-amber-500/30 relative shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Cpu className="w-16 h-16 text-amber-500" />
                  </motion.div>
                </div>
                {/* Decorative rings */}
                <div className="absolute inset-[-10px] border border-dashed border-zinc-700 rounded-full animate-[spin_60s_linear_infinite]" />
                <div className="absolute inset-[-20px] border border-zinc-800 rounded-full opacity-50" />
              </div>

              {/* Text Content */}
              <div className="space-y-4 max-w-lg">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-lg">
                  System
                  <br />
                  <span className="text-amber-500">Maintenance</span>
                </h1>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed border-l-2 border-amber-500/50 pl-4 text-left bg-zinc-950/30 p-2 rounded-r">
                  The command center is currently undergoing critical upgrades.
                  Tactical operations are temporarily suspended.
                </p>
              </div>

              {/* Status Box */}
              <div className="w-full bg-zinc-950/80 border border-zinc-800 backdrop-blur-sm p-0 rounded overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-zinc-800 border-b border-zinc-800">
                  <div className="p-3 bg-zinc-900/30">
                    <span className="block text-zinc-600 uppercase tracking-widest text-[9px] mb-1">
                      Status
                    </span>
                    <span className="text-amber-500 font-bold text-xs animate-pulse">
                      OFFLINE MODE
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-900/30">
                    <span className="block text-zinc-600 uppercase tracking-widest text-[9px] mb-1">
                      Est. Return
                    </span>
                    <span className="text-emerald-500 font-mono text-xs">
                      CALCULATING...
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-black/40">
                  <span className="block text-zinc-600 uppercase tracking-widest text-[9px] mb-2 text-left">
                    Latest Signals
                  </span>
                  <div className="space-y-1.5 font-mono text-xs text-left">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <span className="text-zinc-700">➜</span>
                      <span>Initiating maintenance protocol...</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <span className="text-zinc-700">➜</span>
                      <span>Secure channels locked.</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-500/80">
                      <span className="animate-pulse">_</span>
                      <span>Awaiting deployment completion</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 w-full">
                <Button
                  onClick={handleRefresh}
                  size="lg"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase tracking-widest hover:scale-[1.02] transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                >
                  <RefreshCw className="mr-2 w-4 h-4 animate-[spin_4s_linear_infinite]" />
                  Verify System Status
                </Button>
                <p className="text-[10px] text-zinc-600 mt-3 font-mono">
                  REF_ID:{" "}
                  {Math.random().toString(36).substring(7).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="bg-zinc-950 border-t border-zinc-800 p-2 flex justify-between items-center px-4">
            <div className="flex gap-2">
              <div className="w-1 h-1 bg-zinc-600 rounded-full" />
              <div className="w-1 h-1 bg-zinc-600 rounded-full" />
              <div className="w-1 h-1 bg-zinc-600 rounded-full" />
            </div>
            <span className="text-[9px] text-zinc-600 font-mono tracking-widest uppercase">
              Games of Generals /// Maintenance Protocol v2.4
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
