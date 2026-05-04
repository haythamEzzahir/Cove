import { useCallback, useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import MetricCard from '../components/dashboard/MetricCard';
import PriceChart from '../components/dashboard/PriceChart';
import CoinLogo from '../components/shared/CoinLogo';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FALLBACK_ALLOCATION_COLORS = ['#F7931A', '#627EEA', '#9945FF', '#2A5ADA', '#6B7280'];

const EMPTY_PORTFOLIO = {
  totalBalance: 0,
  profitLoss24h: 0,
  profitLoss24hPercent: 0,
  allTimeProfit: 0,
  allTimeProfitPercent: 0,
  assetAllocation: [],
  chartData: [],
  holdings: [],
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fmt(n) {
  const value = toNumber(n);
  return value >= 1e6
    ? `$${(value / 1e6).toFixed(3)}M`
    : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtSigned(n) {
  const value = toNumber(n);
  return `${value >= 0 ? '+' : '-'}${fmt(Math.abs(value))}`;
}

function fmtPercent(n) {
  const value = toNumber(n);
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function fmtQuantity(n) {
  const value = toNumber(n);
  return value.toLocaleString('en-US', {
    maximumFractionDigits: value >= 1 ? 4 : 8,
  });
}

function normalizeMarketCoin(coin = {}) {
  const currentPrice = toNumber(coin.current_price ?? coin.currentPrice, null);
  const symbol = String(coin.symbol || coin.ticker || '').trim().toUpperCase();
  const coinId = String(coin.id || coin.coinId || '').trim().toLowerCase();

  if (!coinId || !symbol) return null;

  return {
    coinId,
    name: coin.name || coinId,
    symbol,
    currentPrice,
    image: coin.image || '',
  };
}

async function getJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function normalizePortfolioData(data = {}) {
  const assetAllocation = Array.isArray(data.assetAllocation)
    ? data.assetAllocation.map((item, index) => ({
      name: item.name || item.symbol || 'Asset',
      ticker: item.symbol || item.ticker || '',
      value: toNumber(item.percentage ?? item.value),
      amount: toNumber(item.value),
      color: item.color || FALLBACK_ALLOCATION_COLORS[index % FALLBACK_ALLOCATION_COLORS.length],
    }))
    : [];

  const chartData = Array.isArray(data.chartData)
    ? data.chartData.map((point) => ({
      t: point.t || point.label || '',
      price: toNumber(point.price ?? point.value),
    })).filter((point) => point.t)
    : [];

  const holdings = Array.isArray(data.holdings)
    ? data.holdings.map((holding, index) => ({
      rank: holding.rank || index + 1,
      coinId: holding.coinId || '',
      name: holding.name || holding.coinId || 'Asset',
      ticker: holding.ticker || holding.symbol || '',
      amount: toNumber(holding.amount ?? holding.quantity),
      avgBuy: toNumber(holding.avgBuy ?? holding.averageBuyPrice),
      currentPrice: toNumber(holding.currentPrice),
      currentValue: toNumber(holding.currentValue),
      unrealizedPnl: toNumber(holding.unrealizedPnl),
      pnlPct: toNumber(holding.pnlPct),
      image: holding.image || '',
    }))
    : [];

  return {
    totalBalance: toNumber(data.totalBalance),
    profitLoss24h: toNumber(data.profitLoss24h),
    profitLoss24hPercent: toNumber(data.profitLoss24hPercent),
    allTimeProfit: toNumber(data.allTimeProfit),
    allTimeProfitPercent: toNumber(data.allTimeProfitPercent),
    assetAllocation,
    chartData,
    holdings,
  };
}

function DonutLabel({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-8" className="text-[10px] fill-secondary">Total</tspan>
      <tspan x={cx} dy="18" className="text-xs font-bold fill-primary">{fmt(total)}</tspan>
    </text>
  );
}

function AllocationCard({ total, allocationData }) {
  return (
    <div className="bg-surface border border-default rounded-xl p-4 flex-1 min-w-[250px]">
      <div className="mb-3">
        <span className="text-sm font-semibold text-primary block">Asset Allocation</span>
        <span className="text-xs text-muted block mt-0.5">Distribution by value</span>
      </div>
      <div className="flex justify-center my-4">
        <PieChart width={200} height={140}>
          <Pie
            data={allocationData}
            cx={100}
            cy={70}
            innerRadius={45}
            outerRadius={65}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {allocationData.map((entry, i) => (
              <Cell key={`${entry.name}-${i}`} fill={entry.color} />
            ))}
          </Pie>
          <DonutLabel cx={100} cy={70} total={total} />
        </PieChart>
      </div>
      <div className="flex flex-col gap-2">
        {allocationData.length > 0 ? (
          allocationData.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-secondary">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                {d.name}
              </span>
              <span className="text-sm font-semibold text-primary">{d.value.toFixed(1)}%</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted text-center py-3">No portfolio data yet</p>
        )}
      </div>
    </div>
  );
}

function AddAssetModal({ onClose, onAdd }) {
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [marketCoins, setMarketCoins] = useState([]);
  const [coinsLoading, setCoinsLoading] = useState(true);
  const [coinsError, setCoinsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchMarketCoins = useCallback(async () => {
    try {
      setCoinsLoading(true);
      setCoinsError('');

      const response = await fetch(`${API_URL}/coins?currency=usd`);
      const data = await getJson(response);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to load coins');
      }

      const coins = Array.isArray(data)
        ? data.map(normalizeMarketCoin).filter(Boolean)
        : [];

      setMarketCoins(coins);
    } catch (err) {
      const message = err instanceof TypeError && err.message === 'Failed to fetch'
        ? `Unable to reach backend at ${API_URL}`
        : err.message || 'Failed to load coins';

      setMarketCoins([]);
      setCoinsError(message);
    } finally {
      setCoinsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMarketCoins();
  }, [fetchMarketCoins]);

  const filteredCoins = marketCoins.filter(
    (c) =>
      search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );
  const selectedCoinPrice = toNumber(selectedCoin?.currentPrice, null);
  const hasSelectedCoinPrice = Number.isFinite(selectedCoinPrice) && selectedCoinPrice > 0;
  const amountNumber = Number(amount);
  const hasValidAmount = Number.isFinite(amountNumber) && amountNumber > 0;
  const total = hasSelectedCoinPrice && hasValidAmount
    ? selectedCoinPrice * amountNumber
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCoin) return;

    if (!hasValidAmount) {
      setFormError('Amount must be greater than 0');
      return;
    }

    if (!hasSelectedCoinPrice) {
      setFormError('Current price unavailable for this coin');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const result = await onAdd({
      coinId: selectedCoin.coinId,
      name: selectedCoin.name,
      symbol: selectedCoin.symbol,
      quantity: amountNumber,
      currentPrice: selectedCoinPrice,
      image: selectedCoin.image,
    });

    setSubmitting(false);

    if (result?.success === false) {
      setFormError(result.error || 'Failed to add asset');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-surface border border-default rounded-xl p-6 w-[400px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-primary">Add Asset</h2>
            <p className="text-xs text-secondary">Select a coin and enter amount.</p>
          </div>
          <button className="bg-transparent border-none cursor-pointer text-secondary p-1 hover:text-primary" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 bg-base border border-default rounded-lg p-2.5 mb-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search coin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder:text-muted"
            />
          </div>
          <div className="max-h-[150px] overflow-y-auto mb-3">
            {coinsLoading && (
              <div className="p-3 text-sm text-secondary">Loading coins...</div>
            )}
            {!coinsLoading && coinsError && (
              <div className="p-3 text-sm text-danger">{coinsError}</div>
            )}
            {!coinsLoading && !coinsError && filteredCoins.length === 0 && (
              <div className="p-3 text-sm text-secondary">No coins found</div>
            )}
            {!coinsLoading && !coinsError && filteredCoins.map((coin) => (
              <div
                key={coin.coinId}
                className={`flex justify-between p-3 cursor-pointer rounded-lg transition-colors ${selectedCoin?.coinId === coin.coinId ? 'bg-accent text-white' : 'hover:bg-overlay text-primary'}`}
                onClick={() => setSelectedCoin(coin)}
              >
                <span className="font-medium">{coin.name} ({coin.symbol})</span>
                <span>{Number.isFinite(coin.currentPrice) ? fmt(coin.currentPrice) : '-'}</span>
              </div>
            ))}
          </div>
          {selectedCoin && (
            <div className="mb-3">
              <label className="text-xs font-medium text-secondary uppercase block mb-1.5">Amount ({selectedCoin.symbol})</label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="any"
                min="0"
                className="w-full h-10 px-3.5 rounded-lg border border-default bg-base text-sm text-primary outline-none focus:border-accent"
              />
              <p className="text-xs text-secondary text-right mt-1.5">Total: {fmt(amount ? total : 0)}</p>
            </div>
          )}
          {formError && (
            <p className="text-xs text-danger mb-3">{formError}</p>
          )}
          <div className="flex gap-2.5 justify-end">
            <button type="button" className="h-10 px-5 rounded-lg border border-default bg-base text-sm text-primary cursor-pointer hover:bg-overlay" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={!selectedCoin || !hasValidAmount || !hasSelectedCoinPrice || submitting} className="h-10 px-5 rounded-lg bg-accent text-sm text-white font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Adding...' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const { token } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [portfolioData, setPortfolioData] = useState(EMPTY_PORTFOLIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPortfolioData = useCallback(async () => {
    if (!token) {
      setPortfolioData(EMPTY_PORTFOLIO);
      setError('Please login to view your portfolio');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/portfolio/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await getJson(response);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load portfolio');
      }

      setPortfolioData(normalizePortfolioData(data));
    } catch (err) {
      const message = err instanceof TypeError && err.message === 'Failed to fetch'
        ? `Unable to reach backend at ${API_URL}`
        : err.message || 'Failed to load portfolio';

      setPortfolioData(EMPTY_PORTFOLIO);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  const handleAddAsset = async (asset) => {
    if (!token) {
      return { success: false, error: 'Please login to add an asset' };
    }

    try {
      const body = {
        coinId: asset.coinId,
        name: asset.name,
        symbol: asset.symbol,
        quantity: asset.quantity,
        currentPrice: asset.currentPrice,
        image: asset.image,
      };

      const response = await fetch(`${API_URL}/api/portfolio/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await getJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: response.status === 404
            ? 'Portfolio asset route not found'
            : data.message || data.error || 'Failed to add asset',
        };
      }

      setPortfolioData(normalizePortfolioData(data));
      setError('');
      await fetchPortfolioData();

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof TypeError && err.message === 'Failed to fetch'
          ? `Unable to reach backend at ${API_URL}`
          : err.message || 'Failed to add asset',
      };
    }
  };

  const totalBalance = portfolioData.totalBalance;
  const dayPnl = portfolioData.profitLoss24h;
  const dayPnlPct = portfolioData.profitLoss24hPercent;
  const allTimePnl = portfolioData.allTimeProfit;
  const allTimePnlPct = portfolioData.allTimeProfitPercent;
  const holdingsList = portfolioData.holdings;
  const isEmpty = !loading && !error && holdingsList.length === 0;

  const portfolioMetrics = [
    { label: 'Total Balance', value: fmt(totalBalance), change: dayPnlPct, sub: 'vs yesterday' },
    { label: '24h Profit/Loss', value: fmtSigned(dayPnl), change: dayPnlPct, sub: 'since open' },
    { label: 'All-Time Profit', value: fmtSigned(allTimePnl), change: allTimePnlPct, sub: 'since inception' },
  ];

  const portfolioCoin = {
    name: 'Portfolio',
    ticker: 'PFT',
    status: 'Live',
    price: totalBalance,
    change: dayPnlPct,
    changeAbs: dayPnl,
  };

  const aiInsights = useMemo(() => {
    if (holdingsList.length === 0) {
      return [
        { icon: 'i', label: 'Portfolio Status', text: 'No portfolio data yet. Add an asset to start tracking performance.', color: 'blue' },
      ];
    }

    const topHolding = [...holdingsList].sort((a, b) => b.pnlPct - a.pnlPct)[0];
    const largestAllocation = portfolioData.assetAllocation[0];

    return [
      {
        icon: '$',
        label: topHolding.pnlPct >= 0 ? 'Top Gainer' : 'Largest Loss',
        text: `${topHolding.name} is ${fmtPercent(topHolding.pnlPct)} all-time.`,
        color: topHolding.pnlPct >= 0 ? 'green' : 'amber',
      },
      {
        icon: '%',
        label: 'Largest Allocation',
        text: largestAllocation
          ? `${largestAllocation.name} represents ${largestAllocation.value.toFixed(1)}% of your portfolio.`
          : 'Asset allocation will appear once holdings have value.',
        color: 'amber',
      },
      {
        icon: '+',
        label: 'Portfolio Health',
        text: `Your all-time return is ${fmtPercent(allTimePnlPct)}.`,
        color: allTimePnlPct >= 0 ? 'green' : 'blue',
      },
    ];
  }, [allTimePnlPct, holdingsList, portfolioData.assetAllocation]);

  return (
    <main className="p-4 sm:p-6 flex flex-col gap-4 min-h-full">
      <header className="flex gap-2">
        <button className="flex items-center gap-1.5 bg-transparent border border-default rounded-lg px-3 py-2 text-sm text-primary cursor-pointer font-medium hover:bg-overlay">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
        <button className="flex items-center gap-1.5 bg-accent border-none rounded-lg px-3 py-2 text-sm text-white cursor-pointer font-semibold hover:opacity-90" onClick={() => setShowAddModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Asset
        </button>
      </header>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {loading && (
        <div className="bg-surface border border-default rounded-xl px-4 py-3 text-sm text-secondary">
          Loading portfolio...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {portfolioMetrics.map((m, i) => (
          <MetricCard key={i} label={m.label} value={m.value} change={m.change} sub={m.sub} />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <AllocationCard total={totalBalance} allocationData={portfolioData.assetAllocation} />
        <div className="flex-1 min-w-0">
          <PriceChart coin={portfolioCoin} data={portfolioData.chartData} />
        </div>
      </div>

      <div className="bg-surface border border-default rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-default">
          <div>
            <span className="text-sm font-semibold text-primary">Your Holdings</span>
            <span className="text-xs text-muted block mt-0.5">Assets in your portfolio</span>
          </div>
          <button className="flex items-center gap-1.5 bg-transparent border border-default rounded-lg px-2.5 py-1.5 text-xs text-secondary cursor-pointer hover:text-primary hover:bg-overlay">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-default bg-overlay">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase w-8">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase">Coin</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase">Amount</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase">Avg. Buy</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase">Value</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase">P&L</th>
              </tr>
            </thead>
            <tbody>
              {holdingsList.map((h) => (
                <tr key={h.coinId || h.ticker} className="border-b border-subtle hover:bg-overlay transition-colors">
                  <td className="p-3 text-sm text-muted w-8">{h.rank}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <CoinLogo ticker={h.ticker} size={32} image={h.image} />
                      <div>
                        <span className="text-sm font-semibold text-primary block">{h.name}</span>
                        <span className="text-xs text-muted">{h.ticker}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right text-sm text-primary">{fmtQuantity(h.amount)}</td>
                  <td className="p-3 text-right text-sm text-secondary">{fmt(h.avgBuy)}</td>
                  <td className="p-3 text-right text-sm font-semibold text-primary">{fmt(h.currentValue)}</td>
                  <td className="p-3 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`text-sm font-semibold ${h.unrealizedPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                        {fmtSigned(h.unrealizedPnl)}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${h.pnlPct >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                        {fmtPercent(h.pnlPct)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {isEmpty && (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-sm text-muted">
                    No portfolio data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {aiInsights.map((ins) => (
          <div key={ins.label} className={`p-4 rounded-xl border-l-2 ${ins.color === 'green' ? 'border-success bg-success/5' : ins.color === 'amber' ? 'border-amber-500 bg-amber-500/5' : 'border-accent bg-accent/5'}`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${ins.color === 'green' ? 'text-success' : ins.color === 'amber' ? 'text-amber-500' : 'text-accent'}`}>
              <span>{ins.icon}</span>
              {ins.label}
            </div>
            <p className="text-sm text-secondary leading-relaxed">{ins.text}</p>
          </div>
        ))}
      </div>

      <footer className="text-center text-xs text-muted pt-4 border-t border-subtle flex justify-center gap-5 mt-auto">
        <span>Copyright 2024 FinTracker Inc. All rights reserved.</span>
        <div className="flex gap-3.5">
          <a href="#" className="text-inherit no-underline">Terms</a>
          <a href="#" className="text-inherit no-underline">Privacy</a>
          <a href="#" className="text-inherit no-underline">Support</a>
        </div>
      </footer>

      {showAddModal && <AddAssetModal onClose={() => setShowAddModal(false)} onAdd={handleAddAsset} />}
    </main>
  );
}
