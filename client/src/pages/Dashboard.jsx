import { useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { colors } from '../styles/tokens';
import MetricCard from '../components/dashboard/MetricCard';
import PriceChart from '../components/dashboard/PriceChart';
import TrendingPanel from '../components/dashboard/TrendingPanel';
import MarketTable from '../components/dashboard/MarketTable';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { metrics, chartData, featuredCoin, trendingCoins, assets, fetchChartData } = useMarketData();

  useEffect(() => {
    if (featuredCoin?.coinId) {
      fetchChartData('7D');
    }
  }, [featuredCoin?.coinId]);

  return (
    <main className="dashboard">
      <div className="dashboard-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search cryptocurrency (e.g. BTC, ETH)..."
        />
      </div>

      <div className="dashboard-metrics">
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

      <div className="dashboard-charts">
        <PriceChart coin={featuredCoin} data={chartData} onTabChange={fetchChartData} />
        <TrendingPanel coins={trendingCoins} />
      </div>

      <MarketTable assets={assets} />
    </main>
  );
}