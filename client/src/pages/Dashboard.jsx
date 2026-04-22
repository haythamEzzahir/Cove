import { useMarketData } from '../hooks/useMarketData';
import { colors } from '../styles/tokens';
import MetricCard from '../components/dashboard/MetricCard';
import PriceChart from '../components/dashboard/PriceChart';
import TrendingPanel from '../components/dashboard/TrendingPanel';
import MarketTable from '../components/dashboard/MarketTable';

export default function Dashboard() {
  const { metrics, chartData, featuredCoin, trendingCoins, assets } = useMarketData();

  return (
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
  );
}