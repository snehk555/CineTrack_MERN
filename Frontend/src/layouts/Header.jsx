import { useState } from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import useAuthStore from '../features/auth/store/useAuthStore';
import MovieFilters from '../features/movies/components/MovieFilters';
import SearchBar from '../features/movies/components/SearchBar';
import UserProfile from '../features/auth/components/UserProfile';

const Header = () => {
    const {user} = useAuthStore();

    // Shared state: Category aur Genre dono SearchBar aur MovieFilters mein chahiye
    const [error, setError] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();

    // reading url values using get request 
    const selectedCategory = searchParams.get('category') || "";
    const selectedGenre = searchParams.get('genre') || "";

    // when user selectes category then this function set the url 
    const setSelectedCategory = (val) => {
          setSearchParams((prevParams) => {
              if(val){
                 prevParams.set('category',val)
              }
              else{
                 prevParams.delete('category'); // if no value then remove from url 
              }

              return prevParams;

          })
    }
   // gor genres 
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
        <header className="header">
            {/* Left: Logo */}
            <div className="logo">
                <Link to='/'
                    style={
                        {
                            color: 'inherit',
                            textDecoration: 'none'
                        }
                }>CineTrack 🍿</Link>
            </div>

            {/* Conditional Rendering: Logged In vs Logged Out */}
            {
            user ? (
                <> {/* Center: Filters + Search */}
                    <div className="header-controls">
                        <MovieFilters selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            selectedGenre={selectedGenre}
                            setSelectedGenre={setSelectedGenre}/>
                        <SearchBar selectedCategory={selectedCategory}
                            selectedGenre={selectedGenre}
                            setError={setError}/>
                    </div>

                    {/* Right: My Movies + Profile Avatar */}
                    <div className="nav-group">
                        <Link to='/movies' className="nav-link">🎬 My Movies</Link>
                        <UserProfile/>
                    </div>
                </>
            ) : (
                /* Logged Out: Sirf Login/Signup */ <div className="nav-group">
                    <Link to="/login" className="btn-primary btn-auth">Login</Link>
                    <Link to="/signup" className="btn-primary btn-auth">Sign Up</Link>
                </div>
            )
        }

            {/* Error Toast */}
            {
            error && <div className="error-toast">⚠️ {error}</div>
        } </header>
    );
};

export default Header;
