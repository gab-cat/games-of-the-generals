import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { useConvexQueryWithOptions, useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { Loader2, Bot, User, Star, Zap, Crown, Shield, Target, Feather, Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "../../lib/utils";
import { AIGameBoard } from "../../components/ai-game/AIGameBoard";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { UpgradeDonationCTA } from "../../components/subscription/UpgradeDonationCTA";
        
type Difficulty = "easy" | "medium" | "hard";
type Behavior = "aggressive" | "defensive" | "passive" | "balanced";

const difficultyConfig = {
  easy: {
    label: "Easy",
    description: "Perfect for beginners. AI makes random moves.",
    icon: Star,
    color: "bg-green-500",
    textColor: "text-green-600",
  },
  medium: {
    label: "Medium", 
    description: "Balanced challenge. AI makes strategic decisions.",
    icon: Zap,
    color: "bg-yellow-500", 
    textColor: "text-yellow-600",
  },
  hard: {
    label: "Hard",
    description: "Expert level. AI uses advanced tactics.",
    icon: Crown,
    color: "bg-red-500",
    textColor: "text-red-600",
  },
};

const behaviorConfig: Record<Behavior, { label: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string; textColor: string }>= {
  aggressive: {
    label: "Aggressive",
    description: "Seeks battles and prioritizes captures.",
    icon: Target,
    color: "bg-red-500",
    textColor: "text-red-500",
  },
  defensive: {
    label: "Defensive",
    description: "Values safety and favorable trades.",
    icon: Shield,
    color: "bg-blue-500",
    textColor: "text-blue-500",
  },
  passive: {
    label: "Passive",
    description: "Avoids fights, advances cautiously.",
    icon: Feather,
    color: "bg-emerald-500",
    textColor: "text-emerald-500",
  },
  balanced: {
    label: "Balanced",
    description: "Mix of offense and defense.",
    icon: Zap,
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
  },
};

export function AIGamePage() {
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [selectedBehavior, setSelectedBehavior] = useState<Behavior>("balanced");
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
      staleTime: 60000, // 60 seconds - OPTIMIZED: increased from 30s to reduce polling frequency
      gcTime: 300000, // 5 minutes cache
    }
  );

  // Profile data changes infrequently
  const { data: profile } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    {
      staleTime: 120000, // 2 minutes - profile data changes infrequently
      gcTime: 600000, // 10 minutes cache
    }
  );

  // Check difficulty access
  const { data: easyAccess } = useConvexQuery(api.featureGating.checkAIDifficultyAccess, { difficulty: "easy" });
  const { data: mediumAccess } = useConvexQuery(api.featureGating.checkAIDifficultyAccess, { difficulty: "medium" });
  const { data: hardAccess } = useConvexQuery(api.featureGating.checkAIDifficultyAccess, { difficulty: "hard" });

  // Check for existing session
  useEffect(() => {
    if (currentSession && currentSession.status === "finished") {
      // Auto-cleanup finished games
      void cleanupSession({ sessionId: currentSession.sessionId });
    }
  }, [currentSession, cleanupSession]);

  const handleStartGame = () => {
    if (!profile) return;
    
    // Check if selected difficulty is accessible
    const accessCheck = selectedDifficulty === "easy" ? easyAccess : selectedDifficulty === "medium" ? mediumAccess : hardAccess;
    const difficultyLabel = difficultyConfig[selectedDifficulty].label;
    
    if (accessCheck && !accessCheck.hasAccess) {
      if (accessCheck.reason === "subscription_expired") {
        toast.error(`Your subscription has expired. Please renew to access ${difficultyLabel} difficulty.`);
        navigate({ to: "/subscription", search: { subscription: undefined } });
      } else {
        toast.error(`${difficultyLabel} difficulty is only available for Pro and Pro+ subscribers.`);
        navigate({ to: "/pricing", search: { donation: undefined } });
      }
      return;
    }
    
    setIsStarting(true);
    startAIGame({
      profileId: profile._id,
      difficulty: selectedDifficulty,
      behavior: selectedBehavior,
    }).catch((error) => {
      console.error("Failed to start AI game:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start AI game");
    }).finally(() => {
      setIsStarting(false);
    });
  };

  const handleQuitGame = () => {
    if (!currentSession) return;
    
    cleanupSession({ sessionId: currentSession.sessionId }).catch((error) => {
      console.error("Failed to quit game:", error);
    });
  };

  // Show game if session exists and is active
  if (currentSession && (currentSession.status === "setup" || currentSession.status === "playing")) {
    return (
      <>
        <div className="min-h-screen">
          <div className="mx-auto max-w-7xl p-3 sm:p-4 space-y-4 sm:space-y-6">
            {/* Game Header */}
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Bot className="h-8 w-8 text-blue-400" />
                    <div>
                      <h1 className="text-2xl font-bold text-white">
                        VS AI Battle
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="bg-white/10 text-white/80 border-white/20"
                        >
                          {React.createElement(difficultyConfig[currentSession.difficulty as keyof typeof difficultyConfig].icon, { className: "h-4 w-4 mr-1" })}
                          {difficultyConfig[currentSession.difficulty as keyof typeof difficultyConfig].label} AI
                        </Badge>
                        <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20">
                          {React.createElement(behaviorConfig[currentSession.behavior as keyof typeof behaviorConfig].icon, { className: "h-4 w-4 mr-1" })}
                          {behaviorConfig[currentSession.behavior as keyof typeof behaviorConfig].label}
                        </Badge>
                        <Badge variant="outline" className="bg-white/5 text-white/70 border-white/20">
                          Move {currentSession.moveCount}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleQuitGame}
                    className="bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:text-red-300 self-start sm:self-auto"
                  >
                    Quit Game
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Game Status */}
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg self-start",
                    currentSession.currentTurn === "player1"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  )}>
                    {currentSession.currentTurn === "player1" ? (
                      <>
                        <User className="h-4 w-4" />
                        <span>Your Turn</span>
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4" />
                        <span>AI Turn</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 self-start sm:self-auto">
                    <div className="text-white/60 text-sm">
                      {currentSession.status === "setup" ? "Setting up pieces..." : "Battle in progress"}
                    </div>
                    {import.meta.env.DEV && currentSession.status === "playing" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRevealAIPieces(!revealAIPieces)}
                        className="bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30 hover:text-yellow-300 text-xs px-2 py-1 h-7"
                      >
                        {revealAIPieces ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide AI
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Reveal AI
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Board */}
            <AIGameBoard sessionId={currentSession.sessionId} revealAIPieces={revealAIPieces} />
          </div>
        </div>
        <UpgradeDonationCTA />
      </>
    );
  }

  // Show setup/lobby
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-5xl p-3 sm:p-4 space-y-4 sm:space-y-6">

        {/* Difficulty Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-white">Choose Your Challenge</CardTitle>
              <CardDescription className="text-white/60">Select the AI difficulty and behavior</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
              {/* Difficulty */}
              <div>
                <div className="mb-3 text-sm uppercase tracking-wide text-white/60">Difficulty</div>
                <Tabs value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as Difficulty)}>
                  <TabsList className="flex flex-wrap w-full h-full gap-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6 px-1">
                    {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.easy][]).map(([key, config], index) => {
                      const accessCheck = key === "easy" ? easyAccess : key === "medium" ? mediumAccess : hardAccess;
                      const isLocked = accessCheck && !accessCheck.hasAccess;
                      
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 + (index * 0.1) }}
                          className="flex-1 min-w-0 relative"
                        >
                          {isLocked && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 rounded-full">
                              <Lock className="w-4 h-4 text-white/60" />
                            </div>
                          )}
                          <TabsTrigger
                            value={key}
                            disabled={isLocked}
                            className={cn(
                              "w-full data-[state=active]:bg-white/15 rounded-full data-[state=active]:text-white text-white/70 transition-all duration-200 px-3 py-2 text-sm",
                              isLocked && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <config.icon className="mr-2 h-4 w-4" />
                            {config.label}
                            {isLocked && <Lock className="ml-2 h-3 w-3" />}
                          </TabsTrigger>
                        </motion.div>
                      );
                    })}
                  </TabsList>
                  {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.easy][]).map(([key, config]) => {
                    const accessCheck = key === "easy" ? easyAccess : key === "medium" ? mediumAccess : hardAccess;
                    const isLocked = accessCheck && !accessCheck.hasAccess;
                    
                    return (
                      <TabsContent key={key} value={key} className="mt-0">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6"
                        >
                          <div className="flex items-start gap-4">
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.4, type: "spring" }}
                              className="p-3 rounded-lg bg-white/10 border border-white/20"
                            >
                              <config.icon className={`h-6 w-6 ${config.textColor}`} />
                            </motion.div>
                            <div className="flex-1">
                              <motion.h3 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className={`text-xl font-bold mb-2 ${config.textColor}`}
                              >
                                {config.label} AI
                              </motion.h3>
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="text-white/70 mb-4"
                              >
                                {config.description}
                              </motion.p>
                              {isLocked && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.4, delay: 0.3 }}
                                  className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 mb-4"
                                >
                                  <div className="flex items-center gap-2 text-amber-300 text-sm mb-2">
                                    <Lock className="w-4 h-4" />
                                    <span className="font-medium">Premium Feature</span>
                                  </div>
                                  <p className="text-amber-300/80 text-xs font-light mb-3">
                                    {accessCheck?.reason === "subscription_expired"
                                      ? `Your subscription has expired. Please renew to access ${config.label} difficulty.`
                                      : `${config.label} difficulty is only available for Pro and Pro+ subscribers.`}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (accessCheck?.reason === "subscription_expired") {
                                        navigate({ to: "/subscription", search: { subscription: undefined } });
                                      } else {
                                        navigate({ to: "/pricing", search: { donation: undefined } });
                                      }
                                    }}
                                    className="bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-300 text-xs"
                                  >
                                    {accessCheck?.reason === "subscription_expired" ? "Renew Now" : "Upgrade Now"}
                                  </Button>
                                </motion.div>
                              )}
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                className="flex items-center gap-2 text-white/50"
                              >
                                <Bot className="h-4 w-4" />
                                <span>Perfect for {key === "easy" ? "learning the basics" : key === "medium" ? "improving your skills" : "testing your mastery"}</span>
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>

              {/* Behavior */}
              <div>
                <div className="mb-3 text-sm uppercase tracking-wide text-white/60">AI Behavior</div>
                <Tabs value={selectedBehavior} onValueChange={(v) => setSelectedBehavior(v as Behavior)}>
                  <TabsList className="flex flex-wrap w-full h-full gap-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6 px-1">
                    {(Object.entries(behaviorConfig) as [Behavior, typeof behaviorConfig.balanced][]).map(([key, config], index) => (
                      <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 + (index * 0.1) }} className="flex-1 min-w-0">
                        <TabsTrigger value={key} className="w-full data-[state=active]:bg-white/15 rounded-full data-[state=active]:text-white text-white/70 transition-all duration-200 px-3 py-2 text-sm">
                          <config.icon className="mr-2 h-4 w-4" />
                          {config.label}
                        </TabsTrigger>
                      </motion.div>
                    ))}
                  </TabsList>
                  {(Object.entries(behaviorConfig) as [Behavior, typeof behaviorConfig.balanced][]).map(([key, config]) => (
                    <TabsContent key={key} value={key} className="mt-0">
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-white/10 border border-white/20">
                            <config.icon className={`h-6 w-6 ${config.textColor}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className={`text-xl font-bold mb-2 ${config.textColor}`}>{config.label}</h3>
                            <p className="text-white/70 mb-2">{config.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </motion.div>


        {/* Game Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Crown className="h-5 w-5 text-orange-400" />
                Game Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                {[
                  { icon: "🎯", title: "Objective", description: "Capture the enemy flag or reach their back row with your flag." },
                  { icon: "⚡", title: "Quick Play", description: "Instant battles that don't affect your rankings." },
                  { icon: "🎲", title: "Setup", description: "Place your 21 pieces in your territory before battle." },
                  { icon: "🤖", title: "AI Opponent", description: "Smart AI that adapts to your playstyle." }
                ].map((rule, index) => (
                  <motion.div
                    key={rule.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                    className="space-y-2 p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <span>{rule.icon}</span>
                      {rule.title}
                    </h4>
                    <p className="text-white/70 text-sm">{rule.description}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Start Game Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <Button
            size="lg"
            variant="gradient"
            onClick={handleStartGame}
            disabled={isStarting || !profile}
            className="rounded-full text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transition-all duration-200 transform hover:scale-105 min-h-[48px] w-full sm:w-auto"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Starting Game...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-5 w-5" />
                Start AI Battle
              </>
            )}
          </Button>
        </motion.div>
      </div>
      <UpgradeDonationCTA />
    </motion.div>
  );
}
