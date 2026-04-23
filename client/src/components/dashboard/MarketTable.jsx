import Badge from '../shared/Badge';
import { colors, radius, fontSize } from '../../styles/tokens';
import CoinLogo from '../shared/CoinLogo';

export default function MarketTable({ assets, onCoinSelect }) {
  return (
    <div
      style={{
        background: colors.bgSurface,
        border: `0.5px solid ${colors.borderDefault}`,
        borderRadius: radius.lg,
        overflow: 'hidden',
        maxHeight: 400,
        overflowY: 'auto',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            {['#', 'Coin', 'Price', '24h %', 'Market Cap', 'Volume (24h)'].map((h, i) => (
              <th
                key={h}
                style={{
                  padding: '10px 16px',
                  textAlign: i === 0 || i > 2 ? 'left' : 'right',
                  fontSize: fontSize.xs,
                  fontWeight: 600,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `0.5px solid ${colors.borderDefault}`,
                  background: colors.bgOverlay,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr
              key={asset.coinId}
              onClick={() => onCoinSelect?.(asset)}
              style={{ borderBottom: `0.5px solid ${colors.borderSubtle}`, cursor: 'pointer' }}
            >
              <td style={{ padding: '12px 16px', color: colors.textMuted, fontSize: fontSize.sm }}>
                {asset.rank}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CoinLogo ticker={asset.ticker} size={24} image={asset.image} />
                  <span style={{ fontWeight: 600, fontSize: fontSize.sm }}>{asset.name}</span>
                </div>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: fontSize.sm }}>
                {asset.price}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <Badge variant={asset.change >= 0 ? 'green' : 'red'}>
                  {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                </Badge>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: colors.textSecondary, fontSize: fontSize.sm }}>
                {asset.marketCap}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: colors.textSecondary, fontSize: fontSize.sm }}>
                {asset.volume}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}