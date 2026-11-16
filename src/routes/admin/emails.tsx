import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminEmailsPage = lazy(() =>
  import("../../pages/admin/03.admin-emails").then((module) => ({
    default: module.AdminEmailsPage,
  })),
);

type EmailsSearch = { email?: string };

function AdminEmailsComponent() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      }
    >
      <AdminEmailsPage />
    </Suspense>
  );
}

export const Route = createFileRoute("/admin/emails")({
  validateSearch: (search: Record<string, unknown>): EmailsSearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: AdminEmailsComponent,
});
