import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from '../../services/axios';
import type { ApiResponse } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppSettings {
  siteName: string;
  siteTagline: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowRegistrations: boolean;
  maxUploadSizeMB: number;
  supportEmail: string;
}

interface SubscriptionPlan {
  _id: string;
  key: 'free' | 'premium' | 'pro';
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isActive: boolean;
}

interface Webhook {
  _id: string;
  url: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
  lastTriggeredAt?: string;
  createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
const fetchSettings  = () => apiClient.get<ApiResponse<AppSettings>>('/v1/admin/settings').then(r => r.data.data);
const fetchPlans     = () => apiClient.get<ApiResponse<SubscriptionPlan[]>>('/v1/admin/plans').then(r => r.data.data);
const fetchWebhooks  = () => apiClient.get<ApiResponse<Webhook[]>>('/v1/admin/webhooks').then(r => r.data.data);
const updateSettings = (body: Partial<AppSettings>) => apiClient.patch('/v1/admin/settings', body).then(r => r.data);
const updatePlan     = ({ id, body }: { id: string; body: Partial<SubscriptionPlan> }) => apiClient.patch(`/v1/admin/plans/${id}`, body).then(r => r.data);
const createWebhook  = (body: { url: string; events: string[] }) => apiClient.post('/v1/admin/webhooks', body).then(r => r.data);
const deleteWebhook  = (id: string) => apiClient.delete(`/v1/admin/webhooks/${id}`).then(r => r.data);

const WEBHOOK_EVENTS = ['review.approved', 'review.rejected', 'user.banned', 'movie.published', 'plan.changed'];

// ─── Shared input style ───────────────────────────────────────────────────────
const inputSx: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: checked ? '#7c3aed' : 'rgba(255,255,255,0.1)', outline: 'none', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </button>
  );
}

