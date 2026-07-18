import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../../store';
import Spinner from '../ui/Spinner';

export default function AdminRoute() {
  const { user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  return <Outlet />;
}
