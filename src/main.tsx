import { type ReactNode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { convexDeploymentUrl } from "./lib/runtime-mode";
import { releaseBootScreen } from "./lib/boot-screen";

// Create a new router instance
const router = createRouter({
  routeTree,
  // Pages are split into their own chunks; fetch a page's code when the
  // player hovers or touches its link so navigation doesn't wait on it.
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function ConvexAppProviders({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) {
  const [{ convex, queryClient }] = useState(() => {
    const client = new ConvexReactClient(url);
    const convexQueryClient = new ConvexQueryClient(client);
    const tanstackQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          queryKeyHashFn: convexQueryClient.hashFn(),
          queryFn: convexQueryClient.queryFn(),
          gcTime: 5 * 60 * 1000,
          staleTime: 0,
        },
      },
    });
    convexQueryClient.connect(tanstackQueryClient);
    return { convex: client, queryClient: tanstackQueryClient };
  });

  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>
        <ConvexQueryCacheProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            {import.meta.env.DEV && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </ConvexQueryCacheProvider>
      </ConvexAuthProvider>
    </ConvexProvider>
  );
}

function AppTree() {
  // Loaders that mount during the first render hold the title card in their
  // layout effects, which run before this; if none did, the app is ready.
  useEffect(() => releaseBootScreen(), []);

  const tree = (
    <>
      <RouterProvider router={router} />
      {import.meta.env.PROD && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </>
  );

  if (!convexDeploymentUrl) {
    return tree;
  }

  return (
    <ConvexAppProviders url={convexDeploymentUrl}>{tree}</ConvexAppProviders>
  );
}

// In production the app stylesheet loads without blocking the first paint (see
// nonBlockingAppCss in vite.config.ts), so the loader in index.html shows at
// once. Render React only once that stylesheet is in, so nothing paints unstyled.
function appStylesReady(): Promise<void> {
  const link = document.querySelector<HTMLLinkElement>("link[data-app-css]");
  if (!link || link.media === "all") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      link.media = "all";
      resolve();
    };
    link.addEventListener("load", done, { once: true });
    link.addEventListener("error", done, { once: true });
    // The load may have fired between parsing and this check.
    if (link.sheet) done();
  });
}

void appStylesReady().then(() => {
  createRoot(document.getElementById("root")!, {
    // Never leave the title card covering a crashed app.
    onUncaughtError: (error) => {
      releaseBootScreen(true);
      reportError(error);
    },
  }).render(<AppTree />);
});

// Register PWA update checker
if (typeof window !== "undefined" && !import.meta.env.DEV) {
  const updateSW = registerSW({
    immediate: true,
    // Vite PWA v1 exposes either onRegistered or onRegisteredSW depending on import
    // Set up periodic/background checks for updates
    onRegistered(registration) {
      if (!registration) return;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => {});
        }
      });
      setInterval(
        () => {
          registration.update().catch(() => {});
        },
        60 * 60 * 1000,
      );
    },
    // Back-compat: some versions expose onRegisteredSW
    onRegisteredSW(_swUrl: string, registration?: ServiceWorkerRegistration) {
      if (!registration) return;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => {});
        }
      });
      setInterval(
        () => {
          registration.update().catch(() => {});
        },
        60 * 60 * 1000,
      );
    },
    // If the plugin ever signals a waiting SW (prompt mode), activate it immediately
    onNeedRefresh() {
      updateSW().catch(() => {});
    },
    onOfflineReady() {},
  });

  // When a new SW takes control, reload the page once to load the fresh bundle
  let hasRefreshed = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hasRefreshed) return;
    hasRefreshed = true;
    window.location.reload();
  });
}
