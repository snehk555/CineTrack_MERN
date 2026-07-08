import { useEffect } from 'react';
import MovieCard from './MovieCard.jsx';
import useMovieStore, { watchListStore } from '../store/useMovieStore.js';
import { Link } from 'react-router-dom';

const MoviesPage = () => {
    const {movies, setMovies} = useMovieStore();
    const { userWatchlist, fetchUserWatchlist, addtoWatchlist, cardError} = watchListStore();

  // when there is page load then watchlist is come

  useEffect(() => {
      fetchUserWatchlist();
  },[fetchUserWatchlist]);

    const handleWatched = async (id) => {
          await addtoWatchlist(id);
    }

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

            

            <div className="grid grid-cols-[repeat(auto-fill,180px)] gap-6 mt-8 justify-start items-start">
                {movies.map((movie) => {
                     const isMovieWatched = userWatchlist.some((item) => item.movieId?._id === movie._id);

                     return (
                        <Link to={`/movies/${movie._id}`} key={movie._id} className='no-underline'> 
                        <MovieCard 
                        movie={movie}
                        handleWatched={handleWatched}
                        isWatched={isMovieWatched}
                         cardErrorMsg={cardError.movieId === movie._id ? cardError.message : null} 
                        /> 
                              
                        </Link>
                     )
                }) }
            </div>
        </main>
    )
}

export default MoviesPage