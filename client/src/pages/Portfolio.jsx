import { useState } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import MetricCard from '../components/dashboard/MetricCard';
import PriceChart from '../components/dashboard/PriceChart';

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
      <tspan x={cx} dy="-8" className="text-[10px] fill-[#c9d1d9]">Total</tspan>
      <tspan x={cx} dy="18" className="text-xs font-bold fill-[#e6edf3]">{fmt(total)}</tspan>
    </text>
  );
}

function AllocationCard({ total }) {
  return (
    <div className="flex-1 min-w-0 p-3.5 bg-[#161b22] border border-[#30363d] rounded-lg">
      <div className="mb-2">
        <span className="text-xs font-semibold text-[#e6edf3] block">Asset Allocation</span>
        <span className="text-[11px] text-[#7d8590] block mt-0.5">Distribution by value</span>
      </div>
      <div className="flex justify-center my-auto flex-1 min-h-[120px]">
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
      <div className="flex flex-col gap-1.5">
        {allocationData.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#c9d1d9]">
              <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-semibold text-[#e6edf3]">{d.value}%</span>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 w-[400px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#e6edf3]">Add Asset</h2>
            <p className="text-xs text-[#c9d1d9]">Select a coin and enter amount.</p>
          </div>
          <button className="bg-none border-none cursor-pointer text-[#c9d1d9] p-1" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 mb-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8590" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search coin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-[#e6edf3] text-sm"
            />
          </div>
          <div className="max-h-[150px] overflow-y-auto mb-3">
            {filteredCoins.map((coin) => (
              <div
                key={coin.ticker}
                className={`flex justify-between p-2.5 cursor-pointer ${selectedCoin?.ticker === coin.ticker ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => setSelectedCoin(coin)}
              >
                <span>{coin.name} ({coin.ticker})</span>
                <span>${coin.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
          {selectedCoin && (
            <div className="mb-3">
              <label className="text-[11px] text-[#c9d1d9] uppercase block mb-1.5">Amount ({selectedCoin.ticker})</label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="any"
                min="0"
                className="w-full h-10 px-3.5 rounded-lg border border-[#30363d] bg-[#0d1117] text-sm text-[#e6edf3] outline-none"
              />
              <p className="text-xs text-[#c9d1d9] text-right mt-1.5">Total: ${amount ? (selectedCoin.price * parseFloat(amount || 0)).toLocaleString() : '0.00'}</p>
            </div>
          )}
          <div className="flex gap-2.5 justify-end">
            <button type="button" className="h-10 px-5 rounded-lg border border-[#30363d] bg-[#0d1117] text-sm text-[#e6edf3] cursor-pointer" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={!selectedCoin || !amount} className="h-10 px-5 rounded-lg bg-blue-500 text-sm text-white font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">Add Asset</button>
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
    <main className="p-6 flex flex-col gap-4">
      <header className="flex gap-2">
        <button className="flex items-center gap-1.5 bg-transparent border border-[#30363d] rounded-lg p-2 text-sm text-[#e6edf3] cursor-pointer font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
        <button className="flex items-center gap-1.5 bg-blue-500 border-none rounded-lg p-2 text-sm text-white cursor-pointer font-semibold" onClick={() => setShowAddModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Asset
        </button>
      </header>

      <div className="flex flex-wrap gap-3">
        {portfolioMetrics.map((m, i) => (
          <MetricCard key={i} label={m.label} value={m.value} change={m.change} sub={m.sub} />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <AllocationCard total={totalBalance} />
        <PriceChart coin={portfolioCoin} data={portfolioChartData} />
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#21262d]">
          <div>
            <span className="text-sm font-semibold text-[#e6edf3]">Your Holdings</span>
            <span className="text-xs text-[#7d8590] block mt-0.5">Assets in your portfolio</span>
          </div>
          <button className="flex items-center gap-1.5 bg-transparent border border-[#30363d] rounded-lg p-1.5 text-xs text-[#c9d1d9] cursor-pointer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filter
          </button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2.5 text-[11px] font-semibold text-[#7d8590] uppercase tracking-wider border-b border-[#21262d] bg-[#1c2128]">#</th>
              <th className="text-left p-2.5 text-[11px] font-semibold text-[#7d8590] uppercase tracking-wider border-b border-[#21262d] bg-[#1c2128]">Coin</th>
              <th className="text-right p-2.5 text-[11px] font-semibold text-[#7d8590] uppercase tracking-wider border-b border-[#21262d] bg-[#1c2128]">Amount</th>
              <th className="text-right p-2.5 text-[11px] font-semibold text-[#7d8590] uppercase tracking-wider border-b border-[#21262d] bg-[#1c2128]">Avg. Buy</th>
              <th className="text-right p-2.5 text-[11px] font-semibold text-[#7d8590] uppercase tracking-wider border-b border-[#21262d] bg-[#1c2128]">Value</th>
              <th className="text-right p-2.5 text-[11px] font-semibold text-[#7d8590] uppercase tracking-wider border-b border-[#21262d] bg-[#1c2128]">P&L</th>
            </tr>
          </thead>
          <tbody>
            {holdingsList.map((h) => (
              <tr key={h.ticker} className="border-b border-[#21262d]">
                <td className="p-3 text-sm text-[#7d8590] w-8">{h.rank}</td>
                <td className="p-3 text-sm text-[#e6edf3]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">{h.ticker[0]}</span>
                    <div>
                      <span className="font-semibold block">{h.name}</span>
                      <span className="text-xs text-[#c9d1d9]">{h.ticker}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-sm text-right text-[#e6edf3]">{h.amount}</td>
                <td className="p-3 text-sm text-right text-[#c9d1d9]">{h.avgBuy}</td>
                <td className="p-3 text-sm text-right font-semibold text-[#e6edf3]">{h.currentValue}</td>
                <td className="p-3 text-sm text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={h.unrealizedPnl >= 0 ? 'text-green-500 font-semibold text-sm' : 'text-red-500 font-semibold text-sm'}>
                      {h.unrealizedPnl >= 0 ? '+' : ''}${Math.abs(h.unrealizedPnl).toLocaleString()}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${h.pnlPct >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3.5">
        {aiInsights.map((ins) => (
          <div key={ins.label} className={`flex-1 min-w-[200px] p-4 rounded-lg border-t-2 ${ins.color === 'green' ? 'border-green-500' : ins.color === 'amber' ? 'border-amber-500' : 'border-blue-500'}`}>
            <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${ins.color === 'green' ? 'text-green-500' : ins.color === 'amber' ? 'text-amber-500' : 'text-blue-500'}`}>
              <span>{ins.icon}</span>
              {ins.label}
            </div>
            <p className="text-xs text-[#c9d1d9] leading-relaxed">{ins.text}</p>
          </div>
        ))}
      </div>

      <footer className="text-center text-xs text-[#7d8590] pt-4 border-t border-[#21262d] flex justify-center gap-5">
        <span>© 2024 FinTracker Inc. All rights reserved.</span>
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