import { useState } from 'react';
import Badge from '../shared/Badge';
import { colors, radius, fontSize } from '../../styles/tokens';
import CoinLogo from '../shared/CoinLogo';

const AVAILABLE_COLUMNS = [
  { key: 'rank', label: '#', default: true },
  { key: 'watchlist', label: 'Watchlist', default: true },
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
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        width: 18,
        height: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? colors.yellow : 'none'} stroke={filled ? colors.yellow : colors.textMuted} strokeWidth="2">
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
        return (
          <StarIcon 
            filled={inWatchlist} 
            onClick={(e) => toggleWatchlist(e, asset)} 
          />
        );
      case 'rank':
        return <span style={{ color: colors.textMuted, fontSize: fontSize.sm }}>{asset.rank}</span>;
      case 'name':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CoinLogo ticker={asset.ticker} size={24} image={asset.image} />
            <span style={{ fontWeight: 600, fontSize: fontSize.sm }}>{asset.name}</span>
          </div>
        );
      case 'price':
        return <span style={{ fontWeight: 600, fontSize: fontSize.sm }}>{asset.price}</span>;
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
        return <span style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>{asset[key]}</span>;
      case 'marketCapRank':
        return <span style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>{asset[key]}</span>;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        background: colors.bgSurface,
        border: `0.5px solid ${colors.borderDefault}`,
        borderRadius: radius.lg,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '8px 16px', borderBottom: `0.5px solid ${colors.borderDefault}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: fontSize.xs, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Market Data
        </span>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.textMuted,
              fontSize: fontSize.sm,
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Columns
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {showColumnMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: colors.bgSurface,
                border: `0.5px solid ${colors.borderDefault}`,
                borderRadius: radius.md,
                padding: 4,
                minWidth: 150,
                zIndex: 50,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {AVAILABLE_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    cursor: 'pointer',
                    fontSize: fontSize.sm,
                    color: colors.textPrimary,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    style={{ accentColor: colors.blue }}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontSize: fontSize.xs,
                  fontWeight: 600,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `0.5px solid ${colors.borderDefault}`,
                  background: colors.bgOverlay,
                }}
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
              style={{ borderBottom: `0.5px solid ${colors.borderSubtle}`, cursor: 'pointer' }}
            >
              {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map((col) => (
                <td key={col.key} style={{ padding: '12px 16px' }}>
                  {renderCell(asset, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}