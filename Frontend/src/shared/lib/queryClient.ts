import { QueryClient } from "@tanstack/react-query";

/**
 * Global QueryClient instance for managing server state, caching, and network requests.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in ms before data is considered stale and needs refetching (5 minutes)
      staleTime: 5 * 60 * 1000, 
      // Number of retry attempts if a network request fails
      retry: 1, 
      // Disable automatic refetching when the user switches browser tabs back and forth
      refetchOnWindowFocus: false, 
    },
  },
});