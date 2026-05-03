import { useState, useEffect, useMemo, Fragment } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/dashboard/MetricCard';
import PriceChart from '../components/dashboard/PriceChart';

const AVAILABLE_COLUMNS = [
  { key: 'rank', label: '#', default: true },
  { key: 'watchlist', label: 'Watchlist', default: true },
  { key: 'name', label: 'Coin', default: true },
  { key: 'price', label: 'Price', default: true },
  { key: 'change1h', label: '1h %', default: true },
  { key: 'change7d', label: '7d %', default: true },
  { key: 'change', label: '24h %', default: true },
  { key: 'marketCap', label: 'Market Cap', default: true },
  { key: 'volume', label: 'Volume', default: true },
  { key: 'high24h', label: '24h High', default: false },
  { key: 'low24h', label: '24h Low', default: false },
  { key: 'ath', label: 'ATH', default: false },
  { key: 'ath_change', label: 'ATH Change %', default: false },
  { key: 'atl', label: 'ATL', default: false },
  { key: 'mCapRank', label: 'Rank', default: false },
];

const COLUMN_WIDTHS = {
    rank: '50px',
    watchlist: '40px',
    name: 'minmax(140px, 1.5fr)',
    price: 'minmax(100px, 1fr)',
    change1h: 'minmax(70px, 0.7fr)',
    change7d: 'minmax(70px, 0.7fr)',
    change: 'minmax(80px, 0.8fr)',
    marketCap: 'minmax(110px, 1fr)',
    volume: 'minmax(90px, 1fr)',
    high24h: 'minmax(90px, 1fr)',
    low24h: 'minmax(90px, 1fr)',
    ath: 'minmax(90px, 1fr)',
    ath_change: 'minmax(100px, 1fr)',
    atl: 'minmax(90px, 1fr)',
    mCapRank: '60px',
  };

  const getColumnWidth = (key) => COLUMN_WIDTHS[key] || '1fr';

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
  const { token, addToWatchlist, removeFromWatchlist, isInWatchlist } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredAssets = useMemo(() => {
    let result = assets;

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

    return result;
  }, [searchQuery, assets, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedAssets = filteredAssets.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE
  );

  const toggleColumn = (key) => {
    if (visibleColumns.includes(key)) {
      setVisibleColumns(visibleColumns.filter(c => c !== key));
    } else {
      setVisibleColumns([...visibleColumns, key]);
    }
  };

  const handleWatchlistToggle = async (e, asset) => {
    e.stopPropagation();
    if (!token) {
      alert('Please login to add coins to your watchlist');
      return;
    }

    const coinId = asset?.coinId;

    if (!coinId) {
      alert('coinId is required');
      return;
    }

    const result = isInWatchlist(coinId)
      ? await removeFromWatchlist(coinId)
      : await addToWatchlist(asset);

    if (!result.success) {
      alert(result.error);
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
        return (
          <div className="flex items-center gap-1">
            <span className={`text-sm font-semibold whitespace-nowrap ${asset.priceDirection === 'up' ? 'text-success' : asset.priceDirection === 'down' ? 'text-danger' : 'text-primary'}`}>
              {asset.price}
            </span>
            {asset.priceDirection === 'up' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            )}
            {asset.priceDirection === 'down' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger shrink-0">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            )}
          </div>
        );
      case 'change':
        return (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${asset.change >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
            {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%
          </span>
        );
      case 'change1h':
        return (
          <span className={`text-xs font-medium ${asset.price_change_percentage_1h_in_currency >= 0 ? 'text-success' : 'text-danger'}`}>
            {asset.price_change_percentage_1h_in_currency >= 0 ? '+' : ''}{asset.price_change_percentage_1h_in_currency?.toFixed(2)}%
          </span>
        );
      case 'change7d':
        return (
          <span className={`text-xs font-medium ${asset.price_change_percentage_7d_in_currency >= 0 ? 'text-success' : 'text-danger'}`}>
            {asset.price_change_percentage_7d_in_currency >= 0 ? '+' : ''}{asset.price_change_percentage_7d_in_currency?.toFixed(2)}%
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
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="lg:w-[65%]">
          <PriceChart coin={featuredCoin} data={chartData} onTabChange={fetchChartData} />
        </div>
        <div className="lg:w-[35%] lg:h-[320px]">
          <div className="flex overflow-x-auto gap-2 pb-2 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2 lg:h-full">
            {statsMetrics.map((m) => (
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

{/* Search and Actions Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-surface border border-default rounded-lg p-2 min-w-[200px] w-[30%] max-w-[400px] flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search cryptocurrency (e.g BTC ETH)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder:text-muted min-w-0"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-1.5 bg-surface border border-default rounded-lg px-2.5 py-1.5 text-xs text-primary cursor-pointer hover:bg-overlay"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 3l-9.5 9.5-5-5L1 18"/>
              </svg>
              Filter
            </button>
            {showFilterMenu && (
              <div className="absolute top-full left-0 mt-1 bg-surface border border-default rounded-lg p-1 min-w-[140px] z-50 shadow-lg">
                {FILTER_OPTIONS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => {
                      setActiveFilter(filter.key);
                      setCurrentPage(1);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded cursor-pointer ${activeFilter === filter.key ? 'bg-accent text-white' : 'text-primary hover:bg-overlay'}`}
                  >
                    <span className="w-3">{filter.key !== 'all' && '•'}</span>
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
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
      </div>

      {/* Market Table */}
      <div className="bg-surface border border-default rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-default">
          <span className="text-xs font-semibold text-muted uppercase">Market Data</span>
          <span className="text-xs text-muted">{filteredAssets.length} coins</span>
        </div>
        
        <div className="overflow-x-auto">
          <div 
            className="w-full border-collapse" 
            style={{ display: 'grid', gridTemplateColumns: visibleColumns.map(getColumnWidth).join(' '), gap: '0' }}
          >
            {visibleColumns.map((colKey) => {
              const col = AVAILABLE_COLUMNS.find(c => c.key === colKey);
              const isLeftAligned = colKey === 'name' || colKey === 'price' || colKey === 'change1h' || colKey === 'change7d';
              const centerAlign = colKey === 'watchlist';
              return (
                <div 
                  key={colKey} 
                  className={`sticky top-0 z-10 bg-surface border-b border-default px-2 py-2 text-xs font-semibold text-muted uppercase ${centerAlign ? 'flex items-center justify-center' : ''}`}
                  style={{ 
                    display: 'flex',
                    textAlign: isLeftAligned ? 'left' : 'right',
                    justifyContent: isLeftAligned ? 'flex-start' : (centerAlign ? 'center' : 'flex-end'),
                    alignItems: 'center'
                  }}
                >
                  {colKey === 'watchlist' ? '★' : col?.label}
                </div>
              );
            })}
            
            {paginatedAssets.map((asset) => 
              visibleColumns.map((colKey) => (
                <div 
                  key={`${asset.coinId}-${colKey}`}
                  onClick={() => colKey !== 'watchlist' && selectCoin({
                    name: asset.name,
                    ticker: asset.ticker,
                    coinId: asset.coinId,
                    current_price: asset.current_price,
                    change: asset.change,
                    image: asset.image,
                  })}
                  className={`border-b border-subtle hover:bg-overlay cursor-pointer transition-colors px-2 py-2 ${colKey === 'watchlist' ? 'flex items-center justify-center' : ''}`}
                  style={{ 
                    display: 'flex',
                    textAlign: (colKey === 'name' || colKey === 'price' || colKey === 'change1h' || colKey === 'change7d') ? 'left' : 'right',
                    justifyContent: (colKey === 'name' || colKey === 'price' || colKey === 'change1h' || colKey === 'change7d') ? 'flex-start' : (colKey === 'watchlist' ? 'center' : 'flex-end'),
                    alignItems: 'center'
                  }}
                >
                  {colKey === 'watchlist' ? (
                    <div 
                      onClick={(e) => handleWatchlistToggle(e, asset)}
                      onMouseEnter={(e) => e.currentTarget.title = 'Add to watchlist'}
                      onMouseLeave={(e) => e.currentTarget.title = ''}
                      className="cursor-pointer"
                    >
                      {renderCell(asset, 'watchlist')}
                    </div>
                  ) : renderCell(asset, colKey)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-default bg-overlay">
            <span className="text-xs text-muted">
              Showing {(activePage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(activePage * ITEMS_PER_PAGE, filteredAssets.length)} of {filteredAssets.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={activePage === 1}
                className="px-2 py-1 text-xs rounded border border-default bg-surface text-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-overlay"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (activePage <= 3) {
                  pageNum = i + 1;
                } else if (activePage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = activePage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 text-xs rounded border ${pageNum === activePage ? 'bg-accent text-white border-accent' : 'bg-surface text-primary border-default hover:bg-overlay'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={activePage === totalPages}
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
