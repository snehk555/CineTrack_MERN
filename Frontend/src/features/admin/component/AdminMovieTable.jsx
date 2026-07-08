const AdminMovieTable = ({ movies, onDelete }) => {

  if (!movies || movies.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 text-lg">No movies found in the database.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/8">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-white/5 text-slate-400 uppercase text-xs tracking-wider">
            <th className="px-5 py-4 font-medium">Poster</th>
            <th className="px-5 py-4 font-medium">Title</th>
            <th className="px-5 py-4 font-medium">Year</th>
            <th className="px-5 py-4 font-medium">Category</th>
            <th className="px-5 py-4 font-medium">Genre</th>
   
            <th className="px-5 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {movies.map((movie) => (
            <tr key={movie._id} className="border-t border-white/5 transition-colors duration-200 hover:bg-white/[0.03]">
              <td className="px-5 py-3">
                <img
                  src={`https://image.tmdb.org/t/p/w92${movie.poster}`}
                  alt={movie.title}
                  className="w-10 h-14 rounded object-cover"
                />
              </td>
              <td className="px-5 py-3 text-slate-100 font-medium">{movie.title}</td>
              <td className="px-5 py-3 text-slate-400">{movie.year}</td>
              <td className="px-5 py-3">
                {movie.category && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20 font-medium">
                    {movie.category.name}
                  </span>
                )}
              </td>
              <td className="px-5 py-3">
  <div className="flex gap-1 flex-wrap">
    {movie.genre && movie.genre.map((g) => (
      <span key={g._id} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-medium">
        {g.name}
      </span>
    ))}
  </div>
</td>


              
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => onDelete(movie._id)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 cursor-pointer transition-all duration-200 hover:bg-red-500/25 hover:text-red-300"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminMovieTable;
