import { Users, Clock, ArrowLeft, Copy } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { PageHeader } from "../../components/ui/page-header";
import { toast } from "sonner";

interface SpectateHeaderProps {
  spectatorCount: number;
  gameStatus: string;
  timeRemaining: string;
  gameId: string;
  onBack: () => void;
}

export function SpectateHeader({
  spectatorCount,
  gameStatus,
  timeRemaining,
  gameId,
  onBack,
}: SpectateHeaderProps) {
  const copyGameId = () => {
    void navigator.clipboard.writeText(gameId);
    toast.success("Game ID copied");
  };

  return (
    <PageHeader
      title="Spectate"
      description={
        <span className="flex flex-wrap items-center gap-2">
          <Badge variant="success">{gameStatus}</Badge>
          <Badge variant="secondary">
            <Users className="size-3" />
            {spectatorCount} watching
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
            <Clock className="size-4" />
            {timeRemaining}
          </span>
        </span>
      }
      actions={
        <>
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft />
            Back to lobbies
          </Button>
          <Button variant="secondary" onClick={copyGameId}>
            <Copy />
            Copy game ID
          </Button>
        </>
      }
    />
  );
}
