import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminUsersPage = lazy(() =>
  import("../../pages/admin/01.admin-users").then((module) => ({
    default: module.AdminUsersPage,
  })),
);

function AdminUsersComponent() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      }
    >
      <AdminUsersPage />
    </Suspense>
  );
}

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersComponent,
});
