import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CoinLogo from '../shared/CoinLogo';
import TabBar from '../shared/TabBar';
import Badge from '../shared/Badge';
import { colors, radius, fontSize } from '../../styles/tokens';
import { useCurrency } from '../../context/CurrencyContext';

const TIME_TABS = ['1D', '7D', '1M', '1Y', 'All'];

export default function PriceChart({ coin, data = [], onTabChange }) {
  const [activeTab, setActiveTab] = useState('7D');
  const { currencyData } = useCurrency();

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
            <CoinLogo ticker={coin?.ticker} size={22} image={coin?.image} />
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
              {currencyData.symbol}{coin?.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontSize: fontSize.base, color: isPositive ? colors.green : colors.red }}>
              {isPositive ? '+' : ''}{coin?.change}% ({isPositive ? '+' : ''}{currencyData.symbol}{coin?.changeAbs?.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Time range tabs */}
        <TabBar tabs={TIME_TABS} active={activeTab} onChange={handleTab} />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
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
          <YAxis
            orientation="right"
            tick={{ fill: colors.textMuted, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(value) => {
              if (value >= 1000) return `${currencyData.symbol}${(value / 1000).toFixed(1)}k`;
              if (value >= 1) return `${currencyData.symbol}${value.toFixed(0)}`;
              return `${currencyData.symbol}${value.toFixed(2)}`;
            }}
          />
          <Tooltip
            contentStyle={{
              background: colors.bgOverlay,
              border: `0.5px solid ${colors.borderDefault}`,
              borderRadius: radius.md,
              fontSize: 12,
              color: colors.textPrimary,
            }}
            formatter={(v) => [`${currencyData.symbol}${v.toLocaleString()}`, 'Price']}
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