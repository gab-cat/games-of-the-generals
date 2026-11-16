import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "@/auth/SignInForm";
import { useConvexQuery } from "@/lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

const ADMIN_TABS = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/subscriptions", label: "Subscriptions" },
  { to: "/admin/tickets", label: "Tickets" },
  { to: "/admin/emails", label: "Emails" },
] as const;

function AdminTabs() {
  return (
    <nav aria-label="Admin sections" className="border-b border-border">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {ADMIN_TABS.map((tab) => (
          <li key={tab.to}>
            <Link
              to={tab.to}
              activeOptions={{
                exact: "exact" in tab && tab.exact,
                includeSearch: false,
              }}
              className="block whitespace-nowrap rounded-t-md border-b-2 border-transparent px-3 py-3 text-sm text-foreground/80 transition-colors hover:bg-white/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              activeProps={{
                className: "!border-gold-500 !text-foreground font-medium",
                "aria-current": "page",
              }}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NoAccess() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Admins only
        </h1>
        <p className="mt-2 text-sm text-foreground/80">
          Your account does not have admin access.
        </p>
        <Button asChild variant="secondary" className="mt-5">
          <Link to="/">
            <ChevronLeft className="size-4" />
            Back to the game
          </Link>
        </Button>
      </div>
    </div>
  );
}

function AdminLayoutComponent() {
  const { data: profile, isLoading } = useConvexQuery(
    api.profiles.getCurrentProfile,
    {},
  );
  const isAdmin = profile?.adminRole;

  return (
    <>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        {isLoading ? (
          <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        ) : !isAdmin ? (
          <NoAccess />
        ) : (
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="border-b border-border bg-card">
              <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-semibold text-foreground">
                    Admin
                  </span>
                  <span className="text-xs text-foreground/70">
                    {profile?.adminRole === "moderator"
                      ? "Moderator"
                      : "Administrator"}
                  </span>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/">
                    <ChevronLeft className="size-4" />
                    Back to the game
                  </Link>
                </Button>
              </div>
              <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <AdminTabs />
              </div>
            </header>

            <main className="flex-1">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
                <Outlet />
              </div>
            </main>
          </div>
        )}
      </Authenticated>
    </>
  );
}

export const Route = createFileRoute("/admin")({
  component: AdminLayoutComponent,
});
