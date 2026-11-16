import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import {
  useConvexQueryWithOptions,
  useConvexQuery,
} from "@/lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { PageHeader, SectionHeader } from "../../components/ui/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { cn } from "../../lib/utils";
import { easeOut, fadeUp, riseIn, stagger } from "../../lib/motion";
import {
  Insignia,
  Painting,
  type Crop,
  type PlayerRank,
} from "../../components/season/art";
import { AIGameBoard } from "../../components/ai-game/AIGameBoard";
import { UpgradeDonationCTA } from "../../components/subscription/UpgradeDonationCTA";

type Difficulty = "easy" | "medium" | "hard";
type Behavior = "aggressive" | "defensive" | "passive" | "balanced";

const difficultyConfig: Record<
  Difficulty,
  { label: string; description: string; rank: PlayerRank; portrait: Crop }
> = {
  easy: {
    label: "Recruit",
    description: "Moves at random. Good for learning the pieces.",
    rank: "Private",
    portrait: "recruit",
  },
  medium: {
    label: "Veteran",
    description: "Plays a balanced game and plans a few moves ahead.",
    rank: "Captain",
    portrait: "veteran",
  },
  hard: {
    label: "Commander",
    description: "Predicts your moves and attacks on the flanks.",
    rank: "General",
    portrait: "commander",
  },
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const behaviorConfig: Record<Behavior, { label: string; description: string }> =
  {
    balanced: {
      label: "Balanced",
      description: "Mixes attack and defence.",
    },
    aggressive: {
      label: "Aggressive",
      description: "Goes after your pieces first.",
    },
    defensive: {
      label: "Defensive",
      description: "Protects its own pieces first.",
    },
    passive: {
      label: "Passive",
      description: "Advances slowly and avoids fights.",
    },
  };

const rules = [
  "Capture the enemy flag to win.",
  "Or reach the far row with your own flag.",
  "A higher rank captures a lower rank.",
  "The Spy captures any General.",
];

export function AIGamePage() {
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>("medium");
  const [selectedBehavior, setSelectedBehavior] =
    useState<Behavior>("balanced");
  const [isStarting, setIsStarting] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [confirmQuitOpen, setConfirmQuitOpen] = useState(false);
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

  const accessFor = (d: Difficulty) =>
    d === "easy" ? easyAccess : d === "medium" ? mediumAccess : hardAccess;

  // If the user has access to Commander they are on Pro or Pro+. This is our
  // reliable check for "is Pro?" without inspecting the profile directly.
  const isPro = hardAccess?.hasAccess === true;

  const selectedAccess = accessFor(selectedDifficulty);
  const isDifficultyLocked = !!selectedAccess && !selectedAccess.hasAccess;
  const isExpired = selectedAccess?.reason === "subscription_expired";
  const isBehaviorLocked = selectedBehavior !== "balanced" && !isPro;
  const needsUpgrade = isDifficultyLocked || isBehaviorLocked;

  const goToUpgrade = () => {
    if (isDifficultyLocked && isExpired) {
      navigate({ to: "/subscription", search: { subscription: undefined } });
    } else {
      navigate({ to: "/pricing", search: { donation: undefined } });
    }
  };

  const handleStartGame = () => {
    if (!profile) return;

    const difficultyLabel = difficultyConfig[selectedDifficulty].label;

    if (isDifficultyLocked) {
      if (isExpired) {
        toast.error(`Renew your subscription to play ${difficultyLabel}.`);
        navigate({ to: "/subscription", search: { subscription: undefined } });
      } else {
        toast.error(`${difficultyLabel} needs Pro.`);
        navigate({ to: "/pricing", search: { donation: undefined } });
      }
      return;
    }

    // Only the Balanced style is free.
    if (isBehaviorLocked) {
      toast.error(`${behaviorConfig[selectedBehavior].label} style needs Pro.`);
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
        toast.error("Could not start the game. Try again.");
      })
      .finally(() => {
        setIsStarting(false);
      });
  };

  const handleQuitGame = () => {
    if (!currentSession || isQuitting) return;
    setIsQuitting(true);
    cleanupSession({ sessionId: currentSession.sessionId })
      .catch((error) => {
        console.error("Failed to quit game:", error);
        toast.error("Could not quit the game. Try again.");
      })
      .finally(() => {
        setIsQuitting(false);
        setConfirmQuitOpen(false);
      });
  };

  // --------------------------------------------------------------------------
  // Active game
  // --------------------------------------------------------------------------
  if (
    currentSession &&
    (currentSession.status === "setup" ||
      currentSession.status === "playing" ||
      currentSession.status === "finished")
  ) {
    const isPlaying = currentSession.status === "playing";
    const isPlayerTurn = currentSession.currentTurn === "player1";
    const sessionDifficulty =
      difficultyConfig[currentSession.difficulty as Difficulty]?.label ??
      currentSession.difficulty;
    const sessionBehavior =
      behaviorConfig[currentSession.behavior as Behavior]?.label ??
      currentSession.behavior;

    const turnLabel =
      currentSession.status === "setup"
        ? "Place your pieces"
        : currentSession.status === "finished"
          ? "Game over"
          : isPlayerTurn
            ? "Your turn"
            : "AI is thinking";

    return (
      <>
        <div className="mx-auto max-w-5xl">
          <PageHeader
            title="Playing the AI"
            actions={
              <>
                <Badge variant="outline">{sessionDifficulty}</Badge>
                <Badge variant="outline">{sessionBehavior}</Badge>
                <Button
                  variant="secondary"
                  onClick={() =>
                    isPlaying ? setConfirmQuitOpen(true) : handleQuitGame()
                  }
                  disabled={isQuitting}
                >
                  {isQuitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Leaving
                    </>
                  ) : isPlaying ? (
                    "Quit game"
                  ) : (
                    "Leave game"
                  )}
                </Button>
              </>
            }
          />

          <div className="mb-4 flex min-h-10 items-center justify-between gap-3">
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
                isPlaying && isPlayerTurn
                  ? "border-gold-500/30 bg-gold-500/10 text-gold-400"
                  : "border-border bg-card text-foreground",
              )}
            >
              {isPlaying && !isPlayerTurn ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {turnLabel}
            </div>

            {/* Dev tools */}
            {import.meta.env.DEV && isPlaying && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRevealAIPieces(!revealAIPieces)}
              >
                {revealAIPieces ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
                {revealAIPieces ? "Hide AI pieces" : "Show AI pieces"}
              </Button>
            )}
          </div>

          <AIGameBoard
            sessionId={currentSession.sessionId}
            revealAIPieces={revealAIPieces}
          />
        </div>

        <AlertDialog open={confirmQuitOpen} onOpenChange={setConfirmQuitOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Quit this game?</AlertDialogTitle>
              <AlertDialogDescription>
                The game ends and nothing is saved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep playing</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleQuitGame();
                }}
                disabled={isQuitting}
              >
                {isQuitting ? "Quitting" : "Quit game"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // --------------------------------------------------------------------------
  // Pick an opponent
  // --------------------------------------------------------------------------
  const startLabel = needsUpgrade
    ? isDifficultyLocked && isExpired
      ? "Renew subscription"
      : "See Pro plans"
    : "Start game";

  const lockedMessage = isDifficultyLocked
    ? isExpired
      ? `Your subscription expired. Renew it to play ${difficultyConfig[selectedDifficulty].label}.`
      : `${difficultyConfig[selectedDifficulty].label} unlocks with Pro.`
    : isBehaviorLocked
      ? `${behaviorConfig[selectedBehavior].label} style unlocks with Pro.`
      : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.header {...riseIn} className="space-y-2">
        <h1 className="font-display text-4xl font-bold leading-none tracking-[-0.03em] text-foreground sm:text-7xl">
          Pick your opponent
        </h1>
        <p className="text-base text-foreground/90">
          Then choose how it plays and place your pieces.
        </p>
      </motion.header>

      {/* Opponents: three portraits, the picked one opens wide */}
      <motion.div
        role="radiogroup"
        aria-label="Opponent"
        variants={stagger(0.08)}
        initial="hidden"
        animate="show"
        className="flex h-[340px] gap-2 sm:h-[460px] sm:gap-3"
      >
        {DIFFICULTIES.map((key) => {
          const config = difficultyConfig[key];
          const access = accessFor(key);
          const isLocked = !!access && !access.hasAccess;
          const isSelected = selectedDifficulty === key;

          return (
            <motion.button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${config.label}${isLocked ? ", needs Pro" : ""}. ${config.description}`}
              variants={fadeUp}
              onClick={() => setSelectedDifficulty(key)}
              animate={{ flexGrow: isSelected ? 2.6 : 1 }}
              transition={{ duration: 0.45, ease: easeOut }}
              style={{ flexBasis: 0 }}
              className={cn(
                "group relative min-w-0 overflow-hidden rounded-lg border text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected
                  ? "border-gold-500/70"
                  : "border-border hover:border-border-strong",
              )}
            >
              <Painting
                crop={config.portrait}
                fade="bottom"
                className="absolute inset-0"
              />
              {/* Opponents you didn't pick wait in shadow; hover lifts it */}
              <div
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 bg-black transition-opacity duration-300",
                  isSelected ? "opacity-0" : "opacity-55 group-hover:opacity-35",
                )}
              />

              <div
                className={cn(
                  "absolute left-3 top-3 text-[#f3ead8] sm:left-5 sm:top-5",
                  !isSelected && isLocked && "hidden sm:block",
                )}
              >
                <Insignia rank={config.rank} className="h-5 drop-shadow sm:h-8" />
              </div>
              {isLocked && (
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded border border-white/30 bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-white sm:right-5 sm:top-5">
                  <Lock className="size-3" />
                  <span className={cn(!isSelected && "hidden sm:inline")}>Pro</span>
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-6">
                <div
                  className={cn(
                    "font-bold leading-none tracking-[-0.03em] text-white",
                    isSelected
                      ? "text-2xl min-[420px]:text-3xl sm:text-6xl lg:text-7xl"
                      : "rotate-180 text-lg [writing-mode:vertical-rl] sm:rotate-0 sm:text-4xl sm:[writing-mode:horizontal-tb]",
                  )}
                >
                  {config.label}
                </div>
                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: 0.15, ease: easeOut }}
                      className="mt-2 max-w-sm sm:mt-3"
                    >
                      <p className="text-sm text-white/90 sm:text-base">
                        {config.description}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/80 sm:text-sm">
                        <Insignia rank={config.rank} className="h-3 sm:h-3.5" />
                        {config.rank}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Style */}
      <section className="space-y-3">
        <SectionHeader
          title="Playing style"
          description="How the AI chooses its moves. Only Balanced is free."
        />
        <motion.div
          role="radiogroup"
          aria-label="AI playing style"
          variants={stagger(0.04, 0.15)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-2 lg:grid-cols-4"
        >
          {(Object.keys(behaviorConfig) as Behavior[]).map((key) => {
            const config = behaviorConfig[key];
            const isSelected = selectedBehavior === key;
            const isLocked = key !== "balanced" && !isPro;

            return (
              <motion.button
                key={key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                variants={fadeUp}
                onClick={() => setSelectedBehavior(key)}
                className={cn(
                  "flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-md border px-3 py-2.5 text-left transition-colors active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                  isSelected
                    ? "border-gold-500/60 bg-gold-500/10"
                    : "border-border bg-card hover:border-border-strong hover:bg-raised",
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold text-foreground",
                      isSelected && "text-gold-300",
                    )}
                  >
                    {config.label}
                  </span>
                  {isLocked ? (
                    <Lock
                      className="size-3.5 shrink-0 text-foreground/70"
                      aria-label="Needs Pro"
                    />
                  ) : isSelected ? (
                    <Check className="size-4 shrink-0 text-gold-300" />
                  ) : null}
                </span>
                <span className="text-xs text-foreground/80 sm:text-sm">
                  {config.description}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      {/* Summary and start */}
      <motion.div
        {...riseIn}
        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-foreground">
            {difficultyConfig[selectedDifficulty].label} ·{" "}
            {behaviorConfig[selectedBehavior].label}
          </p>
          <p role="status" className="text-foreground/90">
            {lockedMessage ?? "Place your pieces, then the game starts."}
          </p>
        </div>
        <Button
          size="lg"
          className="h-12 w-full shrink-0 text-base sm:w-56"
          onClick={needsUpgrade ? goToUpgrade : handleStartGame}
          disabled={isStarting || !profile}
        >
          {isStarting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Starting
            </>
          ) : (
            startLabel
          )}
        </Button>
      </motion.div>

      <section className="rounded-lg border border-border p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-foreground">How to win</h2>
        <ul className="mt-2 grid gap-1 text-sm text-foreground/90 sm:grid-cols-2">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
      <UpgradeDonationCTA />
    </div>
  );
}
