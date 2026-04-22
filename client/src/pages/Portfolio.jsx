import { useState } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import MetricCard from '../components/dashboard/MetricCard';
import PriceChart from '../components/dashboard/PriceChart';
import '../styles/portfolio.css';

const availableCoins = [
  { name: 'Bitcoin', ticker: 'BTC', price: 68150 },
  { name: 'Ethereum', ticker: 'ETH', price: 3453 },
  { name: 'Solana', ticker: 'SOL', price: 145 },
  { name: 'Chainlink', ticker: 'LINK', price: 16.54 },
  { name: 'Cardano', ticker: 'ADA', price: 0.445 },
  { name: 'Avalanche', ticker: 'AVAX', price: 35.12 },
  { name: 'Polkadot', ticker: 'DOT', price: 7.34 },
  { name: 'Uniswap', ticker: 'UNI', price: 7.21 },
];

const allocationData = [
  { name: 'Bitcoin', value: 55.1, color: '#F7931A' },
  { name: 'Ethereum', value: 24.9, color: '#627EEA' },
  { name: 'Solana', value: 12.7, color: '#9945FF' },
  { name: 'Chainlink', value: 4.3, color: '#2A5ADA' },
  { name: 'Others', value: 3.0, color: '#6B7280' },
];

const portfolioChartData = [
  { t: 'Jan', price: 92000 }, { t: 'Feb', price: 87000 },
  { t: 'Mar', price: 105000 }, { t: 'Apr', price: 98000 },
  { t: 'May', price: 115000 }, { t: 'Jun', price: 109000 },
  { t: 'Jul', price: 128000 }, { t: 'Aug', price: 142000 },
  { t: 'Sep', price: 135000 }, { t: 'Oct', price: 158000 },
  { t: 'Nov', price: 172000 }, { t: 'Dec', price: 181279 },
];

const aiInsights = [
  { icon: '📈', label: 'Top Gainer', text: 'Ethereum has increased by 12.4% in the last 24h.', color: 'green' },
  { icon: '🔥', label: 'Hot Alert', text: 'Solana is 78% correlated with BTC.', color: 'amber' },
  { icon: '🎯', label: 'Best Allocation', text: 'Consider rebalancing BTC from 55% to 45%.', color: 'blue' },
];

