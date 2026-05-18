import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import CoinLogo from '../shared/CoinLogo';
import Badge from '../shared/Badge';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../context/ThemeContext';

const TIME_TABS = ['1D', '7D', '1M', '1Y', 'All'];

// Chart component showing price history with time period tabs (1D/7D/1M/1Y/All)
export default function PriceChart({ coin, data = [], onTabChange }) {
  const [activeTab, setActiveTab] = useState('7D');
  const { currencyData } = useCurrency();
  const { isDark } = useTheme();
  
  const primaryColor = isDark ? '255,255,255' : '0,0,0';
  const mutedColor = isDark ? '255,255,255' : '100,116,139';
  const bgOverlay = isDark ? '24,24,27' : '255,255,255';
  const borderColor = isDark ? '63,63,70' : '228,231,235';
  const chartGreen = '#10b981';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const handleTab = (tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const isPositive = coin?.change >= 0;

  const formatPrice = (value) => {
    if (value >= 1000000) return `${currencyData.symbol}${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${currencyData.symbol}${(value / 1000).toFixed(1)}k`;
    if (value >= 1) return `${currencyData.symbol}${value.toFixed(0)}`;
    return `${currencyData.symbol}${value.toFixed(2)}`;
  };

  return (
    <div className="bg-surface border border-default rounded-xl p-4 lg:p-5 lg:h-[320px]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CoinLogo ticker={coin?.ticker} size={24} image={coin?.image} />
            <span className="text-sm text-muted">{coin?.name} / USD</span>
            {coin?.status && <Badge variant="green" className="text-[10px]">{coin.status}</Badge>}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              {currencyData.symbol}{coin?.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {coin?.priceDirection === 'up' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            )}
            {coin?.priceDirection === 'down' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            )}
            <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
              {isPositive ? '+' : ''}{coin?.change}% ({isPositive ? '+' : ''}{currencyData.symbol}{coin?.changeAbs?.toLocaleString()})
            </span>
          </div>
        </div>
        
        <div className="flex gap-1">
          {TIME_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-accent text-white'
                  : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartGreen} stopOpacity={0.25} />
              <stop offset="100%" stopColor={chartGreen} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke={gridColor} 
          />
          <XAxis
            dataKey="t"
            tick={{ fill: `rgb(${mutedColor})`, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            orientation="right"
            tick={{ fill: `rgb(${mutedColor})`, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
            tickFormatter={formatPrice}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: `rgb(${bgOverlay})`,
              border: `1px solid rgb(${borderColor})`,
              borderRadius: '8px',
              fontSize: 12,
              color: `rgb(${primaryColor})`,
            }}
            formatter={(v) => [`${currencyData.symbol}${v.toLocaleString()}`, 'Price']}
            labelStyle={{ color: `rgb(${mutedColor})` }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={chartGreen}
            strokeWidth={2}
            fill="url(#priceGrad)"
            dot={false}
            activeDot={{ r: 4, fill: chartGreen }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}