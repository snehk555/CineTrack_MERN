import { useState, useEffect, useRef } from 'react';
import useMovieStore from '../store/useMovieStore';

const SearchBar = ({ selectedCategory, selectedGenre, setError, setSelectedCategory, setSelectedGenre }) => {

    const { addMovieToStore } = useMovieStore();

    const [searchName, setSearchName] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchContainerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        let timerId;
        const timerApiData = async () => {
            if (!searchName) {
                setSearchResults([]);
                return;
            }
            timerId = setTimeout(async () => {
                try {
                    setIsLoading(true);
                    const response = await fetch(`http://localhost:8000/api/movies/search?name=${searchName}`, { credentials: 'include' });
                    const data = await response.json();
                    setSearchResults(data);
                    setIsLoading(false);
                } catch (error) {
                    console.log("search error:", error);
                    setIsLoading(false);
                }
            }, 500);
        };
        timerApiData();
        return () => { clearTimeout(timerId); };
    }, [searchName]);

    const handleAddMovie = async () => {
        if (!searchName) return;

        if (!selectedCategory || !selectedGenre) {
            setError("please select both Category and a Genre before adding a movie!");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/movies/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ searchName: searchName, category: selectedCategory, genre: [selectedGenre] }),
                credentials: 'include'
            });

            if (!response.ok) {
                setError("Error from our side: please wait and try again later");
                setTimeout(() => setError(""), 3500);
                return;
            }

            const data = await response.json();
            addMovieToStore(data.movie);
            setSearchName("");
            setSelectedCategory("")
            setSelectedGenre("")
            setError("");
        } catch  {
            setError("There is an issue with your network connection");
        }
    };

    const handleSelectMovie = async (selectedMovie) => {
        if (!selectedCategory || !selectedGenre) {
            setError("please select both Category and a Genre before adding a movie!");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/movies/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movieDetails: selectedMovie, category: selectedCategory, genre: [selectedGenre] }),
                credentials: 'include'
            });

            if (!response.ok) {
                setError("Error from our side: please wait and try again later");
                setTimeout(() => setError(""), 3500);
                return;
            }

            const data = await response.json();
            addMovieToStore(data.movie);
            setSearchResults([]);
            setSearchName("");
            setSelectedCategory("")
            setSelectedGenre("")
            setError("");
        } catch  {
            setError("There is an issue with your network connection");
        }
    };

    return (
        <div className="relative" ref={searchContainerRef}>
            <div className="flex gap-2 items-center">
                <input
                    type="text"
                    placeholder="🔍 Search for a movie..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-100 text-sm font-[var(--font-outfit)] outline-none w-[280px] transition-all duration-300 focus:border-violet-500 focus:shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                    onFocus={() => setIsDropdownOpen(true)}
                />
                <button
                    className="bg-violet-600 text-white border-none px-6 py-2.5 rounded-lg font-[var(--font-outfit)] font-medium text-sm cursor-pointer transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30"
                    onClick={handleAddMovie}
                >
                    + Add
                </button>
            </div>

            {isLoading && isDropdownOpen && (
                <div className="absolute top-12 left-0 w-[300px] bg-slate-900/92 backdrop-blur-2xl border border-white/10 rounded-xl p-4 text-center text-slate-400 z-[100] shadow-2xl"
                     style={{animation: 'slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'}}>
                    <p>Loading...</p>
                </div>
            )}

            {!isLoading && isDropdownOpen && searchResults.length > 0 && (
                <div className="absolute top-12 left-0 w-[300px] bg-slate-900/92 backdrop-blur-2xl border border-white/10 rounded-xl p-2 flex flex-col gap-1 z-[100] shadow-2xl"
                     style={{animation: 'slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'}}>
                    {searchResults.slice(0, 5).map((movie) => (
                        <div
                            key={movie.id}
                            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-violet-500/20"
                            onClick={() => handleSelectMovie(movie)}
                        >
                            {movie.poster_path ? (
                                <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt="poster" className="w-10 h-15 rounded object-cover" />
                            ) : (
                                <div className="w-10 h-15 rounded bg-white/10 flex items-center justify-center text-xs text-slate-400">N/A</div>
                            )}
                            <div>
                                <h4 className="text-sm text-white m-0 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">{movie.title}</h4>
                                <span className="text-xs text-slate-400 bg-white/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                                    {movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}
                                    • {movie.original_language.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
