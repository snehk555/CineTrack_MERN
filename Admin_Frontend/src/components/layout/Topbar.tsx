import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch, clearAdmin } from '@/store';
import apiClient from '@/services/axios';
import './Topbar.css';

const Topbar = () => {
  const admin = useAppSelector((s) => s.auth.admin);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.post('/v1/admin/auth/logout'),
    onSuccess: () => {
      dispatch(clearAdmin());
      navigate('/login');
      toast.success('Signed out successfully');
    },
    onError: () => {
      // Force logout even if request fails
      dispatch(clearAdmin());
      navigate('/login');
    },
  });

  const initials = admin?.name
    ? admin.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <header className="topbar">
      {/* Left — Breadcrumb placeholder */}
      <div className="topbar__left">
        <span className="topbar__app-name">Admin Portal</span>
      </div>

      {/* Right — Admin info + logout */}
      <div className="topbar__right">
        <div className="topbar__admin">
          <div className="topbar__avatar" aria-label={admin?.name}>
            {initials}
          </div>
          <div className="topbar__admin-info">
            <span className="topbar__admin-name">{admin?.name ?? '—'}</span>
            <span className="topbar__admin-role">
              {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>

        <div className="topbar__divider" />

        <button
          className="topbar__logout"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          title="Sign out"
        >
          {logoutMutation.isPending ? '...' : '⎋ Sign out'}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
