const MovieCard = ({ movie, handleWatched, isWatched ,cardErrorMsg}) => {
  return (
    <div className="relative w-[180px] flex flex-col transition-transform duration-300 hover:scale-105 hover:z-10">
      <img src={`https://image.tmdb.org/t/p/w500${movie.poster}`} alt={movie.title} className="w-[180px] h-[270px] object-cover rounded-lg block" />

      {isWatched ? (
        <span className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg shadow-emerald-500/30">✓ Watched</span>
      ) : (
        <span className="absolute top-4 right-4 bg-white/10 text-slate-400 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10">⏳ Pending</span>
      )}

      <div className="py-2 flex flex-col">
        <h3 className="text-base font-semibold mb-0.5 text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis">{movie.title}</h3>
        <p className="text-slate-400 text-xs mb-1">{movie.year}</p>

        <div className="flex gap-1.5 flex-wrap mb-2">
          {movie.category && (
            <span className="text-[0.65rem] px-2 py-0.5 rounded bg-violet-500/20 text-purple-300 border border-violet-500/30 font-semibold uppercase tracking-wide">{movie.category.name}</span>
          )}
          {movie.genre && movie.genre.map((g) => (
            <span key={g._id} className="text-[0.65rem] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase tracking-wide">{g.name}</span>
          ))}
        </div>

        <div className="flex gap-2 mt-auto relative">
          {cardErrorMsg && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-max max-w-[170px] bg-red-600/90 text-white text-[10px] font-bold px-2 py-1.5 rounded shadow-lg text-center backdrop-blur-sm animate-bounce z-20">
              {cardErrorMsg}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600/90"></div>
            </div>
          )}
          {handleWatched && (
            <button className="flex-1 bg-white/8 border-none text-white py-1.5 text-center rounded text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-white/15" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation()
              handleWatched(movie._id)
            }}>Mark Watched</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MovieCard