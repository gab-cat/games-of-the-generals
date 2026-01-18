import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useConvexMutationWithQuery } from "../../lib/convex-query-hooks";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { LobbyHeader } from "./01.lobby-header";
import { LobbyTabs } from "./02.lobby-tabs";
import { useQuery } from "convex-helpers/react/cache";
import { UpgradeDonationCTA } from "../../components/subscription/UpgradeDonationCTA";

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

  // BANDWIDTH OPTIMIZED: Use lightweight query that returns only game ID
  const activeGameId = useQuery(api.games.getCurrentUserGameId);

  const startGameMutation = useConvexMutationWithQuery(api.games.startGame, {
    onError: () => {
      toast.error("Failed to start game");
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
        toast.success("Joining game as spectator!");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to join game",
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
      <motion.div
        exit={{ opacity: 0 }}
        className="min-h-screen relative font-sans p-2 sm:p-6 pb-20"
      >
        {/* Ambient Command Center Background */}
        <div className="fixed inset-0 pointer-events-none select-none z-[-1] bg-black">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent opacity-50" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 relative z-10">
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
        </div>
      </motion.div>
      <UpgradeDonationCTA />
    </>
  );
}
