import { useNavigate } from "@tanstack/react-router";
import { Id } from "../../../convex/_generated/dataModel";
import { SpectatorView } from "./SpectatorView";

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: string;
}

interface SpectatePageProps {
  profile: Profile;
  gameId: string;
}

export function SpectatePage({ profile, gameId }: SpectatePageProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    void navigate({ to: "/" });
  };

  if (!gameId) {
    handleBack();
    return null;
  }

  return (
    <SpectatorView 
      gameId={gameId as Id<"games">} 
      profile={profile} 
      onBack={handleBack}
    />
  );
}
