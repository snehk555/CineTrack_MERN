// Phase 1 — AdminShell placeholder (full layout coming in Phase 1)
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './AdminShell.css';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────
const DashboardPage = lazy(() => import('@/dashboard/pages/DashboardPage'));
const MoviesPage    = lazy(() => import('@/movies/pages/MoviesPage'));
const GenresPage    = lazy(() => import('@/genres/pages/GenresPage'));
const UsersPage     = lazy(() => import('@/users/pages/UsersPage'));
const ReviewsPage      = lazy(() => import('@/reviews/pages/ReviewsPage'));
const FeatureFlagsPage = lazy(() => import('@/feature-flags/pages/FeatureFlagsPage'));
const AuditLogsPage    = lazy(() => import('@/audit-logs/pages/AuditLogsPage'));
const MediaQueuePage   = lazy(() => import('@/media-queue/pages/MediaQueuePage'));
const SettingsPage     = lazy(() => import('@/settings/pages/SettingsPage'));
const AnalyticsPage    = lazy(() => import('@/analytics/pages/AnalyticsPage'));

// Placeholder for pages not yet built
const ComingSoon = ({ name }: { name: string }) => (
  <div className="coming-soon">
    <div className="coming-soon__icon">◇</div>
    <h2 className="coming-soon__title">{name}</h2>
    <p className="coming-soon__sub">This section is being built — Phase roadmap in progress.</p>
  </div>
);

const AdminShell = () => {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-shell__body">
        <Topbar />
        <main className="admin-shell__main">
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<div className="coming-soon"><div className="coming-soon__icon">◇</div><p className="coming-soon__sub">Loading...</p></div>}><DashboardPage /></Suspense>} />
            <Route path="movies" element={<Suspense fallback={<div className="coming-soon"><div className="coming-soon__icon">◇</div><p className="coming-soon__sub">Loading...</p></div>}><MoviesPage /></Suspense>} />
            <Route path="genres" element={<Suspense fallback={<div className="coming-soon"><div className="coming-soon__icon">◇</div><p className="coming-soon__sub">Loading...</p></div>}><GenresPage /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<div className="coming-soon"><div className="coming-soon__icon">◇</div><p className="coming-soon__sub">Loading...</p></div>}><UsersPage /></Suspense>} />
            <Route path="reviews" element={<Suspense fallback={<div className="coming-soon"><div className="coming-soon__icon">◇</div><p className="coming-soon__sub">Loading...</p></div>}><ReviewsPage /></Suspense>} />
            <Route path="analytics" element={<Suspense fallback={<div className="coming-soon"><div className="coming-soon__icon">◇</div><p className="coming-soon__sub">Loading...</p></div>}><AnalyticsPage /></Suspense>} />
            <Route path="media-queue" element={<Suspense fallback={<div className="coming-soon"><div className="coming-soon__icon">◇</div><p className="coming-soon__sub">Loading...</p></div>}><MediaQueuePage /></Suspense>} />
            <Route path="feature-flags" element={<Suspense fallback={<div className="coming-soon"><div className="coming-soon__icon">◇</div><p className="coming-soon__sub">Loading...</p></div>}><FeatureFlagsPage /></Suspense>} />
            <Route path="audit-logs" element={<Suspense fallback={<div className="coming-soon"><div className="coming-soon__icon">◇</div><p className="coming-soon__sub">Loading...</p></div>}><AuditLogsPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<div className="coming-soon"><div className="coming-soon__icon">◇</div><p className="coming-soon__sub">Loading...</p></div>}><SettingsPage /></Suspense>} />
            <Route path="health" element={<ComingSoon name="Health Monitor" />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