// ─── Tab 1: General Settings ──────────────────────────────────────────────────
function GeneralTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'settings'], queryFn: fetchSettings });
  const [form, setForm] = useState<Partial<AppSettings>>({});
  const merged = { ...data, ...form } as AppSettings;

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => updateSettings(form),
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['admin', 'settings'] }); setForm({}); },
    onError: () => toast.error('Save failed'),
  });

  if (isLoading) return <div style={{ color: '#64748b', padding: 20 }}>Loading...</div>;

  const field = (key: keyof AppSettings, label: string, type: 'text' | 'email' | 'number' = 'text') => (
    <div>
      <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{label}</label>
      <input type={type} value={String(merged[key] ?? '')}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        style={inputSx} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
      {field('siteName',    'Site Name')}
      {field('siteTagline', 'Tagline')}
      {field('supportEmail', 'Support Email', 'email')}
      {field('maxUploadSizeMB', 'Max Upload Size (MB)', 'number')}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <p style={{ color: '#f8fafc', fontSize: 13, fontWeight: 500, margin: 0 }}>Allow Registrations</p>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>New users can sign up</p>
        </div>
        <Toggle checked={merged.allowRegistrations ?? true} onChange={() => setForm(f => ({ ...f, allowRegistrations: !merged.allowRegistrations }))} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: merged.maintenanceMode ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', borderRadius: 12, border: `1px solid ${merged.maintenanceMode ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
        <div>
          <p style={{ color: merged.maintenanceMode ? '#f87171' : '#f8fafc', fontSize: 13, fontWeight: 500, margin: 0 }}>🔧 Maintenance Mode</p>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>All users see maintenance page</p>
        </div>
        <Toggle checked={merged.maintenanceMode ?? false} onChange={() => setForm(f => ({ ...f, maintenanceMode: !merged.maintenanceMode }))} />
      </div>

      {merged.maintenanceMode && (
        <div>
          <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Maintenance Message</label>
          <textarea value={merged.maintenanceMessage ?? ''} rows={2}
            onChange={e => setForm(f => ({ ...f, maintenanceMessage: e.target.value }))}
            style={{ ...inputSx, resize: 'none' }} />
        </div>
      )}

      <button onClick={() => save()} disabled={isPending || Object.keys(form).length === 0}
        style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: Object.keys(form).length === 0 ? 'rgba(124,58,237,0.3)' : '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, alignSelf: 'flex-start', opacity: Object.keys(form).length === 0 ? 0.5 : 1 }}>
        {isPending ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

// ─── Tab 2: Subscription Plans ────────────────────────────────────────────────
function PlansTab() {
  const qc = useQueryClient();
  const { data: plans = [], isLoading } = useQuery({ queryKey: ['admin', 'plans'], queryFn: fetchPlans });
  const [editing, setEditing] = useState<{ id: string; priceMonthly: number; priceYearly: number } | null>(null);

  const { mutate: save, isPending } = useMutation({
    mutationFn: updatePlan,
    onSuccess: () => { toast.success('Plan updated'); qc.invalidateQueries({ queryKey: ['admin', 'plans'] }); setEditing(null); },
    onError: () => toast.error('Update failed'),
  });

  if (isLoading) return <div style={{ color: '#64748b', padding: 20 }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 700 }}>
      {plans.map(plan => (
        <div key={plan._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#f8fafc', fontSize: 15, fontWeight: 700 }}>{plan.name}</span>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: plan.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: plan.isActive ? '#34d399' : '#64748b' }}>
                  {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>{plan.features.slice(0, 3).join(' · ')}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#a78bfa', fontSize: 16, fontWeight: 700, margin: 0 }}>₹{(plan.priceMonthly / 100).toFixed(0)}/mo</p>
              <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>₹{(plan.priceYearly / 100).toFixed(0)}/yr</p>
            </div>
          </div>

          {editing?.id === plan._id ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>Monthly (paise)</label>
                <input type="number" value={editing.priceMonthly} onChange={e => setEditing(prev => prev ? { ...prev, priceMonthly: Number(e.target.value) } : null)} style={{ ...inputSx }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>Yearly (paise)</label>
                <input type="number" value={editing.priceYearly} onChange={e => setEditing(prev => prev ? { ...prev, priceYearly: Number(e.target.value) } : null)} style={{ ...inputSx }} />
              </div>
              <button onClick={() => save({ id: plan._id, body: { priceMonthly: editing.priceMonthly, priceYearly: editing.priceYearly } })} disabled={isPending}
                style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                {isPending ? '...' : 'Save'}
              </button>
              <button onClick={() => setEditing(null)} style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setEditing({ id: plan._id, priceMonthly: plan.priceMonthly, priceYearly: plan.priceYearly })}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', background: 'transparent', color: '#a78bfa', cursor: 'pointer', fontSize: 12 }}>
              Edit Pricing
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Tab 3: Webhooks ──────────────────────────────────────────────────────────
function WebhooksTab() {
  const qc = useQueryClient();
  const { data: hooks = [], isLoading } = useQuery({ queryKey: ['admin', 'webhooks'], queryFn: fetchWebhooks });
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: createWebhook,
    onSuccess: () => { toast.success('Webhook created'); qc.invalidateQueries({ queryKey: ['admin', 'webhooks'] }); setUrl(''); setEvents([]); setShowCreate(false); },
    onError: () => toast.error('Create failed'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => { toast.success('Webhook deleted'); qc.invalidateQueries({ queryKey: ['admin', 'webhooks'] }); },
    onError: () => toast.error('Delete failed'),
  });

  if (isLoading) return <div style={{ color: '#64748b', padding: 20 }}>Loading...</div>;

  const toggleEvent = (e: string) => setEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{hooks.length} webhooks configured</p>
        <button onClick={() => setShowCreate(s => !s)}
          style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          + Add Webhook
        </button>
      </div>

      {showCreate && (
        <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Endpoint URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-server.com/webhook"
              style={inputSx} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>Events</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {WEBHOOK_EVENTS.map(ev => (
                <button key={ev} onClick={() => toggleEvent(ev)}
                  style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${events.includes(ev) ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`, background: events.includes(ev) ? 'rgba(124,58,237,0.2)' : 'transparent', color: events.includes(ev) ? '#a78bfa' : '#64748b', cursor: 'pointer', fontSize: 12 }}>
                  {ev}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => create({ url, events })} disabled={!url || events.length === 0 || isCreating}
              style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: (!url || events.length === 0) ? 0.5 : 1 }}>
              {isCreating ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hooks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
            <p style={{ color: '#64748b', fontSize: 13 }}>No webhooks configured</p>
          </div>
        ) : hooks.map(hook => (
          <div key={hook._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${hook.failureCount >= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: hook.isActive && hook.failureCount < 5 ? '#10b981' : '#ef4444', flexShrink: 0 }} />
                <code style={{ color: '#94a3b8', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hook.url}</code>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 5 }}>
                {hook.events.map(ev => (
                  <span key={ev} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: 'rgba(124,58,237,0.12)', color: '#a78bfa' }}>{ev}</span>
                ))}
              </div>
              {hook.failureCount > 0 && (
                <p style={{ color: '#f87171', fontSize: 11, margin: 0 }}>⚠ {hook.failureCount} failures{hook.failureCount >= 5 ? ' — Circuit breaker tripped' : ''}</p>
              )}
            </div>
            <button onClick={() => remove(hook._id)}
              style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = 'general' | 'plans' | 'webhooks';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general');

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'general',  label: 'General',  icon: '⚙️' },
    { key: 'plans',    label: 'Plans',    icon: '👑' },
    { key: 'webhooks', label: 'Webhooks', icon: '🔗' },
  ];

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#09090f' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Settings</h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Platform configuration and integrations</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
              background: tab === t.key ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: tab === t.key ? '#f8fafc' : '#64748b' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'general'  && <GeneralTab />}
      {tab === 'plans'    && <PlansTab />}
      {tab === 'webhooks' && <WebhooksTab />}
    </div>
  );
}
