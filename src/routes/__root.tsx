import {
  createRootRoute,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { lazy, Suspense, useState, useCallback, useEffect } from "react";
import { ConvertAnonymousPopup } from "../components/ConvertAnonymousPopup";
import { Toaster } from "sonner";
import { useConvexQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { SoundProvider } from "@/lib/SoundProvider";

// Lazy load Layout component for better code splitting
const Layout = lazy(() =>
  import("../components/Layout").then((module) => ({ default: module.Layout })),
);

function RootComponent() {
  const { data: profile } = useConvexQuery(api.profiles.getCurrentProfile);
  const [lobbyInviteHandler, setLobbyInviteHandler] = useState<
    ((lobbyId: Id<"lobbies">) => void) | null
  >(null);

  // This function will be called by Layout to register the handler
  const onOpenMessagingWithLobby = useCallback(
    (handler: (lobbyId: Id<"lobbies">) => void) => {
      setLobbyInviteHandler(() => handler);
    },
    [],
  );

  // Expose the openMessagingWithLobby function globally
  // This can be used by any component that needs to open messaging with a lobby invite
  if (typeof window !== "undefined" && lobbyInviteHandler) {
    (window as any).openMessagingWithLobby = lobbyInviteHandler;
  }

  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isMaintenancePage = location.pathname === "/maintenance";

  useEffect(() => {
    const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === "true";
    if (isMaintenanceMode && !isMaintenancePage && !isAdminRoute) {
      navigate({ to: "/maintenance" });
    }
  }, [location.pathname, navigate, isAdminRoute, isMaintenancePage]);

  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingSpinner fullScreen={true} />}>
        <SoundProvider>
          {isAdminRoute || isMaintenancePage ? (
            <Outlet />
          ) : (
            <Layout
              user={profile ? { username: profile.username } : undefined}
              onOpenMessagingWithLobby={onOpenMessagingWithLobby}
            >
              <Outlet />
            </Layout>
          )}
        </SoundProvider>
      </Suspense>
      <ConvertAnonymousPopup />
      <Toaster theme="dark" className="rounded-2xl" />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
