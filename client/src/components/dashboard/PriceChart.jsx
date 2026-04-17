import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CoinLogo from '../shared/CoinLogo';
import TabBar from '../shared/TabBar';
import Badge from '../shared/Badge';
import { colors, radius, fontSize } from '../../styles/tokens';

const TIME_TABS = ['1D', '7D', '1M', '1Y', 'All'];

/**
 * PriceChart
 * Large featured coin chart with time range controls.
 *
 * Props:
 *   coin      {{ name, ticker, status, price, change, changeAbs }}
 *   data      {Array<{ t: string, price: number }>}
 *   onTabChange {(tab: string) => void}  fetch new data on tab change
 */
export default function PriceChart({ coin, data = [], onTabChange }) {
  const [activeTab, setActiveTab] = useState('7D');

  const handleTab = (tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const isPositive = coin?.change >= 0;

  return (
    <div
      style={{
        background: colors.bgSurface,
        border: `0.5px solid ${colors.borderDefault}`,
        borderRadius: radius.lg,
        padding: 20,
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          {/* Coin identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <CoinLogo ticker={coin?.ticker} size={22} />
            <span style={{ fontSize: fontSize.base, color: colors.textMuted }}>
              {coin?.name} / USD
            </span>
            {coin?.status && (
              <Badge variant="green" style={{ fontSize: '10px' }}>{coin.status}</Badge>
            )}
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: colors.textPrimary }}>
              ${coin?.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: fontSize.base, color: isPositive ? colors.green : colors.red }}>
              {isPositive ? '+' : ''}{coin?.change}% ({isPositive ? '+' : ''}${coin?.changeAbs?.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Time range tabs */}
        <TabBar tabs={TIME_TABS} active={activeTab} onChange={handleTab} />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={colors.blue} stopOpacity={0.25} />
              <stop offset="100%" stopColor={colors.blue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tick={{ fill: colors.textMuted, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              background: colors.bgOverlay,
              border: `0.5px solid ${colors.borderDefault}`,
              borderRadius: radius.md,
              fontSize: 12,
              color: colors.textPrimary,
            }}
            formatter={(v) => [`$${v.toLocaleString()}`, 'Price']}
            labelStyle={{ color: colors.textMuted }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={colors.blue}
            strokeWidth={2}
            fill="url(#priceGrad)"
            dot={false}
            activeDot={{ r: 4, fill: colors.blue }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}