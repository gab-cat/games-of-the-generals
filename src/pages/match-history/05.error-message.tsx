import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export function ErrorMessage(_props: { error?: Error }) {
  return (
    <div>
      <PageHeader title="Match history" />
      <EmptyState
        title="Match history didn't load"
        body="Check your connection and try again."
        action={
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
