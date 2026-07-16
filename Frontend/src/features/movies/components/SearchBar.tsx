import React, { useState, useEffect, useRef } from 'react';
import useMovieStore from '../store/useMovieStore';
import { apiClient } from '../../../shared/lib/apiClient';

interface TMDBMovie {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
    original_language: string;
}

interface SearchBarProps {
    selectedCategory: string;
    selectedGenre: string;
    setError: (err: string) => void;
    setSelectedCategory: (val: string) => void;
    setSelectedGenre: (val: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ selectedCategory, selectedGenre, setError, setSelectedCategory, setSelectedGenre }) => {

    const { addMovieToStore } = useMovieStore();

    const [searchName, setSearchName] = useState("");
    const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Click outside handler — pure UI logic, no API call, keep as is
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Debounced search — uses apiClient instead of raw fetch
    useEffect(() => {
        let timerId: number | undefined;
        const timerApiData = async () => {
            if (!searchName) {
                setSearchResults([]);
                return;
            }
            timerId = window.setTimeout(async () => {
                try {
                    setIsLoading(true);
                    const response = await apiClient.get(`/movies/search?name=${searchName}`);
                    setSearchResults(response.data);
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
            const response = await apiClient.post('/movies/add', {
                searchName,
                category: selectedCategory,
                genre: [selectedGenre]
            });
            addMovieToStore(response.data.movie);
            setSearchName("");
            setSelectedCategory("");
            setSelectedGenre("");
            setError("");
        } catch {
            setError("Error from our side: please wait and try again later");
            setTimeout(() => setError(""), 3500);
        }
    };

    const handleSelectMovie = async (selectedMovie: TMDBMovie) => {
        if (!selectedCategory || !selectedGenre) {
            setError("please select both Category and a Genre before adding a movie!");
            return;
        }

        try {
            const response = await apiClient.post('/movies/add', {
                movieDetails: selectedMovie,
                category: selectedCategory,
                genre: [selectedGenre]
            });
            addMovieToStore(response.data.movie);
            setSearchResults([]);
            setSearchName("");
            setSelectedCategory("");
            setSelectedGenre("");
            setError("");
        } catch {
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
