import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { FixedDigits } from "@/components/ui/fixed-digits";
import { useConvexMutationWithQuery } from "../lib/convex-query-hooks";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import {
  Shuffle,
  ArrowRightLeft,
  Check,
  Flag,
  Eye,
  Copy,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Clock,
  Zap,
  Loader2,
  Eraser,
  TriangleAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Timer } from "../pages/game/Timer";
import { GameResultModal } from "../pages/game/GameResultModal";
import { AchievementNotification } from "../pages/achievements/AchievementNotification";
import { UserAvatar } from "./UserAvatar";
import { getPieceDisplay } from "../lib/piece-display";
import { SetupPresets } from "./setup-presets/SetupPresets";
import { useSound } from "../lib/SoundProvider";
import { UserNameWithBadge } from "./UserNameWithBadge";
import { fadeUp, riseIn, stagger } from "../lib/motion";
import usePresence, { type PresenceState } from "@convex-dev/presence/react";

interface GameBoardProps {
  gameId: Id<"games">;
  profile: Doc<"profiles">;
  onBackToLobby: () => void;
}

// Game pieces for setup (21 pieces total) - Memoized constant
const INITIAL_PIECES = [
  "Flag",
  "Spy",
  "Spy",
  "Private",
  "Private",
  "Private",
  "Private",
  "Private",
  "Private",
  "Sergeant",
  "2nd Lieutenant",
  "1st Lieutenant",
  "Captain",
  "Major",
  "Lieutenant Colonel",
  "Colonel",
  "1 Star General",
  "2 Star General",
  "3 Star General",
  "4 Star General",
  "5 Star General",
];

// Constants for better performance
const BOARD_ROWS = 8;
const BOARD_COLS = 9;

// Get time limit in seconds based on game mode
const getTimeLimitSeconds = (
  gameMode?: "classic" | "blitz" | "reveal",
): number => {
  switch (gameMode) {
    case "blitz":
      return 6 * 60; // 6 minutes
    case "classic":
    case "reveal":
    default:
      return 15 * 60; // 15 minutes
  }
};

// Game mode label and icon for the status strip
const getGameModeBadge = (gameMode?: "classic" | "blitz" | "reveal") => {
  switch (gameMode || "classic") {
    case "blitz":
      return { label: "Blitz", icon: <Zap className="h-3 w-3" /> };
    case "reveal":
      return { label: "Reveal", icon: <Eye className="h-3 w-3" /> };
    default:
      return { label: "Classic", icon: <Clock className="h-3 w-3" /> };
  }
};

// Every piece with its short name and rank, used by the legend and the setup tray
const PIECES_INFO = [
  { piece: "5 Star General", short: "5 Star", rank: "1 (highest)" },
  { piece: "4 Star General", short: "4 Star", rank: "2" },
  { piece: "3 Star General", short: "3 Star", rank: "3" },
  { piece: "2 Star General", short: "2 Star", rank: "4" },
  { piece: "1 Star General", short: "1 Star", rank: "5" },
  { piece: "Colonel", short: "Colonel", rank: "6" },
  { piece: "Lieutenant Colonel", short: "Lt Col", rank: "7" },
  { piece: "Major", short: "Major", rank: "8" },
  { piece: "Captain", short: "Captain", rank: "9" },
  { piece: "1st Lieutenant", short: "1st Lt", rank: "10" },
  { piece: "2nd Lieutenant", short: "2nd Lt", rank: "11" },
  { piece: "Sergeant", short: "Sergeant", rank: "12" },
  { piece: "Private", short: "Private", rank: "13" },
  { piece: "Spy", short: "Spy", rank: "Special" },
  { piece: "Flag", short: "Flag", rank: "Goal" },
];
const SHORT_NAMES: Record<string, string> = Object.fromEntries(
  PIECES_INFO.map((p) => [p.piece, p.short]),
);

// "14:52" -> 892
const secondsFromClock = (clock: string) => {
  const [m, s] = clock.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
};

// Create empty board factory function
const createEmptyBoard = () =>
  Array(BOARD_ROWS)
    .fill(null)
    .map(() => Array(BOARD_COLS).fill(null));

// Helper functions for board flipping
const flipRowForDisplay = (row: number, shouldFlip: boolean) =>
  shouldFlip ? BOARD_ROWS - 1 - row : row;
const flipRowForLogic = (displayRow: number, shouldFlip: boolean) =>
  shouldFlip ? BOARD_ROWS - 1 - displayRow : displayRow;

// Helper function to flip board data for display
const flipBoardForDisplay = (board: any[][], shouldFlip: boolean) => {
  if (!shouldFlip) return board;
  return [...board].reverse();
};

// Piece colours: player 1 is blue, player 2 is red, on both screens.
const PLAYER_TONE = {
  player1: {
    text: "text-blue-300",
    tile: "bg-blue-500/[0.13] border-blue-400/30",
    bar: "border-l-blue-400",
    ring: "border-blue-400/60",
  },
  player2: {
    text: "text-red-300",
    tile: "bg-red-500/[0.13] border-red-400/30",
    bar: "border-l-red-400",
    ring: "border-red-400/60",
  },
} as const;

// One board square. Memoized: the board has 72 of them.
const BoardSquare = memo(
  ({
    row,
    col,
    cell,
    isSelected,
    isValidMove,
    highlightType,
    isPendingMove,
    isPendingFromPosition,
    isLastMoveFrom,
    isCurrentPlayer,
    ArrowComponent,
    onClick,
  }: {
    row: number;
    col: number;
    cell: any;
    isSelected: boolean;
    isValidMove: boolean;
    highlightType: string | null;
    isPendingMove: boolean;
    isPendingFromPosition: boolean;
    isLastMoveFrom: boolean;
    isCurrentPlayer: boolean;
    ArrowComponent: any;
    onClick: (row: number, col: number) => void;
  }) => {
    const tone = cell
      ? PLAYER_TONE[cell.player === "player1" ? "player1" : "player2"]
      : null;
    const label = !cell
      ? "Empty square"
      : cell.piece === "Hidden"
        ? "Opponent piece, hidden"
        : cell.piece;

    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={isSelected}
        onClick={() => onClick(row, col)}
        className={`relative flex aspect-square items-center justify-center border text-foreground transition-colors duration-150 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/80 sm:rounded-md ${
          tone ? tone.tile : "border-white/[0.07] bg-white/[0.025]"
        } ${isCurrentPlayer ? "cursor-pointer [@media(hover:hover)]:hover:bg-white/[0.08]" : "cursor-default"} ${
          highlightType === "last-move" && !isSelected
            ? "!border-gold-500/50 !bg-gold-500/[0.12]"
            : ""
        } ${isValidMove ? "!border-emerald-400/60 !bg-emerald-500/[0.12]" : ""} ${
          isSelected
            ? "z-10 ring-2 ring-inset ring-gold-400 !bg-gold-500/20"
            : ""
        } ${isPendingMove ? "opacity-70" : ""}`}
      >
        {isPendingFromPosition && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold-400" />
          </div>
        )}

        {isLastMoveFrom && ArrowComponent && !isPendingFromPosition && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <ArrowComponent className="h-6 w-6 text-gold-400" />
          </div>
        )}

        {cell && tone && (
          <div className="text-center">
            <div className={tone.text}>
              {cell.piece === "Hidden" ? (
                getPieceDisplay(cell.piece, { isOpponent: true, size: "small" })
              ) : (
                <>
                  {/* Phone: icon only */}
                  <div className="block sm:hidden">
                    {getPieceDisplay(cell.piece, {
                      showLabel: false,
                      size: "small",
                    })}
                  </div>
                  {/* Desktop: icon and name */}
                  <div className="hidden sm:block">
                    {getPieceDisplay(cell.piece, {
                      showLabel: true,
                      size: "medium",
                    })}
                  </div>
                </>
              )}
            </div>
            {cell.revealed && cell.piece !== "Hidden" && (
              <div className="mt-0.5 text-[10px] font-bold leading-tight text-foreground/70 sm:text-xs">
                {cell.piece
                  .split(" ")
                  .map((word: string) => word[0])
                  .join("")}
              </div>
            )}
          </div>
        )}
      </button>
    );
  },
);

