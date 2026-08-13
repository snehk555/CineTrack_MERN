import { useGenres } from '../../../features/movies/hooks/moviesQueries';
import { useAppDispatch, useAppSelector, setGenre, resetFilters } from '../../../store';
import type { Genre } from '../../../types';

interface GenreTagBarProps {
  /** If provided, clicking a genre navigates to this prefix, otherwise uses Redux filters */
  className?: string;
}

export default function GenreTagBar({ className = '' }: GenreTagBarProps) {
  const dispatch = useAppDispatch();
  const activeGenre = useAppSelector((s) => s.filters.genre);
  const { data: genres, isLoading } = useGenres();

  if (isLoading) {
    return (
      <div className={`genre-tag-bar ${className}`} style={{ padding: '10px 0' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 70 + Math.random() * 40,
              height: 28,
              borderRadius: 5,
              background: 'rgba(255,255,255,0.05)',
              animation: 'pulse 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`genre-tag-bar ${className}`}>
      {/* All button */}
      <button
        onClick={() => dispatch(resetFilters())}
        className={`genre-tag ${!activeGenre ? 'active' : ''}`}
      >
        All
      </button>

      {(genres as Genre[] | undefined)?.map((genre) => (
        <button
          key={genre._id}
          onClick={() =>
            dispatch(activeGenre === genre._id ? setGenre('') : setGenre(genre._id))
          }
          className={`genre-tag ${activeGenre === genre._id ? 'active' : ''}`}
        >
          {genre.name}
        </button>
      ))}
    </div>
  );
}
