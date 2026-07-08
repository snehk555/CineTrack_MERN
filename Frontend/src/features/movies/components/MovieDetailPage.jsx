import useMovieStore from '../store/useMovieStore.js';
import { useParams, useNavigate } from 'react-router-dom'

const MovieDetailPage = () => {
    const { movies } = useMovieStore();
    const { id } = useParams();
    const navigate = useNavigate();

    const selectedMovie = movies.find((movie) => movie._id === id);

    if (!selectedMovie) return <h2 className="text-white text-center mt-24">Loading Movie...</h2>;

    return (
        <div className="flex flex-col items-center px-4 py-8 max-w-[700px] mx-auto" style={{animation: 'fadeInUp 0.5s ease'}}>

            <button className="self-start bg-transparent border border-white/8 text-slate-400 px-5 py-2 rounded-lg cursor-pointer font-[var(--font-outfit)] text-sm font-medium transition-all duration-300 mb-8 hover:border-violet-500 hover:text-violet-500 hover:-translate-x-1" onClick={() => navigate('/movies')}>
                ⬅ Back to Movies
            </button>

            <div className="w-[300px] rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(139,92,246,0.25)]">
                <img
                    src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster}`}
                    alt={selectedMovie.title}
                    className="w-full h-[450px] object-cover block"
                />
            </div>

            <h1 className="text-4xl font-bold mt-6 bg-gradient-to-r from-slate-100 to-purple-400 bg-clip-text text-transparent text-center">{selectedMovie.title}</h1>
            <p className="text-lg text-slate-400 mt-2">Release Year: {selectedMovie.year}</p>

            <span className={selectedMovie.isWatched
                ? "inline-block mt-4 px-5 py-1.5 rounded-full text-sm font-semibold bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "inline-block mt-4 px-5 py-1.5 rounded-full text-sm font-semibold bg-white/10 text-slate-400 border border-white/10"
            }>
                {selectedMovie.isWatched ? "✓ Watched" : "⏳ Pending"}
            </span>
        </div>
    )
}

export default MovieDetailPage