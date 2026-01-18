import { useNavigate } from "@tanstack/react-router";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Lazy load the heavy GameBoard component
const GameBoard = lazy(() =>
  import("../../components/GameBoard").then((module) => ({
    default: module.GameBoard,
  })),
);

interface GamePageProps {
  profile: Doc<"profiles">;
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
    <Suspense fallback={<LoadingSpinner />}>
      <GameBoard
        gameId={gameId as Id<"games">}
        profile={profile}
        onBackToLobby={handleBackToLobby}
      />
    </Suspense>
  );
}
