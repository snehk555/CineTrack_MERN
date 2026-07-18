import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../../store';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
