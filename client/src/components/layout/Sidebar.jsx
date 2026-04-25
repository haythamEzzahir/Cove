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

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/');
  };

  return (
    <nav className={`flex flex-col w-48 h-full p-3 border-r border-default bg-surface overflow-y-auto z-40 ${isOpen === undefined ? 'relative' : 'fixed lg:relative left-0 top-0'} transition-transform duration-300`}>
      <div className="flex items-center gap-2.5 px-1 pb-4 mb-3 border-b border-default shrink-0">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-sm font-bold text-white">
          F
        </div>
        <span className="text-sm font-semibold text-primary">FinTracker</span>
      </div>

      <span className="text-[10px] text-muted uppercase tracking-wider px-1.5 py-1.5 shrink-0">
        Main Menu
      </span>

      {navItems.map(({ path, label, Icon }) => (
        <NavItem key={path} path={path} label={label} Icon={Icon} />
      ))}

      <div className="mt-auto pt-4 border-t border-default shrink-0">
        <NavItem path="/settings" label="Settings" />
        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[13px] cursor-pointer border-none bg-transparent hover:bg-overlay text-muted"
          >
            <span className="w-4.5 h-4.5 inline-flex items-center justify-center shrink-0">
              <LogoutIcon />
            </span>
            <span>Logout</span>
          </button>
        )}

        <div className="mt-3 bg-gradient-to-r from-blue-700 to-blue-500 rounded-lg p-2.5 text-center">
          <p className="text-[11px] text-white font-semibold">Upgrade to Pro</p>
          <p className="text-[10px] text-white/70 mt-0.5">Unlock all features</p>
        </div>
      </div>
    </nav>
  );
}

const baseStyle = "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[13px] cursor-pointer border-none text-left transition-colors no-underline";

function NavItem({ path, label, Icon }) {
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
    >
      <span className="w-4.5 h-4.5 inline-flex items-center justify-center shrink-0">
        {IconComponent && <IconComponent />}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}