import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useConvexMutationWithQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { friendlyError } from "./friendly-error";
import { LobbyListTab } from "./03.lobby-list-tab";
import { SpectateTab } from "./04.spectate-tab";
import type { LobbyTab } from "./02.lobby-tabs";
import { useQuery } from "convex-helpers/react/cache";
import { UpgradeDonationCTA } from "../../components/subscription/UpgradeDonationCTA";
import { TournamentInvite } from "./TournamentInvite";
import { DiscordLobbyInvite } from "../../components/Discord";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
  elo?: number;
  tier?: "free" | "pro" | "pro_plus";
  isDonor?: boolean;
  avatarUrl?: string;
  avatarFrame?: string;
  usernameColor?: string;
}

interface LobbyPageProps {
  profile: Profile;
  onOpenMessaging?: (lobbyId?: Id<"lobbies">) => void;
}

export function LobbyPage({ profile, onOpenMessaging }: LobbyPageProps) {
  const [activeTab, setActiveTab] = useState<LobbyTab>("lobbies");
  const navigate = useNavigate();

  // BANDWIDTH OPTIMIZED: Use lightweight query that returns only game ID
  const activeGameId = useQuery(api.games.getCurrentUserGameId);

  const startGameMutation = useConvexMutationWithQuery(api.games.startGame, {
    onError: () => {
      toast.error("Couldn't start the game. Try again.");
    },
  });

  const spectateByIdMutation = useConvexMutationWithQuery(
    api.lobbies.spectateGameById,
    {
      onSuccess: (gameId) => {
        void navigate({
          to: "/spectate",
          search: { gameId: gameId as string },
        });
        toast.success("Joining as a spectator");
      },
      onError: (error) => {
        toast.error(
          friendlyError(
            error,
            "Couldn't open that game. Check the ID and try again.",
          ),
        );
      },
    },
  );

  const handleGameStart = (gameId: string) => {
    void navigate({ to: "/game", search: { gameId } });
  };

  const handleSpectateGame = (gameId: string) => {
    // Use the same mutation as spectate by ID to properly validate and join
    spectateByIdMutation.mutate({ gameId: gameId as Id<"games"> });
  };

  // Check if user has an active game and redirect if needed
  if (activeGameId) {
    void navigate({ to: "/game", search: { gameId: activeGameId } });
    return null;
  }

  return (
    <>
      <div className="space-y-6 pb-4 sm:space-y-8">
        <h1 className="sr-only">Lobbies</h1>
        {/* Both invites can be hidden; the wrapper collapses when they are. */}
        <div className="space-y-3 empty:hidden">
          <TournamentInvite />
          <DiscordLobbyInvite />
        </div>
        <LobbyListTab
          profile={profile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onGameStart={handleGameStart}
          startGameMutation={startGameMutation}
          onOpenMessaging={onOpenMessaging}
          watch={
            <SpectateTab
              onSpectateGame={handleSpectateGame}
              spectateByIdMutation={spectateByIdMutation}
            />
          }
        />
      </div>
      <UpgradeDonationCTA />
    </>
  );
}
