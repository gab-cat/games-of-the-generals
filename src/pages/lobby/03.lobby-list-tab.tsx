import { useState, useEffect, useRef } from "react";
import {
  useConvexMutationWithQuery,
  useConvexQuery,
} from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { LobbyCard } from "./LobbyCard";
import { friendlyError } from "./friendly-error";
import { LobbyHeader } from "./01.lobby-header";
import { LobbyTabs, type LobbyTab } from "./02.lobby-tabs";
import {
  BoutSkeleton,
  EmptyBout,
  ListErrorBoundary,
  type Opponent,
} from "./fight-card";
import { motion } from "framer-motion";
import { stagger } from "../../lib/motion";
import {
  Plus,
  Check,
  Copy,
  Key,
  Shuffle,
  Zap,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { GameStartCountdownModal } from "../../components/GameStartCountdownModal";
import {
  GameModeSelector,
  type GameMode,
} from "../../components/GameModeSelector";
import generateName from "@scaleway/random-name";
import { useQuery } from "convex-helpers/react/cache";
import { useNavigate } from "@tanstack/react-router";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
  elo?: number;
  avatarUrl?: string;
  avatarFrame?: string;
}

interface LobbyListTabProps {
  profile: Profile;
  activeTab: LobbyTab;
  onTabChange: (tab: LobbyTab) => void;
  /** The live games list, shown under the Watch tab. */
  watch: React.ReactNode;
  onGameStart?: (gameId: string) => void;
  startGameMutation: any;
  onOpenMessaging?: (lobbyId?: Id<"lobbies">) => void;
}

const LOBBIES_PER_PAGE = 10;

