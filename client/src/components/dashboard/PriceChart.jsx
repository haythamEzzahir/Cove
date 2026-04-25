import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CoinLogo from '../shared/CoinLogo';
import TabBar from '../shared/TabBar';
import Badge from '../shared/Badge';
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
    <div className="bg-surface border border-default rounded-xl p-5 min-h-[200px] lg:min-h-[300px]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CoinLogo ticker={coin?.ticker} size={24} image={coin?.image} />
            <span className="text-sm text-muted">{coin?.name} / USD</span>
            {coin?.status && <Badge variant="green" className="text-[10px]">{coin.status}</Badge>}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-primary">
              {currencyData.symbol}{coin?.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
              {isPositive ? '+' : ''}{coin?.change}% ({isPositive ? '+' : ''}{currencyData.symbol}{coin?.changeAbs?.toLocaleString()})
            </span>
          </div>
        </div>
        <TabBar tabs={TIME_TABS} active={activeTab} onChange={handleTab} />
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tick={{ fill: 'rgb(var(--text-muted))', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            orientation="right"
            tick={{ fill: 'rgb(var(--text-muted))', fontSize: 10 }}
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
              background: 'rgb(var(--bg-overlay))',
              border: '1px solid rgb(var(--border-default))',
              borderRadius: '8px',
              fontSize: 12,
              color: 'rgb(var(--text-primary))',
            }}
            formatter={(v) => [`${currencyData.symbol}${v.toLocaleString()}`, 'Price']}
            labelStyle={{ color: 'rgb(var(--text-muted))' }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="rgb(var(--color-primary))"
            strokeWidth={2}
            fill="url(#priceGrad)"
            dot={false}
            activeDot={{ r: 4, fill: 'rgb(var(--color-primary))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}