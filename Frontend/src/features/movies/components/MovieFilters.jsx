import React, { useState, useEffect } from 'react';

const MovieFilters = ({ selectedCategory, setSelectedCategory, selectedGenre, setSelectedGenre }) => {
    const [categories, setCategories] = useState([]);
    const [genres, setGenres] = useState([]);

    // Effect: Fetch categories and genres from backend on mount
    useEffect(() => {
        const fetchData = async () => {
            const responseCategory = await fetch("http://localhost:8000/api/movies/category/get");
            const dataCategory = await responseCategory.json();
            setCategories(dataCategory);

            const genreResponse = await fetch("http://localhost:8000/api/movies/genre/get");
            const dataGenre = await genreResponse.json();
            setGenres(dataGenre);
        };
        fetchData();
    }, []);

    return (
        <>
            {/* Category Dropdown */}
            <select
                className="header-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
            >
                <option value="" disabled>📁 Select Category</option>
                {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                        {category.name}
                    </option>
                ))}
            </select>

            {/* Genre Dropdown */}
            <select
                className="header-select"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
            >
                <option value="" disabled>🎭 Select Genre</option>
                {genres.map((genre) => (
                    <option key={genre._id} value={genre._id}>
                        {genre.name}
                    </option>
                ))}
            </select>
        </>
    );
};

export default MovieFilters;
