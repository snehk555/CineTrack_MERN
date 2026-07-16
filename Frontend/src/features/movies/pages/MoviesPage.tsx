import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Movie } from '../../../shared/types/movie';
import MovieCard from '../components/MovieCard';
import { watchListStore } from '../store/useMovieStore.js';
import { useMovies } from '../hooks/useMovies';

const MoviesPage = () => {
    const [searchParams] = useSearchParams();
    const category = searchParams.get('category') || undefined;
    const genre = searchParams.get('genre') || undefined;

    const { data, isLoading, isError } = useMovies({ category, genre });
    const movies = data?.movies || [];

    const { userWatchlist, fetchUserWatchlist, addtoWatchlist, cardError } = watchListStore();

    useEffect(() => {
        fetchUserWatchlist();
    }, [fetchUserWatchlist]);

    const handleWatched = async (id: string) => {
        await addtoWatchlist(id);
    };

    return (
        <main>
            <div className="text-center my-16">
                <h1 className="text-5xl mb-4 tracking-tight text-white">
                    Track Your <span className="text-violet-500">Cinematic</span> Journey
                </h1>
                <p className="text-slate-400 text-lg max-w-[600px] mx-auto mb-12">
                    Your personal digital movie diary. Keep track of what you've watched, what you want to watch, and rate your favorites.
                </p>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-20">
                    <p className="text-violet-400 text-xl font-semibold animate-pulse">Loading movies...</p>
                </div>
            )}

            {isError && (
                <div className="flex justify-center items-center py-20">
                    <p className="text-red-400 text-xl font-semibold">Failed to load movies. Please try again.</p>
                </div>
            )}

            {!isLoading && !isError && movies.length === 0 && (
                <div className="flex justify-center items-center py-20">
                    <p className="text-slate-400 text-xl">No movies found for the selected filters.</p>
                </div>
            )}

            {!isLoading && movies.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,180px)] gap-6 mt-8 justify-start items-start">
                    {movies.map((movie) => {
                        const isMovieWatched = userWatchlist.some(
                            (item: Movie & { movieId?: Movie }) =>
                                item.movieId?._id === movie._id || item._id === movie._id
                        );
                        return (
                            <Link to={`/movies/${movie._id}`} key={movie._id} className="no-underline">
                                <MovieCard
                                    movie={movie}
                                    handleWatched={handleWatched}
                                    isWatched={isMovieWatched}
                                    cardErrorMsg={cardError.movieId === movie._id ? cardError.message : null}
                                />
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
};

export default MoviesPage;