function fmt(n) {
  return n >= 1e6 ? `$${(n / 1e6).toFixed(3)}M` : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function DonutLabel({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-8" className="donut-label-total">Total</tspan>
      <tspan x={cx} dy="18" className="donut-label-value">{fmt(total)}</tspan>
    </text>
  );
}

function AllocationCard({ total }) {
  return (
    <div className="allocation-card">
      <div className="allocation-header">
        <span className="allocation-title">Asset Allocation</span>
        <span className="allocation-subtitle">Distribution by value</span>
      </div>
      <div className="allocation-chart">
        <PieChart width={200} height={120}>
          <Pie
            data={allocationData}
            cx={100}
            cy={60}
            innerRadius={40}
            outerRadius={58}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {allocationData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <DonutLabel cx={100} cy={60} total={total} />
        </PieChart>
      </div>
      <div className="allocation-legend">
        {allocationData.map((d) => (
          <div key={d.name} className="legend-row">
            <span className="legend-name">
              <span className="legend-dot" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="legend-pct">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddAssetModal({ onClose, onAdd }) {
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCoin, setSelectedCoin] = useState(null);

  const filteredCoins = availableCoins.filter(
    (c) =>
      search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.ticker.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCoin && amount) {
      onAdd({
        ...selectedCoin,
        amount: parseFloat(amount),
        avgBuy: `$${selectedCoin.price.toLocaleString()}`,
        currentValue: `$${(selectedCoin.price * parseFloat(amount)).toLocaleString()}`,
        unrealizedPnl: 0,
        pnlPct: 0,
      });
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Add Asset</h2>
            <p className="modal-subtitle">Select a coin and enter amount.</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search coin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="modal-list">
            {filteredCoins.map((coin) => (
              <div
                key={coin.ticker}
                className={`modal-coin ${selectedCoin?.ticker === coin.ticker ? 'selected' : ''}`}
                onClick={() => setSelectedCoin(coin)}
              >
                <span>{coin.name} ({coin.ticker})</span>
                <span>${coin.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
          {selectedCoin && (
            <div className="modal-amount">
              <label>Amount ({selectedCoin.ticker})</label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="any"
                min="0"
              />
              <p className="amount-total">Total: ${amount ? (selectedCoin.price * parseFloat(amount || 0)).toLocaleString() : '0.00'}</p>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={!selectedCoin || !amount}>Add Asset</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [holdingsList, setHoldingsList] = useState([
    { rank: 1, name: 'Bitcoin', ticker: 'BTC', amount: 1.48, avgBuy: '$41,200', currentValue: '$100,862', unrealizedPnl: +25803, pnlPct: +62.6 },
    { rank: 2, name: 'Ethereum', ticker: 'ETH', amount: 13.2, avgBuy: '$2,100', currentValue: '$45,583', unrealizedPnl: +17346, pnlPct: +61.4 },
    { rank: 3, name: 'Solana', ticker: 'SOL', amount: 160, avgBuy: '$86', currentValue: '$23,200', unrealizedPnl: +9440, pnlPct: +68.7 },
    { rank: 4, name: 'Chainlink', ticker: 'LINK', amount: 480, avgBuy: '$11.6', currentValue: '$7,939', unrealizedPnl: +3371, pnlPct: +73.7 },
    { rank: 5, name: 'Cardano', ticker: 'ADA', amount: 8300, avgBuy: '$0.38', currentValue: '$3,695', unrealizedPnl: -1459, pnlPct: -28.3 },
  ]);

  const totalBalance = holdingsList.reduce((sum, h) => sum + parseFloat(h.currentValue.replace(/[$,]/g, '')), 0);
  const dayPnl = +5240.15;
  const dayPnlPct = +2.97;
  const allTimePnl = holdingsList.reduce((sum, h) => sum + h.unrealizedPnl, 0);
  const allTimePnlPct = +36.88;

  const portfolioMetrics = [
    { label: 'Total Balance', value: fmt(totalBalance), change: dayPnlPct, sub: 'vs yesterday' },
    { label: '24h Profit/Loss', value: `${dayPnl >= 0 ? '+' : ''}${fmt(dayPnl)}`, change: dayPnlPct, sub: 'since open' },
    { label: 'All-Time Profit', value: `+${fmt(allTimePnl)}`, change: allTimePnlPct, sub: 'since inception' },
  ];

  const portfolioCoin = {
    name: 'Portfolio',
    ticker: 'PFT',
    status: 'Live',
    price: totalBalance,
    change: dayPnlPct,
    changeAbs: dayPnl,
  };

  const handleAddAsset = (asset) => {
    setHoldingsList((prev) => [...prev, { ...asset, rank: prev.length + 1 }]);
  };

  return (
    <main className="portfolio-page">
      <header className="portfolio-actions">
        <button className="btn-outline">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Asset
        </button>
      </header>

      <div className="dashboard-metrics">
        {portfolioMetrics.map((m, i) => (
          <MetricCard key={i} label={m.label} value={m.value} change={m.change} sub={m.sub} />
        ))}
      </div>

      <div className="portfolio-charts">
        <AllocationCard total={totalBalance} />
        <PriceChart coin={portfolioCoin} data={portfolioChartData} />
      </div>

      <div className="holdings-table">
        <div className="holdings-header">
          <div>
            <span className="holdings-title">Your Holdings</span>
            <span className="holdings-subtitle">Assets in your portfolio</span>
          </div>
          <button className="filter-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filter
          </button>
        </div>
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Coin</th>
              <th className="text-right">Amount</th>
              <th className="text-right">Avg. Buy</th>
              <th className="text-right">Value</th>
              <th className="text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {holdingsList.map((h) => (
              <tr key={h.ticker}>
                <td className="rank">{h.rank}</td>
                <td>
                  <div className="coin-cell">
                    <span className="coin-logo">{h.ticker[0]}</span>
                    <div>
                      <span className="coin-name">{h.name}</span>
                      <span className="coin-ticker">{h.ticker}</span>
                    </div>
                  </div>
                </td>
                <td className="text-right">{h.amount}</td>
                <td className="text-right muted">{h.avgBuy}</td>
                <td className="text-right value">{h.currentValue}</td>
                <td className="text-right">
                  <div className="pnl-cell">
                    <span className={h.unrealizedPnl >= 0 ? 'positive' : 'negative'}>
                      {h.unrealizedPnl >= 0 ? '+' : ''}${Math.abs(h.unrealizedPnl).toLocaleString()}
                    </span>
                    <span className={`badge ${h.pnlPct >= 0 ? 'green' : 'red'}`}>
                      {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="portfolio-insights">
        {aiInsights.map((ins) => (
          <div key={ins.label} className={`insight-card ${ins.color}`}>
            <div className={`insight-label ${ins.color}`}>
              <span>{ins.icon}</span>
              {ins.label}
            </div>
            <p className="insight-text">{ins.text}</p>
          </div>
        ))}
      </div>

      <footer className="portfolio-footer">
        <span>© 2024 FinTracker Inc. All rights reserved.</span>
        <div className="footer-links">
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Support</a>
        </div>
      </footer>

      {showAddModal && <AddAssetModal onClose={() => setShowAddModal(false)} onAdd={handleAddAsset} />}
    </main>
  );
}