import { useState } from "react";
import CoinLogo from "../components/shared/CoinLogo";
import Badge from "../components/shared/Badge";
import TabBar from "../components/shared/TabBar";
import MetricCard from "../components/dashboard/MetricCard";

const mockWatchlist = [
  { id: "bitcoin", name: "Bitcoin", ticker: "BTC", price: 67420.5, change24h: 2.34, marketCap: 1327000000000, volume24h: 28400000000, sparkline: [64000, 65200, 63800, 66100, 65700, 67000, 67420], starred: true },
  { id: "ethereum", name: "Ethereum", ticker: "ETH", price: 3541.2, change24h: -1.12, marketCap: 425700000000, volume24h: 14200000000, sparkline: [3600, 3580, 3620, 3510, 3490, 3530, 3541], starred: true },
  { id: "solana", name: "Solana", ticker: "SOL", price: 184.88, change24h: 5.67, marketCap: 84600000000, volume24h: 4100000000, sparkline: [170, 172, 175, 178, 180, 183, 184], starred: false },
  { id: "cardano", name: "Cardano", ticker: "ADA", price: 0.4452, change24h: -3.22, marketCap: 16160000000, volume24h: 520000000, sparkline: [0.47, 0.46, 0.46, 0.45, 0.45, 0.44, 0.445], starred: false },
  { id: "polkadot", name: "Polkadot", ticker: "DOT", price: 7.34, change24h: 1.15, marketCap: 10380000000, volume24h: 310000000, sparkline: [7.1, 7.15, 7.2, 7.25, 7.28, 7.31, 7.34], starred: false },
];

const suggestedCoins = [
  { name: "Polygon", ticker: "MATIC" },
  { name: "Avalanche", ticker: "AVAX" },
  { name: "Chainlink", ticker: "LINK" },
  { name: "Uniswap", ticker: "UNI" },
  { name: "Litecoin", ticker: "LTC" },
  { name: "Cosmos", ticker: "ATOM" },
];

