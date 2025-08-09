import { motion } from "framer-motion";
import { Trophy, Target, Clock, Sword, Crown, Medal, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface GameResult {
  winner: "player1" | "player2" | "draw";
  reason: "flag_captured" | "flag_reached_base" | "timeout" | "surrender" | "elimination";
  duration: number; // in seconds
  moves: number;
  player1Username: string;
  player2Username: string;
}

interface Profile {
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
}

interface GameResultsProps {
  result: GameResult;
  profile: Profile;
  isPlayer1: boolean;
  onReturnToLobby: () => void;
}

export function GameResults({ result, profile, isPlayer1, onReturnToLobby }: GameResultsProps) {
  const isWinner = (isPlayer1 && result.winner === "player1") || (!isPlayer1 && result.winner === "player2");
  const isDraw = result.winner === "draw";

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getResultText = () => {
    if (isDraw) return "Battle Ended in Draw";
    return isWinner ? "Victory Achieved!" : "Defeat...";
  };

  const getResultIcon = () => {
    if (isDraw) return <Target className="h-12 w-12 text-yellow-500" />;
    if (isWinner) return <Crown className="h-12 w-12 text-yellow-500" />;
    return <Sword className="h-12 w-12 text-red-500" />;
  };

  const getReasonText = () => {
    switch (result.reason) {
      case "flag_captured":
        return "Flag Captured";
      case "flag_reached_base":
        return "Flag Reached Enemy Base";
      case "timeout":
        return "Time Expired";
      case "surrender":
        return "Surrender";
      case "elimination":
        return "All Pieces Eliminated";
      default:
        return "Game Over";
    }
  };

  const getResultColor = () => {
    if (isDraw) return "text-yellow-400";
    return isWinner ? "text-green-400" : "text-red-400";
  };

  const getBgGradient = () => {
    if (isDraw) return "from-yellow-500/10 to-orange-500/10 border-yellow-500/20";
    return isWinner 
      ? "from-green-500/10 to-emerald-500/10 border-green-500/20" 
      : "from-red-500/10 to-pink-500/10 border-red-500/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="w-full max-w-4xl space-y-6"
      >
        {/* Main Result Header */}
        <Card className={`bg-card/50 backdrop-blur-md border-border/50 ${getBgGradient()}`}>
          <CardHeader className="text-center pb-6 pt-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              {getResultIcon()}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <CardTitle className={`text-3xl md:text-4xl font-bold ${getResultColor()} mb-2`}>
                {getResultText()}
              </CardTitle>
              <p className="text-muted-foreground text-lg">
                {getReasonText()}
              </p>
            </motion.div>

            {/* Celebration Effects */}
            {isWinner && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="absolute inset-0 pointer-events-none overflow-hidden"
              >
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, opacity: 1, scale: 0 }}
                    animate={{
                      y: [0, 150, 300],
                      opacity: [1, 1, 0],
                      scale: [0, 1, 0.5],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 2.5,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                    className="absolute text-yellow-400 text-lg"
                    style={{
                      left: `${Math.random() * 100}%`,
                    }}
                  >
                    ⭐
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardHeader>
        </Card>

        {/* Match Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-card/50 backdrop-blur-md border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Battle Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-card/30 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        {isPlayer1 ? result.player1Username : result.player2Username}
                      </div>
                      <Badge 
                        variant={isWinner && !isDraw ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {profile.username} (You)
                      </Badge>
                    </div>
                  </div>
                  {isWinner && !isDraw && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <Crown className="h-6 w-6 text-yellow-500" />
                    </motion.div>
                  )}
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-card/30 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <Sword className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        {isPlayer1 ? result.player2Username : result.player1Username}
                      </div>
                      <Badge 
                        variant={!isWinner && !isDraw ? "default" : "secondary"}
                        className="text-xs"
                      >
                        Opponent
                      </Badge>
                    </div>
                  </div>
                  {!isWinner && !isDraw && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <Crown className="h-6 w-6 text-yellow-500" />
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Game Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-card/50 backdrop-blur-md border-border/50 hover:border-blue-500/30 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-blue-500/10 rounded-lg w-fit mx-auto mb-3">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-2xl font-bold mb-1">{formatDuration(result.duration)}</div>
                <div className="text-sm text-muted-foreground">Battle Duration</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-card/50 backdrop-blur-md border-border/50 hover:border-orange-500/30 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-orange-500/10 rounded-lg w-fit mx-auto mb-3">
                  <Zap className="h-6 w-6 text-orange-500" />
                </div>
                <div className="text-2xl font-bold mb-1">{result.moves}</div>
                <div className="text-sm text-muted-foreground">Total Moves</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-card/50 backdrop-blur-md border-border/50 hover:border-purple-500/30 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-purple-500/10 rounded-lg w-fit mx-auto mb-3">
                  <Medal className="h-6 w-6 text-purple-500" />
                </div>
                <div className="text-2xl font-bold mb-1">{profile.rank}</div>
                <div className="text-sm text-muted-foreground">Your Rank</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Updated Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-md border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Your Campaign Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20 hover:border-green-500/40 transition-colors"
                >
                  <div className="text-2xl font-bold text-green-500 mb-1">{profile.wins}</div>
                  <div className="text-sm text-muted-foreground">Victories</div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors"
                >
                  <div className="text-2xl font-bold text-red-500 mb-1">{profile.losses}</div>
                  <div className="text-sm text-muted-foreground">Defeats</div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
                >
                  <div className="text-2xl font-bold text-blue-500 mb-1">{profile.gamesPlayed}</div>
                  <div className="text-sm text-muted-foreground">Total Battles</div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                >
                  <div className="text-2xl font-bold text-purple-500 mb-1">
                    {profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="text-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={onReturnToLobby}
              size="lg"
              className="px-8 py-3 text-lg font-semibold"
            >
              <Sword className="h-5 w-5 mr-2" />
              Return to Command Center
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
