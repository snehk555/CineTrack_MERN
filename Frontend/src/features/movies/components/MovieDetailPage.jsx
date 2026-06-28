import useMovieStore from '../store/useMovieStore.js';

import { useParams, useNavigate } from 'react-router-dom'

const MovieDetailPage = () => {

  const { movies } = useMovieStore();
  const { id } = useParams();
  const navigate = useNavigate();

  const selectedMovie = movies.find((movie) => movie._id === id);

  // If we refresh the page and the store is empty, show a loading message
  if (!selectedMovie) return <h2 style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Loading Movie...</h2>;

  return (
    <div className="detail-page">

      {/* Go Back Button */}
      <button className="btn-back" onClick={() => navigate('/movies')}>
        ⬅ Back to Movies
      </button>

      {/* Movie Poster */}
      <div className="detail-poster-wrapper">
        <img
          src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster}`}
          alt={selectedMovie.title}
          className="detail-poster"
        />
      </div>

      {/* Movie Info */}
      <h1 className="detail-title">{selectedMovie.title}</h1>
      <p className="detail-year">Release Year: {selectedMovie.year}</p>

      {/* Watch Status Badge */}
      <span className={selectedMovie.isWatched ? "detail-badge watched" : "detail-badge pending"}>
        {selectedMovie.isWatched ? "✓ Watched" : "⏳ Pending"}
      </span>

    </div>
  )
}

export default MovieDetailPage