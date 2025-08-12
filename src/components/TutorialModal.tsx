import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Target, 
  Flag, 
  Crown,
  Eye,
  Sword,
  Shield,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CheckCircle
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogOverlay } from "./ui/dialog";
import { getPieceDisplay } from "../lib/piece-display";
import { cn } from "../lib/utils";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  highlightBoard?: boolean;
  highlightPieces?: string[];
  showNavigation?: boolean;
}

// Mock board for tutorial demonstrations
const createTutorialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(9).fill(null));
  
  // Setup some pieces for demonstration
  // Player 1 (blue) pieces
  board[6][0] = { piece: "Private", player: "player1", revealed: true };
  board[6][1] = { piece: "Sergeant", player: "player1", revealed: true };
  board[6][2] = { piece: "2nd Lieutenant", player: "player1", revealed: true };
  board[6][3] = { piece: "Captain", player: "player1", revealed: true };
  board[6][4] = { piece: "Flag", player: "player1", revealed: true };
  board[6][5] = { piece: "1 Star General", player: "player1", revealed: true };
  board[6][6] = { piece: "Spy", player: "player1", revealed: true };
  board[5][3] = { piece: "Major", player: "player1", revealed: true };
  board[5][4] = { piece: "5 Star General", player: "player1", revealed: true };
  
  // Player 2 (red) pieces - all visible
  board[1][0] = { piece: "Private", player: "player2", revealed: true };
  board[1][1] = { piece: "Sergeant", player: "player2", revealed: true };
  board[1][2] = { piece: "Colonel", player: "player2", revealed: true };
  board[1][3] = { piece: "Captain", player: "player2", revealed: true };
  board[1][4] = { piece: "Flag", player: "player2", revealed: true };
  board[2][3] = { piece: "Major", player: "player2", revealed: true };
  board[2][4] = { piece: "Spy", player: "player2", revealed: true };
  
  return board;
};

const TutorialBoardSquare = ({ 
  _row, 
  _col, 
  cell, 
  isHighlighted = false,
  isSelected = false,
  isValidMove = false,
  showArrow = null,
  onClick = () => {}
}: {
  _row: number;
  _col: number;
  cell: any;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isValidMove?: boolean;
  showArrow?: 'up' | 'down' | 'left' | 'right' | null;
  onClick?: () => void;
}) => {
  const ArrowComponent = showArrow ? {
    up: ArrowUp,
    down: ArrowDown,
    left: ArrowLeft,
    right: ArrowRight
  }[showArrow] : null;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "aspect-square border flex items-center justify-center cursor-pointer rounded-sm transition-all relative min-h-[24px] sm:min-h-[32px] p-0.5",
        "bg-muted/30 border-border hover:bg-muted/50",
        isHighlighted && "ring-2 ring-yellow-500 bg-yellow-500/20 border-yellow-500",
        isSelected && "ring-2 ring-blue-500 bg-blue-500/20 border-blue-500",
        isValidMove && "ring-2 ring-green-500 bg-green-500/20 border-green-500"
      )}
    >
      {showArrow && ArrowComponent && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="rounded-full p-1 bg-yellow-500/20">
            <ArrowComponent className="h-4 w-4 text-yellow-500" />
          </div>
        </div>
      )}
      
      {cell && (
        <div className="text-center">
          <div className={`${cell.player === 'player1' ? 'text-blue-400' : 'text-red-400'}`}>
            {cell.piece === "Hidden" ? 
              getPieceDisplay(cell.piece, { isOpponent: true, size: "small" }) : 
              <div className="flex flex-col items-center">
                {getPieceDisplay(cell.piece, { showLabel: false, size: "small" })}
                {cell.revealed && cell.piece !== "Hidden" && (
                  <div className="text-[8px] font-bold mt-0.5 text-muted-foreground leading-tight">
                    {cell.piece.split(' ').map((word: string) => word[0]).join('')}
                  </div>
                )}
              </div>
            }
          </div>
        </div>
      )}
    </motion.div>
  );
};

const TutorialBoard = ({ 
  board, 
  highlightedSquares = [], 
  selectedSquare = null,
  validMoves = [],
  arrows = {},
  onSquareClick = () => {}
}: {
  board: any[][];
  highlightedSquares?: string[];
  selectedSquare?: string | null;
  validMoves?: string[];
  arrows?: Record<string, 'up' | 'down' | 'left' | 'right'>;
  onSquareClick?: (row: number, col: number) => void;
}) => {
  return (
    <div className="grid grid-cols-9 gap-0.5 sm:gap-1 w-full sm:max-w-lg mx-auto p-1 sm:p-2 rounded-lg bg-muted/10 border border-white/10">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const squareKey = `${rowIndex}-${colIndex}`;
          return (
            <TutorialBoardSquare
              key={squareKey}
              _row={rowIndex}
              _col={colIndex}
              cell={cell}
              isHighlighted={highlightedSquares.includes(squareKey)}
              isSelected={selectedSquare === squareKey}
              isValidMove={validMoves.includes(squareKey)}
              showArrow={arrows[squareKey]}
              onClick={() => onSquareClick(rowIndex, colIndex)}
            />
          );
        })
      )}
    </div>
  );
};

