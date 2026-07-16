
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../auth/store/useAuthStore';

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const {logout} = useAuthStore();

  const handleAdminLogout = async () => {
         await logout();
         navigate("/admin/login");
  }
  
  return (
    <aside className="w-[260px] min-h-screen bg-[#0f0f1a] border-r border-white/6 flex flex-col px-4 py-7 fixed top-0 left-0">
      <div className="px-2 mb-7">
        <h2 className="text-xl font-bold text-[#E50914] tracking-tight">🎬 Admin Panel</h2>
      </div>

      <nav className="flex-1">
        <ul className="list-none p-0 m-0 flex flex-col gap-1">
          <li><Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 no-underline text-sm font-medium transition-all duration-200 hover:bg-[#E50914]/10 hover:text-white">📊 Dashboard</Link></li>
          <li><Link to="/admin/add-movie" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 no-underline text-sm font-medium transition-all duration-200 hover:bg-[#E50914]/10 hover:text-white">➕ Add Movie</Link></li>
          <li><Link to="/admin/movies" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 no-underline text-sm font-medium transition-all duration-200 hover:bg-[#E50914]/10 hover:text-white">🎥 Manage Movies</Link></li>
        </ul>
      </nav>
<div className="pt-4 border-t border-white/6 mt-auto">
        <button 
          onClick={handleAdminLogout} 
          className="w-full bg-transparent border-none text-red-500 no-underline text-sm font-medium flex items-center justify-start gap-2 px-2 py-2.5 rounded-lg transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
        >
          <span>🚪</span> Secure Logout
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar