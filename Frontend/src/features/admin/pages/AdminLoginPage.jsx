import { useState } from "react";
import useAuthStore from "../../auth/store/useAuthStore";
import { useNavigate } from "react-router-dom";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.ok) {
        // Strict Authorization Check: Restrict access to administrators only
        if(data.user.role === 'admin') {
           setUser(data.user);
           navigate("/admin");
        } else {
           setError("Access Denied: Administrator privileges are required.");
        }
      } else {
        setError(data.error || "An error occurred during authentication.");
      }
    } catch (er) {
      setError("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-6 bg-[#09090f]">
      <div className="w-full max-w-[420px] p-10 bg-[#0f0f1a] border border-red-500/20 rounded-2xl shadow-[0_15px_40px_rgba(229,9,20,0.15)]">
        
        <h2 className="text-3xl font-bold text-center mb-8 text-[#E50914] tracking-tight">Admin Portal</h2>

        {error && (
          <div className="bg-red-500/12 text-red-300 border border-red-500/25 px-3.5 py-2.5 rounded-lg text-sm flex items-center gap-2 mb-5">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Admin Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/4 text-slate-100 text-sm outline-none transition-all duration-300 focus:border-[#E50914] focus:bg-white/8"
              placeholder="admin@cinetrack.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/4 text-slate-100 text-sm outline-none transition-all duration-300 focus:border-[#E50914] focus:bg-white/8"
              placeholder="Enter secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full py-3 bg-[#E50914] text-white border-none rounded-lg font-medium text-base cursor-pointer transition-all duration-300 mt-2 hover:bg-red-700 hover:-translate-y-0.5">
            Authenticate as Administrator
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLoginPage;
