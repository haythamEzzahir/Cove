import CoinLogo from '../shared/CoinLogo';
import { colors, radius, fontSize } from '../../styles/tokens';

/**
 * TrendingPanel
 * "Trending Now" sidebar card showing top movers.
 *
 * Props:
 *   coins      {Array<{ name, ticker, price, change }>}
 *   onViewAll  {() => void}
 *   onCoinClick {(coin) => void}
 */
export default function TrendingPanel({ coins = [], onViewAll, onCoinClick }) {
  return (
    <div
      style={{
        background: colors.bgSurface,
        border: `0.5px solid ${colors.borderDefault}`,
        borderRadius: radius.lg,
        padding: 16,
        width: 210,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: fontSize.base, fontWeight: 500, color: colors.textPrimary }}>
          Trending Now
        </span>
        <button
          onClick={onViewAll}
          style={{ fontSize: '11px', color: colors.blue, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          View All
        </button>
      </div>

      {/* Coin rows */}
      {coins.map((coin, i) => {
        const isPositive = coin.change >= 0;
        return (
          <button
            key={coin.ticker}
            onClick={() => onCoinClick?.(coin)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 0',
              borderBottom: i < coins.length - 1 ? `0.5px solid ${colors.borderSubtle}` : 'none',
              background: 'none',
              border: 'none',
              borderBottomStyle: i < coins.length - 1 ? 'solid' : undefined,
              borderBottomWidth: i < coins.length - 1 ? '0.5px' : undefined,
              borderBottomColor: i < coins.length - 1 ? colors.borderSubtle : undefined,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <CoinLogo ticker={coin.ticker} size={30} />
              <div>
                <p style={{ fontSize: fontSize.sm, fontWeight: 500, color: colors.textPrimary, margin: 0 }}>{coin.name}</p>
                <p style={{ fontSize: '10px', color: colors.textMuted, margin: 0 }}>{coin.ticker}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: fontSize.sm, color: colors.textPrimary, margin: 0 }}>{coin.price}</p>
              <p style={{ fontSize: '11px', color: isPositive ? colors.green : colors.red, margin: 0 }}>
                {isPositive ? '+' : ''}{coin.change}%
              </p>
            </div>
          </button>
        );
      })}

      {/* CTA */}
      <button
        style={{
          marginTop: 12,
          width: '100%',
          padding: '7px',
          fontSize: '11px',
          fontWeight: 500,
          color: colors.blue,
          background: 'rgba(59,130,246,0.1)',
          border: `0.5px solid rgba(59,130,246,0.3)`,
          borderRadius: radius.md,
          cursor: 'pointer',
        }}
      >
        Explore Markets →
      </button>
    </div>
  );
}