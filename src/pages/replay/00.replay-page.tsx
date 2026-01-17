import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Id } from "../../../convex/_generated/dataModel";
import { GameReplay } from "./GameReplay";
import { LocalReplayViewer, LocalReplayData } from "./LocalReplayViewer";
import { motion } from "framer-motion";

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen text-white selection:bg-blue-500/30 font-sans p-4 sm:p-6"
    >
      {/* Command Center Ambient Background */}
      <div className="fixed inset-0 pointer-events-none select-none -z-10 bg-black">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto rounded-sm overflow-hidden min-h-[calc(100vh-3rem)]">
        {showUploadInterface ? (
          <LocalReplayViewer onReplayLoaded={handleLocalReplayLoaded} />
        ) : (
          <GameReplay
            gameId={gameId ? (gameId as Id<"games">) : undefined}
            localReplayData={localReplayData ?? undefined}
            onBack={handleBack}
          />
        )}
      </div>
    </motion.div>
  );
}
