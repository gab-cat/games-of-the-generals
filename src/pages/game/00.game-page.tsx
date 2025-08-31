import { useNavigate } from "@tanstack/react-router";
import { Id } from "../../../convex/_generated/dataModel";
import { lazy, Suspense } from "react";

// Lazy load the heavy GameBoard component
const GameBoard = lazy(() => import("../../components/GameBoard").then(module => ({ default: module.GameBoard })));

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
}

interface GamePageProps {
  profile: Profile;
  gameId: string;
}

export function GamePage({ profile, gameId }: GamePageProps) {
  const navigate = useNavigate();

  const handleBackToLobby = () => {
    void navigate({ to: "/" });
  };

  if (!gameId) {
    handleBackToLobby();
    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[60vh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
        </div>
      }
    >
      <GameBoard
        gameId={gameId as Id<"games">}
        profile={profile}
        onBackToLobby={handleBackToLobby}
      />
    </Suspense>
  );
}
