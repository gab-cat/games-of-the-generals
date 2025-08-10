import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useConvexQuery, useConvexMutationWithQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { LobbyHeader } from "./01.lobby-header";
import { LobbyTabs } from "./02.lobby-tabs";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
}

interface LobbyPageProps {
  profile: Profile;
  onOpenMessaging?: (lobbyId?: Id<"lobbies">) => void;
}

export function LobbyPage({ profile, onOpenMessaging }: LobbyPageProps) {
  const [activeTab, setActiveTab] = useState<"lobbies" | "spectate">("lobbies");
  const navigate = useNavigate();

  const { data: activeGame } = useConvexQuery(api.games.getCurrentUserGame);

  const startGameMutation = useConvexMutationWithQuery(api.games.startGame, {
    onError: () => {
      toast.error("Failed to start game");
    }
  });

  const spectateByIdMutation = useConvexMutationWithQuery(api.lobbies.spectateGameById, {
    onSuccess: (gameId) => {
      void navigate({ to: "/spectate", search: { gameId: gameId as string } });
      toast.success("Joining game as spectator!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to join game");
    }
  });

  const handleGameStart = (gameId: string) => {
    void navigate({ to: "/game", search: { gameId } });
  };

  const handleSpectateGame = (gameId: string) => {
    // Use the same mutation as spectate by ID to properly validate and join
    spectateByIdMutation.mutate({ gameId: gameId as Id<"games"> });
  };

  // Check if user has an active game and redirect if needed
  if (activeGame?._id) {
    void navigate({ to: "/game", search: { gameId: activeGame._id } });
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      <LobbyHeader profile={profile} />
      <LobbyTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        profile={profile}
        onGameStart={handleGameStart}
        onSpectateGame={handleSpectateGame}
        startGameMutation={startGameMutation}
        spectateByIdMutation={spectateByIdMutation}
        onOpenMessaging={onOpenMessaging}
      />
    </motion.div>
  );
}
