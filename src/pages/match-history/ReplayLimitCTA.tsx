import { motion } from "framer-motion";
import { Lock, Crown, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export function ReplayLimitCTA() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-6 group overflow-hidden"
    >
      {/* Tactical Container */}
      <div className="relative bg-zinc-900/40 border border-amber-500/20 rounded-xl overflow-hidden backdrop-blur-sm">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500/50 to-transparent" />
        <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
          <div className="absolute top-0 right-0 w-[1px] h-full bg-amber-500/20" />
          <div className="absolute top-0 right-0 w-full h-[1px] bg-amber-500/20" />
        </div>

        {/* Scanline background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20" />

        <div className="relative p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 shrink-0">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-display font-medium text-amber-400 tracking-wide">
                  Archive Protocol: Restricted
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] font-mono text-amber-500 border border-amber-500/20">
                  FREE TIER
                </span>
              </div>
              <p className="text-xs sm:text-xs text-zinc-400 max-w-xl leading-relaxed">
                Free operatives are limited to{" "}
                <span className="text-white font-medium">1 visible replay</span>{" "}
                in the history logs. Upgrade security clearance to access
                extended combat archives.
              </p>

              <div className="flex items-center gap-4 mt-2 pt-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                  <Zap className="w-3 h-3 text-amber-500/60" />
                  <span>PRO: 50 REPLAYS</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                  <Crown className="w-3 h-3 text-amber-500/60" />
                  <span>PRO+: 100 REPLAYS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto shrink-0 pl-0 sm:pl-4 sm:border-l border-white/5">
            <Button
              onClick={() =>
                navigate({ to: "/pricing", search: { donation: undefined } })
              }
              className="w-full font-mono sm:w-auto bg-amber-500 text-black hover:bg-amber-400 font-medium tracking-wide text-xs h-9"
            >
              <Crown className="w-3.5 h-3.5 mr-2" />
              UPGRADE CLEARANCE
              <ChevronRight className="w-3.5 h-3.5 ml-1 opacity-60" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
