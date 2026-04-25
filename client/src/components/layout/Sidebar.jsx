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
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', Icon: DashboardIcon },
  { path: '/markets', label: 'Markets', Icon: MarketsIcon },
  { path: '/watchlist', label: 'Watchlist', Icon: WatchlistIcon },
  { path: '/portfolio', label: 'Portfolio', Icon: PortfolioIcon },
  { path: '/alerts', label: 'Alerts', Icon: AlertsIcon },
  { path: '/news', label: 'News', Icon: NewsIcon },
];

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/');
  };

  return (
    <nav 
      className="flex flex-col h-full border-r border-default bg-surface z-40 shrink-0 fixed left-0 top-0"
      style={{ 
        width: collapsed ? '56px' : '220px',
        transition: 'width 0.2s ease',
        overflow: collapsed ? 'visible' : 'y-auto'
      }}
    >
      <div className="flex items-center h-14 px-3 border-b border-default shrink-0">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-sm font-bold text-white shrink-0">
          F
        </div>
        <span 
          className="ml-2.5 text-sm font-semibold text-primary whitespace-nowrap overflow-hidden transition-all duration-150"
          style={{ 
            opacity: collapsed ? 0 : 1, 
            width: collapsed ? 0 : 'auto',
            pointerEvents: collapsed ? 'none' : 'auto'
          }}
        >
          FinTracker
        </span>
        <button
          onClick={onToggleCollapse}
          className="ml-auto p-1.5 cursor-pointer bg-transparent border-none text-muted hover:text-primary rounded shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      <div className="flex-1 py-3 overflow-hidden">
        <span 
          className="block text-[10px] text-muted uppercase tracking-wider px-3 py-1.5 shrink-0 whitespace-nowrap overflow-hidden transition-all duration-150"
          style={{ 
            opacity: collapsed ? 0 : 1, 
            height: collapsed ? 0 : 'auto',
            paddingTop: collapsed ? 0 : undefined,
            paddingBottom: collapsed ? 0 : undefined
          }}
        >
          Main Menu
        </span>

        {navItems.map(({ path, label, Icon }) => (
          <NavItem key={path} path={path} label={label} Icon={Icon} collapsed={collapsed} />
        ))}
      </div>

      <div className="pt-3 border-t border-default shrink-0">
        <NavItem path="/settings" label="Settings" collapsed={collapsed} />
        
        {user && (
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-3 py-1.5 text-[13px] cursor-pointer border-none bg-transparent hover:bg-overlay text-muted`}
          >
            <span className="w-4.5 h-4.5 inline-flex items-center justify-center shrink-0">
              <LogoutIcon />
            </span>
            <span 
              className="ml-2.5 whitespace-nowrap overflow-hidden transition-all duration-150"
              style={{ 
                opacity: collapsed ? 0 : 1, 
                width: collapsed ? 0 : 'auto',
                pointerEvents: collapsed ? 'none' : 'auto'
              }}
            >
              Logout
            </span>
          </button>
        )}

        <div 
          className="mx-2 mt-3 bg-gradient-to-r from-blue-700 to-blue-500 rounded-lg p-2.5 text-center transition-all duration-150 overflow-hidden"
          style={{ 
            opacity: collapsed ? 0 : 1, 
            height: collapsed ? 0 : 'auto',
            padding: collapsed ? 0 : undefined
          }}
        >
          <p className="text-[11px] text-white font-semibold whitespace-nowrap">Upgrade to Pro</p>
          <p className="text-[10px] text-white/70 mt-0.5">Unlock all features</p>
        </div>

        
      </div>
    </nav>
  );
}

const baseStyle = "flex items-center w-full px-3 py-1.5 text-[13px] cursor-pointer border-none text-left transition-colors no-underline";

function NavItem({ path, label, Icon, collapsed }) {
  const IconComponent = Icon || (label === 'Settings' ? SettingsIcon : null);

  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `${baseStyle} ${isActive 
          ? 'bg-overlay text-accent' 
          : 'text-muted hover:bg-overlay hover:text-secondary'
        }`
      }
      title={collapsed ? label : undefined}
      style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
    >
      <span className="w-4.5 h-4.5 inline-flex items-center justify-center shrink-0">
        {IconComponent && <IconComponent />}
      </span>
      <span 
        className="ml-2.5 whitespace-nowrap overflow-hidden transition-all duration-150"
        style={{ 
          opacity: collapsed ? 0 : 1, 
          width: collapsed ? 0 : 'auto',
          pointerEvents: collapsed ? 'none' : 'auto'
        }}
      >
        {label}
      </span>
    </NavLink>
  );
}