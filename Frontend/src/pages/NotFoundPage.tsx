import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#09090f] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-6">🎬</div>
      <h1 className="text-6xl font-bold text-white mb-3">404</h1>
      <p className="text-xl text-slate-400 mb-2">Scene not found</p>
      <p className="text-slate-500 text-sm mb-8">This page has been cut from the final edit.</p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors active:scale-95"
      >
        ← Back to Home
      </button>
    </div>
  );
}