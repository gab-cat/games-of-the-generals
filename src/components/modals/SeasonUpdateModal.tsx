import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import {
  Check,
  Terminal,
  Shield,
  Crosshair,
  Sparkles,
  Zap,
  ChevronRight,
} from "lucide-react";

export function SeasonUpdateModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasAcknowledged = localStorage.getItem("season2_acknowledged");
    // Ensure we are client-side
    if (typeof window !== "undefined" && !hasAcknowledged) {
      // Small delay to prevent conflict with other initial popups
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem("season2_acknowledged", "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleAcknowledge()}>
      <DialogContent className="max-w-3xl p-0 bg-zinc-950 border-amber-500/30 text-white overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)] sm:rounded-xl">
        <div className="relative">
          {/* Header Image Section */}
          <div className="relative h-64 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10" />
            <img
              src="/assets/season-update.webp"
              alt="Season 2 Update"
              className="w-full h-full object-cover object-center transform scale-105"
            />

            {/* Overlay Text on Image */}
            <div className="absolute bottom-6 left-6 z-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 mb-2"
              >
                <div className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-500 text-[10px] font-mono tracking-widest uppercase">
                  System Update v2.0
                </div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight text-shadow-lg"
              >
                SEASON 2 <span className="text-amber-500">INITIALIZED</span>
              </motion.h2>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-8 relative z-20">
            {/* Cosmetic Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Terminal className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-mono font-bold text-amber-100 text-sm">
                      SYSTEM REVAMPED
                    </h3>
                    <p className="text-zinc-400 text-xs leading-relaxed mt-1">
                      Our command center has undergone a complete architectural
                      overhaul. Tactical interfaces are now optimized for
                      superior combat efficiency.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Crosshair className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-mono font-bold text-emerald-100 text-sm">
                      IMPROVED INTELLIGENCE
                    </h3>
                    <p className="text-zinc-400 text-xs leading-relaxed mt-1">
                      Battle analysis algorithms upgraded. Match history and
                      player statistics now provide deeper strategic insights.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-mono font-bold text-blue-100 text-sm">
                      ENHANCED SECURITY
                    </h3>
                    <p className="text-zinc-400 text-xs leading-relaxed mt-1">
                      Fortified defenses against unauthorized incursions. Fair
                      play protocols strictness level increased to maximum.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-6">
                <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-lg">
                  <h4 className="text-[10px] font-mono uppercase text-zinc-500 mb-3 tracking-wider">
                    Patch Highlights
                  </h4>
                  <ul className="space-y-2">
                    {[
                      "New Lobby Interface",
                      "Ranked Matchmaking v2",
                      "Mobile Performance Boost",
                      "Anti-Cheat Integration",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center text-xs text-zinc-300"
                      >
                        <ChevronRight className="w-3 h-3 text-amber-500 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleAcknowledge}
                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-black font-bold font-mono tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    ACKNOWLEDGE UPDATE
                  </Button>
                  <p className="text-center text-[10px] text-zinc-600 mt-2 font-mono">
                    Session ID:{" "}
                    {new Date().getTime().toString(36).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
