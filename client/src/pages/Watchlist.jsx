import { useEffect, useState } from "react";
import CoinLogo from "../components/shared/CoinLogo";
import Badge from "../components/shared/Badge";
import TabBar from "../components/shared/TabBar";
import MetricCard from "../components/dashboard/MetricCard";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function SortIcon({ col, sortKey, sortDir }) {
  return (
    <span className="ml-1 opacity-30 text-[10px]">
      {sortKey === col ? (sortDir === "asc" ? "^" : "v") : "<>"}
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
  const color = positive ? "rgb(var(--color-success))" : "rgb(var(--color-danger))";

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  );
}

function formatPrice(price, symbol = "$") {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return "-";
  const value = Number(price);
  if (value >= 1000) return `${symbol}${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (value >= 1) return `${symbol}${value.toFixed(2)}`;
  return `${symbol}${value.toFixed(4)}`;
}

function formatMarketCap(value, symbol = "$") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  const amount = Number(value);
  if (amount >= 1e12) return `${symbol}${(amount / 1e12).toFixed(2)}T`;
  if (amount >= 1e9) return `${symbol}${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `${symbol}${(amount / 1e6).toFixed(1)}M`;
  return `${symbol}${amount.toLocaleString()}`;
}

function toWatchlistCoin(coin) {
  return {
    coinId: coin.id,
    id: coin.id,
    name: coin.name,
    ticker: coin.symbol?.toUpperCase() || "",
    image: coin.image || "",
    price: coin.current_price ?? null,
    change24h: coin.price_change_percentage_24h ?? 0,
    marketCap: coin.market_cap ?? null,
    volume24h: coin.total_volume ?? null,
    marketCapRank: coin.market_cap_rank ?? null,
    sparkline: [],
  };
}

function AddModal({ onClose, onAdd, existing = [], currency }) {
  const [search, setSearch] = useState("");
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState([]);
  const [error, setError] = useState("");
  const existingIds = existing.map((coinId) => String(coinId).toLowerCase());
  const searchValue = search.trim().toLowerCase();

  useEffect(() => {
    let active = true;

    async function fetchCoins() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/coins?currency=${currency}`);

        if (!response.ok) {
          throw new Error("Failed to load coins");
        }

        const data = await response.json();

        if (active) {
          setCoins(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setCoins([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchCoins();

    return () => {
      active = false;
    };
  }, [currency]);

  const filtered = coins
    .filter((coin) => {
      const coinId = coin.id?.toLowerCase();
      const symbol = coin.symbol?.toLowerCase() || "";
      const name = coin.name?.toLowerCase() || "";

      if (!coinId || existingIds.includes(coinId)) {
        return false;
      }

      return searchValue === "" || name.includes(searchValue) || symbol.includes(searchValue);
    })
    .slice(0, 40);

  const handleAdd = async (coin) => {
    setError("");
    const coinId = coin.id?.trim().toLowerCase();

    if (!coinId) {
      setError("coinId is required");
      return;
    }

    const result = await onAdd(coin);

    if (result?.success) {
      setAdded((prev) => [...prev, coinId]);
    } else {
      setError(result?.error || "Failed to add coin");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-surface border border-default rounded-xl p-7 w-[520px] max-w-[92vw] max-h-[88vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-1.5">
          <h2 className="text-lg font-semibold text-primary">Add to Watchlist</h2>
          <button className="bg-none border-none cursor-pointer text-secondary p-1 rounded" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-secondary mb-4.5">Search and add assets to your personal tracking list.</p>
        {error && <p className="text-xs text-danger mb-3">{error}</p>}
        <div className="flex items-center gap-2 bg-base border border-default rounded-lg p-2.5 mb-4">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Enter coin name or ticker..." value={search} onChange={e => setSearch(e.target.value)} autoFocus className="flex-1 bg-transparent border-none outline-none text-primary text-sm" />
        </div>
        <div className="min-h-0 flex-1 max-h-[420px] overflow-y-auto pr-1">
          <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] gap-3 bg-surface border-b border-default py-2 text-[10px] font-semibold text-muted uppercase tracking-wider">
            <span>Asset</span>
            <span className="text-right">Action</span>
          </div>
          {loading && <p className="text-xs text-secondary text-center py-5">Loading coins...</p>}
          {!loading && filtered.length === 0 && <p className="text-xs text-secondary text-center py-5">No results found</p>}
          {filtered.map(coin => (
            <div key={coin.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5 border-b border-default">
              <div className="flex items-center gap-2.5 min-w-0">
                <CoinLogo ticker={coin.symbol?.toUpperCase()} image={coin.image} size={32} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-primary truncate">{coin.name}</div>
                  <div className="text-xs text-secondary">{coin.symbol?.toUpperCase()} {coin.market_cap_rank ? `#${coin.market_cap_rank}` : ""}</div>
                </div>
              </div>
              {added.includes(coin.id?.toLowerCase()) ? (
                <span className="px-3 py-1.5 rounded-lg bg-success/15 text-success text-sm font-medium border border-success/30 whitespace-nowrap">Added</span>
              ) : (
                <button className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium border-none cursor-pointer hover:opacity-90 whitespace-nowrap" onClick={() => handleAdd(coin)}>Add</button>
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
      <div className="bg-surface border border-default rounded-xl p-7 w-[360px] text-center" onClick={e => e.stopPropagation()}>
        <div className="w-11 h-11 rounded-full bg-danger/15 flex items-center justify-center mx-auto mb-3.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </div>
        <p className="text-base font-semibold text-primary mb-2">Remove {coin.name}?</p>
        <p className="text-xs text-secondary mb-6">This will remove <strong>{coin.ticker}</strong> from your watchlist. You can add it back anytime.</p>
        <div className="flex gap-2.5">
          <button className="flex-1 py-2.5 bg-base border border-default rounded-lg text-sm font-medium text-primary cursor-pointer" onClick={onCancel}>Cancel</button>
          <button className="flex-1 py-2.5 bg-danger border-none rounded-lg text-sm font-medium text-white cursor-pointer" onClick={onConfirm}>Remove</button>
        </div>
      </div>
    </div>
  );
}

export default function Watchlist() {
  const { token, watchlistItems, loadWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
  const { currency, currencyData } = useCurrency();
  const [coins, setCoins] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageError, setPageError] = useState("");
  const [loading, setLoading] = useState(false);

  const ITEMS_PER_PAGE = 8;
  const tabs = ["All", "Gainers", "Losers"];
  const currencySymbol = currencyData?.symbol || "$";
  const watchlist = coins.map(toWatchlistCoin);

  useEffect(() => {
    let active = true;

    async function refreshCoinIds() {
      if (!token) return;

      const result = await loadWatchlist();

      if (active && !result.success) {
        setPageError(result.error);
      }
    }

    refreshCoinIds();

    return () => {
      active = false;
    };
  }, [token, loadWatchlist]);

  useEffect(() => {
    let active = true;

    async function fetchCoinDetails() {
      if (!watchlistItems.length) {
        setCoins([]);
        return;
      }

      setLoading(true);
      setPageError("");

      try {
        const ids = watchlistItems.join(",");
        const response = await fetch(`${API_URL}/coins?currency=${currency}&ids=${encodeURIComponent(ids)}`);

        if (!response.ok) {
          throw new Error("Failed to fetch watchlist coin data");
        }

        const data = await response.json();

        if (active) {
          setCoins(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (active) {
          setPageError(error.message);
          setCoins([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchCoinDetails();

    return () => {
      active = false;
    };
  }, [watchlistItems, currency]);

  const totalValue = watchlist.reduce((sum, c) => sum + (c.price || 0), 0);
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

  const handleAddCoin = async (coin) => {
    setPageError("");
    const result = await addToWatchlist(coin);

    if (!result.success) {
      setPageError(result.error);
    }

    return result;
  };

  const handleRemove = (coin) => setRemoveTarget(coin);

  const confirmRemove = async () => {
    if (!removeTarget) return;

    setPageError("");
    const result = await removeFromWatchlist(removeTarget.coinId);

    if (!result.success) {
      setPageError(result.error);
    }

    setRemoveTarget(null);
  };

  return (
    <div className="p-7 min-h-full bg-base text-primary">
      <div className="flex items-center gap-1.5 text-xs text-secondary mb-1.5">
        <span>Active Tracking</span>
        <span>&gt;</span>
        <span className="text-accent font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-1 animate-pulse" />
          V3.4 LIVE
        </span>
      </div>

      <p className="text-sm text-secondary mb-6">Monitor your selected assets with real-time price feeds and trend analysis.</p>
      {pageError && <p className="text-sm text-danger mb-4">{pageError}</p>}

      <div className="flex flex-wrap gap-3 mb-6">
        <MetricCard label="Tracked Assets" value={watchlistItems.length} change={null} />
        <MetricCard label="Total Value (est.)" value={formatMarketCap(totalValue * 1e6, currencySymbol)} change={null} />
        <MetricCard label="Top Gainer (24h)" value={watchlist.reduce((best, c) => (c.change24h > (best?.change24h ?? -Infinity) ? c : best), null)?.name ?? "-"} change={null} />
        <MetricCard label="Gainers / Losers" value={`${gainers} / ${losers}`} change={null} />
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <TabBar tabs={tabs} active={activeTab} onChange={t => { setActiveTab(t); setCurrentPage(1); }} size="sm" />
          <div className="flex items-center gap-2 bg-surface border border-default rounded-lg p-2.5 min-w-[220px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input placeholder="Filter your list..." value={filterText} onChange={e => { setFilterText(e.target.value); setCurrentPage(1); }} className="bg-transparent border-none outline-none text-primary text-sm flex-1" />
          </div>
        </div>
        <button className="flex items-center gap-1.5 bg-accent text-white border-none rounded-lg py-2 px-4.5 text-sm font-semibold cursor-pointer hover:opacity-90" onClick={() => setShowAddModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Asset
        </button>
      </div>

      <div className="bg-surface border border-default rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="border-b border-default">
            <tr>
              <th className="text-left p-2.5 text-xs font-semibold text-muted uppercase tracking-wider w-8"></th>
              <th className="text-left p-2.5 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer" onClick={() => handleSort("name")}>Asset <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-right p-2.5 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer" onClick={() => handleSort("price")}>Price <SortIcon col="price" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-right p-2.5 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer" onClick={() => handleSort("change24h")}>24h % <SortIcon col="change24h" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-right p-2.5 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer" onClick={() => handleSort("marketCap")}>Market Cap <SortIcon col="marketCap" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-right p-2.5 text-xs font-semibold text-muted uppercase tracking-wider">Last 24h</th>
              <th className="text-right p-2.5 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-15 text-secondary">Loading watchlist...</td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-15 text-secondary">
                  <div className="text-[2.5rem] mb-2">-</div>
                  <div className="font-semibold mb-1 text-primary">{filterText ? "No matching assets" : "Your watchlist is empty"}</div>
                  <div className="text-xs">{filterText ? "Try a different search term" : "Star coins from the dashboard to add them here"}</div>
                </td>
              </tr>
            ) : (
              paginated.map(coin => (
                <tr key={coin.coinId} className="border-b border-default hover:bg-surface transition-colors">
                  <td className="p-3">
                    <button className="cursor-pointer text-amber-500 hover:text-primary" onClick={() => handleRemove(coin)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <CoinLogo ticker={coin.ticker} image={coin.image} size={34} />
                      <div>
                        <div className="text-sm font-semibold text-primary">{coin.name}</div>
                        <div className="text-xs text-secondary">{coin.ticker}</div>
                        <div className="text-[10px] text-muted">Rank #{coin.marketCapRank ?? "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-semibold">{formatPrice(coin.price, currencySymbol)}</td>
                  <td className="p-3 text-right"><Badge variant={coin.change24h >= 0 ? "green" : "red"}>{coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%</Badge></td>
                  <td className="p-3 text-right text-secondary">{formatMarketCap(coin.marketCap, currencySymbol)}</td>
                  <td className="p-3 text-right"><div className="flex justify-end"><Sparkline data={coin.sparkline} positive={coin.change24h >= 0} /></div></td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="cursor-pointer text-muted hover:text-primary p-1" title="View details">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                      <button className="cursor-pointer text-muted hover:text-primary p-1" title="Set alert">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                      </button>
                      <button className="cursor-pointer text-muted hover:text-primary p-1" title="Remove from watchlist" onClick={() => handleRemove(coin)}>
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
      </div>

      <div className="flex items-center justify-between mt-4 gap-3">
        <span className="text-sm text-secondary">Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} tracked asset{filtered.length !== 1 ? "s" : ""}</span>
        <div className="flex gap-2">
          <button className="px-3.5 py-1.5 bg-surface border border-default rounded-lg text-sm text-primary cursor-pointer disabled:opacity-40 disabled:cursor-default" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
            <button key={pg} className={`px-3.5 py-1.5 rounded-lg text-sm cursor-pointer ${pg === currentPage ? "bg-accent text-white border-accent" : "bg-surface border border-default text-primary"}`} onClick={() => setCurrentPage(pg)}>{pg}</button>
          ))}
          <button className="px-3.5 py-1.5 bg-surface border border-default rounded-lg text-sm text-primary cursor-pointer disabled:opacity-40 disabled:cursor-default" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
        </div>
      </div>

      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} onAdd={handleAddCoin} existing={watchlistItems} currency={currency} />}
      {removeTarget && <RemoveModal coin={removeTarget} onConfirm={confirmRemove} onCancel={() => setRemoveTarget(null)} />}

      <footer className="text-center text-xs text-muted pt-4 border-t border-subtle flex justify-center gap-5 mt-6">
        <span>(c) 2024 FinTracker Inc. All rights reserved.</span>
        <div className="flex gap-3.5">
          <a href="#" className="text-inherit no-underline">Terms</a>
          <a href="#" className="text-inherit no-underline">Privacy</a>
          <a href="#" className="text-inherit no-underline">Support</a>
        </div>
      </footer>
    </div>
  );
}
