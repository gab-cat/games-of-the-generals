import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useConvexAuth } from "convex/react";
import { useConvexQueryWithOptions } from "@/lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { lazy, Suspense } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useEffect } from "react";
import { LoadingSpinner } from "../components/LoadingSpinner";

// Lazy load components for better code splitting
const SignInForm = lazy(() =>
  import("../auth/SignInForm").then((module) => ({
    default: module.SignInForm,
  })),
);
const SetupPage = lazy(() =>
  import("../pages/setup/00.setup-page").then((module) => ({
    default: module.SetupPage,
  })),
);
const LobbyPage = lazy(() =>
  import("../pages/lobby/00.lobby-page").then((module) => ({
    default: module.LobbyPage,
  })),
);

type IndexSearch = {
  lobbyId?: string;
};

function IndexComponent() {
  const { lobbyId } = Route.useSearch();
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Query profile only when authenticated - profile data changes infrequently
  const { data: profile } = useConvexQueryWithOptions(
    api.profiles.getCurrentProfile,
    {},
    {
      enabled: !!isAuthenticated,
      staleTime: 120000, // 2 minutes - profile data changes infrequently
      gcTime: 600000, // 10 minutes cache
    },
  );
  const profileLoaded = profile !== undefined;

  const handleOpenMessaging = (lobbyId?: Id<"lobbies">) => {
    if (
      typeof window !== "undefined" &&
      (window as any).openMessagingWithLobby
    ) {
      (window as any).openMessagingWithLobby(lobbyId);
    }
  };

  // Handle lobbyId from URL parameter - Only for navigation, not for opening messaging
  useEffect(() => {
    // Remove the automatic messaging panel opening
    // The lobbyId parameter is now only used for navigation after joining a lobby
  }, [lobbyId, profile]);

  // Show loading only when auth state is still being determined
  if (isLoading || (isAuthenticated && !profileLoaded)) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Unauthenticated>
        <Suspense fallback={<LoadingSpinner />}>
          <SignInForm />
        </Suspense>
      </Unauthenticated>

      <Authenticated>
        <Suspense fallback={<LoadingSpinner />}>
          {!profile ? (
            <SetupPage />
          ) : (
            <LobbyPage
              profile={profile}
              onOpenMessaging={handleOpenMessaging}
            />
          )}
        </Suspense>
      </Authenticated>
    </>
  );
}

export const Route = createFileRoute("/")({
  component: IndexComponent,
  validateSearch: (search: Record<string, unknown>): IndexSearch => {
    return {
      lobbyId: typeof search.lobbyId === "string" ? search.lobbyId : undefined,
    };
  },
});
