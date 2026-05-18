import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  LogoutIcon,
  SettingsIcon,
  MarketsIcon,
  WatchlistIcon,
  PortfolioIcon,
  AlertsIcon,
} from '../icons/SidebarIcons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const navItems = [
  { path: '/markets', label: 'Markets', Icon: MarketsIcon },
  { path: '/watchlist', label: 'Watchlist', Icon: WatchlistIcon },
  { path: '/portfolio', label: 'Portfolio', Icon: PortfolioIcon },
  { path: '/alerts', label: 'Alerts', Icon: AlertsIcon },
];

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  const handleLogout = () => {
    logout();
    onClose?.();
    addToast('Signed out successfully', 'success');
    navigate('/markets');
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
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer shrink-0"
        >
          <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 shrink-0">
            <path d="M26 26C26 18 22 5 16 5C10 5 6 18 6 26" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="14" r="3" fill="#10b981"/>
          </svg>
          <span 
            className="text-sm font-semibold text-primary whitespace-nowrap overflow-hidden transition-all duration-150"
            style={{ 
              opacity: collapsed ? 0 : 1, 
              width: collapsed ? 0 : 'auto',
              pointerEvents: collapsed ? 'none' : 'auto'
            }}
          >
            Cove
          </span>
        </button>
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
          className="mx-2 mt-3 mb-4 bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-lg p-2.5 text-center transition-all duration-150 overflow-hidden"
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