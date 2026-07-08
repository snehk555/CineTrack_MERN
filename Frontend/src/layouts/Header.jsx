import {useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import useAuthStore from '../features/auth/store/useAuthStore';
import MovieFilters from '../features/movies/components/MovieFilters';
import UserProfile from '../features/auth/components/UserProfile';

const Header = () => {
    const {user} = useAuthStore();

    const [error, setError] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedCategory = searchParams.get('category') || "";
    const selectedGenre = searchParams.get('genre') || "";

    const setSelectedCategory = (val) => {
        setSearchParams((prevParams) => {
            if (val) {
                prevParams.set('category', val)
            } else {
                prevParams.delete('category');
            }
            return prevParams;
        })
    }

    const setSelectedGenre = (val) => {
        setSearchParams((prevParams) => {
            if (val) {
                prevParams.set('genre', val);
            } else {
                prevParams.delete('genre');
            }
            return prevParams;
        });
    };

    return (
        <header className="flex justify-between items-center pb-6 border-b border-white/8 mb-8">
            <div>
                <Link to='/' className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent tracking-tight no-underline">
                    CineTrack 🍿
                </Link>
            </div>

            {user ? (
                <>
                    <div className="flex gap-3 items-center relative">
                        <MovieFilters selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            selectedGenre={selectedGenre}
                            setSelectedGenre={setSelectedGenre}/>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to='/movies' className="text-slate-400 no-underline font-medium text-sm px-4 py-2 rounded-lg transition-all duration-300 hover:text-white hover:bg-white/5">
                            🎬 My Movies
                        </Link>
                        <UserProfile/>
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-4">
                    <Link to="/login" className="bg-violet-600 text-white no-underline px-5 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30">
                        Login
                    </Link>
                    <Link to="/signup" className="bg-violet-600 text-white no-underline px-5 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30">
                        Sign Up
                    </Link>
                </div>
            )}

            {error && (
                <div className="fixed top-5 right-5 bg-red-500/15 border border-red-500/40 text-red-300 px-5 py-3 rounded-xl text-sm font-medium backdrop-blur-xl z-[999] max-w-sm"
                     style={{animation: 'toastIn 0.4s ease, toastOut 0.4s ease 2.6s forwards'}}>
                    ⚠️ {error}
                </div>
            )}
        </header>
    );
};

export default Header;