export function TutorialModal({ isOpen, onClose, onComplete }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const tutorialBoard = createTutorialBoard();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [arrows, setArrows] = useState<Record<string, 'up' | 'down' | 'left' | 'right'>>({});

  const handleSquareClick = (row: number, col: number) => {
    // Interactive elements for movement tutorial
    if (currentStep === 4) { // movement-basics step index
      const square = `${row}-${col}`;
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        setArrows({});
      } else if (tutorialBoard[row][col]) {
        setSelectedSquare(square);
        // Show valid moves for the selected piece
        const validSquares: string[] = [];
        const arrowMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {};
        
        // Check four directions
        const directions = [
          { dr: -1, dc: 0, arrow: 'up' as const },
          { dr: 1, dc: 0, arrow: 'down' as const },
          { dr: 0, dc: -1, arrow: 'left' as const },
          { dr: 0, dc: 1, arrow: 'right' as const }
        ];
        
        directions.forEach(({ dr, dc, arrow }) => {
          const newRow = row + dr;
          const newCol = col + dc;
          if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 9) {
            const targetCell = tutorialBoard[newRow][newCol];
            if (!targetCell || targetCell.player !== tutorialBoard[row][col].player) {
              const targetSquare = `${newRow}-${newCol}`;
              validSquares.push(targetSquare);
              arrowMap[targetSquare] = arrow;
            }
          }
        });
        
        setValidMoves(validSquares);
        setArrows(arrowMap);
      }
    }
  };

  const steps: TutorialStep[] = [
    {
      id: "welcome",
      title: "Welcome to Game of the Generals!",
      description: "Learn how to dominate the battlefield with strategy and cunning.",
      content: (
        <div className="text-center space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Animated Crown Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 12 }}
            className="relative mx-auto w-16 h-16 sm:w-24 sm:h-24"
          >
            {/* Glowing background */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 via-orange-500/30 to-red-500/30 rounded-full blur-xl"
            />
            
            {/* Main crown container */}
            <div className="relative w-full h-full bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm border border-yellow-500/40 rounded-2xl flex items-center justify-center shadow-2xl">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Crown className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-400" />
              </motion.div>
              
              {/* Sparkle effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{
                    x: [0, Math.cos(i * 60 * Math.PI / 180) * 40],
                    y: [0, Math.sin(i * 60 * Math.PI / 180) * 40],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
                        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Master the Art of War
            </h2>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
              Command your army in this classic strategy game where tactics, deception, and quick thinking determine victory. 
              Will you emerge as the ultimate General?
            </p>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto"
          >
            {[
              { icon: Target, title: "Strategic Combat", desc: "Outsmart opponents with tactical positioning" },
              { icon: Sword, title: "Rank-Based Combat", desc: "Higher ranks defeat lower ranks in battle" },
              { icon: Flag, title: "Capture the Flag", desc: "Protect yours while hunting theirs" }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="p-3 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mx-auto mb-1 sm:mb-2" />
                <h3 className="text-xs sm:text-sm font-semibold text-white/90 mb-1">{feature.title}</h3>
                <p className="text-xs text-white/60">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="pt-2 sm:pt-4"
          >
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4 max-w-md mx-auto">
              <p className="text-xs sm:text-sm text-blue-300 font-medium mb-2">What you'll learn:</p>
              <div className="text-xs text-white/70 text-left space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
                  <span>Game board and piece movement</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
                  <span>Combat system and piece rankings</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
                  <span>Special abilities and victory conditions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
                  <span>Advanced strategies and tips</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ),
      showNavigation: true
    },
    {
      id: "board-overview",
      title: "The Battlefield",
      description: "A 9x8 grid where armies clash for supremacy.",
      content: (
        <div className="space-y-4">
          <TutorialBoard 
            board={tutorialBoard}
            highlightedSquares={["6-0", "6-1", "6-2", "6-3", "6-4", "6-5", "6-6", "5-3", "5-4"]}
          />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-white/80">Your Army (Blue)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-400 rounded-full"></div>
              <span className="text-sm text-white/80">Enemy Army (Red)</span>
            </div>
            <p className="text-xs text-white/60">
              You start at the bottom rows, your opponent at the top. The highlighted squares show your pieces.
            </p>
          </div>
        </div>
      ),
      highlightBoard: true,
      showNavigation: true
    },
    {
      id: "piece-ranks",
      title: "Military Hierarchy",
      description: "Each piece has a rank that determines combat effectiveness.",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { piece: "5 Star General", rank: "1", color: "text-yellow-400" },
              { piece: "4 Star General", rank: "2", color: "text-yellow-300" },
              { piece: "3 Star General", rank: "3", color: "text-orange-400" },
              { piece: "2 Star General", rank: "4", color: "text-orange-300" },
              { piece: "1 Star General", rank: "5", color: "text-blue-400" },
              { piece: "Colonel", rank: "6", color: "text-blue-300" },
              { piece: "Lieutenant Colonel", rank: "7", color: "text-purple-400" },
              { piece: "Major", rank: "8", color: "text-purple-300" },
              { piece: "Captain", rank: "9", color: "text-green-400" },
              { piece: "1st Lieutenant", rank: "10", color: "text-green-300" },
              { piece: "2nd Lieutenant", rank: "11", color: "text-cyan-400" },
              { piece: "Sergeant", rank: "12", color: "text-cyan-300" },
              { piece: "Private", rank: "13", color: "text-gray-400" },
              { piece: "Spy", rank: "★", color: "text-red-400" },
            ].map(({ piece, rank, color }) => (
              <div key={piece} className="flex items-center gap-2 p-2 rounded bg-white/5">
                <div className="flex justify-center w-6">
                  {getPieceDisplay(piece, { size: "small" })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-xs ${color} truncate`}>{piece}</div>
                  <div className="text-xs text-white/60">Rank {rank}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-xs text-yellow-300 font-medium">Combat Rule:</p>
            <p className="text-xs text-white/70 mt-1">
              Higher ranks (lower numbers) defeat lower ranks. Spy is special: defeats any piece but loses to Private.
            </p>
          </div>
        </div>
      ),
      showNavigation: true
    },
    {
      id: "special-pieces",
      title: "Special Pieces",
      description: "Flag and Spy have unique properties and victory conditions.",
      content: (
        <div className="space-y-4">
          <TutorialBoard 
            board={tutorialBoard}
            highlightedSquares={["6-4", "6-6", "1-4", "2-4"]}
          />
          <div className="space-y-3">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Flag</span>
              </div>
              <p className="text-xs text-white/70">
                Your most important piece! If captured, you lose immediately. Protect it at all costs.
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Spy</span>
              </div>
              <p className="text-xs text-white/70">
                Can defeat any piece except Private. Perfect for eliminating high-ranking officers!
              </p>
            </div>
          </div>
        </div>
      ),
      highlightPieces: ["Flag", "Spy"],
      showNavigation: true
    },
    {
      id: "movement-basics",
      title: "Moving Your Forces",
      description: "Pieces move one square at a time in four directions.",
      content: (
        <div className="space-y-4">
          <TutorialBoard 
            board={tutorialBoard}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            arrows={arrows}
            onSquareClick={handleSquareClick}
          />
          <div className="space-y-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-xs text-green-300 font-medium mb-1">Movement Rules:</p>
              <ul className="text-xs text-white/70 space-y-1">
                <li>• One square per turn (up, down, left, right)</li>
                <li>• Cannot move diagonally</li>
                <li>• Cannot move to squares occupied by your pieces</li>
                <li>• Can move to empty squares or attack enemy pieces</li>
              </ul>
            </div>
            <p className="text-xs text-white/60 text-center">
              {selectedSquare 
                ? "The selected piece (blue outline) can move to any green highlighted square."
                : "Click on a piece to see its possible moves."
              }
            </p>
          </div>
        </div>
      ),
      showNavigation: true
    },
    {
      id: "combat-system",
      title: "Battle Resolution",
      description: "When pieces clash, rank determines the victor.",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500/10 to-red-500/10 border border-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-center">
                <div className="text-blue-400 mb-1">{getPieceDisplay("Major", { size: "medium" })}</div>
                <div className="text-xs text-blue-300">Major (Rank 8)</div>
              </div>
              <div className="flex items-center gap-2">
                <Sword className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-white/80">VS</span>
                <Shield className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="text-center">
                <div className="text-red-400 mb-1">{getPieceDisplay("Captain", { size: "medium" })}</div>
                <div className="text-xs text-red-300">Captain (Rank 9)</div>
              </div>
            </div>
            <div className="text-center">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                Major Wins! (8 beats 9)
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xs text-amber-300 font-medium mb-1">Combat Examples:</p>
              <ul className="text-xs text-white/70 space-y-1">
                <li>• General defeats Colonel (1 beats 6)</li>
                <li>• Spy defeats General (special ability)</li>
                <li>• Private defeats Spy (only exception)</li>
                <li>• Same ranks eliminate each other</li>
              </ul>
            </div>
            <p className="text-xs text-white/60 text-center">
              All pieces are visible to both players, so plan your moves carefully!
            </p>
          </div>
        </div>
      ),
      showNavigation: true
    },
    {
      id: "victory-conditions",
      title: "Path to Victory",
      description: "Capture the enemy flag to claim your triumph!",
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4"
            >
              <Flag className="h-8 w-8 text-yellow-400" />
            </motion.div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-xs text-green-300 font-medium mb-1">Ways to Win:</p>
              <ul className="text-xs text-white/70 space-y-1">
                <li>• <strong>Capture the Flag:</strong> Attack and eliminate the enemy flag</li>
                <li>• <strong>Timeout Victory:</strong> Opponent runs out of time</li>
                <li>• <strong>Resignation:</strong> Opponent surrenders</li>
              </ul>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-xs text-red-300 font-medium mb-1">Ways to Lose:</p>
              <ul className="text-xs text-white/70 space-y-1">
                <li>• Your flag is captured</li>
                <li>• You run out of time (15 minutes total)</li>
                <li>• You surrender the game</li>
              </ul>
            </div>
          </div>
        </div>
      ),
      showNavigation: true
    },
    {
      id: "ready-to-play",
      title: "Ready for Battle!",
      description: "You now know the fundamentals. Time to prove your strategic prowess!",
      content: (
        <div className="text-center space-y-3 sm:space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-green-500/30 rounded-2xl flex items-center justify-center shadow-lg mx-auto"
          >
            <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-400" />
          </motion.div>
          
          <div className="space-y-3">
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Congratulations! You've learned the essential rules of Game of the Generals. 
            </p>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-300 font-medium mb-1">Quick Recap:</p>
              <ul className="text-xs text-white/70 space-y-1">
                <li>• Move pieces one square at a time</li>
                <li>• Higher ranks defeat lower ranks</li>
                <li>• Spy defeats all except Private</li>
                <li>• Capture the enemy flag to win</li>
              </ul>
            </div>
            
            <p className="text-xs sm:text-sm text-white/60">
              Now go forth and lead your army to victory! Good luck, General.
            </p>
          </div>
        </div>
      ),
      showNavigation: false
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  // Reset state when step changes
  useEffect(() => {
    setSelectedSquare(null);
    setValidMoves([]);
    setArrows({});
  }, [currentStep]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="max-w-4xl w-[95vw] max-h-[calc(100dvh-2rem)] sm:max-h-[95vh] p-0 bg-gray-900/95 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden rounded-xl sm:rounded-2xl">
        <Card className="h-full bg-transparent border-0 shadow-none flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[95vh]">
          <CardHeader className="border-b border-white/10 p-3 sm:p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-red-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                >
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg text-white/90 truncate">
                    {currentStepData.title}
                  </CardTitle>
                  <p className="text-xs text-white/60 mt-0.5 line-clamp-1 sm:line-clamp-2">
                    {currentStepData.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <Badge variant="outline" className="bg-white/10 border-white/20 text-white/70 text-xs">
                  {currentStep + 1}/{steps.length}
                </Badge>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 sm:mt-3">
              <div className="w-full bg-white/10 rounded-full h-1 sm:h-1.5">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 sm:h-1.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-3 sm:p-4 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {currentStepData.content}
            </motion.div>
          </CardContent>
          
          {/* Fixed Footer */}
          <div className="border-t border-white/10 p-3 sm:p-4 flex-shrink-0">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50 text-xs sm:text-sm px-2 sm:px-4"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              {/* Progress dots - hidden on very small screens */}
              <div className="hidden sm:flex items-center gap-2">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index <= currentStep ? "bg-blue-500" : "bg-white/20"
                    )}
                    animate={{
                      scale: index === currentStep ? 1.2 : 1
                    }}
                  />
                ))}
              </div>
              
              {/* Mobile progress indicator */}
              <div className="sm:hidden text-xs text-white/60 flex-shrink-0">
                {currentStep + 1}/{steps.length}
              </div>
              
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs sm:text-sm px-2 sm:px-4"
                >
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Start Playing!</span>
                  <span className="sm:hidden">Start!</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    onClick={handleComplete}
                    className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-4"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs sm:text-sm px-2 sm:px-4"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
