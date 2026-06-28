import React, { useState, useEffect, useRef } from 'react';
import useMovieStore from '../store/useMovieStore';

const SearchBar = ({ selectedCategory, selectedGenre, setError }) => {
    const { addMovieToStore } = useMovieStore();

    // State: Stores the text currently typed in the search input
    const [searchName, setSearchName] = useState("");

    // State: Holds the live search suggestions returned from the TMDB API
    const [searchResults, setSearchResults] = useState([]);

    // State: Controls the visibility of the search results dropdown
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // State: Tracks the loading status during API fetch requests
    const [isLoading, setIsLoading] = useState(false);

    // Ref: Used to detect clicks outside the search container to close the dropdown
    const searchContainerRef = useRef(null);

    // Effect: Handles "click outside" logic for the search dropdown
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

    // Effect: Handles API calls for movie search with debouncing
    useEffect(() => {
        let timerId;
        const timerApiData = async () => {
            if (!searchName) {
                setSearchResults([]);
                return;
            }
            // Debounce: 500ms wait karo user ke type band karne ke baad
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

    // Handler: Adds a movie manually using the text entered in the search bar
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
            }

            const data = await response.json();
            addMovieToStore(data.movie);
            setSearchName("");
            setError("");
        } catch (error) {
            // console.log("Network error: ", error);
            setError("There is an issue with your network connection");
        }
    };

    // Handler: Adds a specific movie selected from the dropdown suggestions
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
            }

            const data = await response.json();
            addMovieToStore(data.movie);
            setSearchResults([]);
            setSearchName("");
            setError("");
        } catch (error) {
            // console.log("Network error: ", error);
            setError("There is an issue with your network connection");
        }
    };

    return (
        <div className="search-wrapper" ref={searchContainerRef}>
            <input
                type="text"
                placeholder="🔍 Search for a movie..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem',
                    fontFamily: 'var(--font-family)',
                    outline: 'none',
                    width: '280px',
                    transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-color)';
                    e.target.style.boxShadow = '0 0 12px rgba(139, 92, 246, 0.25)';
                    setIsDropdownOpen(true);
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.boxShadow = 'none';
                }}
            />
            <button className="btn-primary" onClick={handleAddMovie}>+ Add</button>

            {/* Loading State */}
            {isLoading && isDropdownOpen && (
                <div className="search-dropdown" style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p>Loading...</p>
                </div>
            )}

            {/* Search Results Dropdown */}
            {!isLoading && isDropdownOpen && searchResults.length > 0 && (
                <div className="search-dropdown">
                    {searchResults.slice(0, 5).map((movie) => (
                        <div
                            key={movie.id}
                            className="dropdown-item"
                            onClick={() => handleSelectMovie(movie)}
                        >
                            {movie.poster_path ? (
                                <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt="poster" />
                            ) : (
                                <div className="no-poster">N/A</div>
                            )}
                            <div className="dropdown-info">
                                <h4>{movie.title}</h4>
                                <span>
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
