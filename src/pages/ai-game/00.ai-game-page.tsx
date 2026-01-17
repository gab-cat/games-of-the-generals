import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import {
  useConvexQueryWithOptions,
  useConvexQuery,
} from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Loader2,
  Bot,
  User,
  Star,
  Zap,
  Crown,
  Shield,
  Target,
  Feather,
  Eye,
  EyeOff,
  Lock,
  ChevronRight,
  AlertTriangle,
  Terminal,
  Cpu,
  Activity,
  Swords,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { AIGameBoard } from "../../components/ai-game/AIGameBoard";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { UpgradeDonationCTA } from "../../components/subscription/UpgradeDonationCTA";

type Difficulty = "easy" | "medium" | "hard";
type Behavior = "aggressive" | "defensive" | "passive" | "balanced";

const difficultyConfig = {
  easy: {
    label: "RECRUIT",
    subLabel: "Easy Difficulty",
    description:
      "Simulation target with limited tactical processing. Makes random moves.",
    icon: Star,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgGradient: "from-emerald-500/10 to-transparent",
    techLevel: "MK-1",
  },
  medium: {
    label: "VETERAN",
    subLabel: "Medium Difficulty",
    description:
      "Standard combat unit. Executes strategic maneuvers and balanced plays.",
    icon: Zap,
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgGradient: "from-amber-500/10 to-transparent",
    techLevel: "MK-2",
  },
  hard: {
    label: "COMMANDER",
    subLabel: "Hard Difficulty",
    description:
      "Elite tactical AI. Uses advanced prediction and aggressive flanking.",
    icon: Crown,
    color: "text-rose-500",
    borderColor: "border-rose-500/30",
    bgGradient: "from-rose-500/10 to-transparent",
    techLevel: "MK-3",
  },
};

// Reordered: Balanced first (Default)
const behaviorConfig: Record<
  Behavior,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  balanced: {
    label: "BALANCED",
    description: "Adapt & Overcome. Mixed tactics.",
    icon: Target,
    color: "text-purple-400",
  },
  aggressive: {
    label: "AGGRESSIVE",
    description: "Seek & Destroy. Prioritizes captures.",
    icon: Swords,
    color: "text-orange-400",
  },
  defensive: {
    label: "DEFENSIVE",
    description: "Hold the Line. Prioritizes safety.",
    icon: Shield,
    color: "text-blue-400",
  },
  passive: {
    label: "PASSIVE",
    description: "Avoid Conflict. Advances cautiously.",
    icon: Feather,
    color: "text-emerald-400",
  },
};

