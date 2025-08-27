import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import "./index.css";
import { registerSW } from 'virtual:pwa-register';
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";

// Import the generated route tree
import { routeTree } from './routeTree.gen';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Create ConvexQueryClient and connect to TanStack Query
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
      // Keep subscriptions active for 5 minutes after unmount
      gcTime: 5 * 60 * 1000,
      // Reduce stale time since Convex data is never stale
      staleTime: 0,
    },
  },
});
convexQueryClient.connect(queryClient);

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <ConvexProvider client={convex}>
    <ConvexAuthProvider client={convex}>
      <ConvexQueryCacheProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {/* Add React Query DevTools for development only */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
      </ConvexQueryCacheProvider>
    </ConvexAuthProvider>
  </ConvexProvider>,
);

// Register PWA update checker
if (typeof window !== 'undefined') {
  const updateSW = registerSW({
    immediate: true,
    // Vite PWA v1 exposes either onRegistered or onRegisteredSW depending on import
    // Set up periodic/background checks for updates
    onRegistered(registration) {
      if (!registration) return;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);
    },
    // Back-compat: some versions expose onRegisteredSW
    onRegisteredSW(_swUrl: string, registration?: ServiceWorkerRegistration) {
      if (!registration) return;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);
    },
    // If the plugin ever signals a waiting SW (prompt mode), activate it immediately
    onNeedRefresh() {
      updateSW().catch(() => {});
    },
    onOfflineReady() {},
  });

  // When a new SW takes control, reload the page once to load the fresh bundle
  let hasRefreshed = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasRefreshed) return;
    hasRefreshed = true;
    window.location.reload();
  });
}
