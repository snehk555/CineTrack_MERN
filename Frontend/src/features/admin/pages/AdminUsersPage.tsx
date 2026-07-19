import { useState } from 'react';
import { useAdminUsers, useBanUserMutation, useUnbanUserMutation } from '../hooks/adminQueries';
import useDebounce from '../../../shared/hooks/useDebounce';
import type { User } from '../../../types';

// ─── Ban Modal ────────────────────────────────────────────────────────────────
interface BanModalProps {
  user: User;
  onClose: () => void;
}

function BanModal({ user, onClose }: BanModalProps) {
  const [reason, setReason] = useState('');
  const { mutate: banUser, isPending } = useBanUserMutation();

  const handleBan = () => {
    if (!reason.trim()) return;
    banUser({ userId: user._id, reason });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Ban User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl">✕</button>
        </div>
        <div className="mb-4 p-3 bg-white/5 rounded-xl">
          <p className="text-white text-sm font-medium">{user.name}</p>
          <p className="text-slate-400 text-xs">{user.email}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Ban Reason <span className="text-red-400">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Spam, abusive behavior..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm outline-none focus:border-red-500 transition-colors resize-none"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm border border-white/10 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleBan}
              disabled={!reason.trim() || isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {isPending ? 'Banning...' : 'Ban User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
const roleBadge: Record<string, string> = {
  admin:   'bg-violet-500/20 text-violet-300 border-violet-500/30',
  premium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  user:    'bg-white/5 text-slate-400 border-white/10',
};

const planBadge: Record<string, string> = {
  premium: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  pro:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  free:    'bg-white/5 text-slate-500 border-white/8',
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [banTarget, setBanTarget] = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading } = useAdminUsers({ search: debouncedSearch, role: roleFilter, page });
  const { mutate: unbanUser } = useUnbanUserMutation();

  const users: User[] = data?.users ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-slate-400 text-sm mt-0.5">{data?.total ?? 0} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none focus:border-violet-500 transition-colors w-64"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm outline-none focus:border-violet-500 transition-colors"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="premium">Premium</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['User', 'Username', 'Role', 'Plan', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/8 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-slate-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-4 py-3 text-slate-400 text-xs">@{user.username}</td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border capitalize ${roleBadge[user.role] ?? roleBadge.user}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border capitalize ${planBadge[user.subscriptionPlan ?? 'free'] ?? planBadge.free}`}>
                        {user.subscriptionPlan ?? 'free'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${user.isBanned ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                        {user.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {user.isBanned ? (
                        <button
                          onClick={() => unbanUser(user._id)}
                          className="text-xs text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                        >
                          Unban
                        </button>
                      ) : user.role !== 'admin' ? (
                        <button
                          onClick={() => setBanTarget(user)}
                          className="text-xs text-slate-400 border border-white/10 px-3 py-1.5 rounded-lg hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all"
                        >
                          Ban
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                ← Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {banTarget && <BanModal user={banTarget} onClose={() => setBanTarget(null)} />}
    </div>
  );
}
