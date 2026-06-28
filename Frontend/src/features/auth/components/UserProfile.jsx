import React, {useState, useEffect, useRef} from 'react';
import useAuthStore from '../store/useAuthStore';
import {useNavigate} from 'react-router-dom';

const UserProfile = () => {
    const {user, logout} = useAuthStore();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Handler: Logout karo aur login page par bhejo
    const handleLogout = async () => {
        await logout();
        setIsProfileOpen(false);
        navigate("/login");
    };

    // Effect: Profile dropdown ke bahar click hone par band karo
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && ! profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return() => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="profile-wrapper"
            ref={profileRef}>
            {/* Circular Avatar Button */}
            <div className="profile-avatar"
                onClick={
                    () => setIsProfileOpen(!isProfileOpen)
                }
                title={
                    user.name
            }>
                {
                user.name.charAt(0).toUpperCase()
            } </div>

            {/* Dropdown Card */}
            {
            isProfileOpen && (
                <div className="profile-dropdown">
                    {/* Top: User Info */}
                    <div className="profile-dropdown-header">
                        <div className="profile-dropdown-avatar">
                            {
                            user.name.charAt(0).toUpperCase()
                        } </div>
                        <div className="profile-dropdown-info">
                            <span className="profile-dropdown-name">
                                {
                                user.name
                            }</span>
                            <span className="profile-dropdown-email">
                                {
                                user.email
                            }</span>
                        </div>
                    </div>

                    <div className="profile-dropdown-divider"></div>

                    {/* Logout Button */}
                    <button className="profile-dropdown-logout"
                        onClick={handleLogout}>
                        <span>🚪</span>
                        Sign Out
                    </button>
                </div>
            )
        } </div>
    );
};

export default UserProfile;
