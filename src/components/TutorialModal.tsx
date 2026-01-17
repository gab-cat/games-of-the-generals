import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  CheckCircle,
  Terminal,
  Activity,
  X,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "./ui/button";

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
  const board = Array(8)
    .fill(null)
    .map(() => Array(9).fill(null));

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
  onClick = () => {},
}: {
  _row: number;
  _col: number;
  cell: any;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isValidMove?: boolean;
  showArrow?: "up" | "down" | "left" | "right" | null;
  onClick?: () => void;
}) => {
  const ArrowComponent = showArrow
    ? {
        up: ArrowUp,
        down: ArrowDown,
        left: ArrowLeft,
        right: ArrowRight,
      }[showArrow]
    : null;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "aspect-square flex items-center justify-center cursor-pointer transition-all relative min-h-[24px] sm:min-h-[32px] p-0.5",
        "bg-zinc-900/50 border border-white/5 hover:bg-zinc-800/50 hover:border-white/20",
        isHighlighted &&
          "ring-2 ring-emerald-500 bg-emerald-500/20 border-emerald-500 z-10",
        isSelected &&
          "ring-2 ring-blue-500 bg-blue-500/20 border-blue-500 z-10",
        isValidMove &&
          "ring-1 ring-emerald-500/50 bg-emerald-500/10 border-emerald-500/50",
      )}
    >
      {/* Corner accents for tactical look */}
      <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-white/10" />
      <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-white/10" />

      {showArrow && ArrowComponent && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="rounded-full p-1 bg-emerald-500/20 backdrop-blur-sm">
            <ArrowComponent className="h-4 w-4 text-emerald-400" />
          </div>
        </div>
      )}

      {cell && (
        <div className="text-center w-full h-full flex items-center justify-center">
          <div
            className={`${
              cell.player === "player1" ? "text-blue-400" : "text-red-400"
            }`}
          >
            {cell.piece === "Hidden" ? (
              getPieceDisplay(cell.piece, { isOpponent: true, size: "small" })
            ) : (
              <div className="flex flex-col items-center justify-center scale-90 sm:scale-100">
                {getPieceDisplay(cell.piece, {
                  showLabel: false,
                  size: "small",
                })}
                {cell.revealed && cell.piece !== "Hidden" && (
                  <div className="text-[7px] sm:text-[8px] font-mono mt-0.5 opacity-60 leading-none uppercase tracking-tighter">
                    {cell.piece
                      .split(" ")
                      .map((word: string) => word[0])
                      .join("")}
                  </div>
                )}
              </div>
            )}
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
  onSquareClick = () => {},
}: {
  board: any[][];
  highlightedSquares?: string[];
  selectedSquare?: string | null;
  validMoves?: string[];
  arrows?: Record<string, "up" | "down" | "left" | "right">;
  onSquareClick?: (row: number, col: number) => void;
}) => {
  return (
    <div className="relative p-1 bg-black/40 border border-white/10 rounded-sm">
      {/* Board Grid decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_100%] pointer-events-none" />

      <div className="grid grid-cols-9 gap-px w-full sm:max-w-lg mx-auto bg-white/5 shadow-2xl">
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
          }),
        )}
      </div>
    </div>
  );
};

export function TutorialModal({
  isOpen,
  onClose,
  onComplete,
}: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const tutorialBoard = createTutorialBoard();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [arrows, setArrows] = useState<
    Record<string, "up" | "down" | "left" | "right">
  >({});

  const handleSquareClick = (row: number, col: number) => {
    // Interactive elements for movement tutorial
    if (currentStep === 4) {
      // movement-basics step index
      const square = `${row}-${col}`;
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        setArrows({});
      } else if (tutorialBoard[row][col]) {
        setSelectedSquare(square);
        // Show valid moves for the selected piece
        const validSquares: string[] = [];
        const arrowMap: Record<string, "up" | "down" | "left" | "right"> = {};

        // Check four directions
        const directions = [
          { dr: -1, dc: 0, arrow: "up" as const },
          { dr: 1, dc: 0, arrow: "down" as const },
          { dr: 0, dc: -1, arrow: "left" as const },
          { dr: 0, dc: 1, arrow: "right" as const },
        ];

        directions.forEach(({ dr, dc, arrow }) => {
          const newRow = row + dr;
          const newCol = col + dc;
          if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 9) {
            const targetCell = tutorialBoard[newRow][newCol];
            if (
              !targetCell ||
              targetCell.player !== tutorialBoard[row][col].player
            ) {
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

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  const steps: TutorialStep[] = [
    {
      id: "welcome",
      title: "INITIATE TRAINING",
      description: "BASIC COMBAT PROTOCOLS",
      content: (
        <div className="text-center space-y-8 py-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
            className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32"
          >
            {/* Rotating Tech Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-emerald-500/30"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border border-dotted border-emerald-500/30"
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-emerald-500/20" />
                <Crown className="h-12 w-12 sm:h-16 sm:w-16 text-emerald-400 relative z-10" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 max-w-lg mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight leading-none">
              COMMAND THE <span className="text-emerald-500">BATTLEFIELD</span>
            </h2>
            <p className="text-white/60 text-sm font-mono leading-relaxed">
              Welcome, General. This module will certify you in tactical
              operations, unit hierarchy, and combat engagement rules.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              {
                icon: Target,
                title: "STRATEGY",
                desc: "Positioning is key",
              },
              {
                icon: Sword,
                title: "WARFARE",
                desc: "Rank-based combat",
              },
              {
                icon: Flag,
                title: "VICTORY",
                desc: "Capture the Objective",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-4 bg-zinc-900/50 border border-white/5 hover:border-emerald-500/30 transition-colors rounded-sm"
              >
                <feature.icon className="h-6 w-6 text-emerald-500/70 group-hover:text-emerald-400 mx-auto mb-3 transition-colors" />
                <h3 className="text-xs font-mono font-bold text-white/80 mb-1">
                  {feature.title}
                </h3>
                <p className="text-[10px] text-white/40 uppercase tracking-wide">
                  {feature.desc}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      ),
      showNavigation: true,
    },
    {
      id: "board-overview",
      title: "SECTOR ANALYSIS",
      description: "THE FIELD OF OPERATIONS",
      content: (
        <div className="space-y-6">
          <TutorialBoard
            board={tutorialBoard}
            highlightedSquares={[
              "6-0",
              "6-1",
              "6-2",
              "6-3",
              "6-4",
              "6-5",
              "6-6",
              "5-3",
              "5-4",
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                <div className="w-3 h-3 bg-blue-400 rounded-sm animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-blue-400">
                  ALLIED FORCES
                </div>
                <div className="text-[10px] text-blue-300/60 uppercase">
                  Deployment Zone (Bottom)
                </div>
              </div>
            </div>
            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/30">
                <div className="w-3 h-3 bg-red-400 rounded-sm" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-red-400">
                  HOSTILE FORCES
                </div>
                <div className="text-[10px] text-red-300/60 uppercase">
                  Enemy Territory (Top)
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs font-mono text-white/50 text-center border-t border-white/5 pt-4">
            // INTEL: The battlefield is a 9x8 grid. Fog of war prevents seeing
            enemy ranks until engagement.
          </p>
        </div>
      ),
      highlightBoard: true,
      showNavigation: true,
    },
    {
      id: "piece-ranks",
      title: "UNIT HIERARCHY",
      description: "CHAIN OF COMMAND",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {[
              { piece: "5 Star General", rank: "1", color: "text-amber-400" },
              { piece: "4 Star General", rank: "2", color: "text-amber-300" },
              { piece: "3 Star General", rank: "3", color: "text-amber-200" },
              { piece: "2 Star General", rank: "4", color: "text-amber-100" },
              { piece: "1 Star General", rank: "5", color: "text-blue-400" },
              { piece: "Colonel", rank: "6", color: "text-blue-300" },
              {
                piece: "Lieutenant Colonel",
                rank: "7",
                color: "text-purple-400",
              },
              { piece: "Major", rank: "8", color: "text-purple-300" },
              { piece: "Captain", rank: "9", color: "text-emerald-400" },
              {
                piece: "1st Lieutenant",
                rank: "10",
                color: "text-emerald-300",
              },
              { piece: "2nd Lieutenant", rank: "11", color: "text-cyan-400" },
              { piece: "Sergeant", rank: "12", color: "text-cyan-300" },
              { piece: "Private", rank: "13", color: "text-zinc-400" },
              { piece: "Spy", rank: "★", color: "text-rose-500" },
            ].map(({ piece, rank, color }) => (
              <div
                key={piece}
                className="flex items-center gap-3 p-2 rounded-sm bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-center w-8 shrink-0">
                  {getPieceDisplay(piece, { size: "small" })}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-mono font-bold text-xs ${color} truncate`}
                  >
                    {piece}
                  </div>
                  <div className="text-[10px] text-white/30 font-mono uppercase tracking-wider">
                    Rank Class: {rank}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-mono font-bold text-amber-500 mb-1">
                COMBAT PROTOCOL
              </p>
              <p className="text-xs text-amber-200/60 leading-relaxed font-mono">
                Lower rank numbers indicate higher authority.
                <br />
                Example: Rank 1 defeats Rank 2.
              </p>
            </div>
          </div>
        </div>
      ),
      showNavigation: true,
    },
    {
      id: "special-pieces",
      title: "SPECIAL ASSETS",
      description: "HIGH VALUE TARGETS",
      content: (
        <div className="space-y-6">
          <TutorialBoard
            board={tutorialBoard}
            highlightedSquares={["6-4", "6-6", "1-4", "2-4"]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-sm p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Flag className="w-12 h-12 rotate-12" />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-sm">
                  <Flag className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm font-mono font-bold text-blue-400">
                  THE FLAG
                </span>
              </div>
              <p className="text-xs text-blue-200/60 font-mono leading-relaxed">
                Mission Critical Asset. Loss of flag results in immediate
                defeat. Must be defended at all costs.
              </p>
            </div>

            <div className="bg-rose-500/5 border border-rose-500/20 rounded-sm p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Eye className="w-12 h-12 rotate-12" />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-500/20 rounded-sm">
                  <Eye className="h-4 w-4 text-rose-400" />
                </div>
                <span className="text-sm font-mono font-bold text-rose-400">
                  THE SPY
                </span>
              </div>
              <p className="text-xs text-rose-200/60 font-mono leading-relaxed">
                Assassin Class Unit. Eliminates all officer ranks. Vulnerable
                only to the lowest rank (Private).
              </p>
            </div>
          </div>
        </div>
      ),
      highlightPieces: ["Flag", "Spy"],
      showNavigation: true,
    },
    {
      id: "movement-basics",
      title: "MANEUVERS",
      description: "UNIT DEPLOYMENT & MOTION",
      content: (
        <div className="space-y-6">
          <TutorialBoard
            board={tutorialBoard}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            arrows={arrows}
            onSquareClick={handleSquareClick}
          />
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-sm p-4">
            <div className="flex items-center gap-3 mb-3 border-b border-emerald-500/10 pb-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-mono font-bold text-emerald-500">
                MOVEMENT RULES
              </span>
            </div>
            <ul className="text-xs text-emerald-200/60 font-mono space-y-2">
              <li className="flex gap-2">
                <span className="text-emerald-500">▶</span>
                Single square movement per turn
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">▶</span>
                Orthogonal only (Up, Down, Left, Right)
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">▶</span>
                No diagonal movement allowed
              </li>
            </ul>
          </div>
          <p className="text-[10px] uppercase font-mono text-center text-white/30 animate-pulse">
            {selectedSquare
              ? ">> TARGET ACQUIRED. SELECT DESTINATION."
              : ">> CLICK UNIT TO VIEW MOVEMENT VECTORS"}
          </p>
        </div>
      ),
      showNavigation: true,
    },
    {
      id: "combat-system",
      title: "ENGAGEMENT",
      description: "BATTLE RESOLUTION LOGIC",
      content: (
        <div className="space-y-8 py-4">
          <div className="relative">
            {/* VS Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-zinc-950 border border-white/20 rounded-full p-2">
                <span className="font-display font-bold text-xl text-white">
                  VS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Allied Unit */}
              <div className="text-center space-y-2">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-sm p-6 flex items-center justify-center">
                  <div className="scale-150">
                    {getPieceDisplay("Major", { size: "medium" })}
                  </div>
                </div>
                <div className="font-mono text-xs text-blue-400 font-bold">
                  MAJOR
                </div>
                <div className="font-mono text-[10px] text-blue-300/50">
                  RANK 8
                </div>
              </div>

              {/* Enemy Unit */}
              <div className="text-center space-y-2">
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-6 flex items-center justify-center">
                  <div className="scale-150">
                    {getPieceDisplay("Captain", { size: "medium" })}
                  </div>
                </div>
                <div className="font-mono text-xs text-red-400 font-bold">
                  CAPTAIN
                </div>
                <div className="font-mono text-[10px] text-red-300/50">
                  RANK 9
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-4 py-2 font-mono text-xs tracking-widest"
            >
              OUTCOME: VICTORY
            </Badge>
            <p className="mt-2 text-xs font-mono text-white/40">
              Rank 8 (Higher) eliminates Rank 9 (Lower)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50 uppercase">
            <div className="bg-white/5 p-2 rounded-sm border border-white/5">
              General (1) &gt; Colonel (6)
            </div>
            <div className="bg-white/5 p-2 rounded-sm border border-white/5 text-rose-300/70">
              Spy (★) &gt; General (1)
            </div>
            <div className="bg-white/5 p-2 rounded-sm border border-white/5 text-blue-300/70">
              Private (13) &gt; Spy (★)
            </div>
            <div className="bg-white/5 p-2 rounded-sm border border-white/5">
              Equal Ranks = Mutually Assured Destruction
            </div>
          </div>
        </div>
      ),
      showNavigation: true,
    },
    {
      id: "victory-conditions",
      title: "OBJECTIVES",
      description: "MISSION SUCCESS CRITERIA",
      content: (
        <div className="space-y-6">
          <div className="text-center py-4">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0px rgba(234, 179, 8, 0)",
                  "0 0 20px rgba(234, 179, 8, 0.2)",
                  "0 0 0px rgba(234, 179, 8, 0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block rounded-full p-6 bg-amber-500/10 border border-amber-500/30"
            >
              <Flag className="h-12 w-12 text-amber-500" />
            </motion.div>
          </div>

          <div className="space-y-3">
            <div className="group border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 p-4 rounded-sm transition-all">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-mono font-bold text-emerald-400">
                  FLAG_CAPTURE
                </span>
              </div>
              <p className="text-xs text-emerald-200/60 font-mono">
                Primary Objective. Locate and eliminate the enemy flag.
              </p>
            </div>

            <div className="group border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40 p-4 rounded-sm transition-all">
              <div className="flex items-center gap-3 mb-2">
                <ArrowUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-mono font-bold text-blue-400">
                  INFILTRATION
                </span>
              </div>
              <p className="text-xs text-blue-200/60 font-mono">
                Secondary Objective. Maneuver your Flag to the enemy's back
                rank.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-sm">
                <span className="block text-[10px] text-white/40 font-mono uppercase mb-1">
                  Time Limit
                </span>
                <span className="text-xs text-white/80 font-mono">
                  15:00 Minutes
                </span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-sm">
                <span className="block text-[10px] text-white/40 font-mono uppercase mb-1">
                  Resignation
                </span>
                <span className="text-xs text-white/80 font-mono">
                  Available
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      showNavigation: true,
    },
    {
      id: "ready-to-play",
      title: "CERTIFIED",
      description: "TRAINING COMPLETE",
      content: (
        <div className="text-center space-y-8 py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.2,
            }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/50 relative"
          >
            <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-50" />
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </motion.div>

          <div className="space-y-4 max-w-md mx-auto">
            <h3 className="text-2xl font-display font-medium text-white">
              YOU ARE <span className="text-emerald-500">READY</span>
            </h3>
            <p className="text-white/60 text-sm font-mono leading-relaxed">
              Tactical briefing concluded. Your strategic capabilities have been
              initialized. Proceed to deployment sector immediately.
            </p>
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
            <Button
              onClick={handleComplete}
              className="h-12 w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold font-mono tracking-wider rounded-sm"
            >
              <Play className="w-4 h-4 mr-2" />
              DEPLOY NOW
            </Button>
            <Button
              onClick={() => setCurrentStep(0)}
              variant="outline"
              className="h-10 w-full border-white/10 bg-transparent text-white/60 hover:text-white hover:bg-white/5 font-mono text-xs rounded-sm"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              RESTART MODULE
            </Button>
          </div>
        </div>
      ),
      showNavigation: false,
    },
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

  // Reset state when step changes
  useEffect(() => {
    setSelectedSquare(null);
    setValidMoves([]);
    setArrows({});
  }, [currentStep]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/90 backdrop-blur-md" />
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] sm:h-auto sm:max-h-[90vh] p-0 bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden rounded-sm flex flex-col">
        {/* Tactical Corner Decoration */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-sm pointer-events-none z-50" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-sm pointer-events-none z-50" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-sm pointer-events-none z-50" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-sm pointer-events-none z-50" />

        {/* Scanline Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-sm">
              <Terminal className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-[0.2em] mb-0.5">
                System Training
              </div>
              <h2 className="text-sm font-display font-medium text-white tracking-widest uppercase">
                Tactical Module 01
              </h2>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-sm"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            {/* Left: Visual/Board Area */}
            <div className="lg:col-span-12 p-6 flex flex-col h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col"
                >
                  {/* Step Header */}
                  <div className="mb-6 flex items-start justify-between border-b border-white/5 pb-4">
                    <div>
                      <div className="text-xs font-mono text-emerald-500 mb-2 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        PHASE {String(currentStep + 1).padStart(2, "0")} //{" "}
                        {String(steps.length).padStart(2, "0")}
                      </div>
                      <h1 className="text-2xl font-display font-bold text-white uppercase tracking-wide">
                        {currentStepData.title}
                      </h1>
                      <p className="text-white/40 font-mono text-sm uppercase tracking-wider mt-1">
                        [{currentStepData.description}]
                      </p>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {currentStepData.content}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        {currentStepData.showNavigation && (
          <div className="relative z-10 p-4 border-t border-white/10 bg-zinc-950/80 backdrop-blur-sm flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 font-mono text-xs rounded-sm h-10 px-4 disabled:opacity-30 uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-sm transition-all duration-300 ${
                    idx === currentStep ? "bg-emerald-500 w-3" : "bg-white/20"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold font-mono text-xs rounded-sm h-10 px-6 uppercase tracking-widest"
            >
              {currentStep === steps.length - 1 ? (
                "Complete"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
