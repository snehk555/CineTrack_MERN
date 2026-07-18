import { Movie } from '../../../types';

interface AdminMoviesTableProps {
  movies: Movie[];
  onDelete: (id: string) => void;
}

export default function AdminMoviesTable({ movies, onDelete }: AdminMoviesTableProps) {
  return (
    <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #333' }}>
          <th style={{ textAlign: 'left', padding: '8px' }}>Title</th>
          <th style={{ textAlign: 'left', padding: '8px' }}>Year</th>
          <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
          <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {movies.map((movie) => (
          <tr key={movie._id} style={{ borderBottom: '1px solid #222' }}>
            <td style={{ padding: '8px' }}>{movie.title}</td>
            <td style={{ padding: '8px' }}>{movie.releaseYear}</td>
            <td style={{ padding: '8px' }}>{movie.status}</td>
            <td style={{ padding: '8px' }}>
              <button
                onClick={() => onDelete(movie._id)}
                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
