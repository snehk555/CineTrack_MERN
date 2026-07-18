import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch, clearUser } from '../../../store';
import apiClient from '../../../services/axios';

const UserProfile = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await apiClient.post('/v1/auth/logout').catch(() => null);
    dispatch(clearUser());
    setIsProfileOpen(false);
    navigate('/login');
  };


    useEffect(() => {
        const handleClickOutside = (event:MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={profileRef}>
            <div
                className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-base font-bold flex items-center justify-center cursor-pointer select-none border-2 border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.4)] transition-all duration-200 hover:scale-110 hover:shadow-[0_0_20px_rgba(139,92,246,0.7)]"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                title={user?.name}
            >
                {user?.name.charAt(0).toUpperCase()}
            </div>

            {isProfileOpen && (
                <div className="absolute top-[calc(100%+12px)] right-0 w-[280px] bg-[#1e1e2e] border border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden z-[1000]" style={{animation: 'fadeInDown 0.2s ease-out'}}>
                    <div className="flex items-center gap-3.5 px-5 py-5">
                        <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xl font-bold flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(139,92,246,0.4)]">
                            {user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-white font-semibold text-base">{user?.name}</span>
                            <span className="text-slate-400 text-xs">{user?.email}</span>
                        </div>
                    </div>

                    <div className="h-px bg-white/8 mx-3"></div>

                    <button
                        className="flex items-center gap-2.5 w-full px-5 py-3.5 bg-transparent border-none text-red-300 font-[var(--font-outfit)] text-sm font-medium cursor-pointer transition-colors duration-200 text-left hover:bg-red-500/12"
                        onClick={handleLogout}
                    >
                        <span>🚪</span>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