BoardSquare.displayName = "BoardSquare";

type Presence = { online: boolean } | null | undefined;

// One player's bar above or below the board: who, their clock, whose turn.
function PlayerBar({
  side,
  username,
  profile,
  presence,
  forfeitRemaining,
  time,
  isTurn,
  isWinner,
  isYou,
  formatTime,
}: {
  side: "player1" | "player2";
  username: string;
  profile?: {
    username?: string;
    avatarUrl?: string;
    rank?: string;
    avatarFrame?: string;
    tier?: "free" | "pro" | "pro_plus";
    isDonor?: boolean;
    usernameColor?: string;
  } | null;
  presence: Presence;
  forfeitRemaining: number | null;
  time: string;
  isTurn: boolean;
  isWinner: boolean;
  isYou: boolean;
  formatTime: (s: number) => string;
}) {
  const tone = PLAYER_TONE[side];
  const seconds = secondsFromClock(time);
  const lowTime = isTurn && seconds <= 60;
  return (
    <div
      data-testid={isYou ? "player-bar-you" : "player-bar-opponent"}
      data-turn={isTurn}
      className={`flex items-center gap-3 rounded-lg border border-l-[3px] px-3 py-2 transition-colors duration-200 ${tone.bar} ${
        isTurn
          ? "border-y-gold-500/40 border-r-gold-500/40 bg-gold-500/[0.07]"
          : "border-y-border border-r-border bg-card"
      }`}
    >
      <UserAvatar
        username={profile?.username || username}
        avatarUrl={profile?.avatarUrl}
        rank={profile?.rank}
        size="sm"
        frame={profile?.avatarFrame}
        noRing
        className={`border-2 ${isWinner ? "border-gold-400" : tone.ring}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <UserNameWithBadge
            username={username}
            tier={profile?.tier}
            isDonor={profile?.isDonor}
            usernameColor={profile?.usernameColor}
            size="md"
            className="max-w-[160px] sm:max-w-[240px]"
          />
          {isYou && (
            <span className="shrink-0 text-xs text-foreground/70">You</span>
          )}
          {presence?.online && (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-emerald-400"
              title="Online"
              role="img"
              aria-label="Online"
            />
          )}
          {presence && !presence.online && (
            <span
              className="flex shrink-0 items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-xs text-red-300"
              title={
                forfeitRemaining !== null
                  ? `Forfeits in ${formatTime(forfeitRemaining)}`
                  : "Disconnected"
              }
            >
              <TriangleAlert className="h-3 w-3" />
              {forfeitRemaining !== null ? (
                <FixedDigits>{formatTime(forfeitRemaining)}</FixedDigits>
              ) : (
                "Offline"
              )}
            </span>
          )}
        </div>
        {isWinner && <p className="text-xs text-gold-300">Winner</p>}
      </div>
      <span
        className={`text-xl font-semibold tabular-nums ${
          lowTime
            ? "text-red-400"
            : isTurn
              ? "text-foreground"
              : "text-foreground/75"
        }`}
        aria-label={`Time left ${time}`}
      >
        <FixedDigits>{time}</FixedDigits>
      </span>
    </div>
  );
}

// Piece ranks. Collapsed by default.
function PieceLegend() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-lg px-4 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
      >
        <span className="text-base font-semibold text-foreground">
          Piece ranks
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto border-t border-border px-4 pb-4 pt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[13px] text-foreground/70">
                    <th className="w-14 py-2 font-medium">Piece</th>
                    <th className="py-2 font-medium">Name</th>
                    <th className="py-2 text-right font-medium">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {PIECES_INFO.map(({ piece, rank }) => (
                    <tr key={piece} className="border-b border-border/60">
                      <td className="py-1.5">
                        <div className="flex w-10 justify-center text-foreground">
                          {getPieceDisplay(piece, { size: "small" })}
                        </div>
                      </td>
                      <td className="py-1.5 text-foreground">{piece}</td>
                      <td className="py-1.5 text-right text-foreground/80">
                        {rank}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="mt-3 space-y-1 text-[13px] text-foreground/80">
                <li>A higher rank removes a lower rank.</li>
                <li>The Spy removes any officer, but loses to a Private.</li>
                <li>Capture your opponent's Flag to win.</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// A player who stops sending heartbeats shows offline after 2.5 intervals,
// which starts the disconnect forfeit timer.
const GAME_PRESENCE_INTERVAL = 60_000;

// Heartbeats into the game's presence room. Rendered only while the game is
// live: unmounting when it finishes ends the session, so the room the server
// removed at game end isn't recreated by the result screen.
function GamePresenceSession({
  gameId,
  username,
  onChange,
}: {
  gameId: Id<"games">;
  username: string;
  onChange: (state: PresenceState[] | undefined) => void;
}) {
  const state = usePresence(
    api.gamePresence,
    gameId,
    username,
    GAME_PRESENCE_INTERVAL,
  );
  useEffect(() => {
    onChange(state);
  }, [state, onChange]);
  useEffect(() => () => onChange(undefined), [onChange]);
  return null;
}

const GameBoard = memo(function GameBoard({
  gameId,
  profile,
  onBackToLobby,
}: GameBoardProps) {
  const navigate = useNavigate();

  const game = useQuery(api.games.getGame, { gameId });
  const isLoadingGame = game === undefined;

  // Filled by <GamePresenceSession>, which is mounted only during setup and play.
  const [presenceState, setPresenceState] = useState<PresenceState[]>();
  const presenceSession =
    game && game.status !== "finished" ? (
      <GamePresenceSession
        key="presence"
        gameId={gameId}
        username={profile.username}
        onChange={setPresenceState}
      />
    ) : null;
  const { playBGM, playSFX } = useSound();

  // Helper function to get online status for a player
  const getPlayerPresence = useCallback(
    (username: string) => {
      if (!presenceState || !Array.isArray(presenceState)) return null;
      return presenceState.find((presence) => presence.userId === username);
    },
    [presenceState],
  );

  // Subscribing during play re-ran this on every move only to return null.
  const matchResult = useQuery(
    api.games.getMatchResult,
    game?.status === "finished" ? { gameId } : "skip",
  );

  const { mutate: setupPieces, isPending: isSettingUpPieces } =
    useConvexMutationWithQuery(api.games.setupPieces, {
      onSuccess: () => {
        toast.success("Pieces placed. Waiting for your opponent.");
      },
      onError: () => {
        toast.error("Failed to setup pieces");
      },
    });

  const { mutate: makeMove, isPending: isMakingMove } =
    useConvexMutationWithQuery(api.games.makeMove, {
      onSuccess: (result: any) => {
        // Clear optimistic state when real data comes back
        setOptimisticBoard(null);
        setPendingMove(null);

        if (result.challengeResult) {
          // Play kill SFX when pieces are eliminated in battle
          playSFX("kill");

          // Don't reveal pieces in toast, just indicate if it was a win/loss
          const isCurrentPlayerWinner =
            result.challengeResult.winner === "attacker";
          if (isCurrentPlayerWinner) {
            toast.success("Your piece won the battle.");
          } else if (result.challengeResult.winner === "defender") {
            toast.error("Your piece was captured.");
          } else {
            toast.info("Both pieces were removed.");
          }
        }
      },
      onError: (error: any) => {
        // Revert optimistic update on error
        setOptimisticBoard(null);
        setPendingMove(null);
        toast.error(error instanceof Error ? error.message : "Invalid move");
      },
    });

  const { mutate: surrenderGame, isPending: isSurrendering } =
    useConvexMutationWithQuery(api.games.surrenderGame, {
      onSuccess: () => {
        toast.success("Game surrendered");
      },
      onError: () => {
        toast.error("Failed to surrender");
      },
    });

  const { mutate: timeoutGame } = useConvexMutationWithQuery(
    api.games.timeoutGame,
    {
      onSuccess: () => {
        toast.error("Your time ran out. You lost the game.");
      },
    },
  );

  const { mutate: acknowledgeGameResult } = useConvexMutationWithQuery(
    api.games.acknowledgeGameResult,
    {
      onError: () => {
        toast.error("Failed to acknowledge result");
      },
    },
  );

  // Mutations for opponent disconnection tracking
  const reportOpponentDisconnect = useMutation(
    api.games.reportOpponentDisconnect,
  );
  const reportOpponentReconnect = useMutation(
    api.games.reportOpponentReconnect,
  );

  // Track opponent's online status and report disconnection/reconnection to backend
  // This enables the automatic 2-minute forfeit timer
  const prevOpponentOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!game || game.status !== "playing") return;

    // Determine who the opponent is and check their presence
    const isPlayer1 = profile.userId === game.player1Id;
    const opponentUsername = isPlayer1
      ? game.player2Username
      : game.player1Username;
    const opponentPresence = getPlayerPresence(opponentUsername);

    // If we can't determine opponent presence, skip
    if (!opponentPresence) return;

    const isOpponentOnline = opponentPresence.online;
    const wasOpponentOnline = prevOpponentOnlineRef.current;

    // Update previous state
    prevOpponentOnlineRef.current = isOpponentOnline;

    // On initial mount or when we don't have previous data, don't trigger anything
    if (wasOpponentOnline === null) return;

    // Opponent went offline
    if (wasOpponentOnline && !isOpponentOnline) {
      console.log(
        `[GameBoard] Opponent ${opponentUsername} went offline, reporting disconnection`,
      );
      reportOpponentDisconnect({ gameId })
        .then((result) => {
          if (result.scheduled) {
            toast.warning(
              `Opponent disconnected. Game will forfeit in 2 minutes if they don't return.`,
              {
                duration: 5000,
              },
            );
          }
        })
        .catch(console.error);
    }

    // Opponent came back online
    if (!wasOpponentOnline && isOpponentOnline) {
      console.log(
        `[GameBoard] Opponent ${opponentUsername} came back online, clearing disconnection`,
      );
      reportOpponentReconnect({ gameId })
        .then(() => {
          toast.success(`Your opponent is back.`, { duration: 3000 });
        })
        .catch(console.error);
    }
  }, [
    game,
    profile.userId,
    getPlayerPresence,
    gameId,
    reportOpponentDisconnect,
    reportOpponentReconnect,
  ]);

  // Get player profiles for avatars - conditional queries

  const player1Profile = useQuery(
    api.profiles.getProfileByUsername,
    game?.player1Username ? { username: game.player1Username } : "skip",
  );

  const player2Profile = useQuery(
    api.profiles.getProfileByUsername,
    game?.player2Username ? { username: game.player2Username } : "skip",
  );

  // Optimized state initialization
  const [setupBoard, setSetupBoard] = useState<(string | null)[][]>(() =>
    createEmptyBoard(),
  );
  const [availablePieces, setAvailablePieces] = useState(() => [
    ...INITIAL_PIECES,
  ]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [selectedSetupSquare, setSelectedSetupSquare] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [optimisticBoard, setOptimisticBoard] = useState<any[][] | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showSurrenderDialog, setShowSurrenderDialog] = useState(false);

  const [_, setBoardRect] = useState<DOMRect | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Memoized computed values
  const isPlayer1 = useMemo(
    () => game?.player1Id === profile.userId,
    [game?.player1Id, profile.userId],
  );
  const isPlayer2 = useMemo(
    () => game?.player2Id === profile.userId,
    [game?.player2Id, profile.userId],
  );
  const isCurrentPlayer = useMemo(
    () => game?.currentTurn === (isPlayer1 ? "player1" : "player2"),
    [game?.currentTurn, isPlayer1],
  );

  // Get eliminated pieces for current player from game data
  const eliminatedPieces = useMemo(() => {
    if (!game?.eliminatedPieces) return [];

    const currentPlayer = isPlayer1 ? "player1" : "player2";

    return game.eliminatedPieces
      .filter((ep) => ep.player === currentPlayer)
      .map((ep) => ({
        piece: ep.piece,
        moveNumber: ep.turn,
        battleOutcome: ep.battleOutcome,
      }))
      .reverse(); // Most recent first
  }, [game?.eliminatedPieces, isPlayer1]);

  // Determine if board should be flipped (player2 sees board flipped so they appear at bottom)
  const shouldFlipBoard = useMemo(() => isPlayer2, [isPlayer2]);
  // Check if current user has acknowledged the result
  const hasAcknowledgedResult = useMemo(
    () =>
      game?.status === "finished" &&
      ((isPlayer1 && game.player1ResultAcknowledged) ||
        (isPlayer2 && game.player2ResultAcknowledged)),
    [
      game?.status,
      game?.player1ResultAcknowledged,
      game?.player2ResultAcknowledged,
      isPlayer1,
      isPlayer2,
    ],
  );

  // Memoized board dimensions
  const updateBoardRect = useCallback(() => {
    if (boardRef.current) {
      setBoardRect(boardRef.current.getBoundingClientRect());
    }
  }, []);

  // Optimized useEffect hooks with proper dependencies

  // Timer effect - optimized with cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Board rect tracking - optimized with throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const throttledUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(updateBoardRect, 100);
    };

    updateBoardRect();
    window.addEventListener("resize", throttledUpdate);
    return () => {
      window.removeEventListener("resize", throttledUpdate);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [updateBoardRect]);

  // Initialize showResultModal to true if game is already finished when component loads
  // but only if the user hasn't acknowledged the result yet
  useEffect(() => {
    if (
      game?.status === "finished" &&
      !gameFinished &&
      !hasAcknowledgedResult
    ) {
      setShowResultModal(true);
      setGameFinished(true);
    }
  }, [game?.status, gameFinished, hasAcknowledgedResult]);

  // Auto-select next piece after placing one and auto-enable swap mode when no pieces left
  useEffect(() => {
    if (availablePieces.length === 0) {
      setIsSwapMode(true);
      setSelectedPiece(null);
    } else if (!selectedPiece && availablePieces.length > 0 && !isSwapMode) {
      setSelectedPiece(availablePieces[0]);
    }
  }, [selectedPiece, availablePieces, isSwapMode]);

  // Clear optimistic state when game updates from server
  useEffect(() => {
    if (game && optimisticBoard && !pendingMove) {
      // If we have optimistic state but no pending move, clear it
      setOptimisticBoard(null);
    }
  }, [game, optimisticBoard, pendingMove]);

  // Disconnection grace period constant (2 minutes = 120 seconds)
  const DISCONNECTION_GRACE_PERIOD_MS = 2 * 60 * 1000;

  // Memoized helper functions
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Calculate remaining time before forfeit for a disconnected player
  const getDisconnectForfeitTime = useCallback(
    (disconnectedAt: number | undefined): number | null => {
      if (!disconnectedAt) return null;
      const forfeitAt = disconnectedAt + DISCONNECTION_GRACE_PERIOD_MS;
      const remainingMs = forfeitAt - currentTime;
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      return remainingSeconds;
    },
    [currentTime],
  );

  // Memoized timeout handlers
  const handlePlayer1Timeout = useCallback(() => {
    if (!game) return;

    // Allow current user to handle timeout if either:
    // 1. They are player1 whose time ran out, OR
    // 2. Player1's time ran out but player1 is offline
    const player1Presence = getPlayerPresence(game.player1Username);
    const canHandlePlayer1Timeout =
      (isPlayer1 && game.currentTurn === "player1") ||
      (game.currentTurn === "player1" &&
        (!player1Presence || !player1Presence.online));

    if (canHandlePlayer1Timeout) {
      if (isPlayer1) {
        toast.error("Your time ran out. You lost the game.");
      } else {
        toast.success("Your opponent ran out of time. You won.");
      }
      timeoutGame({ gameId });
    }
  }, [isPlayer1, game, timeoutGame, gameId, getPlayerPresence]);

  const handlePlayer2Timeout = useCallback(() => {
    if (!game) return;

    // Allow current user to handle timeout if either:
    // 1. They are player2 whose time ran out, OR
    // 2. Player2's time ran out but player2 is offline
    const player2Presence = getPlayerPresence(game.player2Username);
    const canHandlePlayer2Timeout =
      (isPlayer2 && game.currentTurn === "player2") ||
      (game.currentTurn === "player2" &&
        (!player2Presence || !player2Presence.online));

    if (canHandlePlayer2Timeout) {
      if (isPlayer2) {
        toast.error("Your time ran out. You lost the game.");
      } else {
        toast.success("Your opponent ran out of time. You won.");
      }
      timeoutGame({ gameId });
    }
  }, [isPlayer2, game, timeoutGame, gameId, getPlayerPresence]);

  // Get time limit based on game mode
  const timeLimitSeconds = useMemo(() => {
    return getTimeLimitSeconds(game?.gameMode);
  }, [game?.gameMode]);

  // Optimized getPlayerTime function with timeout handling
  const getPlayerTime = useCallback(
    (isPlayerParam: boolean) => {
      if (!game) return formatTime(timeLimitSeconds); // Default time display

      if (game.status === "finished") {
        // Show final time remaining for finished games
        const timeUsed = isPlayerParam
          ? game.player1TimeUsed || 0
          : game.player2TimeUsed || 0;
        const timeUsedSeconds = Math.floor(timeUsed / 1000);
        const remaining = Math.max(0, timeLimitSeconds - timeUsedSeconds);
        return formatTime(remaining);
      }

      if (game.status !== "playing") return formatTime(timeLimitSeconds); // Default time display for setup

      const timeUsed = isPlayerParam
        ? game.player1TimeUsed || 0
        : game.player2TimeUsed || 0;
      const timeUsedSeconds = Math.floor(timeUsed / 1000);

      // If it's current player's turn, add elapsed time since turn started
      let currentTurnTime = 0;
      const isCurrentTurn =
        (isPlayerParam && game.currentTurn === "player1") ||
        (!isPlayerParam && game.currentTurn === "player2");

      if (isCurrentTurn && (game.lastMoveTime || game.gameTimeStarted)) {
        const turnStartTime =
          game.lastMoveTime || game.gameTimeStarted || currentTime;
        currentTurnTime = Math.floor((currentTime - turnStartTime) / 1000);
      }

      const totalUsed = timeUsedSeconds + currentTurnTime;
      const remaining = Math.max(0, timeLimitSeconds - totalUsed);

      // Check for timeout condition - only trigger once per timeout
      if (remaining <= 0 && isCurrentTurn && game.status === "playing") {
        // Allow timeout handling for any player when it's their turn and time runs out
        if (game.currentTurn === "player1") {
          setTimeout(() => handlePlayer1Timeout(), 100);
        } else if (game.currentTurn === "player2") {
          setTimeout(() => handlePlayer2Timeout(), 100);
        }
      }

      return formatTime(remaining);
    },
    [
      game,
      currentTime,
      formatTime,
      handlePlayer1Timeout,
      handlePlayer2Timeout,
      timeLimitSeconds,
    ],
  );

  // Memoized valid rows calculation - logical positions (not display positions)
  const validRows = useMemo(
    () => (isPlayer1 ? [5, 6, 7] : [0, 1, 2]),
    [isPlayer1],
  );

  // Valid rows for display (considering board flip for player2)
  const validDisplayRows = useMemo(() => {
    if (!shouldFlipBoard) return validRows;
    return validRows.map((row) => flipRowForDisplay(row, shouldFlipBoard));
  }, [validRows, shouldFlipBoard]);

  // Memoized game actions
  const randomizeSetup = useCallback(() => {
    setSetupBoard(createEmptyBoard());
    setAvailablePieces([...INITIAL_PIECES]);

    const shuffledPieces = [...INITIAL_PIECES].sort(() => Math.random() - 0.5);
    const newBoard = createEmptyBoard();
    let pieceIndex = 0;

    for (const row of validRows) {
      for (let col = 0; col < BOARD_COLS; col++) {
        if (pieceIndex < shuffledPieces.length) {
          newBoard[row][col] = shuffledPieces[pieceIndex];
          pieceIndex++;
        }
      }
    }

    setSetupBoard(newBoard);
    setAvailablePieces([]);
    setSelectedPiece(null);
    setIsSwapMode(true);
    toast.success("Pieces placed at random.");
  }, [validRows]);

  const clearSetup = useCallback(() => {
    setSetupBoard(createEmptyBoard());
    setAvailablePieces([...INITIAL_PIECES]);
    setSelectedPiece(null);
    setSelectedSetupSquare(null);
    setIsSwapMode(false);
    toast.success("Board cleared.");
  }, []);

  const loadPresetSetup = useCallback(
    (pieces: { piece: string; row: number; col: number }[]) => {
      // Clear the board first
      const newBoard = createEmptyBoard();

      // Place the pieces from the preset
      for (const { piece, row, col } of pieces) {
        newBoard[row][col] = piece;
      }

      setSetupBoard(newBoard);
      setAvailablePieces([]);
      setSelectedPiece(null);
      setSelectedSetupSquare(null);
      setIsSwapMode(true);
      toast.success("Preset loaded.");
    },
    [],
  );

  const handleSurrender = useCallback(() => {
    surrenderGame({ gameId });
  }, [surrenderGame, gameId]);

  const handleAcknowledgeResult = useCallback(() => {
    acknowledgeGameResult({ gameId });
    // Clean up presence room when game is acknowledged as finished
    // Note: removeRoom is an internal function, cleanup happens automatically
  }, [acknowledgeGameResult, gameId]);

  const handleViewReplay = useCallback(
    (gameId: Id<"games">) => {
      // Acknowledge result and navigate to replay
      void handleAcknowledgeResult();
      setShowResultModal(false);
      // Use setTimeout to ensure modal closes before navigation
      setTimeout(() => {
        void navigate({ to: "/replay", search: { gameId: gameId as string } });
      }, 150);
    },
    [navigate, handleAcknowledgeResult],
  );

  const handleCheckBoard = useCallback(() => {
    // Just close the modal without acknowledging or navigating
    // User can view the final board state
    setShowResultModal(false);
  }, []);

  const handleReturnToLobby = useCallback(() => {
    // First acknowledge the result and close modal, then navigate
    void handleAcknowledgeResult();
    setShowResultModal(false);
    // Use setTimeout to ensure modal closes before navigation
    setTimeout(() => {
      onBackToLobby();
    }, 100);
  }, [handleAcknowledgeResult, onBackToLobby]);

  // Helper function to check if a square is highlighted - memoized
  const isSquareHighlighted = useCallback(
    (row: number, col: number) => {
      if (game?.lastMoveFrom && game?.lastMoveTo) {
        if (
          (game.lastMoveFrom.row === row && game.lastMoveFrom.col === col) ||
          (game.lastMoveTo.row === row && game.lastMoveTo.col === col)
        ) {
          return "last-move";
        }
      }

      if (
        selectedSquare &&
        selectedSquare.row === row &&
        selectedSquare.col === col
      ) {
        return "selected";
      }

      return null;
    },
    [game?.lastMoveFrom, game?.lastMoveTo, selectedSquare],
  );

  // Helper function to get arrow direction for moves - memoized
  const getArrowDirection = useCallback(
    (
      fromRow: number,
      fromCol: number,
      toRow: number,
      toCol: number,
      isFlipped: boolean = false,
    ) => {
      const rowDiff = toRow - fromRow;
      const colDiff = toCol - fromCol;

      // If board is flipped, reverse the row direction logic
      if (isFlipped) {
        if (rowDiff > 0) return ArrowUp; // Down becomes up when flipped
        if (rowDiff < 0) return ArrowDown; // Up becomes down when flipped
      } else {
        if (rowDiff > 0) return ArrowDown;
        if (rowDiff < 0) return ArrowUp;
      }

      // Column directions remain the same regardless of flip
      if (colDiff > 0) return ArrowRight;
      if (colDiff < 0) return ArrowLeft;

      return null;
    },
    [],
  );

  // Result modal state management
  useEffect(() => {
    if (
      game?.status === "finished" &&
      !gameFinished &&
      !hasAcknowledgedResult
    ) {
      setShowResultModal(true);
      setGameFinished(true);
    }
  }, [game?.status, gameFinished, hasAcknowledgedResult]);

  // Auto-select next piece optimization
  useEffect(() => {
    if (availablePieces.length === 0) {
      setIsSwapMode(true);
      setSelectedPiece(null);
    } else if (!selectedPiece && availablePieces.length > 0 && !isSwapMode) {
      setSelectedPiece(availablePieces[0]);
    }
  }, [selectedPiece, availablePieces, isSwapMode]);

  // Optimistic state cleanup
  useEffect(() => {
    if (game && optimisticBoard && !pendingMove) {
      setOptimisticBoard(null);
    }
  }, [game, optimisticBoard, pendingMove]);

  // Game result toast notification - separated for better performance
  useEffect(() => {
    if (game?.status === "finished" && !hasAcknowledgedResult) {
      // The result modal says who won (including draws), so no toast here.
      if (!gameFinished) {
        setShowResultModal(true);
        setGameFinished(true);
      }
    }
  }, [
    game?.status,
    game?.winner,
    isPlayer1,
    gameFinished,
    hasAcknowledgedResult,
  ]);

  // BGM management based on game status
  useEffect(() => {
    if (!game?.status) return;

    if (game.status === "setup") {
      playBGM("setup");
    } else if (game.status === "playing") {
      playBGM("battle");
    } else if (game.status === "finished") {
      // Game finished, resume main BGM
      playBGM("main");
    }
  }, [game?.status, playBGM]);

  // Cleanup: resume main BGM when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Only resume main BGM if we were playing setup or battle BGM
      // The Layout will handle playing main BGM for authenticated users
    };
  }, []);

  // Memoized setup square click handler
  const handleSetupSquareClick = useCallback(
    (logicalRow: number, logicalCol: number) => {
      if (!validRows.includes(logicalRow)) {
        toast.error("You can only place pieces in your area");
        return;
      }

      const currentPiece = setupBoard[logicalRow][logicalCol];

      if (isSwapMode || availablePieces.length === 0) {
        if (selectedSetupSquare) {
          const selectedPiece =
            setupBoard[selectedSetupSquare.row][selectedSetupSquare.col];

          if (
            selectedSetupSquare.row === logicalRow &&
            selectedSetupSquare.col === logicalCol
          ) {
            setSelectedSetupSquare(null);
            return;
          }

          const newBoard = setupBoard.map((r) => [...r]);
          newBoard[selectedSetupSquare.row][selectedSetupSquare.col] =
            currentPiece;
          newBoard[logicalRow][logicalCol] = selectedPiece;
          setSetupBoard(newBoard);
          setSelectedSetupSquare(null);
          return;
        }

        if (currentPiece) {
          setSelectedSetupSquare({ row: logicalRow, col: logicalCol });
          return;
        }

        if (isSwapMode) {
          toast.info("Click on a piece to select it for swapping");
          return;
        }
      }

      if (currentPiece) {
        toast.error(
          "Square is already occupied. Enable swap mode to move pieces.",
        );
        return;
      }

      if (!selectedPiece) {
        toast.error("Please select a piece to place");
        return;
      }

      const newBoard = setupBoard.map((r) => [...r]);
      newBoard[logicalRow][logicalCol] = selectedPiece;
      setSetupBoard(newBoard);

      const pieceIndex = availablePieces.indexOf(selectedPiece);
      const newAvailable = [...availablePieces];
      newAvailable.splice(pieceIndex, 1);
      setAvailablePieces(newAvailable);

      setSelectedPiece(null);
    },
    [
      validRows,
      setupBoard,
      isSwapMode,
      availablePieces,
      selectedSetupSquare,
      selectedPiece,
    ],
  );

  // Handler for display setup square clicks (converts display coordinates to logical)
  const handleDisplaySetupSquareClick = useCallback(
    (displayRow: number, displayCol: number) => {
      const logicalRow = flipRowForLogic(displayRow, shouldFlipBoard);
      handleSetupSquareClick(logicalRow, displayCol);
    },
    [shouldFlipBoard, handleSetupSquareClick],
  );

  const handleFinishSetup = useCallback(async () => {
    if (availablePieces.length > 0) {
      toast.error("Please place all pieces before finishing setup");
      return;
    }

    const pieces = [];
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        if (setupBoard[row][col]) {
          pieces.push({
            piece: setupBoard[row][col]!,
            row,
            col,
          });
        }
      }
    }

    setupPieces({ gameId, pieces });
  }, [availablePieces.length, setupBoard, setupPieces, gameId]);

  // Optimized game square click handler
  const handleGameSquareClick = useCallback(
    (row: number, col: number) => {
      if (
        !game ||
        game.status !== "playing" ||
        !isCurrentPlayer ||
        isMakingMove
      )
        return;

      if (selectedSquare) {
        if (selectedSquare.row === row && selectedSquare.col === col) {
          setSelectedSquare(null);
          return;
        }

        const isValidMove =
          Math.abs(selectedSquare.row - row) +
            Math.abs(selectedSquare.col - col) ===
          1;
        if (!isValidMove) {
          toast.error("Invalid move: pieces can only move to adjacent squares");
          setSelectedSquare(null);
          return;
        }

        const movingPiece = game.board[selectedSquare.row][selectedSquare.col];
        const targetPiece = game.board[row][col];

        if (
          targetPiece &&
          targetPiece.player === (isPlayer1 ? "player1" : "player2")
        ) {
          toast.error("Cannot move to a square occupied by your own piece");
          setSelectedSquare(null);
          return;
        }

        setPendingMove({
          fromRow: selectedSquare.row,
          fromCol: selectedSquare.col,
          toRow: row,
          toCol: col,
        });

        const fromSquare = selectedSquare;
        setSelectedSquare(null);

        // Create optimistic board update
        const newBoard = game.board.map((r) => [...r]);
        newBoard[row][col] = movingPiece;
        newBoard[fromSquare.row][fromSquare.col] = null;
        setOptimisticBoard(newBoard);

        // Play piece-move SFX when a piece is moved
        playSFX("piece-move");

        // Make the move immediately
        makeMove({
          gameId,
          fromRow: fromSquare.row,
          fromCol: fromSquare.col,
          toRow: row,
          toCol: col,
        });
      } else {
        const boardToUse = optimisticBoard || game.board;
        const piece = boardToUse[row][col];
        if (piece && piece.player === (isPlayer1 ? "player1" : "player2")) {
          setSelectedSquare({ row, col });
        }
      }
    },
    [
      game,
      isCurrentPlayer,
      isMakingMove,
      selectedSquare,
      isPlayer1,
      optimisticBoard,
      makeMove,
      gameId,
      playSFX,
    ],
  );

  const handleSetupTimeout = useCallback(() => {
    toast.error("Setup time ran out. Your pieces were placed at random.");
    randomizeSetup();
    setTimeout(() => {
      void handleFinishSetup();
    }, 1000);
  }, [randomizeSetup, handleFinishSetup]);

  // Memoized board data for performance
  const boardData = useMemo(() => {
    return optimisticBoard || game?.board;
  }, [optimisticBoard, game?.board]);

  // Memoized display board data (flipped for player2)
  const displayBoardData = useMemo(() => {
    if (!boardData) return null;
    return flipBoardForDisplay(boardData, shouldFlipBoard);
  }, [boardData, shouldFlipBoard]);

  // Memoized display setup board data (flipped for player2)
  const displaySetupBoard = useMemo(() => {
    return flipBoardForDisplay(setupBoard, shouldFlipBoard);
  }, [setupBoard, shouldFlipBoard]);

  // Memoized board squares rendering
  const renderBoardSquares = useMemo(() => {
    if (!displayBoardData) return null;

    return displayBoardData.map((row, displayRowIndex) =>
      row.map((cell, colIndex) => {
        // Convert display coordinates to logical coordinates for game logic
        const logicalRowIndex = flipRowForLogic(
          displayRowIndex,
          shouldFlipBoard,
        );

        const isSelected =
          selectedSquare?.row === logicalRowIndex &&
          selectedSquare?.col === colIndex;
        const isValidMove =
          selectedSquare &&
          Math.abs(selectedSquare.row - logicalRowIndex) +
            Math.abs(selectedSquare.col - colIndex) ===
            1 &&
          cell?.player !== (isPlayer1 ? "player1" : "player2");
        const highlightType = isSquareHighlighted(logicalRowIndex, colIndex);
        const isPendingMove =
          pendingMove &&
          ((pendingMove.fromRow === logicalRowIndex &&
            pendingMove.fromCol === colIndex) ||
            (pendingMove.toRow === logicalRowIndex &&
              pendingMove.toCol === colIndex));

        const isPendingFromPosition =
          pendingMove &&
          pendingMove.fromRow === logicalRowIndex &&
          pendingMove.fromCol === colIndex;

        const isLastMoveFrom =
          game?.lastMoveFrom &&
          game.lastMoveFrom.row === logicalRowIndex &&
          game.lastMoveFrom.col === colIndex;

        const ArrowComponent =
          isLastMoveFrom && game?.lastMoveFrom && game?.lastMoveTo
            ? getArrowDirection(
                game.lastMoveFrom.row,
                game.lastMoveFrom.col,
                game.lastMoveTo.row,
                game.lastMoveTo.col,
                shouldFlipBoard,
              )
            : null;

        return (
          <BoardSquare
            key={`${displayRowIndex}-${colIndex}`}
            row={logicalRowIndex}
            col={colIndex}
            cell={cell}
            isSelected={isSelected}
            isValidMove={!!isValidMove}
            highlightType={highlightType}
            isPendingMove={!!isPendingMove}
            isPendingFromPosition={!!isPendingFromPosition}
            isLastMoveFrom={!!isLastMoveFrom}
            isCurrentPlayer={isCurrentPlayer}
            ArrowComponent={ArrowComponent}
            onClick={(row, col) => handleGameSquareClick(row, col)}
          />
        );
      }),
    );
  }, [
    displayBoardData,
    shouldFlipBoard,
    selectedSquare,
    pendingMove,
    game?.lastMoveFrom,
    game?.lastMoveTo,
    isCurrentPlayer,
    isPlayer1,
    isSquareHighlighted,
    getArrowDirection,
    handleGameSquareClick,
  ]);

  // If not part of the game, show toast and redirect to lobby
  // if (!game) {
  //   toast.error("You are not part of this game");
  //   onBackToLobby();
  //   return null;
  // }

  if (isLoadingGame) {
    // Same shape as the live game: status, two player bars, the board.
    return (
      <div
        className="mx-auto w-full max-w-[600px] space-y-2 sm:space-y-3"
        aria-busy="true"
      >
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-[58px] w-full rounded-lg" />
        <div className="-mx-4 grid grid-cols-9 border-y border-border bg-card sm:mx-0 sm:gap-1 sm:rounded-lg sm:border sm:p-2">
          {Array.from({ length: BOARD_ROWS * BOARD_COLS }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-square rounded-none sm:rounded-md"
            />
          ))}
        </div>
        <Skeleton className="h-[58px] w-full rounded-lg" />
        <span className="sr-only">Loading game</span>
      </div>
    );
  }

  // show message that the game might not exist or not a player of it
  if (!game) {
    return (
      <motion.div
        {...riseIn}
        className="mx-auto flex min-h-[50vh] w-full max-w-md items-center px-0"
      >
        <Card className="w-full p-6 text-center sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Game not found
          </h1>
          <p className="mt-2 text-sm text-foreground/80">
            This game doesn't exist, or you're not one of its players.
          </p>
          <Button onClick={onBackToLobby} className="mt-6 w-full" size="lg">
            <ArrowLeft />
            Back to lobbies
          </Button>
        </Card>
      </motion.div>
    );
  }

  const myKey = isPlayer2 ? "player2" : "player1";
  const myTone = PLAYER_TONE[myKey];
  const opponentName = isPlayer1 ? game.player2Username : game.player1Username;
  const copyGameId = () => {
    void navigator.clipboard.writeText(gameId);
    toast.success("Game ID copied");
  };

  if (game.status === "setup") {
    const needsSetup =
      (isPlayer1 && !game.player1Setup) || (isPlayer2 && !game.player2Setup);
    const setupTimeUsed = game.setupTimeStarted
      ? Math.floor((Date.now() - game.setupTimeStarted) / 1000)
      : 0;

    if (!needsSetup) {
      const myProfile = isPlayer1 ? player1Profile : player2Profile;
      const theirProfile = isPlayer1 ? player2Profile : player1Profile;
      return (
        <>
          <motion.div
            {...riseIn}
            className="mx-auto w-full max-w-md py-4 sm:py-10"
          >
            <Card className="p-5 sm:p-6">
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Waiting for your opponent
              </h1>
              <p className="mt-2 text-sm text-foreground/80">
                Your pieces are placed. The game starts when {opponentName}{" "}
                finishes setup. If they run out of time, you win.
              </p>

              <ul className="mt-5 divide-y divide-border border-y border-border">
                <li className="flex items-center gap-3 py-3">
                  <UserAvatar
                    username={profile.username}
                    avatarUrl={myProfile?.avatarUrl}
                    size="sm"
                    noRing
                    className={`border-2 ${myTone.ring}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {profile.username}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                    <Check className="h-4 w-4" />
                    Ready
                  </span>
                </li>
                <li className="flex items-center gap-3 py-3">
                  <UserAvatar
                    username={opponentName}
                    avatarUrl={theirProfile?.avatarUrl}
                    size="sm"
                    noRing
                    className={`border-2 ${PLAYER_TONE[isPlayer1 ? "player2" : "player1"].ring}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {opponentName}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-foreground/80">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-gold-400" />
                    Setting up
                  </span>
                </li>
              </ul>

              <div className="mt-5">
                <Timer
                  duration={300} // 5 minutes for setup
                  onTimeout={() => {}} // No-op for the waiting player, server handles it
                  label="Their setup time"
                  variant="setup"
                  isActive={true}
                  timeUsed={setupTimeUsed}
                  turnStartTime={game.setupTimeStarted}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={copyGameId}>
                  <Copy />
                  Copy game ID
                </Button>
                <Button variant="ghost" onClick={onBackToLobby}>
                  Back to lobbies
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Achievement Notifications */}
          <AchievementNotification userId={profile.userId} />
        </>
      );
    }

    // Group the remaining pieces by name so six Privates are one tile with a count.
    const pieceGroups: { piece: string; count: number }[] = [];
    for (const piece of availablePieces) {
      const group = pieceGroups.find((g) => g.piece === piece);
      if (group) group.count += 1;
      else pieceGroups.push({ piece, count: 1 });
    }
    const placedAll = availablePieces.length === 0;

    return (
      <>
        {presenceSession}
        <motion.div {...riseIn} className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold leading-tight text-foreground sm:text-4xl">
                Set up your army
              </h1>
              <p className="mt-1 text-sm text-foreground/80 sm:text-base">
                Place all 21 pieces in your three rows. Your opponent can't see
                them.
              </p>
            </div>
            <div className="flex items-stretch gap-2 sm:w-auto">
              <div className="min-w-0 flex-1 sm:w-56 sm:flex-none">
                <Timer
                  duration={300} // 5 minutes for setup
                  onTimeout={handleSetupTimeout}
                  label="Setup time"
                  variant="setup"
                  isActive={needsSetup}
                  timeUsed={setupTimeUsed}
                  turnStartTime={game.setupTimeStarted}
                />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" className="h-auto">
                    <ArrowLeft />
                    <span className="hidden sm:inline">Back to lobbies</span>
                    <span className="sm:hidden">Back</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave setup?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your game stays open and the setup timer keeps running. If
                      it runs out before you finish, you lose the game.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Stay and set up</AlertDialogCancel>
                    <AlertDialogAction onClick={onBackToLobby}>
                      Back to lobbies
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:items-start">
            {/* Board */}
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Button
                  onClick={randomizeSetup}
                  variant="secondary"
                  data-testid="setup-randomize"
                >
                  <Shuffle />
                  Randomize
                </Button>
                <Button onClick={clearSetup} variant="secondary">
                  <Eraser />
                  Clear
                </Button>
                {/* Hide the swap toggle once swapping is the only thing left to do */}
                {(availablePieces.length > 0 ||
                  (availablePieces.length === 0 && !isSwapMode)) && (
                  <Button
                    onClick={() => setIsSwapMode(!isSwapMode)}
                    variant="secondary"
                    aria-pressed={isSwapMode}
                    className={
                      isSwapMode
                        ? "border-gold-500/50 bg-gold-500/15 text-gold-200 hover:bg-gold-500/20"
                        : ""
                    }
                  >
                    <ArrowRightLeft />
                    {isSwapMode ? "Swapping" : "Swap"}
                  </Button>
                )}
              </div>
              <p className="mb-2 text-sm text-foreground/80" aria-live="polite">
                {placedAll
                  ? "Tap one piece, then another, to swap them."
                  : isSwapMode
                    ? "Swap is on. Tap a piece on the board, then another."
                    : "Pick a piece below, then tap a gold square."}
              </p>

              <div
                data-testid="setup-board"
                className="-mx-4 grid grid-cols-9 border-y border-border bg-card sm:mx-0 sm:gap-1 sm:rounded-lg sm:border sm:p-2"
              >
                {displaySetupBoard.map((row, displayRowIndex) =>
                  row.map((cell, colIndex) => {
                    const isValidArea =
                      validDisplayRows.includes(displayRowIndex);
                    // Convert selected square logical coordinates to display coordinates for comparison
                    const selectedDisplayRow = selectedSetupSquare
                      ? flipRowForDisplay(
                          selectedSetupSquare.row,
                          shouldFlipBoard,
                        )
                      : -1;
                    const isSelected =
                      selectedDisplayRow === displayRowIndex &&
                      selectedSetupSquare?.col === colIndex;

                    return (
                      <button
                        type="button"
                        key={`${displayRowIndex}-${colIndex}`}
                        aria-label={
                          cell
                            ? cell
                            : isValidArea
                              ? "Empty square in your area"
                              : "Opponent's area"
                        }
                        aria-pressed={isSelected}
                        onClick={() =>
                          handleDisplaySetupSquareClick(
                            displayRowIndex,
                            colIndex,
                          )
                        }
                        className={`relative flex aspect-square items-center justify-center border text-foreground transition-colors duration-150 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/80 sm:rounded-md ${
                          !isValidArea
                            ? "cursor-default border-white/[0.05] bg-transparent"
                            : cell
                              ? `${myTone.tile} cursor-pointer`
                              : "cursor-pointer border-gold-500/30 bg-gold-500/[0.07] [@media(hover:hover)]:hover:bg-gold-500/[0.15]"
                        } ${isSelected ? "z-10 ring-2 ring-inset ring-gold-400 !bg-gold-500/20" : ""}`}
                      >
                        {cell && (
                          <div className={myTone.text}>
                            <div className="block sm:hidden">
                              {getPieceDisplay(cell, {
                                showLabel: false,
                                size: "small",
                              })}
                            </div>
                            <div className="hidden sm:block">
                              {getPieceDisplay(cell, {
                                showLabel: true,
                                size: "medium",
                              })}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>

            {/* Tray, finish, presets, legend */}
            <div className="min-w-0 space-y-4">
              <Card className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-base font-semibold text-foreground">
                    Pieces to place
                  </h2>
                  <span className="text-sm text-foreground/80">
                    <span className="tabular-nums">
                      {availablePieces.length}
                    </span>{" "}
                    left
                  </span>
                </div>

                {placedAll ? (
                  <p className="mt-2 text-sm text-foreground/80">
                    All pieces are placed. Check your setup, then finish.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-foreground/80">
                      Placing:{" "}
                      <span className="font-medium text-foreground">
                        {selectedPiece ?? "none selected"}
                      </span>
                    </p>
                    <motion.div
                      variants={stagger(0.02)}
                      initial="hidden"
                      animate="show"
                      className="mt-3 grid grid-cols-5 gap-2 lg:grid-cols-4"
                    >
                      {pieceGroups.map(({ piece, count }) => (
                        <motion.button
                          type="button"
                          variants={fadeUp}
                          key={piece}
                          onClick={() => setSelectedPiece(piece)}
                          aria-pressed={selectedPiece === piece}
                          aria-label={`${piece}, ${count} left`}
                          className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-md border px-1 py-2 text-foreground transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 ${
                            selectedPiece === piece
                              ? "border-gold-400 bg-gold-500/15"
                              : "border-border bg-white/[0.03] [@media(hover:hover)]:hover:bg-white/[0.08]"
                          }`}
                        >
                          <span className={myTone.text}>
                            {getPieceDisplay(piece, {
                              showLabel: false,
                              size: "small",
                            })}
                          </span>
                          <span className="w-full truncate text-center text-[11px] leading-tight text-foreground/90">
                            {SHORT_NAMES[piece] ?? piece}
                          </span>
                          {count > 1 && (
                            <span className="absolute right-1 top-0.5 text-[11px] tabular-nums text-gold-300">
                              {count}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  </>
                )}
              </Card>

              <Button
                onClick={() => void handleFinishSetup()}
                disabled={!placedAll || isSettingUpPieces}
                className="w-full"
                size="lg"
                data-testid="setup-finish"
              >
                {isSettingUpPieces ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Placing your army
                  </>
                ) : placedAll ? (
                  <>
                    <Check />
                    Finish setup
                  </>
                ) : (
                  `Place ${availablePieces.length} more ${
                    availablePieces.length === 1 ? "piece" : "pieces"
                  }`
                )}
              </Button>

              <SetupPresets
                currentSetup={displaySetupBoard}
                onLoadPreset={loadPresetSetup}
                shouldFlipBoard={shouldFlipBoard}
              />

              <PieceLegend />
            </div>
          </div>
        </motion.div>

        {/* Achievement Notifications */}
        <AchievementNotification userId={profile.userId} />
      </>
    );
  }

  const isPlaying = game.status === "playing";
  const isFinished = game.status === "finished";
  const oppKey = myKey === "player1" ? "player2" : "player1";
  const gameModeBadge = getGameModeBadge(game.gameMode);
  const barProps = (key: "player1" | "player2") => {
    const username =
      key === "player1" ? game.player1Username : game.player2Username;
    return {
      side: key,
      username,
      profile: key === "player1" ? player1Profile : player2Profile,
      presence: getPlayerPresence(username) as Presence,
      forfeitRemaining: getDisconnectForfeitTime(
        key === "player1"
          ? game.player1DisconnectedAt
          : game.player2DisconnectedAt,
      ),
      time: getPlayerTime(key === "player1"),
      isTurn: isPlaying && game.currentTurn === key,
      isWinner: isFinished && game.winner === key,
      isYou: key === myKey,
      formatTime,
    };
  };
  const oppBar = barProps(oppKey);
  const myBar = barProps(myKey);
  const isMyTurn = isPlaying && isCurrentPlayer;

  return (
    <>
      {presenceSession}
      <motion.div
        {...riseIn}
        className="mx-auto grid max-w-5xl gap-4 sm:gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:items-start"
      >
        <div className="min-w-0 space-y-2 sm:space-y-3">
          {/* Status strip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              data-testid="turn-indicator"
              data-mine={isMyTurn}
              role="status"
              className={`inline-flex max-w-full items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium ${
                isMyTurn
                  ? "border-gold-500/40 bg-gold-500/10 text-gold-200"
                  : "border-border bg-white/[0.03] text-foreground"
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isMyTurn ? "bg-gold-400" : "bg-foreground/40"
                }`}
              />
              <span className="truncate">
                {isFinished
                  ? "Game over"
                  : isMyTurn
                    ? "Your turn"
                    : `${opponentName}'s turn`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-foreground/80">
              <Badge variant="outline">
                {gameModeBadge.icon}
                {gameModeBadge.label}
              </Badge>
              {isPlaying && (
                <span>
                  Turn{" "}
                  <span className="tabular-nums">
                    {Math.floor((game.moveCount || 0) / 2 + 1)}
                  </span>
                </span>
              )}
            </div>
          </div>

          <PlayerBar {...oppBar} />

          {/* Board */}
          <div
            ref={boardRef}
            data-testid="game-board"
            className={`relative -mx-4 grid grid-cols-9 border-y bg-card transition-colors duration-300 sm:mx-0 sm:gap-1 sm:rounded-lg sm:border sm:p-2 ${
              isMyTurn ? "border-gold-500/50" : "border-border"
            } ${isMakingMove ? "pointer-events-none" : ""}`}
          >
            <AnimatePresence>
              {isMakingMove && (
                <motion.div
                  className="pointer-events-none absolute inset-x-0 top-1/2 z-50 flex -translate-y-1/2 justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2 rounded-md border border-border-strong bg-card px-3 py-1.5 text-sm text-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
                    Sending move
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {renderBoardSquares}
          </div>

          <PlayerBar {...myBar} />

          <div className="flex items-center justify-between gap-2 pt-1">
            <Button variant="ghost" onClick={copyGameId}>
              <Copy />
              Copy game ID
            </Button>

            {isPlaying && (isPlayer1 || isPlayer2) && (
              <AlertDialog
                open={showSurrenderDialog}
                onOpenChange={setShowSurrenderDialog}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isSurrendering}>
                    {isSurrendering ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Surrendering
                      </>
                    ) : (
                      <>
                        <Flag />
                        Surrender
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Surrender this game?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Surrendering counts as a loss and ends the game now. You
                      can't undo it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep playing</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleSurrender()}
                      disabled={isSurrendering}
                      className="border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                    >
                      <Flag />
                      Surrender and lose
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Lost pieces and ranks */}
        <div className="min-w-0 space-y-4">
          {eliminatedPieces.length > 0 && (
            <Card>
              <h2 className="px-4 pt-4 text-base font-semibold text-foreground">
                Your lost pieces
              </h2>
              <ul className="max-h-60 overflow-y-auto px-4 pb-2 pt-1">
                {eliminatedPieces.map((eliminated, index) => (
                  <li
                    key={`${eliminated.piece}-${eliminated.moveNumber}-${index}`}
                    className="flex items-center gap-3 border-b border-border py-2 last:border-b-0"
                  >
                    <span className={`flex w-8 justify-center ${myTone.text}`}>
                      {getPieceDisplay(eliminated.piece, { size: "small" })}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        {eliminated.piece}
                      </p>
                      <p className="text-xs text-foreground/70">
                        {eliminated.battleOutcome === "attacker" &&
                          "Attacker won"}
                        {eliminated.battleOutcome === "defender" &&
                          "Defender won"}
                        {eliminated.battleOutcome === "tie" &&
                          "Tie, both removed"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-foreground/70">
                      Move{" "}
                      <span className="tabular-nums">
                        {eliminated.moveNumber}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <PieceLegend />
        </div>
      </motion.div>

      {/* Achievement Notifications */}
      <AchievementNotification userId={profile.userId} />

      {/* Game Result Modal */}
      {game.status === "finished" && matchResult && !hasAcknowledgedResult && (
        <GameResultModal
          result={{
            winner: (matchResult.winner || "draw") as
              | "player1"
              | "player2"
              | "draw",
            reason: matchResult.reason,
            duration: matchResult.duration,
            moves: matchResult.moves,
            player1Username: matchResult.player1Username,
            player2Username: matchResult.player2Username,
          }}
          profile={profile}
          isPlayer1={isPlayer1}
          isOpen={showResultModal}
          onClose={() => {
            // Ensure modal closes and doesn't reopen
            void handleAcknowledgeResult();
            setShowResultModal(false);
          }}
          onCheckBoard={handleCheckBoard}
          onReturnToLobby={handleReturnToLobby}
          gameId={gameId}
          onViewReplay={handleViewReplay}
          player1Profile={player1Profile}
          player2Profile={player2Profile}
        />
      )}
    </>
  );
});

GameBoard.displayName = "GameBoard";

export { GameBoard };
