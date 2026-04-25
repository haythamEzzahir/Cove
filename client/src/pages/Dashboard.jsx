import { useState, useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/dashboard/MetricCard';
import PriceChart from '../components/dashboard/PriceChart';

const AVAILABLE_COLUMNS = [
  { key: 'rank', label: '#', default: true },
  { key: 'watchlist', label: '', default: true },
  { key: 'name', label: 'Coin', default: true },
  { key: 'price', label: 'Price', default: true },
  { key: 'change', label: '24h %', default: true },
  { key: 'marketCap', label: 'Market Cap', default: true },
  { key: 'volume', label: 'Volume', default: false },
  { key: 'high24h', label: '24h High', default: false },
  { key: 'low24h', label: '24h Low', default: false },
  { key: 'ath', label: 'ATH', default: false },
  { key: 'ath_change', label: 'ATH Change %', default: false },
  { key: 'atl', label: 'ATL', default: false },
  { key: 'mCapRank', label: 'Rank', default: false },
];

const ITEMS_PER_PAGE = 30;

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'trending', label: 'Trending' },
  { key: 'gainers', label: 'Gainers' },
  { key: 'losers', label: 'Losers' },
  { key: 'new', label: 'New' },
];

export default function Dashboard() {
  const { metrics, chartData, featuredCoin, assets, fetchChartData, selectCoin } = useMarketData();
  const { user, addToWatchlist, removeFromWatchlist, isInWatchlist } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(() => AVAILABLE_COLUMNS.filter(c => c.default).map(c => c.key));
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (featuredCoin?.coinId) {
      fetchChartData('7D');
    }
  }, [featuredCoin?.coinId]);

  useEffect(() => {
    let result = assets;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(asset => 
        asset.name.toLowerCase().includes(query) || 
        asset.ticker.toLowerCase().includes(query)
      );
    }
    
    // Apply trending/gainers/losers filter
    if (activeFilter === 'trending') {
      result = result.slice(0, 10);
    } else if (activeFilter === 'gainers') {
      result = result.filter(a => a.change >= 0).sort((a, b) => b.change - a.change);
    } else if (activeFilter === 'losers') {
      result = result.filter(a => a.change < 0).sort((a, b) => a.change - b.change);
    } else if (activeFilter === 'new') {
      result = result.filter(a => a.marketCapRank <= 50).sort((a, b) => a.marketCapRank - b.marketCapRank);
    }
    
    setFilteredAssets(result);
    setCurrentPage(1);
  }, [searchQuery, assets, activeFilter]);

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleColumn = (key) => {
    if (visibleColumns.includes(key)) {
      setVisibleColumns(visibleColumns.filter(c => c !== key));
    } else {
      setVisibleColumns([...visibleColumns, key]);
    }
  };

  const handleWatchlistToggle = (e, asset) => {
    e.stopPropagation();
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

  const renderCell = (asset, key) => {
    const inWatchlist = isInWatchlist(asset.coinId);
    switch (key) {
      case 'watchlist':
        return (
          <button
            onClick={(e) => handleWatchlistToggle(e, asset)}
            className={`w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer ${inWatchlist ? 'text-amber-500' : 'text-muted hover:text-primary'}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={inWatchlist ? '#f59e0b' : 'none'} stroke={inWatchlist ? '#f59e0b' : 'currentColor'} strokeWidth="2">
              <path d="m12 3.75 2.55 5.17 5.7.83-4.13 4.03.98 5.68L12 16.78l-5.1 2.68.98-5.68L3.75 9.75l5.7-.83L12 3.75Z" />
            </svg>
          </button>
        );
      case 'rank':
        return <span className="text-xs text-muted w-6">{asset.rank}</span>;
      case 'name':
        return (
          <div className="flex items-center gap-2 min-w-0">
            <img src={asset.image} alt={asset.name} className="w-5 h-5 rounded-full shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-primary truncate">{asset.name}</div>
              <div className="text-xs text-muted">{asset.ticker}</div>
            </div>
          </div>
        );
      case 'price':
        return <span className="text-sm font-semibold text-primary whitespace-nowrap">{asset.price}</span>;
      case 'change':
        return (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${asset.change >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
            {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%
          </span>
        );
      case 'ath_change':
        return (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${asset.ath_change >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
            {asset.ath_change >= 0 ? '+' : ''}{asset.ath_change?.toFixed(2)}%
          </span>
        );
      case 'high24h':
      case 'low24h':
      case 'ath':
      case 'atl':
      case 'marketCap':
      case 'volume':
      case 'mCapRank':
        return <span className="text-xs text-secondary whitespace-nowrap">{asset[key] || '-'}</span>;
      default:
        return null;
    }
  };

  const statsMetrics = [
    { id: 'marketCap', label: 'Market Cap', value: metrics[0]?.value || '-', change: metrics[0]?.change },
    { id: 'volume', label: '24h Volume', value: metrics[1]?.value || '-', change: metrics[1]?.change },
    { id: 'dominance', label: 'BTC Dominance', value: metrics[2]?.value || '-', change: metrics[2]?.change },
    { id: 'fearGreed', label: 'Fear & Greed', value: metrics[3]?.value || '-', badge: metrics[3]?.badge, change: null },
    { id: 'ath', label: 'BTC ATH', value: metrics[4]?.value || '-', change: metrics[4]?.change },
    { id: 'globalCap', label: 'Global Cap', value: metrics[5]?.value || '-', change: metrics[5]?.change },
  ];

  return (
    <main className="p-3 sm:p-5 flex flex-col gap-3">
      {/* Desktop: chart 65% left, metrics 35% right */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="lg:w-[65%]">
          <PriceChart coin={featuredCoin} data={chartData} onTabChange={fetchChartData} />
        </div>
        <div className="lg:w-[35%]">
          <div className="flex overflow-x-auto gap-2 pb-2 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2 lg:h-full">
            <MetricCard
                key={m.id}
                label={m.label}
                value={m.value}
                badge={m.badge}
                change={m.change}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Search and Columns Bar - Filter left, Columns right */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-surface border border-default rounded-lg p-2 max-w-[280px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder:text-muted min-w-0"
            />
          </div>
          
          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-1.5 bg-surface border border-default rounded-lg px-2.5 py-1.5 text-xs text-primary cursor-pointer hover:bg-overlay"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 3l-9.5 9.5-5-5L1 18"/>
              </svg>
              {FILTER_OPTIONS.find(f => f.key === activeFilter)?.label}
            </button>
            {showFilterMenu && (
              <div className="absolute top-full left-0 mt-1 bg-surface border border-default rounded-lg p-1 min-w-[140px] z-50 shadow-lg">
                {FILTER_OPTIONS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => { setActiveFilter(filter.key); setShowFilterMenu(false); }}
                    className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded cursor-pointer ${activeFilter === filter.key ? 'bg-accent text-white' : 'text-primary hover:bg-overlay'}`}
                  >
                    <span className="w-3">{filter.key !== 'all' && '•'}</span>
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Columns dropdown - on the right */}
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="flex items-center gap-1.5 bg-surface border border-default rounded-lg px-2.5 py-1.5 text-xs text-primary cursor-pointer hover:bg-overlay"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Columns
          </button>
          {showColumnMenu && (
            <div className="absolute top-full right-0 mt-1 bg-surface border border-default rounded-lg p-1 min-w-[150px] z-50 shadow-lg">
              {AVAILABLE_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-overlay rounded text-xs text-primary"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="accent-accent"
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Market Table */}
      <div className="bg-surface border border-default rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-default">
          <span className="text-xs font-semibold text-muted uppercase">Market Data</span>
          <span className="text-xs text-muted">{filteredAssets.length} coins</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-default">
                {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map((col) => (
                  <th key={col.key} className={`text-left px-2 py-2 text-xs font-semibold text-muted uppercase bg-overlay whitespace-nowrap ${['price', 'change', 'marketCap', 'volume', 'high24h', 'low24h', 'ath', 'ath_change', 'atl', 'mCapRank'].includes(col.key) ? 'text-right' : ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedAssets.map((asset) => (
                <tr
                  key={asset.coinId}
                  onClick={() => selectCoin({
                    name: asset.name,
                    ticker: asset.ticker,
                    coinId: asset.coinId,
                    current_price: asset.current_price,
                    change: asset.change,
                    image: asset.image,
                  })}
                  className="border-b border-subtle hover:bg-overlay cursor-pointer transition-colors"
                >
                  {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map((col) => (
                    <td key={col.key} className={`px-2 py-2 ${['price', 'change', 'marketCap', 'volume', 'high24h', 'low24h', 'ath', 'ath_change', 'atl', 'mCapRank'].includes(col.key) ? 'text-right' : ''}`}>
                      {renderCell(asset, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-default bg-overlay">
            <span className="text-xs text-muted">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)} of {filteredAssets.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs rounded border border-default bg-surface text-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-overlay"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 text-xs rounded border ${pageNum === currentPage ? 'bg-accent text-white border-accent' : 'bg-surface text-primary border-default hover:bg-overlay'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs rounded border border-default bg-surface text-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-overlay"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-muted pt-4 border-t border-subtle flex justify-center gap-5">
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