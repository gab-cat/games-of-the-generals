import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Id } from "../../../convex/_generated/dataModel";
import { GameReplay } from "./GameReplay";
import { LocalReplayViewer, LocalReplayData } from "./LocalReplayViewer";

interface ReplayPageProps {
  gameId?: string;
}

export function ReplayPage({ gameId }: ReplayPageProps) {
  const navigate = useNavigate();
  const [localReplayData, setLocalReplayData] =
    useState<LocalReplayData | null>(null);

  const handleBack = () => {
    // If viewing local replay, go back to upload interface
    if (localReplayData && !gameId) {
      setLocalReplayData(null);
      return;
    }
    void navigate({ to: "/match-history" });
  };

  const handleLocalReplayLoaded = (data: LocalReplayData) => {
    setLocalReplayData(data);
  };

  // If we have a gameId, render server replay
  // If we have localReplayData, render local replay
  // Otherwise, show the upload interface
  const showUploadInterface = !gameId && !localReplayData;

  return showUploadInterface ? (
    <LocalReplayViewer onReplayLoaded={handleLocalReplayLoaded} />
  ) : (
    <GameReplay
      gameId={gameId ? (gameId as Id<"games">) : undefined}
      localReplayData={localReplayData ?? undefined}
      onBack={handleBack}
    />
  );
}
