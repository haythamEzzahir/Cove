import { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../styles/tokens';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const PAGE_DATA = {
  '/': { title: 'Dashboard', subtitle: 'Live market feed' },
  '/markets': { title: 'Markets', subtitle: 'Browse all cryptocurrencies' },
  '/watchlist': { title: 'Watchlist', subtitle: 'Track your assets' },
  '/portfolio': { title: 'Portfolio', subtitle: 'Manage your holdings' },
  '/alerts': { title: 'Alerts', subtitle: 'Price notifications' },
  '/news': { title: 'News', subtitle: 'Latest crypto news' },
  '/settings': { title: 'Settings', subtitle: 'App preferences' },
  '/settings/profile': { title: 'Profile', subtitle: 'Account settings' },
};

const PROTECTED_ROUTES = ['/watchlist', '/portfolio', '/alerts', '/news', '/settings', '/settings/profile'];

export default function AppLayout() {
  const location = useLocation();
  const { settings, updateSetting } = useSettings();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { title, subtitle } = PAGE_DATA[location.pathname] || { title: 'Dashboard', subtitle: '' };

  const handleToggleTheme = () => {
    updateSetting('darkMode', !settings.darkMode);
  };

  if (loading) {
    return null;
  }

  const requiresAuth = PROTECTED_ROUTES.some(route => location.pathname.startsWith(route));
  
  if (requiresAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: colors.bgBase,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <TopBar
          pageTitle={title}
          pageSubtitle={subtitle}
          user={user}
          themeMode={settings.darkMode ? 'dark' : 'light'}
          onToggleTheme={handleToggleTheme}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}