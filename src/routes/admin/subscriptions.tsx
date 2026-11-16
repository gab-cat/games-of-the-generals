import { createFileRoute } from "@tanstack/react-router";

import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminSubscriptionsPage = lazy(() =>
  import("../../pages/admin/02.admin-subscriptions").then((module) => ({
    default: module.AdminSubscriptionsPage,
  })),
);

function AdminSubscriptionsComponent() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      }
    >
      <AdminSubscriptionsPage />
    </Suspense>
  );
}

export const Route = createFileRoute("/admin/subscriptions")({
  component: AdminSubscriptionsComponent,
});
