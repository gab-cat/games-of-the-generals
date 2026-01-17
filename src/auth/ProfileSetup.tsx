import { useState } from "react";
import { useConvexMutationWithQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Terminal,
} from "lucide-react";
import { Button } from "../components/ui/button";

import Squares from "../components/backgrounds/Squares/Squares";

export function ProfileSetup() {
  const [username, setUsername] = useState("");

  const createProfile = useConvexMutationWithQuery(
    api.profiles.createOrUpdateProfile,
    {
      onSuccess: () => {
        toast.success("Identity established. Welcome, Commander.");
      },
      onError: (error) => {
        console.error("Profile creation error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to establish identity",
        );
      },
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    createProfile.mutate({ username: username.trim() });
  };

  return (
    <div className="absolute inset-0 w-screen h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 selection:bg-amber-500/30">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="flex h-full w-full">
        {/* Left Panel - Briefing */}
        <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 bg-zinc-900/50 border-r border-zinc-800">
          {/* Decorative corner brackets */}
          <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-zinc-800 rounded-tl-sm opacity-50" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-zinc-800 rounded-br-sm opacity-50" />

          {/* Header */}
          <div className="z-10 mt-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center rounded-sm">
                <User className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-xs font-mono text-amber-500 tracking-wider">
                PERSONNEL ONBOARDING
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white mb-6 max-w-lg leading-tight uppercase font-display">
              Establish Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-400">
                Command Identity
              </span>
            </h1>

            <div className="space-y-6 max-w-md">
              <p className="text-zinc-400 text-base border-l-2 border-zinc-800 pl-4">
                Your codename will be your unique identifier across global
                operations. Choose wisely.
              </p>

              <div className="grid gap-4 pt-4">
                {[
                  {
                    icon: ShieldCheck,
                    label: "Secure Identity",
                    desc: "Encrypted profile record",
                  },
                  {
                    icon: Zap,
                    label: "Instant Access",
                    desc: "Real-time network propagation",
                  },
                  {
                    icon: Globe,
                    label: "Global Rank",
                    desc: "Visible on worldwide leaderboards",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-center opacity-80">
                    <item.icon className="w-4 h-4 text-zinc-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-600">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decorative Code Block */}
          <div className="opacity-30 font-mono text-[10px] text-zinc-500 space-y-1">
            <p>{`> INITIALIZING_PROFILE_SEQUENCE...`}</p>
            <p>{`> CONNECTING_TO_MAIN_SERVER... [OK]`}</p>
            <p>{`> AWAITING_USER_INPUT...`}</p>
          </div>
        </div>

        {/* Right Panel - Input Form */}
        <div className="flex-1 flex items-center justify-center relative bg-zinc-950 p-6 sm:p-12">
          {/* Mobile Background Overlay */}
          <div className="absolute inset-0 z-0 lg:hidden opacity-10">
            <Squares
              direction="diagonal"
              speed={0.5}
              borderColor="#3f3f46"
              squareSize={40}
              hoverFillColor="#27272a"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-xl p-8 rounded-sm shadow-2xl relative overflow-hidden">
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50" />

              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white uppercase tracking-wide font-display">
                  New Commander Registration
                </h2>
                <p className="text-zinc-500 text-xs font-mono mt-2">
                  Please enter your preferred callsign
                </p>
              </div>

              <form
                onSubmit={(e) => void handleSubmit(e)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 font-medium ml-1"
                  >
                    Callsign (Username)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Terminal className="h-4 w-4 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.replace(/\s/g, ""))
                      }
                      className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-100 pl-10 pr-4 py-3 rounded-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder:text-zinc-700 font-mono text-sm transition-all uppercase tracking-wider"
                      placeholder="ENTER_CODENAME"
                      required
                      minLength={3}
                      maxLength={20}
                      autoComplete="off"
                    />
                    <div className="absolute inset-0 border border-transparent group-hover:border-zinc-700/50 pointer-events-none rounded-sm transition-colors" />
                  </div>
                  <p className="text-[10px] text-zinc-600 font-mono flex justify-between px-1">
                    <span>3-20 CHARACTERS</span>
                    <span>NO SPACES</span>
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={createProfile.isPending || !username.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-sm h-12 uppercase tracking-wide font-sans text-xs transition-all relative overflow-hidden group shadow-[0_0_20px_-10px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_-5px_rgba(251,191,36,0.4)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {createProfile.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-zinc-900/50 border-t-zinc-900 rounded-full animate-spin" />
                      PROCESSING...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      CONFIRM IDENTITY <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 border-t border-zinc-800/50 pt-4 text-center">
                <p className="text-[10px] text-zinc-600 font-mono">
                  SECURE COMMUNICATION CHANNEL ESTABLISHED
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
