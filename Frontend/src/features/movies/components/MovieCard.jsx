// passing props through moviePage.jsx 

const MovieCard = ({ movie, handledelete, handleWatched }) => {
  return (
    <div className="glass-panel movie-card">
      {/* Poster -  image */}
      <img src={`https://image.tmdb.org/t/p/w500${movie.poster}`} alt={movie.title} className="movie-poster" />

      {/* Conditional Rendering: if movie is watched then showing these badges  */}
      {movie.isWatched ? (
        <span className="watched-badge">✓ Watched</span>
      ) : (
        <span className="unwatched-badge">⏳ Pending</span>
      )}

      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-year">{movie.year}</p>

{/** showing the tags data  */}
        <div className="movie-tags">

          {/** category tag because category is only one */}
          {movie.category && (
            <span className="tag category-tag"> {movie.category.name} </span>
          )}

          {/** for genres and they are array  */}

          {movie.genre && movie.genre.map((g) => (
                  <span key={ g._id} className="tag genre-tag"> {g.name} </span>
          ))}

        </div>

 
        <div className="card-actions">
          <button className="btn-small" onClick={(e) => {

            e.preventDefault();
            e.stopPropagation()
            handleWatched(movie._id)
          }}>Mark Watched</button>
          <button className="btn-small btn-danger" onClick={(e) => {
               e.preventDefault();
               e.stopPropagation()
            handledelete(movie._id)
            
            }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default MovieCard