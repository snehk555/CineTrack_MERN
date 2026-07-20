import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector, initializeAdminAuth } from '@/store';

const LoginPage = lazy(() => import('@/auth/pages/LoginPage'));
const AdminShell = lazy(() => import('@/components/layout/AdminShell'));

// ─── Full-page spinner while auth initializes ─────────────────────────────
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-secondary)',
      fontSize: '0.875rem',
      letterSpacing: '0.05em',
    }}
  >
    Loading CineTrack Admin...
  </div>
);

// ─── Auth guard — only role admin or super_admin allowed ──────────────────
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, admin } = useAppSelector((s) => s.auth);
  if (!isAuthenticated || !admin) return <Navigate to="/login" replace />;
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// ─── App ─────────────────────────────────────────────────────────────────
const App = () => {
  const dispatch = useAppDispatch();
  const { isLoading, isAuthenticated } = useAppSelector((s) => s.auth);

  // Check existing session on mount
  useEffect(() => {
    dispatch(initializeAdminAuth());
  }, [dispatch]);

  if (isLoading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* Protected Admin Shell */}
        <Route
          path="/*"
          element={
            <AdminGuard>
              <AdminShell />
            </AdminGuard>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default App;
