import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type RowSelectionState,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import apiClient from '@/services/axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import './UsersPage.css';

// ─── Types ────────────────────────────────────────────────────────────────
interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  role: string;
  subscriptionPlan: string;
  isBanned: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  avatarUrl?: string;
}

interface UserStats {
  byRole: Record<string, number>;
  byPlan: Record<string, number>;
  banned: number;
  newThisWeek: number;
}

// ─── API ──────────────────────────────────────────────────────────────────
const usersApi = {
  list: (params: Record<string, string | number>) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiClient.get<{ success: boolean; data: { data: User[]; total: number; page: number; totalPages: number } }>(`/v1/admin/users/v2?${qs}`);
  },
  stats:   () => apiClient.get<{ success: boolean; data: UserStats }>('/v1/admin/users/v2/stats'),
  role:    (id: string, role: string)   => apiClient.patch(`/v1/admin/users/v2/${id}/role`, { role }),
  plan:    (id: string, plan: string)   => apiClient.patch(`/v1/admin/users/v2/${id}/plan`, { plan }),
  ban:     (id: string, reason: string) => apiClient.patch(`/v1/admin/users/v2/${id}/ban`, { reason }),
  unban:   (id: string)                 => apiClient.patch(`/v1/admin/users/v2/${id}/unban`, {}),
  export:  (role?: string)              => window.open(`/api/v1/admin/users/v2/export${role ? `?role=${role}` : ''}`, '_blank'),
};

// ─── Role Badge ──────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  super_admin: '#f59e0b',
  admin:       '#8b5cf6',
  moderator:   '#3b82f6',
  premium:     '#22c55e',
  user:        'var(--text-muted)',
};

const PLAN_COLORS: Record<string, string> = {
  premium: '#f59e0b',
  pro:     '#8b5cf6',
  free:    'var(--text-muted)',
};



