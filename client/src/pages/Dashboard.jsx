import { useState, useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/dashboard/MetricCard';
import PriceChart from '../components/dashboard/PriceChart';
import TrendingPanel from '../components/dashboard/TrendingPanel';
import MarketTable from '../components/dashboard/MarketTable';

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
    <main className="p-6 flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
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

      <div className="flex flex-wrap gap-3">
        <PriceChart coin={featuredCoin} data={chartData} onTabChange={fetchChartData} />
        <TrendingPanel coins={trendingCoins} onCoinClick={selectCoin} />
      </div>

      <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-2 max-w-[380px]" style={{ marginBottom: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7d8590" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search cryptocurrency (e.g. BTC, ETH)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[#e6edf3] text-sm"
        />
      </div>

      <MarketTable 
        assets={filteredAssets} 
        onCoinSelect={selectCoin} 
        watchlist={watchlist}
        onAddToWatchlist={handleWatchlistToggle}
      />

      <footer className="text-center text-xs text-[#7d8590] pt-4 border-t border-[#21262d] flex justify-center gap-5">
        <span>© 2024 FinTracker Inc. All rights reserved.</span>
        <div className="flex gap-3.5">
          <a href="#" className="text-inherit no-underline">Terms</a>
          <a href="#" className="text-inherit no-underline">Privacy</a>
          <a href="#" className="text-inherit no-underline">Support</a>
        </div>
      </footer>
    </main>
  );
}