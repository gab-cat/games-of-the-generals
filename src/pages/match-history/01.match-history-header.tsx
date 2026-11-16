import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export function MatchHistoryHeader() {
  const navigate = useNavigate();

  return (
    <PageHeader
      title="Match history"
      description="Your finished games. Open one to watch it back move by move."
      actions={
        <Button variant="secondary" onClick={() => navigate({ to: "/replay" })}>
          Open a replay file
        </Button>
      }
    />
  );
}