export function LobbyListTab({
  profile,
  activeTab,
  onTabChange,
  watch,
  onGameStart: _onGameStart,
  startGameMutation,
  onOpenMessaging,
}: LobbyListTabProps) {
  const navigate = useNavigate();
  const [showCreateLobby, setShowCreateLobby] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [lobbyName, setLobbyName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [maxSpectators, setMaxSpectators] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Subscription queries
  const { data: privateLobbyLimit } = useConvexQuery(
    api.featureGating.checkPrivateLobbyLimit,
    {},
  );
  const [gameStartData, setGameStartData] = useState<{
    isOpen: boolean;
    player1Username: string;
    player2Username: string;
    currentUsername: string;
  }>({
    isOpen: false,
    player1Username: "",
    player2Username: "",
    currentUsername: "",
  });

  // Track if we've already shown countdown for this lobby state to prevent duplicates
  const countdownShownRef = useRef<string | null>(null);

  // Quick Match state
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueTimeRemaining, setQueueTimeRemaining] = useState<number | null>(
    null,
  );

  const activeLobby = useQuery(api.lobbies.getUserActiveLobby);
  const currentGame = useQuery(api.games.getCurrentUserGame);

  // Quick Match queries
  const queueStatus = useQuery(api.matchmaking.getQueueStatus);
  // const queueCount = useQuery(api.matchmaking.getQueueCount);

  // Update queue status state
  useEffect(() => {
    if (queueStatus) {
      setIsInQueue(queueStatus.inQueue);
      setQueueTimeRemaining(queueStatus.timeRemaining || null);
    }
  }, [queueStatus]);

  // Clear queue state when player gets matched (has active lobby)
  useEffect(() => {
    if (activeLobby && isInQueue) {
      // Player was matched and now has an active lobby, clear queue state
      setIsInQueue(false);
      setQueueTimeRemaining(null);
    }
  }, [activeLobby, isInQueue]);

  // Show countdown modal when lobby becomes full (for host)
  useEffect(() => {
    const lobbyKey = `${activeLobby?._id}-${activeLobby?.playerId}-host`;

    if (
      activeLobby &&
      activeLobby.playerId &&
      activeLobby.hostId === profile.userId &&
      !gameStartData.isOpen &&
      !currentGame &&
      countdownShownRef.current !== lobbyKey
    ) {
      // Only if no game has started yet

      countdownShownRef.current = lobbyKey;
      setGameStartData({
        isOpen: true,
        player1Username: activeLobby.hostUsername,
        player2Username: activeLobby.playerUsername!,
        currentUsername: profile.username,
      });

      // Auto-start the game after 10 seconds
      setTimeout(() => {
        if (activeLobby) {
          void startGameMutation.mutate(
            { lobbyId: activeLobby._id },
            {
              onSuccess: (gameId: string) => {
                toast.success("The game is starting");
                _onGameStart?.(gameId);
              },
              onError: () => {
                toast.error("Couldn't start the game. Try again.");
                setGameStartData((prev) => ({ ...prev, isOpen: false }));
              },
            },
          );
        }
      }, 10000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeLobby,
    profile.userId,
    profile.username,
    currentGame,
    startGameMutation,
    _onGameStart,
  ]);

  // Show countdown for non-host when they are in a lobby
  useEffect(() => {
    // Skip if already showing countdown
    if (gameStartData.isOpen) return;

    // For non-host players in an active lobby, show countdown immediately
    if (activeLobby && activeLobby.hostId !== profile.userId && !currentGame) {
      const lobbyKey = `${activeLobby._id}-non-host-player`;

      if (countdownShownRef.current !== lobbyKey) {
        countdownShownRef.current = lobbyKey;
        setGameStartData({
          isOpen: true,
          player1Username: activeLobby.hostUsername,
          player2Username: activeLobby.playerUsername || profile.username,
          currentUsername: profile.username,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLobby, profile.userId, profile.username, currentGame]);

  // Monitor for game creation - this will show countdown for the non-host player when game is created
  useEffect(() => {
    const gameKey = `${currentGame?._id}-setup`;

    if (
      currentGame &&
      currentGame.status === "setup" &&
      activeLobby &&
      activeLobby.playerId &&
      activeLobby.hostId !== profile.userId && // Only for non-host player
      !gameStartData.isOpen &&
      countdownShownRef.current !== gameKey
    ) {
      countdownShownRef.current = gameKey;
      setGameStartData({
        isOpen: true,
        player1Username: currentGame.player1Username,
        player2Username: currentGame.player2Username,
        currentUsername: profile.username,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame, activeLobby, profile.userId, profile.username]);

  // Reset countdown tracking when modal closes
  useEffect(() => {
    if (!gameStartData.isOpen) {
      countdownShownRef.current = null;
    }
  }, [gameStartData.isOpen]);

  const handleCountdownComplete = () => {
    setGameStartData((prev) => ({ ...prev, isOpen: false }));
    // Navigate to the game if we have an active game
    if (currentGame) {
      _onGameStart?.(currentGame._id);
    }
  };

  const createLobbyMutation = useConvexMutationWithQuery(
    api.lobbies.createLobby,
    {
      onSuccess: (newLobby) => {
        setLobbyName("");
        setIsPrivate(false);
        setAllowSpectators(true);
        setMaxSpectators("");
        setGameMode("classic");
        setShowCreateLobby(false);

        if (isPrivate && newLobby) {
          toast.success(
            "Private lobby created. Share the code with your opponent.",
          );
        } else {
          toast.success("Lobby created. Waiting for an opponent.");
        }
      },
      onError: (error) => {
        toast.error(
          friendlyError(error, "Couldn't create the lobby. Try again."),
        );
      },
    },
  );

  const joinLobbyMutation = useConvexMutationWithQuery(api.lobbies.joinLobby, {
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't join that lobby. Try again."));
    },
  });

  // Errors for this one show inside the dialog, next to the code.
  const joinLobbyByCodeMutation = useConvexMutationWithQuery(
    api.lobbies.joinLobbyByCode,
  );

  const leaveLobbyMutation = useConvexMutationWithQuery(
    api.lobbies.leaveLobby,
    {
      onSuccess: () => {
        toast.success("You left the lobby");
      },
      onError: () => {
        toast.error("Couldn't leave the lobby. Try again.");
      },
    },
  );

  // Quick Match mutations
  const joinQueueMutation = useConvexMutationWithQuery(
    api.matchmaking.joinQueue,
    {
      onSuccess: (result) => {
        if (result.success) {
          toast.success("Looking for an opponent");
        } else {
          toast.info("You are already in the queue");
        }
      },
      onError: (error) => {
        toast.error(
          friendlyError(error, "Couldn't start a quick match. Try again."),
        );
      },
    },
  );

  const leaveQueueMutation = useConvexMutationWithQuery(
    api.matchmaking.leaveQueue,
    {
      onSuccess: () => {
        setIsInQueue(false);
        setQueueTimeRemaining(null);
        toast.success("Quick match cancelled");
      },
      onError: () => {
        toast.error("Couldn't cancel. Try again.");
      },
    },
  );

  // Countdown timer for queue timeout
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isInQueue && queueTimeRemaining && queueTimeRemaining > 0) {
      interval = setInterval(() => {
        setQueueTimeRemaining((prev) => {
          if (prev && prev > 1000) {
            return prev - 1000;
          } else {
            // Time's up - leave queue (check current queue status to avoid double calls)
            if (queueStatus?.inQueue) {
              leaveQueueMutation.mutate({});
            }
            return null;
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInQueue, queueTimeRemaining, leaveQueueMutation, queueStatus]);

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();

    // Generate random name if no name is provided
    const finalLobbyName = lobbyName.trim() || generateName();

    const maxSpectatorsNum =
      maxSpectators.trim() === "" ? undefined : parseInt(maxSpectators.trim());

    createLobbyMutation.mutate({
      name: finalLobbyName,
      isPrivate,
      allowSpectators,
      maxSpectators: maxSpectatorsNum,
      gameMode,
    });
  };

  const generateRandomName = () => {
    const randomName = generateName();
    setLobbyName(randomName);
  };

  const handleJoinLobby = async (lobbyId: Id<"lobbies">) => {
    // The mutation hook already shows the error toast.
    try {
      await new Promise<void>((resolve, reject) => {
        joinLobbyMutation.mutate(
          { lobbyId },
          {
            onSuccess: () => {
              toast.success("Joined. Waiting for the host to start the game.");
              resolve();
            },
            onError: reject,
          },
        );
      });
    } catch {
      // Handled by the hook's onError.
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length < 6) return;
    setJoinError(null);

    try {
      await new Promise<Id<"lobbies">>((resolve, reject) => {
        joinLobbyByCodeMutation.mutate(
          { lobbyCode: joinCode.trim().toUpperCase() },
          {
            onSuccess: (result: any) => {
              setJoinCode("");
              setShowJoinByCode(false);
              toast.success("Joined. Waiting for the host to start the game.");
              resolve(result as Id<"lobbies">);
            },
            onError: reject,
          },
        );
      });
    } catch (error) {
      setJoinError(
        friendlyError(
          error,
          "Couldn't join with that code. Check it and try again.",
        ),
      );
    }
  };

  const handleLeaveLobby = async (lobbyId: Id<"lobbies">) => {
    leaveLobbyMutation.mutate({ lobbyId });
  };

  const handleInviteToLobby = (lobbyId: Id<"lobbies">) => {
    onOpenMessaging?.(lobbyId);
  };

  const copyLobbyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success("Lobby code copied");
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  const planName = (tier?: string) =>
    tier === "pro" ? "Pro" : tier === "pro_plus" ? "Pro+" : "Free";

  const countdownActive = gameStartData.isOpen;
  const lobbyIsFull = !!activeLobby?.playerId;
  const iAmHost = activeLobby?.hostId === profile.userId;

  let lobbyStatus: {
    text: string;
    tone: "gold" | "win" | "plain";
    busy?: boolean;
  } | null = null;
  if (activeLobby) {
    if (lobbyIsFull && countdownActive) {
      lobbyStatus = { text: "Starting the game", tone: "gold", busy: true };
    } else if (lobbyIsFull && iAmHost) {
      lobbyStatus = { text: "Opponent joined", tone: "win" };
    } else if (lobbyIsFull) {
      lobbyStatus = { text: "Waiting for the host to start", tone: "gold" };
    } else {
      lobbyStatus = { text: "Waiting for an opponent", tone: "plain" };
    }
  }

  // Who stands in the red corner of the title card
  let opponent: Opponent = { kind: "anyone", elo: profile.elo ?? 1500 };
  if (activeLobby) {
    const other = iAmHost
      ? activeLobby.playerUsername
      : activeLobby.hostUsername;
    opponent =
      lobbyIsFull && other
        ? {
            kind: "joined",
            username: other,
            status: lobbyStatus?.text ?? "Opponent joined",
          }
        : { kind: "waiting", lobbyName: activeLobby.name };
  } else if (isInQueue) {
    opponent = {
      kind: "searching",
      secondsLeft: queueTimeRemaining
        ? Math.ceil(queueTimeRemaining / 1000)
        : null,
    };
  }

  const privateLimitReached =
    !!privateLobbyLimit && !privateLobbyLimit.canCreate;
  const privateLeft =
    privateLobbyLimit && privateLobbyLimit.canCreate
      ? privateLobbyLimit.limit === Infinity
        ? "No daily limit on private lobbies."
        : `${privateLobbyLimit.limit - privateLobbyLimit.today} private ${
            privateLobbyLimit.limit - privateLobbyLimit.today === 1
              ? "lobby"
              : "lobbies"
          } left today.`
      : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* You against whoever's next */}
      <section className="space-y-3">
        <LobbyHeader profile={profile} opponent={opponent} />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Quick match: the one gold action */}
          {!activeLobby && !isInQueue && (
            <>
              <Button
                className="h-12 w-full text-base sm:h-14 sm:w-auto sm:px-12 sm:text-lg"
                onClick={() => joinQueueMutation.mutate({})}
                disabled={joinQueueMutation.isPending}
              >
                {joinQueueMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Zap />
                )}
                {joinQueueMutation.isPending
                  ? "Joining the queue"
                  : "Quick match"}
              </Button>
              <p className="hidden text-sm text-foreground/85 sm:block sm:px-3">
                Ranked. Finds someone near your rating.
              </p>
            </>
          )}

          {isInQueue && (
            <>
              <Button
                variant="secondary"
                className="h-12 w-full text-base sm:h-14 sm:w-auto sm:px-10"
                onClick={() => leaveQueueMutation.mutate({})}
                disabled={leaveQueueMutation.isPending}
              >
                {leaveQueueMutation.isPending && (
                  <Loader2 className="animate-spin" />
                )}
                {leaveQueueMutation.isPending
                  ? "Cancelling"
                  : "Cancel quick match"}
              </Button>
              <p className="hidden text-sm text-foreground/85 sm:block sm:px-3">
                You can still join a lobby while you wait.
              </p>
            </>
          )}

          <div className="grid grid-cols-2 gap-2 sm:ml-auto sm:flex">
            {/* Join with a code */}
            <Dialog
              open={showJoinByCode}
              onOpenChange={(open) => {
                setShowJoinByCode(open);
                if (open) setJoinError(null);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  className={activeLobby ? "col-span-2" : undefined}
                >
                  <Key />
                  Join with code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>Join with a code</DialogTitle>
                  <DialogDescription>
                    Enter the 6-character code from the host of a private lobby.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => void handleJoinByCode(e)}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="join-code">Lobby code</Label>
                    <Input
                      id="join-code"
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(
                          e.target.value.toUpperCase().replace(/\s/g, ""),
                        );
                        setJoinError(null);
                      }}
                      placeholder="ABC123"
                      maxLength={6}
                      required
                      autoFocus
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      disabled={
                        joinLobbyByCodeMutation.isPending ||
                        startGameMutation.isPending
                      }
                      aria-invalid={joinError ? true : undefined}
                      className="h-14 text-center text-2xl tabular-nums"
                    />
                    {joinError && (
                      <p role="alert" className="text-sm text-red-300">
                        {joinError}
                      </p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowJoinByCode(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        joinCode.trim().length < 6 ||
                        joinLobbyByCodeMutation.isPending ||
                        startGameMutation.isPending
                      }
                    >
                      {(joinLobbyByCodeMutation.isPending ||
                        startGameMutation.isPending) && (
                        <Loader2 className="animate-spin" />
                      )}
                      {joinLobbyByCodeMutation.isPending ||
                      startGameMutation.isPending
                        ? "Joining"
                        : "Join lobby"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Create a lobby */}
            {!activeLobby && (
              <Dialog open={showCreateLobby} onOpenChange={setShowCreateLobby}>
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <Plus />
                    Create lobby
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[440px]">
                  <DialogHeader>
                    <DialogTitle>Create a lobby</DialogTitle>
                    <DialogDescription>
                      Pick a name and a mode, then wait for an opponent. Lobbies
                      with no activity close after 30 minutes.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => void handleCreateLobby(e)}
                    className="space-y-5"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="lobby-name">Lobby name</Label>
                      <div className="flex gap-2">
                        <Input
                          id="lobby-name"
                          value={lobbyName}
                          onChange={(e) => setLobbyName(e.target.value)}
                          placeholder="Random if blank"
                          disabled={createLobbyMutation.isPending}
                          autoComplete="off"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={generateRandomName}
                          disabled={createLobbyMutation.isPending}
                          aria-label="Suggest a random name"
                          title="Suggest a random name"
                          className="shrink-0"
                        >
                          <Shuffle />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-border pt-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="private-lobby"
                          checked={isPrivate}
                          onCheckedChange={(checked) =>
                            setIsPrivate(checked === true)
                          }
                          disabled={
                            createLobbyMutation.isPending || privateLimitReached
                          }
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <Label
                            htmlFor="private-lobby"
                            className="cursor-pointer"
                          >
                            Private lobby
                          </Label>
                          <p className="mt-1 text-[13px] text-foreground/80">
                            Players need a code to join.
                            {isPrivate && privateLeft ? ` ${privateLeft}` : ""}
                          </p>
                        </div>
                      </div>

                      {privateLobbyLimit && privateLimitReached && (
                        <div
                          role="alert"
                          className="rounded-md border border-gold-500/30 bg-gold-500/[0.06] p-3 text-sm text-foreground"
                        >
                          <p className="font-medium">
                            {privateLobbyLimit.reason === "subscription_expired"
                              ? "Your subscription has expired"
                              : "Daily limit reached"}
                          </p>
                          <p className="mt-1 text-foreground/85">
                            {privateLobbyLimit.reason === "subscription_expired"
                              ? "Renew it to create private lobbies again."
                              : `The ${planName(privateLobbyLimit.tier)} plan allows ${privateLobbyLimit.limit} private ${privateLobbyLimit.limit === 1 ? "lobby" : "lobbies"} a day.`}
                          </p>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              navigate({
                                to:
                                  privateLobbyLimit.reason ===
                                  "subscription_expired"
                                    ? "/subscription"
                                    : "/pricing",
                                search: {
                                  subscription: undefined,
                                  donation: undefined,
                                },
                              })
                            }
                          >
                            {privateLobbyLimit.reason === "subscription_expired"
                              ? "Renew subscription"
                              : "See plans"}
                          </Button>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="allow-spectators"
                          checked={allowSpectators}
                          onCheckedChange={(checked) =>
                            setAllowSpectators(checked === true)
                          }
                          disabled={createLobbyMutation.isPending}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <Label
                            htmlFor="allow-spectators"
                            className="cursor-pointer"
                          >
                            Allow spectators
                          </Label>
                          <p className="mt-1 text-[13px] text-foreground/80">
                            Others can watch the game live.
                          </p>
                        </div>
                      </div>

                      {allowSpectators && (
                        <div className="space-y-1.5 pl-7">
                          <Label
                            htmlFor="max-spectators"
                            className="text-[13px] font-normal"
                          >
                            Spectator limit
                          </Label>
                          <Input
                            id="max-spectators"
                            value={maxSpectators}
                            onChange={(e) => setMaxSpectators(e.target.value)}
                            placeholder="No limit"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            disabled={createLobbyMutation.isPending}
                            className="tabular-nums"
                          />
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border pt-4">
                      <GameModeSelector
                        value={gameMode}
                        onChange={setGameMode}
                        disabled={createLobbyMutation.isPending}
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowCreateLobby(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createLobbyMutation.isPending}
                      >
                        {createLobbyMutation.isPending && (
                          <Loader2 className="animate-spin" />
                        )}
                        {createLobbyMutation.isPending
                          ? "Creating"
                          : "Create lobby"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </section>

      {/* The lobby the player is already in */}
      {activeLobby && (
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          aria-label="Your lobby"
          className="flex flex-col gap-4 rounded-lg border border-gold-500/30 bg-gold-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs text-foreground/80">Your lobby</p>
            <h3 className="truncate font-display text-xl font-semibold text-foreground">
              {activeLobby.name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/85">
              <span>{activeLobby.isPrivate ? "Private" : "Public"}</span>
              <span className="tabular-nums">
                {activeLobby.playerId ? "2/2" : "1/2"} players
              </span>
              {activeLobby.isPrivate && activeLobby.lobbyCode && (
                <span className="inline-flex items-center gap-1">
                  Code
                  <code className="rounded border border-border bg-background/60 px-2 py-0.5 text-sm tabular-nums text-gold-300">
                    {activeLobby.lobbyCode}
                  </code>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9"
                    aria-label="Copy lobby code"
                    onClick={() =>
                      activeLobby.lobbyCode &&
                      copyLobbyCode(activeLobby.lobbyCode)
                    }
                  >
                    {codeCopied ? <Check /> : <Copy />}
                  </Button>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {lobbyStatus && (
              <p
                role="status"
                className={`inline-flex items-center gap-2 text-sm ${
                  lobbyStatus.tone === "win"
                    ? "text-emerald-400"
                    : lobbyStatus.tone === "gold"
                      ? "text-gold-300"
                      : "text-foreground/85"
                }`}
              >
                {lobbyStatus.busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span
                    className={`h-2 w-2 rounded-full ${
                      lobbyStatus.tone === "win"
                        ? "bg-emerald-400"
                        : lobbyStatus.tone === "gold"
                          ? "bg-gold-400"
                          : "bg-foreground/50"
                    }`}
                  />
                )}
                {lobbyStatus.text}
              </p>
            )}
            <Button
              variant="destructive"
              onClick={() => void handleLeaveLobby(activeLobby._id)}
              disabled={leaveLobbyMutation.isPending}
            >
              {leaveLobbyMutation.isPending && (
                <Loader2 className="animate-spin" />
              )}
              {leaveLobbyMutation.isPending ? "Leaving" : "Leave lobby"}
            </Button>
          </div>
        </motion.section>
      )}

      <LobbyTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        lobbies={
          <ListErrorBoundary message="Couldn't load the open lobbies.">
            <OpenLobbies
              currentUserId={profile.userId}
              canCreate={!activeLobby}
              onCreate={() => setShowCreateLobby(true)}
              onJoin={(lobbyId) => void handleJoinLobby(lobbyId)}
              onLeave={(lobbyId) => void handleLeaveLobby(lobbyId)}
              onInvite={handleInviteToLobby}
              isJoining={
                joinLobbyMutation.isPending || startGameMutation.isPending
              }
              isLeaving={leaveLobbyMutation.isPending}
            />
          </ListErrorBoundary>
        }
        watch={watch}
      />

      {/* Game Start Countdown Modal */}
      <GameStartCountdownModal
        isOpen={gameStartData.isOpen}
        onComplete={handleCountdownComplete}
        player1Username={gameStartData.player1Username}
        player2Username={gameStartData.player2Username}
        currentUsername={gameStartData.currentUsername}
      />
    </div>
  );
}

/** The open lobbies as bouts, with paging. Its own component so a failed load
 * is caught by the error boundary around it. */
function OpenLobbies({
  currentUserId,
  canCreate,
  onCreate,
  onJoin,
  onLeave,
  onInvite,
  isJoining,
  isLeaving,
}: {
  currentUserId: Id<"users">;
  canCreate: boolean;
  onCreate: () => void;
  onJoin: (lobbyId: Id<"lobbies">) => void;
  onLeave: (lobbyId: Id<"lobbies">) => void;
  onInvite: (lobbyId: Id<"lobbies">) => void;
  isJoining: boolean;
  isLeaving: boolean;
}) {
  const [lobbiesCursor, setLobbiesCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const lobbiesQuery = useQuery(api.lobbies.getLobbies, {
    paginationOpts: {
      numItems: LOBBIES_PER_PAGE,
      cursor: lobbiesCursor || undefined,
    },
  });
  const lobbies = lobbiesQuery?.page || [];

  const loadMoreLobbies = () => {
    if (lobbiesQuery?.continueCursor) {
      setIsLoadingMore(true);
      setLobbiesCursor(lobbiesQuery.continueCursor);
      // Reset loading state after a brief delay to show animation
      setTimeout(() => setIsLoadingMore(false), 500);
    }
  };

  if (lobbiesQuery === undefined) {
    // Same shape as a bout, so nothing jumps when data arrives
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <BoutSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (lobbies.length === 0) {
    return (
      <EmptyBout
        title="No one's waiting"
        body="Create a lobby and you're the first bout on the card, or start a quick match."
        action={
          canCreate ? (
            <Button variant="secondary" onClick={onCreate}>
              <Plus />
              Create lobby
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-2 pb-6">
      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        className="space-y-2"
      >
        {lobbies.map((lobby) => (
          <LobbyCard
            key={lobby._id}
            lobby={lobby}
            currentUserId={currentUserId}
            onJoin={onJoin}
            onLeave={onLeave}
            onInviteToLobby={onInvite}
            isJoining={isJoining}
            isLeaving={isLeaving}
          />
        ))}
      </motion.div>

      {!lobbiesQuery.isDone && (
        <div className="flex justify-center pt-4">
          <Button
            variant="secondary"
            onClick={loadMoreLobbies}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ChevronDown />
            )}
            {isLoadingMore ? "Loading" : "Show more lobbies"}
          </Button>
        </div>
      )}
    </div>
  );
}
