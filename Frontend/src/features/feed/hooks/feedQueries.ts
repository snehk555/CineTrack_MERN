import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Movie } from '../../../types';

interface FeedResponse {
  data: Movie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useFeed(page: number, limit: number = 12) {
  return useQuery({
    queryKey: ['feed', page, limit],
    queryFn: async () => {
      const { data } = await axios.get<{ success: boolean; data: FeedResponse }>(`/api/v1/feed`, {
        params: { page, limit },
        withCredentials: true,
      });
      return data.data;
    },
  });
}

export function useFeaturedFeed() {
  return useQuery({
    queryKey: ['feed', 'featured'],
    queryFn: async () => {
      const { data } = await axios.get<{ success: boolean; data: Movie[] }>(`/api/v1/feed/featured`, {
        withCredentials: true,
      });
      return data.data;
    },
  });
}
