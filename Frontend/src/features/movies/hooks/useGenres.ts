import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/apiClient";

interface Genre {
  _id: string;
  name: string;
}

/**
 * Custom hook to fetch all movie genres using TanStack Query.
 * Automatically handles caching, loading states, and error management.
 */
export const useGenres = () => {
  return useQuery<Genre[]>({
    queryKey: ["genres"],
    queryFn: async () => {
      const response = await apiClient.get("/movies/genre/get");
      return response.data;
    },
  });
};
