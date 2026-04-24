import { useState, useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/tokens';
import MetricCard from '../components/dashboard/MetricCard';
import PriceChart from '../components/dashboard/PriceChart';
import TrendingPanel from '../components/dashboard/TrendingPanel';
import MarketTable from '../components/dashboard/MarketTable';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { metrics, chartData, featuredCoin, trendingCoins, assets, fetchChartData, selectCoin } = useMarketData();
  const { user, watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAssets, setFilteredAssets] = useState([]);

  useEffect(() => {
    if (featuredCoin?.coinId) {
      fetchChartData('7D');
    }
  }, [featuredCoin?.coinId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAssets(assets);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAssets(assets.filter(asset => 
        asset.name.toLowerCase().includes(query) || 
        asset.ticker.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, assets]);

  const handleWatchlistToggle = (asset) => {
    if (!user) {
      alert('Please login to add coins to your watchlist');
      return;
    }
    if (isInWatchlist(asset.coinId)) {
      removeFromWatchlist(asset.coinId);
    } else {
      addToWatchlist(asset);
    }
  };

  return (
    <main className="dashboard">
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
        <TrendingPanel coins={trendingCoins} onCoinClick={selectCoin} />
      </div>

      <div className="dashboard-search" style={{ marginBottom: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search cryptocurrency (e.g. BTC, ETH)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <MarketTable 
        assets={filteredAssets} 
        onCoinSelect={selectCoin} 
        watchlist={watchlist}
        onAddToWatchlist={handleWatchlistToggle}
      />
    </main>
  );
}