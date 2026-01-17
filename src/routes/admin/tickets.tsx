import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const SupportResolvePage = lazy(() =>
  import("../../pages/support/resolve").then((module) => ({
    default: module.SupportResolvePage,
  })),
);

function AdminTicketsComponent() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4" />
            <p className="text-white/50 text-sm">Loading tickets...</p>
          </div>
        </div>
      }
    >
      <SupportResolvePage />
    </Suspense>
  );
}

export const Route = createFileRoute("/admin/tickets")({
  component: AdminTicketsComponent,
});
