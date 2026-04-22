import { Outlet } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { colors } from '../../styles/tokens';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  const { settings, updateSetting } = useSettings();

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