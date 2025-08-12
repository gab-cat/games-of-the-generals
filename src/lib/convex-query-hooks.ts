import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { FunctionReference } from "convex/server";
import { useAuthActions } from "@convex-dev/auth/react";

/**
 * Custom hook that wraps TanStack Query's useQuery with Convex
 * Provides proper typing and error handling for Convex queries
 */
export function useConvexQuery<
  Query extends FunctionReference<"query", "public", any, any>,
>(
  query: Query,
  args?: any
) {
  return useQuery({
    ...convexQuery(query, args || {}),
    // You can add any TanStack Query options here
    retry: false, // Convex handles retries automatically
    refetchOnWindowFocus: false, // Convex data is always up-to-date
  });
}

/**
 * Custom hook that wraps TanStack Query's useQuery with Convex and additional options
 * Allows you to pass custom TanStack Query options
 */
export function useConvexQueryWithOptions<
  Query extends FunctionReference<"query", "public", any, any>,
>(
  query: Query,
  args: any,
  options?: {
    enabled?: boolean;
    initialData?: any;
    gcTime?: number;
    select?: (data: any) => any;
  }
) {
  return useQuery({
    ...convexQuery(query, args || {}),
    ...options,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Custom infinite query hook for Convex queries using TanStack Query.
 * Provide a function that maps pageParam -> query args. The pageParam should typically be a cursor or timestamp.
 */
export function useConvexInfiniteQuery<
  Query extends FunctionReference<"query", "public", any, any>,
>(
  query: Query,
  getArgsForPage: (pageParam: unknown) => any,
  options?: {
    initialPageParam?: unknown;
    getNextPageParam?: (lastPage: any, allPages: any[]) => unknown;
    enabled?: boolean;
  }
) {
  // Create a stable base key from initial args (without pageParam)
  const base = convexQuery(query, getArgsForPage(undefined));

  return useInfiniteQuery({
    queryKey: [...(base.queryKey as any), "infinite"],
    queryFn: async ({ pageParam, signal, queryKey }) => {
      const current = convexQuery(query, getArgsForPage(pageParam));
      // Reuse the generated queryFn from convexQuery, passing expected context
      return await (current.queryFn as any)({ queryKey: current.queryKey, signal });
    },
    initialPageParam: options?.initialPageParam,
    getNextPageParam:
      options?.getNextPageParam || ((lastPage: any) => lastPage?.continueTimestamp ?? undefined),
    enabled: options?.enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Custom hook that wraps TanStack Query's useMutation with Convex
 * Provides proper typing and error handling for Convex mutations
 */
export function useConvexMutationWithQuery<
  Mutation extends FunctionReference<"mutation", "public", any, any>,
>(
  mutation: Mutation,
  options?: {
    onSuccess?: (data: any, variables: any) => void;
    onError?: (error: any, variables: any) => void;
    onMutate?: (variables: any) => void;
    onSettled?: (data: any, error: any, variables: any) => void;
  }
) {
  return useMutation({
    mutationFn: useConvexMutation(mutation),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    onMutate: options?.onMutate,
    onSettled: options?.onSettled,
  });
}

/**
 * Hook to get the query client for manual cache management
 */
export function useConvexQueryClient() {
  return useQueryClient();
}

/**
 * Custom hook for auth actions with TanStack Query error handling
 * Provides structured error handling for sign in/sign up operations
 */
export function useAuthMutation(options?: {
  onSuccess?: (data: any, variables: any) => void;
  onError?: (error: any, variables: any) => void;
  onMutate?: (variables: any) => void;
  onSettled?: (data: any, error: any, variables: any) => void;
}) {
  const { signIn } = useAuthActions();
  
  return useMutation({
    mutationFn: async ({ 
      provider, 
      formData 
    }: { 
      provider: "password" | "anonymous"; 
      formData?: FormData 
    }) => {
      if (provider === "anonymous") {
        return await signIn("anonymous");
      }
      if (!formData) {
        throw new Error("Form data is required for password sign in");
      }
      return await signIn("password", formData);
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    onMutate: options?.onMutate,
    onSettled: options?.onSettled,
  });
}
