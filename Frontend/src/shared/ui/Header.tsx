import React from 'react';
import { Link } from 'react-router-dom';
import UserProfile from '../../features/auth/components/UserProfile';
import useAuthStore from '../../features/auth/store/useAuthStore';

const Header: React.FC = () => {
    const { user } = useAuthStore();

    return (
        <header className="flex justify-between items-center py-4 mb-8">
            <Link to="/" className="text-3xl font-bold text-violet-500 no-underline">
                CineTrack
            </Link>
            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <Link to="/movies" className="text-white hover:text-violet-400 font-medium no-underline">Movies</Link>
                        {user.role === 'admin' && (
                            <Link to="/admin" className="text-white hover:text-violet-400 font-medium no-underline">Admin</Link>
                        )}
                        <UserProfile />
                    </>
                ) : (
                    <>
                        <Link to="/login" className="text-white hover:text-violet-400 font-medium no-underline">Login</Link>
                        <Link to="/signup" className="bg-violet-600 text-white px-4 py-2 rounded font-medium hover:bg-violet-700 no-underline">Sign Up</Link>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;
