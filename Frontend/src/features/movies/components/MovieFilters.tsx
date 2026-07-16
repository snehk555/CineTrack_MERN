import React from 'react';
import { useCategories } from '../hooks/useCategories';
import { useGenres } from '../hooks/useGenres';

interface MovieFiltersProps {
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    selectedGenre: string;
    setSelectedGenre: (val: string) => void;
}

const MovieFilters: React.FC<MovieFiltersProps> = ({ selectedCategory, setSelectedCategory, selectedGenre, setSelectedGenre }) => {

    // TanStack Query hooks - automatically cached, no useEffect/useState needed
    const { data: categories = [] } = useCategories();
    const { data: genres = [] } = useGenres();

    return (
        <>
            <select
                className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-100 font-[var(--font-outfit)] text-sm outline-none cursor-pointer transition-all duration-300 min-w-[150px] focus:border-violet-500 focus:shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
            >
                <option value=""  className="bg-[#1e1b2e] text-white">📁 Select Category</option>
                {categories.map((category) => (
                    <option key={category._id} value={category._id} className="bg-[#1e1b2e] text-white">
                        {category.name}
                    </option>
                ))}
            </select>

            <select
                className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-100 font-[var(--font-outfit)] text-sm outline-none cursor-pointer transition-all duration-300 min-w-[150px] focus:border-violet-500 focus:shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
            >
                <option value=""  className="bg-[#1e1b2e] text-white">🎭 Select Genre</option>
                {genres.map((genre) => (
                    <option key={genre._id} value={genre._id} className="bg-[#1e1b2e] text-white">
                        {genre.name}
                    </option>
                ))}
            </select>
        </>
    );
};

export default MovieFilters;
