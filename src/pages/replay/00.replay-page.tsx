import { useNavigate } from "@tanstack/react-router";
import { Id } from "../../../convex/_generated/dataModel";
import { GameReplay } from "./GameReplay";

interface ReplayPageProps {
  gameId: string;
}

export function ReplayPage({ gameId }: ReplayPageProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    void navigate({ to: "/" });
  };

  if (!gameId) {
    handleBack();
    return null;
  }

  return (
    <GameReplay 
      gameId={gameId as Id<"games">} 
      onBack={handleBack}
    />
  );
}