function SortIcon({ col, sortKey, sortDir }) {
  return (
    <span className="ml-1 opacity-30 text-[10px]">
      {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );
}

function Sparkline({ data, positive, width = 80, height = 28 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const color = positive ? "#22c55e" : "#ef4444";
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  );
}

function formatPrice(price) {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

function formatMarketCap(value) {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

function AddModal({ onClose, onAdd, existing }) {
  const [search, setSearch] = useState("");
  const [added, setAdded] = useState([]);
  const filtered = suggestedCoins.filter(c => !existing.includes(c.ticker) && (search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.ticker.toLowerCase().includes(search.toLowerCase())));
  const handleAdd = (coin) => { setAdded(prev => [...prev, coin.ticker]); onAdd(coin); };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-7 w-[420px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-1.5">
          <h2 className="text-lg font-semibold text-[#e6edf3]">Add to Watchlist</h2>
          <button className="bg-none border-none cursor-pointer text-[#c9d1d9] p-1 rounded" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-[#c9d1d9] mb-4.5">Search and add assets to your personal tracking list.</p>
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 mb-4">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d8590" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Enter coin name or ticker..." value={search} onChange={e => setSearch(e.target.value)} autoFocus className="flex-1 bg-transparent border-none outline-none text-[#e6edf3] text-sm" />
        </div>
        <div>
          {filtered.length === 0 && <p className="text-xs text-[#c9d1d9] text-center py-5">No results found</p>}
          {filtered.map(coin => (
            <div key={coin.ticker} className="flex items-center justify-between py-2.5 border-b border-[#30363d]">
              <div className="flex items-center gap-2.5">
                <CoinLogo ticker={coin.ticker} size={32} />
                <span className="text-sm font-medium text-[#e6edf3]">{coin.name} ({coin.ticker})</span>
              </div>
              {added.includes(coin.ticker) ? (
                <span className="px-4 py-1.5 rounded-lg bg-green-500/15 text-green-500 text-sm font-medium border border-green-500/30">Added ✓</span>
              ) : (
                <button className="px-4 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium border-none cursor-pointer hover:opacity-90" onClick={() => handleAdd(coin)}>Add</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RemoveModal({ coin, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-7 w-[360px] text-center" onClick={e => e.stopPropagation()}>
        <div className="w-11 h-11 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-3.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </div>
        <p className="text-base font-semibold text-[#e6edf3] mb-2">Remove {coin.name}?</p>
        <p className="text-xs text-[#c9d1d9] mb-6">This will remove <strong>{coin.ticker}</strong> from your watchlist. You can add it back anytime.</p>
        <div className="flex gap-2.5">
          <button className="flex-1 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm font-medium text-[#e6edf3] cursor-pointer" onClick={onCancel}>Cancel</button>
          <button className="flex-1 py-2.5 bg-red-500 border-none rounded-lg text-sm font-medium text-white cursor-pointer" onClick={onConfirm}>Remove</button>
        </div>
      </div>
    </div>
  );
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState(mockWatchlist);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 8;
  const tabs = ["All", "Gainers", "Losers"];

  const totalValue = watchlist.reduce((sum, c) => sum + c.price, 0);
  const gainers = watchlist.filter(c => c.change24h > 0).length;
  const losers = watchlist.filter(c => c.change24h < 0).length;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = watchlist
    .filter(c => {
      const matchText = filterText === "" || c.name.toLowerCase().includes(filterText.toLowerCase()) || c.ticker.toLowerCase().includes(filterText.toLowerCase());
      const matchTab = activeTab === "All" || (activeTab === "Gainers" && c.change24h > 0) || (activeTab === "Losers" && c.change24h < 0);
      return matchText && matchTab;
    })
    .sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      return sortDir === "asc" ? (va < vb ? -1 : 1) : va > vb ? -1 : 1;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAddCoin = (coin) => {
    const newCoin = { id: coin.ticker.toLowerCase(), name: coin.name, ticker: coin.ticker, price: Math.random() * 500 + 0.5, change24h: (Math.random() - 0.5) * 10, marketCap: Math.random() * 50e9, volume24h: Math.random() * 2e9, sparkline: Array.from({ length: 7 }, () => Math.random() * 100), starred: false };
    setWatchlist(prev => [...prev, newCoin]);
  };

  const handleRemove = (coin) => setRemoveTarget(coin);
  const confirmRemove = () => { setWatchlist(prev => prev.filter(c => c.ticker !== removeTarget.ticker)); setRemoveTarget(null); };
  const toggleStar = (ticker) => { setWatchlist(prev => prev.map(c => c.ticker === ticker ? { ...c, starred: !c.starred } : c)); };

  return (
    <div className="p-7 min-h-full bg-[#0d1117] text-[#e6edf3]">
      <div className="flex items-center gap-1.5 text-xs text-[#c9d1d9] mb-1.5">
        <span>Active Tracking</span>
        <span>›</span>
        <span className="text-blue-500 font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
          V3.4 LIVE
        </span>
      </div>

      <p className="text-sm text-[#c9d1d9] mb-6">Monitor your selected assets with real-time price feeds and trend analysis.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <MetricCard label="Tracked Assets" value={watchlist.length} change={null} />
        <MetricCard label="Total Value (est.)" value={formatMarketCap(totalValue * 1e6)} change={null} />
        <MetricCard label="Top Gainer (24h)" value={watchlist.reduce((best, c) => (c.change24h > (best?.change24h ?? -Infinity) ? c : best), null)?.name ?? "—"} change={null} />
        <MetricCard label="Gainers / Losers" value={`${gainers} / ${losers}`} change={null} />
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <TabBar tabs={tabs} active={activeTab} onChange={t => { setActiveTab(t); setCurrentPage(1); }} size="sm" />
          <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 min-w-[220px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7d8590" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input placeholder="Filter your list..." value={filterText} onChange={e => { setFilterText(e.target.value); setCurrentPage(1); }} className="bg-transparent border-none outline-none text-[#e6edf3] text-sm flex-1" />
          </div>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-500 text-white border-none rounded-lg py-2 px-4.5 text-sm font-semibold cursor-pointer hover:opacity-90" onClick={() => setShowAddModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Asset
        </button>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="border-b border-[#30363d]">
            <tr>
              <th className="text-left p-2.5 text-xs font-semibold text-[#7d8590] uppercase tracking-wider w-8"></th>
              <th className="text-left p-2.5 text-xs font-semibold text-[#7d8590] uppercase tracking-wider cursor-pointer" onClick={() => handleSort("name")}>Asset <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-right p-2.5 text-xs font-semibold text-[#7d8590] uppercase tracking-wider cursor-pointer" onClick={() => handleSort("price")}>Price <SortIcon col="price" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-right p-2.5 text-xs font-semibold text-[#7d8590] uppercase tracking-wider cursor-pointer" onClick={() => handleSort("change24h")}>24h % <SortIcon col="change24h" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-right p-2.5 text-xs font-semibold text-[#7d8590] uppercase tracking-wider cursor-pointer" onClick={() => handleSort("marketCap")}>Market Cap <SortIcon col="marketCap" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-right p-2.5 text-xs font-semibold text-[#7d8590] uppercase tracking-wider">Last 24h</th>
              <th className="text-right p-2.5 text-xs font-semibold text-[#7d8590] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-15 text-[#c9d1d9]">
                  <div className="text-[2.5rem] mb-2">📋</div>
                  <div className="font-semibold mb-1 text-[#e6edf3]">{filterText ? "No matching assets" : "Your watchlist is empty"}</div>
                  <div className="text-xs">{filterText ? "Try a different search term" : "Click 'Add Asset' to start tracking cryptocurrencies"}</div>
                </td>
              </tr>
            ) : (
              paginated.map(coin => (
                <tr key={coin.ticker} className="border-b border-[#30363d] hover:bg-[#161b22] transition-colors">
                  <td className="p-3">
                    <button className={`cursor-pointer ${coin.starred ? "text-amber-500" : "text-[#7d8590]"} hover:text-[#e6edf3]`} onClick={() => toggleStar(coin.ticker)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={coin.starred ? "#f59e0b" : "none"} stroke={coin.starred ? "#f59e0b" : "currentColor"} strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <CoinLogo ticker={coin.ticker} size={34} />
                      <div>
                        <div className="text-sm font-semibold text-[#e6edf3]">{coin.name}</div>
                        <div className="text-xs text-[#c9d1d9]">{coin.ticker}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-semibold">{formatPrice(coin.price)}</td>
                  <td className="p-3 text-right"><Badge variant={coin.change24h >= 0 ? "green" : "red"}>{coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%</Badge></td>
                  <td className="p-3 text-right text-[#c9d1d9]">{formatMarketCap(coin.marketCap)}</td>
                  <td className="p-3 text-right"><div className="flex justify-end"><Sparkline data={coin.sparkline} positive={coin.change24h >= 0} /></div></td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="cursor-pointer text-[#7d8590] hover:text-[#e6edf3] p-1" title="View details">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                      <button className="cursor-pointer text-[#7d8590] hover:text-[#e6edf3] p-1" title="Set alert">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                      </button>
                      <button className="cursor-pointer text-[#7d8590] hover:text-[#e6edf3] p-1" title="Remove from watchlist" onClick={() => handleRemove(coin)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 gap-3">
        <span className="text-sm text-[#c9d1d9]">Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} tracked asset{filtered.length !== 1 ? "s" : ""}</span>
        <div className="flex gap-2">
          <button className="px-3.5 py-1.5 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] cursor-pointer disabled:opacity-40 disabled:cursor-default" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
            <button key={pg} className={`px-3.5 py-1.5 rounded-lg text-sm cursor-pointer ${pg === currentPage ? "bg-blue-500 text-white border-blue-500" : "bg-[#161b22] border border-[#30363d] text-[#e6edf3]"}`} onClick={() => setCurrentPage(pg)}>{pg}</button>
          ))}
          <button className="px-3.5 py-1.5 bg-[#161b22] border border-[#30363d] rounded-lg text-sm text-[#e6edf3] cursor-pointer disabled:opacity-40 disabled:cursor-default" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
        </div>
      </div>

      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} onAdd={handleAddCoin} existing={watchlist.map(c => c.ticker)} />}
      {removeTarget && <RemoveModal coin={removeTarget} onConfirm={confirmRemove} onCancel={() => setRemoveTarget(null)} />}

      <footer className="text-center text-xs text-[#7d8590] pt-4 border-t border-[#21262d] flex justify-center gap-5 mt-6">
        <span>© 2024 FinTracker Inc. All rights reserved.</span>
        <div className="flex gap-3.5">
          <a href="#" className="text-inherit no-underline">Terms</a>
          <a href="#" className="text-inherit no-underline">Privacy</a>
          <a href="#" className="text-inherit no-underline">Support</a>
        </div>
      </footer>
    </div>
  );
}