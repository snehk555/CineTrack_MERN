import React from 'react'

import MovieCard from './MovieCard.jsx';
import useMovieStore from '../store/useMovieStore.js';
import { Link } from 'react-router-dom';

const MoviesPage = () => {

     const {movies, setMovies} = useMovieStore();


  // Sends a DELETE request to remove a movie from the database,
  // then filters it out from local state to update the UI without a full page reload
  const handledelete = async (id) => {
    const response = await fetch(`http://localhost:8000/api/movies/delete/${id}`, {
      method: "DELETE",
      credentials: 'include'
    })
    setMovies(movies.filter((movie) => movie._id !== id))
  }  

  // Marks a movie as watched by sending a PUT request to update the database,
  // then uses immutable state update (spread operator) to reflect the change in the UI
  const handleWatched = async (id) => {
    const response = await fetch(`http://localhost:8000/api/movies/update/${id}`, {
      method: "PUT",
      credentials: 'include'
    })
    setMovies(movies.map((movie) => {
      return movie._id === id ? { ...movie, isWatched: true } : movie
    }))
  }




  return (
     <main>
        <div style={{ textAlign: 'center', margin: '4rem 0' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', letterSpacing: '-1px' }}>
            Track Your <span style={{ color: 'var(--primary-color)' }}>Cinematic</span> Journey
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Your personal digital movie diary. Keep track of what you've watched, what you want to watch, and rate your favorites.
          </p>
        </div>

        {/* Movie Grid — Maps over saved movies and renders each as an extracted MovieCard component */}
        {/* Props passed: movie data, delete handler, and watched status handler */}
        <div className="movies-grid">
         {movies.map((movie) => (
  <Link to={`/movies/${movie._id}`} key={movie._id} style={{ textDecoration: 'none' }}>
    <MovieCard
      movie={movie}
      handledelete={handledelete}
      handleWatched={handleWatched}
    />
  </Link>
))}

        </div>

      </main>
  )
}

export default MoviesPage