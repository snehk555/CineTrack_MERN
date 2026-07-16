import { create } from 'zustand';
import { Movie } from '../../../shared/types/movie';
import { apiClient } from '../../../shared/lib/apiClient';

interface MovieStore {
    movies: Movie[];
    setMovies: (fetchMovies: Movie[]) => void;
    addMovieToStore: (newMovie: Movie) => void;
}

const useMovieStore = create<MovieStore>((set) => ({
    movies: [],
    setMovies: (fetchMovies) => {
        set({ movies: fetchMovies || [] });
    },
    addMovieToStore: (newMovie) => {
        set((state) => ({
            movies: [...state.movies, newMovie]
        }));
    }
}));

export default useMovieStore;

interface WatchlistCardError {
    movieId: string | null;
    message: string | null;
}

interface WatchlistStore {
    userWatchlist: Movie[];
    cardError: WatchlistCardError;
    error?: string | null;
    addtoWatchlist: (movieId: string) => Promise<void>;
    fetchUserWatchlist: () => Promise<void>;
}

export const watchListStore = create<WatchlistStore>((set) => ({
    userWatchlist: [],
    cardError: {
        movieId: null,
        message: null
    },

    addtoWatchlist: async (movieId) => {
        set({ cardError: { movieId: null, message: null } });
        try {
            const response = await apiClient.post('/user/addtowatchlist', { movieId });
            set((state) => ({
                userWatchlist: [...state.userWatchlist, response.data.WatchingListing],
                cardError: { movieId: null, message: null }
            }));
        } catch (error: any) {
            const message = error.response?.data?.message || "Network error!";
            set({ cardError: { movieId: movieId, message } });
            setTimeout(() => set({ cardError: { movieId: null, message: null } }), 3000);
        }
    },

    fetchUserWatchlist: async () => {
        set({ error: null });
        try {
            const response = await apiClient.get('/user/getuserwatchlist');
            set({ userWatchlist: response.data.watchlist });
        } catch (error: any) {
            const message = error.response?.data?.message || "Network error while loading watchlist.";
            set({ error: message });
        }
    }
}));
