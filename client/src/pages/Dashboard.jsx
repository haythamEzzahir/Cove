import { useMarketData } from '../hooks/useMarketData';
import MetricCard from '../components/dashboard/MetricCard';
import PriceChart from '../components/dashboard/PriceChart';
import TrendingPanel from '../components/dashboard/TrendingPanel';
import MarketTable from '../components/dashboard/MarketTable';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { metrics, chartData, featuredCoin, trendingCoins, assets } = useMarketData();

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Market Dashboard</h1>
        <p className="dashboard-subtitle">Live market feed · Last updated 2 mins ago</p>
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
        <PriceChart coin={featuredCoin} data={chartData} />
        <TrendingPanel coins={trendingCoins} />
      </div>

      <MarketTable assets={assets} />
    </main>
  );
}