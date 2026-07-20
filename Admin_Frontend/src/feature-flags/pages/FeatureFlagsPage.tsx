import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../../services/axios';
import type { ApiResponse } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeatureFlag {
  _id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  enabledFor: string[];
  rolloutPercentage?: number;
  updatedBy?: string;
  updatedAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
const fetchFlags = async () => {
  const { data } = await apiClient.get<ApiResponse<FeatureFlag[]>>('/v1/admin/feature-flags');
  return data.data;
};

const toggleFlag = async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
  const { data } = await apiClient.patch(`/v1/admin/feature-flags/${id}/toggle`, { isEnabled });
  return data;
};

const createFlag = async (payload: { name: string; description: string }) => {
  const { data } = await apiClient.post('/v1/admin/feature-flags', payload);
  return data;
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{
        position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#7c3aed' : 'rgba(255,255,255,0.1)', transition: 'background 0.2s', flexShrink: 0, outline: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  );
}

// ─── Create Flag Modal ────────────────────────────────────────────────────────
function CreateFlagModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createFlag,
    onSuccess: () => {
      toast.success('Feature flag created');
      qc.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      onClose();
    },
    onError: () => toast.error('Failed to create flag'),
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, width: 420, maxWidth: '90vw' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ color: '#f8fafc', fontWeight: 600, marginBottom: 16, margin: '0 0 16px' }}>New Feature Flag</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Flag Key (snake_case)</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. new_review_system"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does this flag control?"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={() => mutate({ name: name.trim(), description: desc.trim() })} disabled={!name.trim() || isPending}
            style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: !name.trim() ? 0.5 : 1 }}>
            {isPending ? 'Creating...' : 'Create Flag'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FeatureFlagsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: fetchFlags,
  });

  const { mutate: toggle } = useMutation({
    mutationFn: toggleFlag,
    onMutate: ({ id: flagId }) => setToggling(flagId),
    onSuccess: (_, { isEnabled }) => {
      toast.success(`Flag ${isEnabled ? 'enabled' : 'disabled'}`);
      qc.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      setToggling(null);
    },
    onError: () => { toast.error('Toggle failed'); setToggling(null); },
  });

  const enabledCount = flags.filter(f => f.isEnabled).length;

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#09090f' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Feature Flags</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            {enabledCount} of {flags.length} flags enabled
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + New Flag
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Flags', value: flags.length, color: '#a78bfa' },
          { label: 'Enabled',     value: enabledCount, color: '#34d399' },
          { label: 'Disabled',    value: flags.length - enabledCount, color: '#64748b' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Flags list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 72, background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s infinite' }} />
          ))
        ) : flags.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🚩</div>
            <p style={{ color: '#64748b', fontSize: 14 }}>No feature flags yet. Create one to get started.</p>
          </div>
        ) : flags.map(flag => (
          <div key={flag._id}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${flag.isEnabled ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                <code style={{ color: flag.isEnabled ? '#a78bfa' : '#94a3b8', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{flag.name}</code>
                <span style={{
                  padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  background: flag.isEnabled ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
                  color: flag.isEnabled ? '#a78bfa' : '#475569',
                }}>
                  {flag.isEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              {flag.description && (
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{flag.description}</p>
              )}
              {flag.enabledFor?.length > 0 && (
                <p style={{ color: '#475569', fontSize: 11, margin: '4px 0 0' }}>
                  Enabled for: {flag.enabledFor.slice(0, 3).join(', ')}{flag.enabledFor.length > 3 ? ` +${flag.enabledFor.length - 3} more` : ''}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, shrink: 0 } as React.CSSProperties}>
              <span style={{ color: '#475569', fontSize: 11 }}>
                {new Date(flag.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
              <Toggle
                checked={flag.isEnabled}
                onChange={() => toggle({ id: flag._id, isEnabled: !flag.isEnabled })}
                disabled={toggling === flag._id}
              />
            </div>
          </div>
        ))}
      </div>

      {createOpen && <CreateFlagModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
