import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector, initializeAuth } from '../store';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useNotifications, useBanListener } from '../shared/hooks/useSocket';
import { useWatchlist } from '../features/watchlist/hooks/watchlistQueries';
import ProtectedRoute from '../shared/components/common/ProtectedRoute';
import Spinner from '../shared/components/ui/Spinner';
import Navbar from '../shared/components/layout/Navbar';
import Footer from '../shared/components/layout/Footer';

const HomePage          = lazy(() => import('../pages/HomePage'));
const MoviesPage        = lazy(() => import('../features/movies/pages/MoviesPage'));
const MovieDetailPage   = lazy(() => import('../features/movies/pages/MovieDetailPage'));
const WatchPage         = lazy(() => import('../features/movies/pages/WatchPage'));
const SeriesListPage    = lazy(() => import('../features/series/pages/SeriesListPage'));
const SeriesDetailPage  = lazy(() => import('../features/series/pages/SeriesDetailPage'));
const SeriesWatchPage   = lazy(() => import('../features/series/pages/SeriesWatchPage'));
const LoginPage         = lazy(() => import('../features/auth/pages/LoginPage'));
const RegisterPage      = lazy(() => import('../features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../features/auth/pages/ForgotPasswordPage'));
const WatchlistPage     = lazy(() => import('../pages/WatchlistPage'));
const ProfilePage       = lazy(() => import('../pages/ProfilePage'));
const SubscriptionPage  = lazy(() => import('../pages/SubscriptionPage'));
const NotFoundPage      = lazy(() => import('../pages/NotFoundPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="lg" />
  </div>
);

function GlobalWatchlistSync() {
  useWatchlist();
  return null;
}

// Auth + Watch pages are full-screen — no Navbar/Footer
const AUTH_PATHS = ['/login', '/register', '/forgot-password'];
const isWatchPath = (path: string) => /^\/movies\/[^/]+\/watch/.test(path) || /^\/series\/[^/]+\/watch/.test(path);

const App = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const isFullScreen = isAuthPage || isWatchPath(location.pathname);

  // Initialize auth on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Socket lifecycle — connect on login, disconnect on logout
  useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket(user._id);
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, user]);

  // Global socket event listeners (only active when connected)
  useNotifications();
  useBanListener();

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col min-h-screen bg-dark-bg">
      {/* Navbar — hidden on auth + watch pages */}
      {!isFullScreen && <Navbar />}

      {/* Global Watchlist Sync */}
      {isAuthenticated && <GlobalWatchlistSync />}

      {/* Main content grows to fill space */}
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login"           element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/register"        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
         

            <Route path="/"              element={<HomePage />} />
            <Route path="/movies"        element={<MoviesPage />} />
            <Route path="/movies/:id"    element={<MovieDetailPage />} />
            <Route path="/series"        element={<SeriesListPage />} />
            <Route path="/series/:id"    element={<SeriesDetailPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/movies/:id/watch"    element={<WatchPage />} />
              <Route path="/series/:id/watch"    element={<SeriesWatchPage />} />
              <Route path="/watchlist"     element={<WatchlistPage />} />
              <Route path="/profile"       element={<ProfilePage />} />
              <Route path="/subscription"  element={<SubscriptionPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer — hidden on auth + watch pages */}
      {!isFullScreen && <Footer />}
    </div>
  );
};

export default App;
