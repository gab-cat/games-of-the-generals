import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SupportResolvePage = lazy(() =>
  import("../../pages/support/resolve").then((module) => ({
    default: module.SupportResolvePage,
  })),
);

function AdminTicketsComponent() {
  // ?ticketId= opens one ticket, e.g. from a donation alert email.
  const { ticketId } = Route.useSearch();
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      }
    >
      <SupportResolvePage key={ticketId} initialTicketId={ticketId} />
    </Suspense>
  );
}

export const Route = createFileRoute("/admin/tickets")({
  component: AdminTicketsComponent,
  validateSearch: (search: Record<string, unknown>): { ticketId?: string } =>
    typeof search.ticketId === "string" ? { ticketId: search.ticketId } : {},
});
