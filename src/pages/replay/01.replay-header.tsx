import { ArrowLeft, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { PageHeader } from "../../components/ui/page-header";

interface ReplayHeaderProps {
  onBack: () => void;
  onReset: () => void;
  showAllPieces: boolean;
  onTogglePieceVisibility: () => void;
  gameStatus: string;
  result?: string;
}

export function ReplayHeader({
  onBack,
  onReset,
  showAllPieces,
  onTogglePieceVisibility,
  gameStatus,
  result,
}: ReplayHeaderProps) {
  return (
    <PageHeader
      title="Replay"
      description={
        <span className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{gameStatus}</Badge>
          {result ? <Badge>{result}</Badge> : null}
        </span>
      }
      actions={
        <>
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft />
            Back
          </Button>
          <Button variant="secondary" onClick={onTogglePieceVisibility}>
            {showAllPieces ? <EyeOff /> : <Eye />}
            {showAllPieces ? "Hide pieces" : "Show all pieces"}
          </Button>
          <Button variant="secondary" onClick={onReset}>
            <RotateCcw />
            Restart
          </Button>
        </>
      }
    />
  );
}