export function AIGamePage() {
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>("medium");
  const [selectedBehavior, setSelectedBehavior] =
    useState<Behavior>("balanced");
  const [isStarting, setIsStarting] = useState(false);
  const [revealAIPieces, setRevealAIPieces] = useState(false);

  // Mutations
  const startAIGame = useMutation(api.aiGame.startAIGameSession);
  const cleanupSession = useMutation(api.aiGame.cleanupAIGameSession);

  // Queries
  const { data: currentSession } = useConvexQueryWithOptions(
    api.aiGame.getCurrentUserAIGame,
    {},
    {
      staleTime: 60000,
      gcTime: 300000,
    },
  );

  const { data: profile } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    {
      staleTime: 120000,
      gcTime: 600000,
    },
  );

  // Check difficulty access
  const { data: easyAccess } = useConvexQuery(
    api.featureGating.checkAIDifficultyAccess,
    { difficulty: "easy" },
  );
  const { data: mediumAccess } = useConvexQuery(
    api.featureGating.checkAIDifficultyAccess,
    { difficulty: "medium" },
  );
  const { data: hardAccess } = useConvexQuery(
    api.featureGating.checkAIDifficultyAccess,
    { difficulty: "hard" },
  );

  // Derived state for access checking
  // If user has access to HARD, they are PRO/PRO+. This is our reliable check for "Is Pro?"
  // without needing to inspect the profile string directly which might vary.
  const isPro = hardAccess?.hasAccess === true;

  useEffect(() => {
    if (currentSession && currentSession.status === "finished") {
      void cleanupSession({ sessionId: currentSession.sessionId });
    }
  }, [currentSession, cleanupSession]);

  const handleStartGame = () => {
    if (!profile) return;

    // 1. Check Difficulty Access
    const diffAccessCheck =
      selectedDifficulty === "easy"
        ? easyAccess
        : selectedDifficulty === "medium"
          ? mediumAccess
          : hardAccess;
    const difficultyLabel = difficultyConfig[selectedDifficulty].label;

    if (diffAccessCheck && !diffAccessCheck.hasAccess) {
      if (diffAccessCheck.reason === "subscription_expired") {
        toast.error(
          `Clearance denied. Renew subscription for ${difficultyLabel} access.`,
        );
        navigate({ to: "/subscription", search: { subscription: undefined } });
      } else {
        toast.error(
          `Clearance denied. ${difficultyLabel} is restricted to Pro agents.`,
        );
        navigate({ to: "/pricing", search: { donation: undefined } });
      }
      return;
    }

    // 2. Check Behavior Access
    // "Rule: selection behavior is only allowed on pro" (Default 'balanced' is free, others Pro)
    if (selectedBehavior !== "balanced" && !isPro) {
      toast.error("Advanced Combat Doctrines are restricted to Pro agents.");
      navigate({ to: "/pricing", search: { donation: undefined } });
      return;
    }

    setIsStarting(true);
    startAIGame({
      profileId: profile._id,
      difficulty: selectedDifficulty,
      behavior: selectedBehavior,
    })
      .catch((error) => {
        console.error("Failed to start AI game:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to initiate combat simulation",
        );
      })
      .finally(() => {
        setIsStarting(false);
      });
  };

  const handleQuitGame = () => {
    if (!currentSession) return;
    cleanupSession({ sessionId: currentSession.sessionId }).catch((error) => {
      console.error("Failed to quit game:", error);
    });
  };

  // --------------------------------------------------------------------------------
  // ACTIVE GAME OVERLAY
  // --------------------------------------------------------------------------------
  if (
    currentSession &&
    (currentSession.status === "setup" || currentSession.status === "playing")
  ) {
    return (
      <>
        <div className="min-h-screen relative overflow-hidden bg-black">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Game Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-sm border border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-widest font-mono text-white/40">
                      SIMULATION ACTIVE
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <h1 className="text-2xl font-display font-medium text-white tracking-tight">
                    COMBAT SIMULATION
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-white/5 text-white/70 border-white/10 font-mono rounded-md px-3 py-1"
                >
                  <span className="text-white/40 mr-2">OPPONENT:</span>
                  {
                    difficultyConfig[
                      currentSession.difficulty as keyof typeof difficultyConfig
                    ].label
                  }
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-white/5 text-white/70 border-white/10 font-mono rounded-md px-3 py-1"
                >
                  <span className="text-white/40 mr-2">STRATEGY:</span>
                  {
                    behaviorConfig[
                      currentSession.behavior as keyof typeof behaviorConfig
                    ].label
                  }
                </Badge>
                <Button
                  variant="destructive"
                  onClick={handleQuitGame}
                  className="ml-4 font-mono text-xs uppercase tracking-wider bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-md"
                >
                  ABORT SIMULATION
                </Button>
              </div>
            </div>

            {/* Turn Indicator */}
            <div className="flex items-center justify-between p-4 rounded-sm border border-white/5 bg-white/5 backdrop-blur-md">
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg border transition-all duration-300",
                  currentSession.currentTurn === "player1"
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400",
                )}
              >
                {currentSession.currentTurn === "player1" ? (
                  <>
                    <User className="h-4 w-4" />
                    <span className="font-mono text-xs uppercase tracking-wider font-bold">
                      YOUR TURN
                    </span>
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4" />
                    <span className="font-mono text-xs uppercase tracking-wider font-bold">
                      AI CALCULATING...
                    </span>
                  </>
                )}
              </div>

              {/* Dev Tools */}
              {import.meta.env.DEV && currentSession.status === "playing" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevealAIPieces(!revealAIPieces)}
                  className="text-yellow-400/70 hover:text-yellow-400 font-mono text-xs"
                >
                  {revealAIPieces ? (
                    <EyeOff className="w-4 h-4 mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  {revealAIPieces ? "HIDE ENEMY INTEL" : "REVEAL ENEMY INTEL"}
                </Button>
              )}
            </div>

            {/* Game Board */}
            <div className="relative">
              {/* Board Decoration */}
              <div className="absolute -inset-4 bg-gradient-to-b from-blue-500/5 to-transparent rounded-2xl pointer-events-none" />
              <AIGameBoard
                sessionId={currentSession.sessionId}
                revealAIPieces={revealAIPieces}
              />
            </div>
          </div>
        </div>
        <UpgradeDonationCTA />
      </>
    );
  }

  // --------------------------------------------------------------------------------
  // SELECTION SCREEN ("COMMAND CENTER")
  // --------------------------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen  text-white selection:bg-blue-500/30 font-sans p-4 sm:p-6" // Added global padding and roundedness support via container
    >
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none select-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto rounded-sm overflow-hidden min-h-[calc(100vh-3rem)]">
        {" "}
        {/* Roundedness reduced for dashboard look */}
        {/* Header Section */}
        <div className="mb-12 md:mb-16 space-y-4 px-2 md:px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "circOut" }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-3 text-blue-400/60 font-mono text-xs tracking-[0.2em] uppercase">
              <Terminal className="w-4 h-4" />
              <span>System Ready</span>
              <span className="w-px h-3 bg-blue-500/30" />
              <span>Ver {import.meta.env.VITE_APP_VERSION || "2.4.0"}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-medium text-white tracking-tight leading-none">
              Tactical <span className="text-white/20">Simulation</span>
            </h1>
            <p className="max-w-xl text-white/50 text-sm leading-relaxed font-light">
              Configure AI opponent parameters for combat simulation. Higher
              threat levels require advanced strategic clearance.
            </p>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-2 md:px-4 pb-12">
          {/* LEFT COLUMN: Controls */}
          <div className="lg:col-span-8 space-y-12">
            {/* 1. THREAT LEVEL */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-white/10 flex-1" />
                <h2 className="font-mono text-xs uppercase tracking-widest text-white/40">
                  Phase 1 // Select Threat Level
                </h2>
                <div className="h-px bg-white/10 w-8" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(
                  Object.entries(difficultyConfig) as [
                    Difficulty,
                    typeof difficultyConfig.easy,
                  ][]
                ).map(([key, config], i) => {
                  const accessCheck =
                    key === "easy"
                      ? easyAccess
                      : key === "medium"
                        ? mediumAccess
                        : hardAccess;
                  const isLocked = accessCheck && !accessCheck.hasAccess;
                  const isSelected = selectedDifficulty === key;

                  return (
                    <motion.button
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      onClick={() => setSelectedDifficulty(key)}
                      className={cn(
                        "group relative flex flex-col items-start text-left p-6 h-full transition-all duration-300 rounded-sm border backdrop-blur-sm overflow-hidden",
                        isSelected
                          ? `bg-black/40 ${config.borderColor} shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)]`
                          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10",
                      )}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <motion.div
                          layoutId="active-difficulty"
                          className={cn(
                            "absolute inset-0 bg-gradient-to-b opacity-20 pointer-events-none",
                            config.bgGradient,
                          )}
                        />
                      )}
                      {/* Tech Lines */}
                      <div className="absolute top-0 right-0 p-3 opacity-20">
                        <span className="font-mono text-[10px]">
                          {config.techLevel}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "p-3 rounded-lg mb-4 bg-black/40 border border-white/10 transition-colors duration-300",
                          isSelected
                            ? config.color
                            : "text-white/40 group-hover:text-white/70",
                        )}
                      >
                        <config.icon className="w-6 h-6" />
                      </div>

                      <div className="relative z-10 space-y-2">
                        <h3
                          className={cn(
                            "font-display text-lg font-bold tracking-wide transition-colors duration-300",
                            isSelected ? "text-white" : "text-white/60",
                          )}
                        >
                          {config.label}
                        </h3>
                        <p className="text-xs text-white/40 font-mono leading-relaxed">
                          {config.description}
                        </p>
                      </div>

                      {/* Lock Overlay */}
                      {isLocked && (
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-amber-500/10 border-t border-amber-500/20 backdrop-blur-md">
                          <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                            <Lock className="w-3 h-3" />
                            <span>Restricted</span>
                          </div>
                        </div>
                      )}

                      {/* Active Corners */}
                      {isSelected && (
                        <>
                          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50 transition-colors" />
                          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50 transition-colors" />
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {/* 2. BEHAVIOR */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-white/10 flex-1" />
                <h2 className="font-mono text-xs uppercase tracking-widest text-white/40">
                  Phase 2 // Combat Doctrine
                </h2>
                <div className="h-px bg-white/10 w-8" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(
                  Object.entries(behaviorConfig) as [
                    Behavior,
                    typeof behaviorConfig.balanced,
                  ][]
                ).map(([key, config], i) => {
                  const isSelected = selectedBehavior === key;
                  const isLocked = key !== "balanced" && !isPro;

                  return (
                    <motion.button
                      key={key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      onClick={() => setSelectedBehavior(key)}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-3 py-4 px-2 rounded-sm border transition-all duration-300 overflow-hidden",
                        isSelected
                          ? "bg-white/10 border-white/20"
                          : "bg-transparent border-white/5 hover:bg-white/5 hover:border-white/10",
                      )}
                    >
                      <div
                        className={cn(
                          "transition-colors duration-300 relative",
                          isSelected ? config.color : "text-white/20",
                        )}
                      >
                        <config.icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={cn(
                            "text-xs font-mono uppercase tracking-widest transition-colors duration-300",
                            isSelected ? "text-white" : "text-white/40",
                          )}
                        >
                          {config.label}
                        </span>
                        {isLocked && (
                          <div className="flex items-center gap-1 text-[9px] text-amber-500/80 font-bold uppercase tracking-wider">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Pro</span>
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <>
                          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40 transition-colors" />
                          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40 transition-colors" />
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              {/* Strategy Description */}
              <motion.div
                key={selectedBehavior}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-4 border border-white/5 bg-black/20 rounded-sm"
              >
                <div className="flex items-center justify-center gap-2">
                  {selectedBehavior !== "balanced" && !isPro ? (
                    <div className="flex items-center gap-2 text-amber-500">
                      <AlertTriangle className="w-4 h-4" />
                      <p className="font-mono text-xs">
                        Upgrade to Pro to unlock{" "}
                        {behaviorConfig[selectedBehavior].label} strategy.
                      </p>
                    </div>
                  ) : (
                    <p className="font-mono text-xs text-white/50 text-center">
                      <span className="text-white/30 uppercase mr-2">
                        [Strategy Note]
                      </span>
                      {behaviorConfig[selectedBehavior].description}
                    </p>
                  )}
                </div>
              </motion.div>
            </section>

            {/* 3. ACTION */}
            <section className="pt-4">
              <Button
                size="lg"
                className={cn(
                  "w-full text-base rounded-sm font-mono transition-all duration-500",
                  "bg-white text-black hover:bg-blue-400 hover:text-white hover:tracking-[0.2em]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
                onClick={handleStartGame}
                disabled={isStarting || !profile}
              >
                {isStarting ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Initializing Sequence...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5" />
                    <span>Initiate Simulation</span>
                    <ChevronRight className="w-5 h-5 opacity-50" />
                  </div>
                )}
              </Button>
            </section>
          </div>

          {/* RIGHT COLUMN: Readout */}
          <div className="lg:col-span-4 space-y-6">
            {/* Mission Status / Warnings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 border border-white/10 bg-white/5 rounded-sm backdrop-blur-md relative overflow-hidden"
            >
              {/* Scanline */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-20 pointer-events-none" />

              <h3 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Simulation Parameters
              </h3>

              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/40">OPPONENT CLASS</span>
                  <span
                    className={cn(
                      "uppercase",
                      difficultyConfig[selectedDifficulty].color,
                    )}
                  >
                    {difficultyConfig[selectedDifficulty].label}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/40">BEHAVIOR MOD</span>
                  <span
                    className={cn(
                      "uppercase",
                      selectedBehavior !== "balanced" && !isPro
                        ? "text-amber-500"
                        : "text-white",
                    )}
                  >
                    {behaviorConfig[selectedBehavior].label}
                    {selectedBehavior !== "balanced" && !isPro && " (LOCKED)"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/40">MAP CONFIG</span>
                  <span className="text-white/60">STANDARD GRID (9x8)</span>
                </div>
              </div>

              {/* Warnings if locked */}
              {(() => {
                const diffAccessCheck =
                  selectedDifficulty === "easy"
                    ? easyAccess
                    : selectedDifficulty === "medium"
                      ? mediumAccess
                      : hardAccess;
                const isDiffLocked =
                  diffAccessCheck && !diffAccessCheck.hasAccess;
                const isBehaviorLocked =
                  selectedBehavior !== "balanced" && !isPro;

                if (isDiffLocked || isBehaviorLocked) {
                  return (
                    <div className="mt-6 p-4 border border-amber-500/30 bg-amber-500/10 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        <div className="space-y-2">
                          <p className="text-amber-500 font-bold text-xs uppercase tracking-wider">
                            Authorization Required
                          </p>
                          <p className="text-amber-200/60 text-xs leading-relaxed">
                            {isBehaviorLocked
                              ? "Selected strategy requires Pro clearance."
                              : diffAccessCheck?.reason ===
                                  "subscription_expired"
                                ? "Clearance expired. Renew license to access."
                                : "Insufficient clearance level. Upgrade required."}
                          </p>
                          <div className="pt-2">
                            <span className="text-[10px] uppercase text-amber-500/50 block mb-1">
                              Override Code:
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 h-8 font-mono"
                              onClick={() => {
                                if (
                                  diffAccessCheck?.reason ===
                                  "subscription_expired"
                                ) {
                                  navigate({
                                    to: "/subscription",
                                    search: { subscription: undefined },
                                  });
                                } else {
                                  navigate({
                                    to: "/pricing",
                                    search: { donation: undefined },
                                  });
                                }
                              }}
                            >
                              ACQUIRE CLEARANCE
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </motion.div>

            {/* Operational Guide (Rules in small text) */}
            <div className="pl-4 border-l border-white/10 space-y-4">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
                Operational Directives
              </p>
              <ul className="space-y-4">
                {[
                  "Capture the enemy colors to secure victory.",
                  "Reach the opposing backline with your flag.",
                  "Higher ranked officers capture lower ranks.",
                  "Spies can eliminate Generals.",
                ].map((rule, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-xs text-white/50 font-light items-start"
                  >
                    <span className="w-1 h-1 bg-white/20 mt-1.5 rounded-full shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <UpgradeDonationCTA />
    </motion.div>
  );
}