// ─── Ban Modal ───────────────────────────────────────────────────────────
const BanModal = ({ user, onClose, onConfirm, loading }: {
  user: User;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) => {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Ban User</h3>
        <p className="modal-sub">You are banning <strong>{user.name}</strong> ({user.email})</p>
        <Input
          label="Reason (optional)"
          placeholder="Spam, abuse, TOS violation..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={() => onConfirm(reason)}>
            Confirm Ban
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Role Dropdown ───────────────────────────────────────────────────────
const ROLES = ['user', 'premium', 'moderator', 'admin', 'super_admin'];
const PLANS = ['free', 'pro', 'premium'];

const col = createColumnHelper<User>();

// ─── Users Page ──────────────────────────────────────────────────────────
const UsersPage = () => {
  const qc = useQueryClient();
  const [page, setPage]         = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]     = useState('');
  const [role, setRole]         = useState('');
  const [plan, setPlan]         = useState('');
  const [banned, setBanned]     = useState('');
  const [rowSel, setRowSel]     = useState<RowSelectionState>({});
  const [banTarget, setBanTarget] = useState<User | null>(null);

  const handleSearch = useCallback((val: string) => {
    setSearchInput(val);
    setTimeout(() => { setSearch(val); setPage(1); }, 400);
  }, []);

  const queryKey = ['admin-users', page, search, role, plan, banned];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => usersApi.list({ page, limit: 20, ...(search && { search }), ...(role && { role }), ...(plan && { plan }), ...(banned && { banned }) })
      .then(r => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn:  () => usersApi.stats().then(r => r.data.data),
  });

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); qc.invalidateQueries({ queryKey: ['admin-user-stats'] }); };

  const roleMutation  = useMutation({ mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.role(id, role),  onSuccess: () => { toast.success('Role updated'); invalidate(); } });
  const planMutation  = useMutation({ mutationFn: ({ id, plan }: { id: string; plan: string }) => usersApi.plan(id, plan),  onSuccess: () => { toast.success('Plan updated'); invalidate(); } });
  const banMutation   = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => usersApi.ban(id, reason), onSuccess: () => { toast.success('User banned'); setBanTarget(null); invalidate(); } });
  const unbanMutation = useMutation({ mutationFn: (id: string) => usersApi.unban(id), onSuccess: () => { toast.success('User unbanned'); invalidate(); } });

  const columns = [
    col.display({
      id: 'select',
      header: ({ table }) => <input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />,
      cell: ({ row }) => <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      size: 40,
    }),
    col.accessor('name', {
      header: 'User',
      cell: info => {
        const u = info.row.original;
        const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return (
          <div className="user-cell">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{u.name}</span>
              <span className="user-email">{u.email}</span>
            </div>
          </div>
        );
      },
    }),
    col.accessor('role', {
      header: 'Role',
      cell: info => (
        <select
          className="inline-select"
          value={info.getValue()}
          onChange={e => roleMutation.mutate({ id: info.row.original._id, role: e.target.value })}
          style={{ color: ROLE_COLORS[info.getValue()] ?? 'inherit' }}
        >
          {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      ),
      size: 130,
    }),
    col.accessor('subscriptionPlan', {
      header: 'Plan',
      cell: info => (
        <select
          className="inline-select"
          value={info.getValue()}
          onChange={e => planMutation.mutate({ id: info.row.original._id, plan: e.target.value })}
          style={{ color: PLAN_COLORS[info.getValue()] ?? 'inherit' }}
        >
          {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      ),
      size: 100,
    }),
    col.accessor('isBanned', {
      header: 'Status',
      cell: info => (
        <span className={`user-status ${info.getValue() ? 'user-status--banned' : 'user-status--active'}`}>
          {info.getValue() ? '⊘ Banned' : '◉ Active'}
        </span>
      ),
      size: 100,
    }),
    col.accessor('lastLoginAt', {
      header: 'Last Login',
      cell: info => (
        <span className="mono-text" style={{ fontSize: '0.75rem' }}>
          {info.getValue() ? new Date(info.getValue()!).toLocaleDateString('en-IN') : '—'}
        </span>
      ),
      size: 110,
    }),
    col.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="row-actions">
            {u.isBanned
              ? <button className="row-btn row-btn--publish" onClick={() => unbanMutation.mutate(u._id)}>Unban</button>
              : <button className="row-btn row-btn--delete"  onClick={() => setBanTarget(u)}>Ban</button>
            }
          </div>
        );
      },
      size: 100,
    }),
  ];

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { rowSelection: rowSel },
    onRowSelectionChange: setRowSel,
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row._id,
    manualPagination: true,
    pageCount: data?.totalPages ?? 1,
  });

  return (
    <div className="users-page">
      <div className="users-page__header">
        <div>
          <h1>Users</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            {data?.total?.toLocaleString() ?? '—'} total users
          </p>
        </div>
        <Button variant="outline" onClick={() => usersApi.export(role || undefined)}>⬇ Export CSV</Button>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div className="users-stats-strip">
          {Object.entries(stats.byRole).map(([r, c]) => (
            <div key={r} className="stat-chip">
              <span className="stat-chip__label" style={{ color: ROLE_COLORS[r] }}>{r.replace('_',' ')}</span>
              <span className="stat-chip__val">{c}</span>
            </div>
          ))}
          <div className="stat-chip stat-chip--sep">
            <span className="stat-chip__label" style={{ color: 'var(--danger)' }}>Banned</span>
            <span className="stat-chip__val">{stats.banned}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip__label">New this week</span>
            <span className="stat-chip__val">{stats.newThisWeek}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="movies-filters">
        <Input placeholder="Search name, email..." value={searchInput} onChange={e => handleSearch(e.target.value)} style={{ maxWidth: 260 }} />
        <select className="filter-select" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
        </select>
        <select className="filter-select" value={plan} onChange={e => { setPlan(e.target.value); setPage(1); }}>
          <option value="">All plans</option>
          {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="filter-select" value={banned} onChange={e => { setBanned(e.target.value); setPage(1); }}>
          <option value="">All users</option>
          <option value="true">Banned only</option>
          <option value="false">Not banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} style={{ width: h.column.columnDef.size }}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  {columns.map((_, ci) => <td key={ci}><div className="cell-skeleton" /></td>)}
                </tr>
              ))
              : table.getRowModel().rows.map(row => (
                <tr key={row.id} className={`${row.getIsSelected() ? 'row--selected' : ''} ${row.original.isBanned ? 'row--banned' : ''}`}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>← Prev</button>
        <span className="page-info">Page {page} of {data?.totalPages ?? 1}</span>
        <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= (data?.totalPages ?? 1)}>Next →</button>
      </div>

      {/* Ban Modal */}
      {banTarget && (
        <BanModal
          user={banTarget}
          onClose={() => setBanTarget(null)}
          onConfirm={reason => banMutation.mutate({ id: banTarget._id, reason })}
          loading={banMutation.isPending}
        />
      )}
    </div>
  );
};

export default UsersPage;
