import { useNavigate } from "@tanstack/react-router";
import { Id } from "../../../convex/_generated/dataModel";
import { GameBoard } from "../../components/GameBoard";

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
    <GameBoard 
      gameId={gameId as Id<"games">} 
      profile={profile} 
      onBackToLobby={handleBackToLobby}
    />
  );
}
