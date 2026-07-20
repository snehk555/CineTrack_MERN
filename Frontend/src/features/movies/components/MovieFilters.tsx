import React from 'react';
import { useCategories, useGenres } from '../hooks/moviesQueries';
import type { Category, Genre } from '../../../types';

interface MovieFiltersProps {
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    selectedGenre: string;
    setSelectedGenre: (val: string) => void;
}

const MovieFilters: React.FC<MovieFiltersProps> = ({
    selectedCategory,
    setSelectedCategory,
    selectedGenre,
    setSelectedGenre,
}) => {
    const { data: categories = [] } = useCategories();
    const { data: genres = [] } = useGenres();

    return (
        <>
            <select
                className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-100 text-sm outline-none cursor-pointer transition-all duration-300 min-w-[150px] focus:border-amber-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
            >
                <option value="" className="bg-[#1e1b2e] text-white">📁 All Categories</option>
                {categories.map((category: Category) => (
                    <option key={category._id} value={category._id} className="bg-[#1e1b2e] text-white">
                        {category.name}
                    </option>
                ))}
            </select>

            <select
                className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-100 text-sm outline-none cursor-pointer transition-all duration-300 min-w-[150px] focus:border-amber-500"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
            >
                <option value="" className="bg-[#1e1b2e] text-white">🎭 All Genres</option>
                {genres.map((genre: Genre) => (
                    <option key={genre._id} value={genre._id} className="bg-[#1e1b2e] text-white">
                        {genre.name}
                    </option>
                ))}
            </select>
        </>
    );
};

export default MovieFilters;
