import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Eye, 
  EyeOff,
  Target,
  FastForward,
  Rewind,
  Crown,
  Sword,
  Square
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Id } from "../../convex/_generated/dataModel";
import { getPieceDisplay } from "../lib/piece-display";
import { cn } from "@/lib/utils";

interface GameReplayProps {
  gameId: Id<"games">;
  onBack: () => void;
}

export function GameReplay({ gameId, onBack }: GameReplayProps) {
  const replayData = useQuery(api.games.getGameReplay, { gameId });
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // -1 means initial state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // milliseconds between moves
  const [showAllPieces, setShowAllPieces] = useState(true); // New state to toggle piece visibility

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !replayData) return;

    const timer = setInterval(() => {
      setCurrentMoveIndex((prev) => {
        if (prev >= replayData.moves.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, replayData]);

  const reconstructBoardAtMove = (moveIndex: number) => {
    if (!replayData) return null;

    // Start with the initial board state (pieces placed during setup)
    const board = replayData.initialBoard.map(row => 
      row.map(cell => cell ? { 
        ...cell, 
        revealed: false // Start with all pieces hidden
      } : null)
    );

    // Apply moves up to the current index
    for (let i = 0; i <= moveIndex && i < replayData.moves.length; i++) {
      const move = replayData.moves[i];
      
      if (move.moveType === "move" || move.moveType === "challenge") {
        const fromPiece = board[move.fromRow!][move.fromCol!];
        
        if (move.moveType === "challenge" && move.challengeResult) {
          // Handle challenge result - follow the same logic as server
          const revealedFromPiece = fromPiece ? { ...fromPiece, revealed: true } : null;
          
          if (move.challengeResult.winner === "attacker") {
            // Attacker wins, move attacking piece and reveal it
            board[move.toRow][move.toCol] = revealedFromPiece;
            board[move.fromRow!][move.fromCol!] = null;
          } else if (move.challengeResult.winner === "defender") {
            // Attacker loses, defender piece stays hidden, attacker removed
            board[move.fromRow!][move.fromCol!] = null;
            // Defender piece stays in place and remains hidden
          } else {
            // Tie - both eliminated
            board[move.toRow][move.toCol] = null;
            board[move.fromRow!][move.fromCol!] = null;
          }
        } else {
          // Simple move - piece moves without revealing
          board[move.toRow][move.toCol] = fromPiece;
          board[move.fromRow!][move.fromCol!] = null;
        }
      }
    }

    return board;
  };

  const currentBoard = reconstructBoardAtMove(currentMoveIndex);
  const currentMove = currentMoveIndex >= 0 && currentMoveIndex < (replayData?.moves.length || 0) 
    ? replayData!.moves[currentMoveIndex] 
    : null;

  if (!replayData) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
      {/* Header */}
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="w-12 h-12 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Play className="h-6 w-6 text-purple-400" />
              </motion.div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2 text-white/90">
                  Game Replay
                </CardTitle>
                <p className="text-white/60 mt-1">
                  {replayData.player1Username} vs {replayData.player2Username}
                </p>
              </div>
            </motion.div>
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2 bg-white/10 border-white/20 text-white/90 hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game Board */}
        <div className="lg:col-span-3">
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  <span className="text-white/90">Battle Replay</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllPieces(!showAllPieces)}
                    className="flex rounded-full items-center gap-2 bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
                  >
                    {showAllPieces ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAllPieces ? 'Hide Pieces' : 'Show All Pieces'}
                  </Button>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    Move {currentMoveIndex + 1} of {replayData.moves.length}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="grid grid-cols-9 gap-2 max-w-3xl mx-auto p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
              >
                {(currentBoard || replayData.initialBoard).map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isLastMoveFrom = currentMove?.fromRow === rowIndex && currentMove?.fromCol === colIndex;
                    const isLastMoveTo = currentMove?.toRow === rowIndex && currentMove?.toCol === colIndex;
                    const isChallenge = currentMove?.moveType === "challenge";
                    
                    // Calculate arrow direction for "from" position
                    const getArrowDirection = () => {
                      if (!isLastMoveFrom || !currentMove) return null;
                      
                      const rowDiff = currentMove.toRow - currentMove.fromRow!;
                      const colDiff = currentMove.toCol - currentMove.fromCol!;
                      
                      if (rowDiff > 0) return ArrowDown; // Moving down
                      if (rowDiff < 0) return ArrowUp;   // Moving up
                      if (colDiff > 0) return ArrowRight; // Moving right
                      if (colDiff < 0) return ArrowLeft;  // Moving left
                      
                      return null;
                    };
                    
                    const ArrowComponent = getArrowDirection();
                    
                    return (
                      <motion.div
                        key={`${rowIndex}-${colIndex}`}
                        animate={isLastMoveFrom || isLastMoveTo ? {
                          scale: [1, 1.05, 1],
                        } : {}}
                        transition={{ duration: 0.5 }}
                        className={cn('aspect-square border-2 flex items-center justify-center rounded-lg transition-all bg-muted/30 border-border relative', 
                            isLastMoveFrom && isChallenge ? 'ring-2 ring-red-500' : '',
                            isLastMoveFrom && !isChallenge ? 'ring-2 ring-yellow-500' : '',
                            isLastMoveTo && isChallenge ? 'ring-2 ring-red-500' : '',
                            isLastMoveTo && !isChallenge ? 'ring-2 ring-yellow-500' : ''
                        )}
                      >
                        {/* Directional arrow indicator for "from" position */}
                        {isLastMoveFrom && ArrowComponent && (
                          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <div className="rounded-full p-1">
                              <ArrowComponent className={cn("h-4 w-4", 
                                isChallenge ? "text-red-500" : "text-yellow-500"
                              )} />
                            </div>
                          </div>
                        )}
                        
                        {cell && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-center cursor-pointer">
                                <div className={`${cell.player === 'player1' ? 'text-blue-400' : 'text-red-400'}`}>
                                  {(showAllPieces || cell.revealed) ? getPieceDisplay(cell.piece, { showLabel: true, size: "medium" }) : (
                                    <div className="flex flex-col items-center justify-center">
                                      <Square className="w-6 h-6" fill="currentColor" />
                                      <div className="text-xs mt-1">Hidden</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{(showAllPieces || cell.revealed) ? cell.piece : 'Hidden Piece'}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </CardContent>
          </Card>
        </div>

        {/* Controls and Info */}
        <div className="space-y-6">
          {/* Playback Controls */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white/90">
                <Play className="h-5 w-5 text-green-400" />
                Playback Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timeline Slider */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Move Timeline</label>
                <Slider
                  value={[currentMoveIndex + 1]}
                  onValueChange={([value]: number[]) => {
                    setCurrentMoveIndex(value - 1);
                    setIsPlaying(false);
                  }}
                  max={replayData.moves.length}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Start</span>
                  <span>End</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMoveIndex(-1);
                    setIsPlaying(false);
                  }}
                  className="bg-white/10 rounded-full px-4 border-white/20 text-white/90 hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMoveIndex(Math.max(-1, currentMoveIndex - 1));
                    setIsPlaying(false);
                  }}
                  disabled={currentMoveIndex <= -1}
                  className="bg-white/10 rounded-full px-4 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={currentMoveIndex >= replayData.moves.length - 1}
                  className="px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMoveIndex(Math.min(replayData.moves.length - 1, currentMoveIndex + 1));
                    setIsPlaying(false);
                  }}
                  disabled={currentMoveIndex >= replayData.moves.length - 1}
                  className="bg-white/10 rounded-full px-4 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Speed Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Playback Speed</label>
                <div className="flex items-center gap-2">
                  <Rewind className="h-4 w-4 text-white/60" />
                  <Slider
                    value={[2000 - playbackSpeed]}
                    onValueChange={([value]: number[]) => setPlaybackSpeed(2000 - value)}
                    max={1800}
                    min={200}
                    step={200}
                    className="flex-1"
                  />
                  <FastForward className="h-4 w-4 text-white/60" />
                </div>
                <div className="text-xs text-white/50 text-center">
                  {playbackSpeed <= 400 ? "Very Fast" : 
                   playbackSpeed <= 800 ? "Fast" : 
                   playbackSpeed <= 1200 ? "Normal" : 
                   playbackSpeed <= 1600 ? "Slow" : "Very Slow"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Move Info */}
          {currentMove && (
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <Sword className="h-5 w-5 text-red-400" />
                  Current Move
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Move #:</span>
                    <span className="font-medium text-white/90">{currentMoveIndex + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Type:</span>
                    <Badge variant={currentMove.moveType === "challenge" ? "destructive" : "secondary"} 
                           className={currentMove.moveType === "challenge" ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30"}>
                      {currentMove.moveType}
                    </Badge>
                  </div>
                  {currentMove.piece && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Piece:</span>
                      <span className="font-medium text-white/90">{currentMove.piece}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/60">From:</span>
                    <span className="font-mono text-white/90">({currentMove.fromRow}, {currentMove.fromCol})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">To:</span>
                    <span className="font-mono text-white/90">({currentMove.toRow}, {currentMove.toCol})</span>
                  </div>
                  {currentMove.challengeResult && (
                    <div className="mt-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
                      <div className="font-medium text-sm mb-3 text-white/90 flex items-center gap-2">
                        <Sword className="h-4 w-4 text-red-400" />
                        Battle Result
                      </div>
                      
                      {/* VS Battle Display */}
                      <div className="flex items-center justify-between gap-3">
                        {/* Attacker */}
                        <div className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                          currentMove.challengeResult.winner === "attacker" 
                            ? "bg-green-500/20 border-green-500/50 shadow-green-500/20 shadow-lg" 
                            : currentMove.challengeResult.winner === "tie"
                            ? "bg-yellow-500/20 border-yellow-500/50"
                            : "bg-red-500/20 border-red-500/50"
                        }`}>
                          <div className="text-xs text-white/60 mb-1">Attacker</div>
                          <div className={`font-bold text-sm ${
                            currentMove.playerId === replayData.game.player1Id ? 'text-blue-400' : 'text-red-400'
                          }`}>
                            {currentMove.challengeResult.attacker}
                          </div>
                          {currentMove.challengeResult.winner === "attacker" && (
                            <Crown className="h-3 w-3 text-yellow-400 mt-1" />
                          )}
                        </div>

                        {/* VS Indicator */}
                        <div className="flex flex-col items-center">
                          <div className="text-white/40 text-xs font-bold">VS</div>
                          <Sword className="h-4 w-4 text-white/40 rotate-90" />
                        </div>

                        {/* Defender */}
                        <div className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                          currentMove.challengeResult.winner === "defender" 
                            ? "bg-green-500/20 border-green-500/50 shadow-green-500/20 shadow-lg" 
                            : currentMove.challengeResult.winner === "tie"
                            ? "bg-yellow-500/20 border-yellow-500/50"
                            : "bg-red-500/20 border-red-500/50"
                        }`}>
                          <div className="text-xs text-white/60 mb-1">Defender</div>
                          <div className={`font-bold text-sm ${
                            currentMove.playerId === replayData.game.player1Id ? 'text-red-400' : 'text-blue-400'
                          }`}>
                            {currentMove.challengeResult.defender}
                          </div>
                          {currentMove.challengeResult.winner === "defender" && (
                            <Crown className="h-3 w-3 text-yellow-400 mt-1" />
                          )}
                        </div>
                      </div>

                      {/* Result Summary */}
                      <div className="mt-3 text-center">
                        <div className={`text-xs font-medium ${
                          currentMove.challengeResult.winner === "tie" 
                            ? "text-yellow-400" 
                            : "text-green-400"
                        }`}>
                          {currentMove.challengeResult.winner === "tie" 
                            ? "🤝 Both pieces eliminated" 
                            : currentMove.challengeResult.winner === "attacker"
                            ? "⚔️ Attacker victorious"
                            : "🛡️ Defender holds position"
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Players Info */}
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white/90">
                <Crown className="h-5 w-5 text-yellow-400" />
                Players
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-3 p-2 rounded bg-blue-500/10 backdrop-blur-sm border border-blue-500/20"
              >
                <div className="w-4 h-4 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"></div>
                <span className="font-medium text-blue-400">{replayData.player1Username}</span>
              </motion.div>
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 p-2 rounded bg-red-500/10 backdrop-blur-sm border border-red-500/20"
              >
                <div className="w-4 h-4 bg-red-400 rounded-full shadow-lg shadow-red-400/50"></div>
                <span className="font-medium text-red-400">{replayData.player2Username}</span>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
    </TooltipProvider>
  );
}
