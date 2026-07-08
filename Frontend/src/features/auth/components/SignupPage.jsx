import { useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { useNavigate, Link } from "react-router-dom";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch("http://localhost:8000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        navigate("/");
      } else {
        setError(data.error || "something went wrong");
      }
    } catch (error) {
      setError("Network error, please try again!");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-120px)] p-6">
      <div className="w-full max-w-[420px] p-10 bg-white/3 backdrop-blur-xl border border-white/8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.4)]" style={{animation: 'fadeInUp 0.4s ease-out'}}>
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Create Account 🎬</h2>

        {error && (
          <div className="bg-red-500/12 text-red-300 border border-red-500/25 px-3.5 py-2.5 rounded-lg text-sm flex items-center gap-2 mb-2">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Full Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/4 text-slate-100 font-[var(--font-outfit)] text-sm outline-none transition-all duration-300 focus:border-violet-500 focus:shadow-[0_0_12px_rgba(139,92,246,0.25)] focus:bg-white/8"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Email Address</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/4 text-slate-100 font-[var(--font-outfit)] text-sm outline-none transition-all duration-300 focus:border-violet-500 focus:shadow-[0_0_12px_rgba(139,92,246,0.25)] focus:bg-white/8"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/4 text-slate-100 font-[var(--font-outfit)] text-sm outline-none transition-all duration-300 focus:border-violet-500 focus:shadow-[0_0_12px_rgba(139,92,246,0.25)] focus:bg-white/8"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full py-3 bg-violet-600 text-white border-none rounded-lg font-[var(--font-outfit)] font-medium text-base cursor-pointer transition-all duration-300 mt-2 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30">
            Sign Up
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-400">
          Already have an account?
          <Link to="/login" className="text-violet-500 no-underline font-medium ml-1 hover:text-violet-600 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
