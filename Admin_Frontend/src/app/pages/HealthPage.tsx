import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/axios';
import { toast } from 'sonner';
import './HealthPage.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface HealthData {
  db: { status: 'connected' | 'error'; pingMs: number };
  redis: { status: 'connected' | 'error'; pingMs: number };
  queues: {
    emails: { waiting: number; active: number; completed: number; failed: number };
    media: { waiting: number; active: number; completed: number; failed: number };
  };
  server: { uptimeSeconds: number; memoryUsedMB: number; nodeVersion: string };
}

// ─── API ──────────────────────────────────────────────────────────────────────
const fetchHealth = () => apiClient.get<{ success: boolean; data: HealthData }>('/v1/admin/health').then(r => r.data.data);

// ─── Component ────────────────────────────────────────────────────────────────
export default function HealthPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: fetchHealth,
    refetchInterval: 30000, // auto refresh every 30s
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Health status updated');
    } catch {
      toast.error('Failed to refresh health status');
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${Math.floor(seconds % 60)}s`;
  };

  const StatusDot = ({ status }: { status: 'connected' | 'error' | 'loading' }) => {
    const color = status === 'connected' ? '#34d399' : status === 'error' ? '#f87171' : '#fbbf24';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: color,
          boxShadow: `0 0 8px ${color}80`, display: 'inline-block'
        }} />
        <span style={{ color: '#e2e8f0', fontSize: 13, textTransform: 'capitalize' }}>{status}</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="health-page">
        <div className="health-header">
          <div>
            <h1>System Health</h1>
            <p>Checking system vitals...</p>
          </div>
        </div>
        <div className="health-loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="health-page">
        <div className="health-header">
          <div>
            <h1>System Health</h1>
            <p>Could not reach the server</p>
          </div>
          <button className="health-btn" onClick={handleRefresh}>Retry</button>
        </div>
        <div className="health-error-box">
          <p>The health check endpoint is currently unreachable. Make sure the backend server is running.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="health-page">
      <div className="health-header">
        <div>
          <h1>System Health</h1>
          <p>Real-time monitor for backend services, databases, and task queues.</p>
        </div>
        <button className="health-btn" onClick={handleRefresh} disabled={isFetching}>
          {isFetching ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>

      <div className="health-grid">
        {/* Server Vital */}
        <div className="health-card">
          <div className="health-card-header">
            <h3>Server</h3>
            <span className="icon">🖥️</span>
          </div>
          <div className="health-metrics">
            <div className="metric">
              <span className="metric-label">Uptime</span>
              <span className="metric-value">{formatUptime(data.server.uptimeSeconds)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Memory Used</span>
              <span className="metric-value">{data.server.memoryUsedMB} MB</span>
            </div>
            <div className="metric">
              <span className="metric-label">Node Version</span>
              <span className="metric-value">{data.server.nodeVersion}</span>
            </div>
          </div>
        </div>

        {/* Database Vital */}
        <div className="health-card">
          <div className="health-card-header">
            <h3>MongoDB (Primary)</h3>
            <StatusDot status={data.db.status} />
          </div>
          <div className="health-metrics">
            <div className="metric">
              <span className="metric-label">Latency</span>
              <span className="metric-value">{data.db.pingMs} ms</span>
            </div>
          </div>
        </div>

        {/* Redis Vital */}
        <div className="health-card">
          <div className="health-card-header">
            <h3>Redis Cache</h3>
            <StatusDot status={data.redis.status} />
          </div>
          <div className="health-metrics">
            <div className="metric">
              <span className="metric-label">Latency</span>
              <span className="metric-value">{data.redis.pingMs} ms</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="section-title">Background Queues (BullMQ)</h2>
      <div className="health-grid">
        {/* Media Queue */}
        <div className="health-card queue-card">
          <div className="health-card-header">
            <h3>Media Processing</h3>
            <span className="icon">🎬</span>
          </div>
          <div className="queue-stats">
            <div className="q-stat" style={{ color: '#fbbf24' }}>
              <span>Waiting</span> <strong>{data.queues.media.waiting}</strong>
            </div>
            <div className="q-stat" style={{ color: '#60a5fa' }}>
              <span>Active</span> <strong>{data.queues.media.active}</strong>
            </div>
            <div className="q-stat" style={{ color: '#34d399' }}>
              <span>Completed</span> <strong>{data.queues.media.completed}</strong>
            </div>
            <div className="q-stat" style={{ color: '#f87171' }}>
              <span>Failed</span> <strong>{data.queues.media.failed}</strong>
            </div>
          </div>
        </div>

        {/* Email Queue */}
        <div className="health-card queue-card">
          <div className="health-card-header">
            <h3>Email Delivery</h3>
            <span className="icon">📧</span>
          </div>
          <div className="queue-stats">
            <div className="q-stat" style={{ color: '#fbbf24' }}>
              <span>Waiting</span> <strong>{data.queues.emails.waiting}</strong>
            </div>
            <div className="q-stat" style={{ color: '#60a5fa' }}>
              <span>Active</span> <strong>{data.queues.emails.active}</strong>
            </div>
            <div className="q-stat" style={{ color: '#34d399' }}>
              <span>Completed</span> <strong>{data.queues.emails.completed}</strong>
            </div>
            <div className="q-stat" style={{ color: '#f87171' }}>
              <span>Failed</span> <strong>{data.queues.emails.failed}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
