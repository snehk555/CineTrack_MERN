import { NavLink } from 'react-router-dom';
import { useAppSelector, useAppDispatch, toggleSidebar } from '@/store';
import './Sidebar.css';

// ─── Nav items ────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',     icon: '▣' },
  { to: '/movies',        label: 'Movies',         icon: '◈' },
  { to: '/users',         label: 'Users',          icon: '◎' },
  { to: '/reviews',       label: 'Reviews',        icon: '◆' },
  { to: '/analytics',     label: 'Analytics',      icon: '◇' },
  { to: '/media-queue',   label: 'Media Queue',    icon: '◐' },
  { to: '/feature-flags', label: 'Feature Flags',  icon: '⊞' },
  { to: '/audit-logs',    label: 'Audit Logs',     icon: '☰' },
  { to: '/settings',      label: 'Settings',       icon: '⊙' },
];

const BOTTOM_ITEMS = [
  { to: '/health', label: 'Health', icon: '♡' },
];

const Sidebar = () => {
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const dispatch = useAppDispatch();

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <span className="sidebar__brand-icon">◆</span>
        {!collapsed && (
          <span className="sidebar__brand-text">
            CineTrack <span className="sidebar__brand-tag">Admin</span>
          </span>
        )}
        <button
          className="sidebar__collapse-btn"
          onClick={() => dispatch(toggleSidebar())}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Main nav */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <span className="sidebar__link-icon">{icon}</span>
            {!collapsed && <span className="sidebar__link-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="sidebar__bottom">
        {BOTTOM_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <span className="sidebar__link-icon">{icon}</span>
            {!collapsed && <span className="sidebar__link-label">{label}</span>}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
