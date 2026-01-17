import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { lazy, Suspense } from "react";
import { SignInForm } from "@/auth/SignInForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Lazy load the SupportTicketsPage component
const SupportTicketsPage = lazy(() =>
  import("../pages/support/00.support-tickets-page").then((module) => ({
    default: module.SupportTicketsPage,
  })),
);

function SupportComponent() {
  const { ticketId } = Route.useSearch();

  return (
    <>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <Suspense fallback={<LoadingSpinner />}>
          <SupportTicketsPage initialTicketId={ticketId} />
        </Suspense>
      </Authenticated>
    </>
  );
}

export const Route = createFileRoute("/support")({
  validateSearch: (search: Record<string, unknown>) => ({
    ticketId: search.ticketId as string | undefined,
  }),
  component: SupportComponent,
});
