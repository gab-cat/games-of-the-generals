import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboardPage = lazy(() =>
  import("../../pages/admin/00.admin-dashboard").then((module) => ({
    default: module.AdminDashboardPage,
  })),
);

function AdminIndexComponent() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      }
    >
      <AdminDashboardPage />
    </Suspense>
  );
}

export const Route = createFileRoute("/admin/")({
  component: AdminIndexComponent,
});
