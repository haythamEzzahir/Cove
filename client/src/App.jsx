import { useEffect, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import MetricCard from './components/dashboard/MetricCard';
import PriceChart from './components/dashboard/PriceChart';
import TrendingPanel from './components/dashboard/TrendingPanel.jsx';
import MarketTable from './components/dashboard/MarketTable';
import { useMarketData } from './hooks/useMarketData';
import { navItems, user } from './data/mockData';
import { colors, themes } from './styles/tokens.jsx';

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

function getSystemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark';
  }

  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

export default function App() {
  const { metrics, chartData, featuredCoin, trendingCoins, assets } = useMarketData();
  const [themeMode, setThemeMode] = useState(getSystemTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const handleChange = (event) => {
      setThemeMode(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const palette = themes[themeMode];
    const root = document.documentElement;

    Object.entries(palette).forEach(([token, value]) => {
      const cssToken = token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      root.style.setProperty(`--color-${cssToken}`, value);
    });

    root.style.colorScheme = themeMode;
    document.body.style.backgroundColor = palette.bgBase;
    document.body.style.color = palette.textPrimary;
  }, [themeMode]);

  const handleToggleTheme = () => {
    setThemeMode((currentMode) => (currentMode === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div style={{ display: 'flex', background: colors.bgBase, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <Sidebar items={navItems} />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar user={user} themeMode={themeMode} onToggleTheme={handleToggleTheme} />

        <main style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Page title */}
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              Market Dashboard
            </h1>
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: '4px 0 0' }}>
              Live market feed · Last updated 2 mins ago
            </p>
          </div>

          {/* Metric cards row */}
          <div style={{ display: 'flex', gap: 12 }}>
            {metrics.map((m) => (
              <MetricCard key={m.id} icon={m.icon} label={m.label} value={m.value} change={m.change} badge={m.badge} />
            ))}
          </div>

          {/* Chart + Trending row */}
          <div style={{ display: 'flex', gap: 12 }}>
            <PriceChart coin={featuredCoin} data={chartData} />
            <TrendingPanel coins={trendingCoins} />
          </div>

          {/* Market table */}
          <MarketTable assets={assets} />
        </main>
      </div>
    </div>
  );
}
