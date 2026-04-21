import { useState } from 'react';
import { useSettings } from './context/SettingsContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import MetricCard from './components/dashboard/MetricCard';
import PriceChart from './components/dashboard/PriceChart';
import TrendingPanel from './components/dashboard/TrendingPanel.jsx';
import MarketTable from './components/dashboard/MarketTable';
import { useMarketData } from './hooks/useMarketData';
import { navItems, user } from './data/mockData';
import { colors } from './styles/tokens.jsx';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

export default function App() {
  const { metrics, chartData, featuredCoin, trendingCoins, assets } = useMarketData();
  const { settings, updateSetting } = useSettings();
  const [activePage, setActivePage] = useState('dashboard');

  const handleToggleTheme = () => {
    updateSetting('darkMode', !settings.darkMode);
  };

  const handleNav = (item) => {
    if (item.label === 'Settings') {
      setActivePage('settings');
    } else {
      setActivePage('dashboard');
    }
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
      <Sidebar items={navItems} onNav={handleNav} activePage={activePage} />

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
          user={user}
          themeMode={settings.darkMode ? 'dark' : 'light'}
          onToggleTheme={handleToggleTheme}
        />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activePage === 'settings' ? (
            <Settings onNavigate={setActivePage} />
          ) : activePage === 'profile' ? (
            <Profile />
          ) : (
            <main
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: colors.textPrimary,
                    margin: 0,
                  }}
                >
                  Market Dashboard
                </h1>
                <p
                  style={{
                    fontSize: '12px',
                    color: colors.textMuted,
                    margin: '4px 0 0',
                  }}
                >
                  Live market feed · Last updated 2 mins ago
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {metrics.map((m) => (
                  <MetricCard
                    key={m.id}
                    icon={m.icon}
                    label={m.label}
                    value={m.value}
                    change={m.change}
                    badge={m.badge}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <PriceChart coin={featuredCoin} data={chartData} />
                <TrendingPanel coins={trendingCoins} />
              </div>

              <MarketTable assets={assets} />
            </main>
          )}
        </div>
      </div>
    </div>
  );
}