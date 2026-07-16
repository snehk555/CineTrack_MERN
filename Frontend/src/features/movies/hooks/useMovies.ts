import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/apiClient";
import { Movie } from "../../../shared/types/movie";

interface MovieFilters {
  category?: string;
  genre?: string;
  searchQuery?: string;
}

export const useMovies = (filters?: MovieFilters) => {
  return useQuery<{ movies: Movie[] }>({
    queryKey: ['movies', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.genre) params.append('genre', filters.genre);
      if (filters?.searchQuery) params.append('name', filters.searchQuery);
      
      const queryString = params.toString();
      const endpoint = queryString ? `/movies/all?${queryString}` : '/movies/all';
      
      const response = await apiClient.get(endpoint);
      return response.data; 
    }
  });
};