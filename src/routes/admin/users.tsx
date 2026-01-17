import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdminUsersPage = lazy(() =>
  import("../../pages/admin/01.admin-users").then((module) => ({
    default: module.AdminUsersPage,
  })),
);

function AdminUsersComponent() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto mb-4" />
            <p className="text-white/50 text-sm">Loading users...</p>
          </div>
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
