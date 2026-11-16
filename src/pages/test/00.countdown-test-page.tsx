import { useState } from "react";
import { GameStartCountdownModal } from "@/components/GameStartCountdownModal";
import { Button } from "@/components/ui/button";

export function CountdownTestPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-4">
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Countdown preview
      </h1>

      <Button onClick={() => setIsOpen(true)}>Open countdown</Button>

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
