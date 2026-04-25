import { useState } from 'react';
import Badge from '../shared/Badge';
import CoinLogo from '../shared/CoinLogo';

const AVAILABLE_COLUMNS = [
  { key: 'rank', label: '#', default: true },
  { key: 'watchlist', label: '', default: true },
  { key: 'name', label: 'Coin', default: true },
  { key: 'price', label: 'Price', default: true },
  { key: 'change', label: '24h %', default: true },
  { key: 'marketCap', label: 'Market Cap', default: true },
  { key: 'volume', label: 'Volume (24h)', default: true },
  { key: 'high24h', label: '24h High', default: false },
  { key: 'low24h', label: '24h Low', default: false },
  { key: 'ath', label: 'All Time High', default: false },
  { key: 'ath_change', label: 'ATH Change %', default: false },
  { key: 'atl', label: 'All Time Low', default: false },
  { key: 'marketCapRank', label: 'MCap Rank', default: false },
];

function StarIcon({ filled, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer ${filled ? 'text-amber-500' : 'text-muted hover:text-primary'}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke={filled ? '#f59e0b' : 'currentColor'} strokeWidth="2">
        <path d="m12 3.75 2.55 5.17 5.7.83-4.13 4.03.98 5.68L12 16.78l-5.1 2.68.98-5.68L3.75 9.75l5.7-.83L12 3.75Z" />
      </svg>
    </button>
  );
}

export default function MarketTable({ assets, onCoinSelect, watchlist = [], onAddToWatchlist }) {
  const [visibleColumns, setVisibleColumns] = useState(() => 
    AVAILABLE_COLUMNS.filter(c => c.default).map(c => c.key)
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const toggleWatchlist = (e, asset) => {
    e.stopPropagation();
    if (!onAddToWatchlist) return;
    onAddToWatchlist(asset);
  };

  const toggleColumn = (key) => {
    if (visibleColumns.includes(key)) {
      setVisibleColumns(visibleColumns.filter(c => c !== key));
    } else {
      setVisibleColumns([...visibleColumns, key]);
    }
  };

  const renderCell = (asset, key) => {
    const inWatchlist = watchlist.includes(asset.coinId);
    switch (key) {
      case 'watchlist':
        return <StarIcon filled={inWatchlist} onClick={(e) => toggleWatchlist(e, asset)} />;
      case 'rank':
        return <span className="text-sm text-muted">{asset.rank}</span>;
      case 'name':
        return (
          <div className="flex items-center gap-2">
            <CoinLogo ticker={asset.ticker} size={24} image={asset.image} />
            <span className="text-sm font-semibold text-primary">{asset.name}</span>
          </div>
        );
      case 'price':
        return <span className="text-sm font-semibold text-primary">{asset.price}</span>;
      case 'change':
        return (
          <Badge variant={asset.change >= 0 ? 'green' : 'red'}>
            {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
          </Badge>
        );
      case 'ath_change':
        return (
          <Badge variant={asset.ath_change >= 0 ? 'green' : 'red'}>
            {asset.ath_change >= 0 ? '+' : ''}{asset.ath_change.toFixed(2)}%
          </Badge>
        );
      case 'high24h':
      case 'low24h':
      case 'ath':
      case 'atl':
      case 'marketCap':
      case 'volume':
        return <span className="text-sm text-secondary">{asset[key]}</span>;
      case 'marketCapRank':
        return <span className="text-sm text-secondary">{asset[key]}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-surface border border-default rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-default">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">Market Data</span>
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="flex items-center gap-1 text-sm text-muted bg-transparent border-none cursor-pointer hover:text-primary"
          >
            Columns
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {showColumnMenu && (
            <div className="absolute top-full right-0 mt-1 bg-surface border border-default rounded-lg p-1 min-w-[150px] z-50 shadow-lg">
              {AVAILABLE_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-overlay rounded text-sm text-primary"
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-default">
              {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider bg-overlay"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr
                key={asset.coinId}
                onClick={() => onCoinSelect?.({
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
                  <td key={col.key} className="px-4 py-3">
                    {renderCell(asset, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}