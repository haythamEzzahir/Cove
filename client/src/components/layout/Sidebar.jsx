import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  LogoutIcon,
  SettingsIcon,
  DashboardIcon,
  MarketsIcon,
  WatchlistIcon,
  PortfolioIcon,
  AlertsIcon,
  NewsIcon,
} from '../icons/SidebarIcons';
import { colors, radius, fontSize } from '../../styles/tokens';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/',         label: 'Dashboard', Icon: DashboardIcon },
  { path: '/markets',  label: 'Markets',  Icon: MarketsIcon },
  { path: '/watchlist',label: 'Watchlist', Icon: WatchlistIcon },
  { path: '/portfolio',label: 'Portfolio',Icon: PortfolioIcon },
  { path: '/alerts',   label: 'Alerts',   Icon: AlertsIcon },
  { path: '/news',     label: 'News',     Icon: NewsIcon },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      style={{
        width: 192,
        flexShrink: 0,
        background: colors.bgSurface,
        borderRight: `0.5px solid ${colors.borderDefault}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 12px',
        height: '100%',
        overflowY: 'auto',
        gap: 2,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 4px 16px',
          borderBottom: `0.5px solid ${colors.borderDefault}`,
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: colors.blue,
            borderRadius: radius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          F
        </div>
        <span style={{ fontSize: fontSize.md, fontWeight: 600, color: colors.textPrimary }}>
          FinTracker
        </span>
      </div>

      <span
        style={{
          fontSize: '10px',
          color: colors.textMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '0 6px 6px',
          flexShrink: 0,
        }}
      >
        Main Menu
      </span>

      {navItems.map(({ path, label, Icon }) => (
        <NavItem key={path} path={path} label={label} Icon={Icon} />
      ))}

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: `0.5px solid ${colors.borderDefault}`,
          flexShrink: 0,
        }}
      >
        <NavItem path="/settings" label="Settings" />
        {user && (
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '7px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              border: 'none',
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              color: colors.textMuted,
            }}
          >
            <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogoutIcon />
            </span>
            <span>Logout</span>
          </button>
        )}

        <div
          style={{
            marginTop: 12,
            background: `linear-gradient(135deg, ${colors.blueDim}, ${colors.blue})`,
            borderRadius: radius.lg,
            padding: '10px 12px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>Upgrade to Pro</p>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
            Unlock all features
          </p>
        </div>
      </div>
    </nav>
  );
}

const baseStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '7px 10px',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  transition: 'background 0.15s, color 0.15s',
};

function NavItem({ path, label, Icon }) {
  const IconComponent = Icon
    || (label === 'Settings' ? SettingsIcon : label === 'Logout' ? LogoutIcon : null);

  return (
    <NavLink
      to={path}
      style={({ isActive }) => ({
        ...baseStyle,
        background: isActive ? colors.bgOverlay : 'transparent',
        color: isActive ? colors.blue : colors.textMuted,
        textDecoration: 'none',
      })}
      onMouseEnter={(e) => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.background = colors.bgOverlay;
          e.currentTarget.style.color = colors.textSecondary;
        }
      }}
      onMouseLeave={(e) => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = colors.textMuted;
        }
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {IconComponent && <IconComponent />}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}