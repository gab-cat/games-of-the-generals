import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import { Loader2, Bot, User, Star, Zap, Crown } from "lucide-react";
import { cn } from "../../lib/utils";
import { AIGameBoard } from "../../components/ai-game/AIGameBoard";
import { motion } from "framer-motion";

type Difficulty = "easy" | "medium" | "hard";

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

export function AIGamePage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [isStarting, setIsStarting] = useState(false);
  
  // Mutations
  const startAIGame = useMutation(api.aiGame.startAIGameSession);
  const cleanupSession = useMutation(api.aiGame.cleanupAIGameSession);
  
  // Queries
  const currentSession = useQuery(api.aiGame.getCurrentUserAIGame);
  const profile = useQuery(api.profiles.getCurrentProfile);

  // Check for existing session
  useEffect(() => {
    if (currentSession && currentSession.status === "finished") {
      // Auto-cleanup finished games
      void cleanupSession({ sessionId: currentSession.sessionId });
    }
  }, [currentSession, cleanupSession]);

  const handleStartGame = () => {
    if (!profile) return;
    
    setIsStarting(true);
    startAIGame({
      profileId: profile._id,
      difficulty: selectedDifficulty,
    }).catch((error) => {
      console.error("Failed to start AI game:", error);
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
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl p-4 space-y-6">
          {/* Game Header */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Bot className="h-8 w-8 text-blue-400" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      VS AI Battle
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge 
                        variant="secondary" 
                        className="bg-white/10 text-white/80 border-white/20"
                      >
                        {React.createElement(difficultyConfig[currentSession.difficulty].icon, { className: "h-4 w-4 mr-1" })}
                        {difficultyConfig[currentSession.difficulty].label} AI
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
                  className="bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                >
                  Quit Game
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Game Status */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg",
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
                
                <div className="text-white/60 text-sm">
                  {currentSession.status === "setup" ? "Setting up pieces..." : "Battle in progress"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Board */}
          <AIGameBoard sessionId={currentSession.sessionId} />
        </div>
      </div>
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
      <div className="mx-auto max-w-5xl p-4 space-y-6">

        {/* Difficulty Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-white">
                Choose Your Challenge
              </CardTitle>
              <CardDescription className="text-white/60">
                Select the AI difficulty that matches your skill level
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as Difficulty)}>
                <TabsList className="flex w-fit rounded-full  bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
                  {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.easy][]).map(([key, config], index) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + (index * 0.1) }}
                    >
                      <TabsTrigger 
                        value={key}
                        className="data-[state=active]:bg-white/15 rounded-full data-[state=active]:text-white text-white/70 transition-all duration-200"
                      >
                        <config.icon className="mr-2 h-4 w-4" />
                        {config.label}
                      </TabsTrigger>
                    </motion.div>
                  ))}
                </TabsList>
                
                {(Object.entries(difficultyConfig) as [Difficulty, typeof difficultyConfig.easy][]).map(([key, config]) => (
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
                ))}
              </Tabs>
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
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
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
                    className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10"
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
            className="rounded-full text-white px-8 py-4  transition-all duration-200 transform hover:scale-105"
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
    </motion.div>
  );
}
