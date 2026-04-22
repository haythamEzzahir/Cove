import { Outlet, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
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

export default function AppLayout() {
  const location = useLocation();
  const { settings, updateSetting } = useSettings();

  const { title, subtitle } = PAGE_DATA[location.pathname] || { title: 'Dashboard', subtitle: '' };

  const handleToggleTheme = () => {
    updateSetting('darkMode', !settings.darkMode);
  };

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
      <Sidebar />
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
          user={{ name: 'Alex Sivera', role: 'Pro Trader', initials: 'AS' }}
          themeMode={settings.darkMode ? 'dark' : 'light'}
          onToggleTheme={handleToggleTheme}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}