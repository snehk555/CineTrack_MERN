import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector, initializeAuth } from '../store';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useNotifications, useBanListener } from '../shared/hooks/useSocket';
import ProtectedRoute from '../shared/components/common/ProtectedRoute';
import AdminRoute from '../shared/components/common/AdminRoute';
import Spinner from '../shared/components/ui/Spinner';

const HomePage = lazy(() => import('../pages/HomePage'));
const MoviesPage = lazy(() => import('../features/movies/pages/MoviesPage'));
const MovieDetailPage = lazy(() => import('../features/movies/pages/MovieDetailPage'));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../features/auth/pages/ForgotPasswordPage'));
const WatchlistPage = lazy(() => import('../pages/WatchlistPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SubscriptionPage = lazy(() => import('../pages/SubscriptionPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const AdminLayout = lazy(() => import('../features/admin/components/AdminLayout'));
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage'));
const AdminMoviesPage = lazy(() => import('../features/admin/pages/AdminMoviesPage'));
const AdminUsersPage = lazy(() => import('../features/admin/pages/AdminUsersPage'));
const AdminAnalyticsPage = lazy(() => import('../features/admin/pages/AdminAnalyticsPage'));
const AdminReviewsPage = lazy(() => import('../features/admin/pages/AdminReviewsPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="lg" />
  </div>
);

const App = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Route>

        {/* Admin routes — AdminRoute checks role, AdminLayout provides sidebar+topbar */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="movies" element={<AdminMoviesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default App;
