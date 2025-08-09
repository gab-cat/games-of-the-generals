import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import "./index.css";
import App from "./App";

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

createRoot(document.getElementById("root")!).render(
  <ConvexProvider client={convex}>
    <ConvexAuthProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <App />
        {/* Add React Query DevTools for development */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ConvexAuthProvider>
  </ConvexProvider>,
);
