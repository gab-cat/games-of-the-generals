import { useState } from "react";
import { GameStartCountdownModal } from "@/components/GameStartCountdownModal";
import { Button } from "@/components/ui/button";

export function CountdownTestPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-white mb-8">
        Countdown Modal Test
      </h1>

      <Button
        onClick={() => setIsOpen(true)}
        className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
      >
        Open Countdown Modal
      </Button>

      <GameStartCountdownModal
        isOpen={isOpen}
        onComplete={() => {
          console.log("Countdown complete!");
          setIsOpen(false);
        }}
        player1Username="Player1TestName"
        player2Username="Player2TestName"
        currentUsername="Player1TestName"
      />
    </div>
  );
}
