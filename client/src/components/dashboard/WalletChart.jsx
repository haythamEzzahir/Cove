import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../context/ThemeContext';

const TIME_RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'All', days: Infinity },
];

// Format a date label for the X axis based on the selected range
function fmtAxisLabel(rawDate, rangeDays) {
  try {
    const d = new Date(rawDate);
    const now = new Date();
    const diffHours = (now - d) / (1000 * 60 * 60);

    if (rangeDays <= 7 && diffHours < 24) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (rangeDays <= 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    }
    if (rangeDays <= 90) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  } catch {
    return String(rawDate);
  }
}

// Format a date for the tooltip popup
function fmtTooltipDate(rawDate) {
  try {
    const d = new Date(rawDate);
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return String(rawDate);
  }
}

// Portfolio value chart with time range filtering (7D/30D/90D/1Y/All)
export default function WalletChart({ data = [], totalBalance = 0 }) {
  const [activeRange, setActiveRange] = useState(TIME_RANGES[4]);
  const { currencyData } = useCurrency();
  const { isDark } = useTheme();

  const mutedColor = isDark ? '255,255,255' : '100,116,139';
  const bgOverlay = isDark ? '24,24,27' : '255,255,255';
  const borderColor = isDark ? '63,63,70' : '228,231,235';
  const chartGreen = '#10b981';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const chartPoints = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    const rangeDays = activeRange.days;
    const cutoff = rangeDays === Infinity ? null : new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);

    const all = data
      .map(p => ({
        ts: new Date(p.t || p.label),
        price: Number(p.price ?? p.value ?? 0),
      }))
      .filter(p => Number.isFinite(p.ts.getTime()))
      .sort((a, b) => a.ts - b.ts);

    let filtered = cutoff ? all.filter(p => p.ts >= cutoff) : all;

    if (filtered.length < 2 && all.length > 0) {
      const last = all[all.length - 1];
      filtered = [
        { ts: cutoff || all[0].ts, price: all.length > 1 ? all[all.length - 2].price : last.price },
        { ts: now, price: totalBalance || last.price },
      ];
    }

    return filtered.map(p => ({
      t: fmtAxisLabel(p.ts.toISOString(), rangeDays),
      fullDate: fmtTooltipDate(p.ts.toISOString()),
      price: p.price,
    }));
  }, [data, activeRange.days, totalBalance]);

  const formatPrice = (value) => {
    if (value >= 1000000) return `${currencyData.symbol}${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${currencyData.symbol}${(value / 1000).toFixed(1)}k`;
    if (value >= 1) return `${currencyData.symbol}${value.toFixed(0)}`;
    return `${currencyData.symbol}${value.toFixed(2)}`;
  };

  const isPositive = chartPoints.length >= 2
    ? chartPoints[chartPoints.length - 1].price >= chartPoints[0].price
    : true;

  const gradientId = isPositive ? 'priceGradUp' : 'priceGradDown';
  const lineColor = isPositive ? chartGreen : '#ef4444';

  return (
    <div className="bg-surface border border-default rounded-xl p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-primary">Wallet Value</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              {currencyData.symbol}{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {chartPoints.length >= 2 && (
              <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
                {isPositive ? '+' : ''}{currencyData.symbol}
                {(chartPoints[chartPoints.length - 1].price - chartPoints[0].price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setActiveRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeRange.label === range.label
                  ? 'bg-accent text-white'
                  : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {chartPoints.length > 1 ? (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartPoints} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
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
                color: `rgb(${isDark ? '255,255,255' : '0,0,0'})`,
              }}
              formatter={(v) => [`${currencyData.symbol}${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
              labelFormatter={(_, payload) => {
                if (payload && payload.length > 0) {
                  return `Date: ${payload[0].payload.fullDate}`;
                }
                return '';
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: lineColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[180px]">
          <div className="text-center">
            <div className="text-3xl mb-2 opacity-30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-muted">
                <path d="M3 3v18h18" />
                <path d="M7 16l4-8 4 4 5-9" />
              </svg>
            </div>
            <p className="text-sm text-muted">Add transactions to see your portfolio history</p>
          </div>
        </div>
      )}
    </div>
  );
}
