import { useEffect, useState, useCallback, useRef } from "react";
import CoinLogo from "../components/shared/CoinLogo";
import Badge from "../components/shared/Badge";
import TabBar from "../components/shared/TabBar";
import MetricCard from "../components/dashboard/MetricCard";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { useTheme } from "../context/ThemeContext";
import { useBinanceWebSocket } from "../hooks/useBinanceWebSocket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AVAILABLE_COLUMNS = [
  { key: 'rank', label: '#', default: true },
  { key: 'name', label: 'Coin', default: true },
  { key: 'price', label: 'Price', default: true },
  { key: 'change1h', label: '1h %', default: true },
  { key: 'change7d', label: '7d %', default: true },
  { key: 'change24h', label: '24h %', default: true },
  { key: 'marketCap', label: 'Market Cap', default: true },
  { key: 'volume', label: 'Volume', default: true },
  { key: 'high24h', label: '24h High', default: false },
  { key: 'low24h', label: '24h Low', default: false },
  { key: 'ath', label: 'ATH', default: false },
  { key: 'athChange', label: 'ATH Change %', default: false },
  { key: 'atl', label: 'ATL', default: false },
  { key: 'sparkline', label: 'Last 7d', default: true },
  { key: 'alert', label: 'Alert', default: true },
  { key: 'portfolio', label: '', default: true },
  { key: 'actions', label: '', default: true },
];

const COLUMN_WIDTHS = {
  rank: '50px',
  name: 'minmax(140px, 1.5fr)',
  price: 'minmax(100px, 1fr)',
  change1h: 'minmax(65px, 0.65fr)',
  change7d: 'minmax(65px, 0.65fr)',
  change24h: 'minmax(75px, 0.75fr)',
  marketCap: 'minmax(110px, 1fr)',
  volume: 'minmax(90px, 0.9fr)',
  high24h: 'minmax(85px, 0.85fr)',
  low24h: 'minmax(85px, 0.85fr)',
  ath: 'minmax(85px, 0.85fr)',
  athChange: 'minmax(90px, 0.9fr)',
  atl: 'minmax(85px, 0.85fr)',
  sparkline: '140px',
  alert: '80px',
  portfolio: '70px',
  actions: '50px',
};

function getColumnWidth(key) {
  return COLUMN_WIDTHS[key] || '1fr';
}

function SortIcon({ col, sortKey, sortDir }) {
  return (
    <span className="ml-1 opacity-100 text-primary text-[10px]">
      {sortKey === col ? (sortDir === "asc" ? "^" : "v") : "<>"}
    </span>
  );
}

function Sparkline({ data, positive, width = 120, height = 32 }) {
  if (!data || data.length < 2) return <span className="text-muted text-xs">-</span>;

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
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
    change1h: coin.price_change_percentage_1h_in_currency ?? null,
    change7d: coin.price_change_percentage_7d_in_currency ?? null,
    change24h: coin.price_change_percentage_24h ?? 0,
    marketCap: coin.market_cap ?? null,
    volume: coin.total_volume ?? null,
    high24h: coin.high_24h ?? null,
    low24h: coin.low_24h ?? null,
    ath: coin.ath ?? null,
    athChange: coin.ath_change_percentage ?? null,
    atl: coin.atl ?? null,
    marketCapRank: coin.market_cap_rank ?? null,
    sparkline: coin.sparkline_in_7d?.price || [],
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

function AlertModal({ coin, currentPrice, currencySymbol, existingAlert, onSave, onCancel }) {
  const [targetPrice, setTargetPrice] = useState(existingAlert?.targetPrice ?? currentPrice ?? '');
  const [condition, setCondition] = useState(existingAlert?.condition ?? 'above');
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(!existingAlert);

  const handleSave = () => {
    const price = parseFloat(targetPrice);
    if (!isNaN(price) && price > 0) {
      onSave(coin.coinId || coin.id, { targetPrice: price, condition });
      setSaved(true);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setSaved(false);
  };

  if (editing) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onCancel}>
        <div className="bg-surface border border-default rounded-xl p-7 w-[380px]" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {existingAlert ? 'Edit Alert' : 'New Alert'} — {coin.name}
            </h2>
            <button className="text-secondary hover:text-primary cursor-pointer" onClick={onCancel}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <p className="text-xs text-secondary mb-4">Current price: <strong className="text-primary">{formatPrice(currentPrice, currencySymbol)}</strong></p>
          {existingAlert && (
            <div className="mb-3 p-2.5 rounded-lg bg-base border border-default">
              <p className="text-xs text-muted mb-0.5">Existing alert:</p>
              <p className="text-xs text-primary">Price {existingAlert.condition} {currencySymbol}{existingAlert.targetPrice.toLocaleString()}</p>
            </div>
          )}
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className={`flex-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${condition === 'above' ? 'bg-success/15 border-success/30 text-success' : 'bg-base border-default text-secondary'}`} onClick={() => setCondition('above')}>Goes Above</button>
              <button className={`flex-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${condition === 'below' ? 'bg-danger/15 border-danger/30 text-danger' : 'bg-base border-default text-secondary'}`} onClick={() => setCondition('below')}>Goes Below</button>
            </div>
            <div className="flex items-center gap-2 bg-base border border-default rounded-lg p-2.5">
              <span className="text-xs text-muted">{currencySymbol}</span>
              <input type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="Target price" className="flex-1 bg-transparent border-none outline-none text-sm text-primary" />
            </div>
            <button className="w-full py-2.5 bg-accent text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90" onClick={handleSave}>{existingAlert ? 'Update Alert' : 'Set Alert'}</button>
            <button className="w-full py-2 bg-base border border-default rounded-lg text-xs font-medium text-secondary cursor-pointer hover:text-primary" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onCancel}>
        <div className="bg-surface border border-default rounded-xl p-7 w-[380px]" onClick={e => e.stopPropagation()}>
          <div className="text-center py-4">
            <div className="w-11 h-11 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p className="text-sm font-medium text-primary mb-1">Alert {existingAlert ? 'Updated' : 'Set'}!</p>
            <p className="text-xs text-secondary mb-4">You'll be notified when price {condition === 'above' ? 'goes above' : 'drops below'} {currencySymbol}{parseFloat(targetPrice).toLocaleString()}</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-accent text-white border-none rounded-lg text-sm font-medium cursor-pointer hover:opacity-90" onClick={handleEdit}>Edit Alert</button>
              <button className="flex-1 py-2 bg-base border border-default rounded-lg text-sm font-medium text-primary cursor-pointer hover:text-primary" onClick={onCancel}>Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="bg-surface border border-default rounded-xl p-7 w-[380px]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-primary flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {coin.name} Alert
          </h2>
          <button className="text-secondary hover:text-primary cursor-pointer" onClick={onCancel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <p className="text-xs text-secondary mb-4">Current price: <strong className="text-primary">{formatPrice(currentPrice, currencySymbol)}</strong></p>
        {existingAlert && !existingAlert.triggered && (
          <div className="mb-4 p-3 rounded-lg bg-base border border-default">
            <p className="text-xs text-muted mb-0.5">Active alert:</p>
            <p className="text-sm text-primary font-medium">Price {existingAlert.condition} {currencySymbol}{existingAlert.targetPrice.toLocaleString()}</p>
          </div>
        )}
        <div className="space-y-2">
          <button className="w-full py-2.5 bg-accent text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90" onClick={handleEdit}>{existingAlert ? 'Edit Alert' : 'Create Alert'}</button>
          {existingAlert && (
            <button className="w-full py-2 bg-base border border-default rounded-lg text-xs font-medium text-danger cursor-pointer hover:bg-danger/10" onClick={() => { onSave(coin.coinId || coin.id, null); setSaved(true); }}>Delete Alert</button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddToPortfolioModal({ coin, currentPrice, currencySymbol, onConfirm, onCancel }) {
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState(currentPrice ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const qty = parseFloat(quantity);
    const price = parseFloat(buyPrice);
    const total = qty * price;

    if (!qty || qty <= 0) { setError('Enter a valid quantity'); return; }
    if (!price || price <= 0) { setError('Enter a valid price'); return; }

    setSubmitting(true);
    setError('');

    await onConfirm(coin, qty, price, total);
    setSubmitting(false);
  };

  const qtyNum = parseFloat(quantity) || 0;
  const priceNum = parseFloat(buyPrice) || 0;
  const total = qtyNum * priceNum;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="bg-surface border border-default rounded-xl p-7 w-[400px] max-w-[92vw]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-base font-semibold text-primary">Add to Portfolio</h2>
            <p className="text-xs text-secondary mt-0.5">{coin.name} ({coin.ticker})</p>
          </div>
          <button className="bg-none border-none cursor-pointer text-secondary p-1 rounded" onClick={onCancel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-secondary mb-4">Current price: <strong className="text-primary">{formatPrice(currentPrice, currencySymbol)}</strong></p>

        {error && <p className="text-xs text-danger mb-3">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-secondary uppercase mb-1 block">Quantity ({coin.ticker})</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
              className="w-full h-10 px-3.5 rounded-lg border border-default bg-base text-sm text-primary outline-none focus:border-accent"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-secondary uppercase mb-1 block">Avg. Buy Price ({currencySymbol})</label>
            <input
              type="number"
              value={buyPrice}
              onChange={e => setBuyPrice(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
              className="w-full h-10 px-3.5 rounded-lg border border-default bg-base text-sm text-primary outline-none focus:border-accent"
            />
          </div>

          <div className="bg-base rounded-lg p-3 border border-default">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Total Investment</span>
              <span className="text-primary font-semibold">{formatPrice(total, currencySymbol)}</span>
            </div>
          </div>

          <button
            className="w-full py-2.5 bg-accent text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add to Portfolio'}
          </button>
          <button
            className="w-full py-2 bg-base border border-default rounded-lg text-xs font-medium text-secondary cursor-pointer hover:text-primary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Watchlist() {
  const { user, watchlistItems, loadWatchlist, addToWatchlist, removeFromWatchlist } = useAuth();
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
  const [visibleColumns, setVisibleColumns] = useState(() => AVAILABLE_COLUMNS.filter(c => c.default).map(c => c.key));
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [priceFlash, setPriceFlash] = useState({});
  const [alerts, setAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('fintracker_alerts');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [alertTarget, setAlertTarget] = useState(null);
  const [addToPortfolioTarget, setAddToPortfolioTarget] = useState(null);
  const alertsRef = useRef(alerts);

  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const ITEMS_PER_PAGE = 8;
  const tabs = ["All", "Gainers", "Losers"];
  const currencySymbol = currencyData?.symbol || "$";
  const livePricesRef = useRef({});

  const handlePriceUpdate = useCallback((coinId, price) => {
    setCoins(prev => {
      const coin = prev.find(c => c.id === coinId || c.coinId === coinId);
      const oldPrice = coin?.current_price ?? null;
      if (oldPrice !== null && oldPrice !== price) {
        setPriceFlash(pf => ({ ...pf, [coinId]: price > oldPrice ? 'up' : 'down' }));
        setTimeout(() => setPriceFlash(pf => ({ ...pf, [coinId]: null })), 600);

        const alert = alertsRef.current[coinId];
        if (alert && !alert.triggered) {
          const triggered = (alert.condition === 'above' && price >= alert.targetPrice) || (alert.condition === 'below' && price <= alert.targetPrice);
          if (triggered) {
            setAlerts(a => {
              const existing = a[coinId] || {};
              const next = { ...a, [coinId]: { ...existing, triggered: true, triggeredAt: Date.now() } };
              localStorage.setItem('fintracker_alerts', JSON.stringify(next));
              return next;
            });

            fetch(`${API_URL}/api/alerts/trigger`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                coinName: coin?.name || coinId,
                condition: alert.condition,
                targetPrice: alert.targetPrice,
                currentPrice: price,
                currencySymbol,
              }),
            }).catch(e => console.error('Alert email failed:', e));

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`🔔 ${coin?.name || coinId} Alert!`, {
                body: `Price ${alert.condition} ${currencySymbol}${alert.targetPrice.toLocaleString()} — Now: ${currencySymbol}${price.toLocaleString()}`,
                icon: '/vite.svg',
              });
            }
          }
        }
      }
      livePricesRef.current = { ...livePricesRef.current, [coinId]: price };
      return prev.map(c => (c.id === coinId || c.coinId === coinId) ? { ...c, current_price: price } : c);
    });
  }, [currencySymbol]);

  const { isConnected } = useBinanceWebSocket(coins.map(c => ({ ticker: c.symbol, coinId: c.id })), handlePriceUpdate, currency);

  const watchlist = coins.map(toWatchlistCoin);

  useEffect(() => {
    let active = true;

    async function refreshCoinIds() {
      if (!user) return;

      const result = await loadWatchlist();

      if (active && !result.success) {
        setPageError(result.error);
      }
    }

    refreshCoinIds();

    return () => {
      active = false;
    };
  }, [user, loadWatchlist]);

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
  const bestPerformer = watchlist.length ? watchlist.reduce((best, c) => (c.change24h > (best?.change24h ?? -Infinity) ? c : best), null) : null;
  const lowestPerformer = watchlist.length ? watchlist.reduce((worst, c) => (c.change24h < (worst?.change24h ?? Infinity) ? c : worst), null) : null;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const toggleColumn = (key) => {
    if (visibleColumns.includes(key)) {
      setVisibleColumns(visibleColumns.filter(c => c !== key));
    } else {
      setVisibleColumns([...visibleColumns, key]);
    }
  };

  const renderCell = (coin, key) => {
    switch (key) {
      case 'rank':
        return <span className="text-xs text-muted w-6">{coin.marketCapRank ?? "-"}</span>;
      case 'name':
        return (
          <div className="flex items-center gap-2 min-w-0">
            <CoinLogo ticker={coin.ticker} image={coin.image} size={20} />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-primary truncate">{coin.name}</div>
              <div className="text-xs text-muted">{coin.ticker}</div>
            </div>
          </div>
        );
      case 'price': {
        const cid = coin.coinId || coin.id;
        const flash = priceFlash[cid];
        const flashClass = flash === 'up' ? 'text-success' : flash === 'down' ? 'text-danger' : 'text-primary';
        const arrow = flash === 'up' ? '↑ ' : flash === 'down' ? '↓ ' : '';
        return <span className={`text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${flashClass}`}>{arrow}{formatPrice(coin.price, currencySymbol)}</span>;
      }
      case 'change1h':
        return coin.change1h !== null ? (
          <span className={`text-xs font-medium whitespace-nowrap ${coin.change1h >= 0 ? 'text-success' : 'text-danger'}`}>
            {coin.change1h >= 0 ? '+' : ''}{coin.change1h.toFixed(2)}%
          </span>
        ) : <span className="text-xs text-muted">-</span>;
      case 'change7d':
        return coin.change7d !== null ? (
          <span className={`text-xs font-medium whitespace-nowrap ${coin.change7d >= 0 ? 'text-success' : 'text-danger'}`}>
            {coin.change7d >= 0 ? '+' : ''}{coin.change7d.toFixed(2)}%
          </span>
        ) : <span className="text-xs text-muted">-</span>;
      case 'change24h':
        return (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${coin.change24h >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
            {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
          </span>
        );
      case 'marketCap':
        return <span className="text-xs text-secondary whitespace-nowrap">{formatMarketCap(coin.marketCap, currencySymbol)}</span>;
      case 'volume':
        return <span className="text-xs text-secondary whitespace-nowrap">{formatMarketCap(coin.volume, currencySymbol)}</span>;
      case 'high24h':
        return <span className="text-xs text-secondary whitespace-nowrap">{coin.high24h !== null ? formatPrice(coin.high24h, currencySymbol) : '-'}</span>;
      case 'low24h':
        return <span className="text-xs text-secondary whitespace-nowrap">{coin.low24h !== null ? formatPrice(coin.low24h, currencySymbol) : '-'}</span>;
      case 'ath':
        return <span className="text-xs text-secondary whitespace-nowrap">{coin.ath !== null ? formatPrice(coin.ath, currencySymbol) : '-'}</span>;
      case 'athChange':
        return coin.athChange !== null ? (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${coin.athChange >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
            {coin.athChange >= 0 ? '+' : ''}{coin.athChange.toFixed(2)}%
          </span>
        ) : <span className="text-xs text-muted">-</span>;
      case 'atl':
        return <span className="text-xs text-secondary whitespace-nowrap">{coin.atl !== null ? formatPrice(coin.atl, currencySymbol) : '-'}</span>;
      case 'sparkline':
        return <Sparkline data={coin.sparkline} positive={coin.change7d !== null ? coin.change7d >= 0 : coin.change24h >= 0} width={120} height={32} />;
      case 'alert': {
        const cid = coin.coinId || coin.id;
        const alert = alerts[cid];
        const hasAlert = alert && !alert.triggered;
        const isTriggered = alert?.triggered;
        return (
          <div className="flex items-center justify-center">
            <button 
              className={`cursor-pointer p-1.5 rounded-lg border-none transition-colors ${isTriggered ? 'bg-warning/15 text-warning hover:bg-warning/25' : hasAlert ? 'bg-accent/15 text-accent hover:bg-accent/25' : 'text-muted hover:text-primary hover:bg-overlay'}`}
              title={isTriggered ? 'Alert triggered!' : hasAlert ? `Set ${alert.condition} ${formatPrice(alert.targetPrice, currencySymbol)}` : 'Set price alert'}
              onClick={e => { e.stopPropagation(); setAlertTarget(coin); }}
            >
              {isTriggered ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              )}
            </button>
          </div>
        );
      }
      case 'portfolio':
        return (
          <div className="flex items-center justify-center">
            <button
              className="cursor-pointer p-1.5 rounded-lg border-none text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              title="Add to portfolio"
              onClick={e => { e.stopPropagation(); setAddToPortfolioTarget(coin); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        );
      case 'actions':
        return (
          <button className="cursor-pointer text-muted hover:text-danger transition-colors" title="Remove from watchlist" onClick={e => { e.stopPropagation(); setRemoveTarget(coin); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        );
      default:
        return null;
    }
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

  const confirmRemove = async () => {
    if (!removeTarget) return;

    setPageError("");
    const result = await removeFromWatchlist(removeTarget.coinId);

    if (!result.success) {
      setPageError(result.error);
    }

    setRemoveTarget(null);
  };

  const handleSaveAlert = (coinId, alertData) => {
    if (alertData === null) {
      setAlerts(prev => {
        const next = { ...prev };
        delete next[coinId];
        localStorage.setItem('fintracker_alerts', JSON.stringify(next));
        return next;
      });
    } else {
      const target = watchlist.find(c => c.coinId === coinId || c.id === coinId);
      setAlerts(prev => {
        const next = {
          ...prev,
          [coinId]: {
            ...alertData,
            triggered: false,
            name: target?.name || coinId,
            ticker: target?.ticker || coinId.toUpperCase(),
            createdAt: prev[coinId]?.createdAt || Date.now(),
          }
        };
        localStorage.setItem('fintracker_alerts', JSON.stringify(next));
        return next;
      });
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    setTimeout(() => setAlertTarget(null), 800);
  };

  const handleAddToPortfolioConfirm = async (coin, quantity, buyPrice, total) => {
    if (!user) return { success: false, error: 'Please login to add an asset' };

    try {
      const response = await fetch(`${API_URL}/api/portfolio/assets`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coinId: coin.coinId || coin.id,
          name: coin.name,
          symbol: coin.ticker,
          quantity,
          currentPrice: coin.price,
          averageBuyPrice: buyPrice,
          image: coin.image || '',
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || data.error || 'Failed to add to portfolio' };
      }

      setAddToPortfolioTarget(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to add to portfolio' };
    }
  };

  const handleConfirmAddToPortfolio = async (coin, quantity, buyPrice) => {
    try {
      const response = await fetch(`${API_URL}/api/portfolio/assets`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coinId: coin.coinId || coin.id,
          name: coin.name,
          symbol: coin.ticker,
          quantity,
          currentPrice: buyPrice,
          averageBuyPrice: buyPrice,
          image: coin.image || '',
        }),
      });

      if (response.ok) {
        setAddToPortfolioTarget(null);
      }
    } catch {
    }
  };

  return (
    <div className="p-3 sm:p-5 flex flex-col gap-3 min-h-full">
      <div className="flex items-center gap-1.5 text-xs text-secondary mb-1.5">
        <span>Active Tracking</span>
        <span>&gt;</span>
        <span className={`font-medium ${isConnected ? 'text-success' : 'text-muted'}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${isConnected ? 'bg-success animate-pulse' : 'bg-muted'}`} />
          {isConnected ? 'LIVE' : 'Connecting...'}
        </span>
      </div>

      <p className="text-sm text-secondary mb-4">Monitor your selected assets with real-time price feeds and trend analysis.</p>
      {pageError && <p className="text-sm text-danger mb-2">{pageError}</p>}

      <div className="flex overflow-x-auto gap-2 pb-2">
        <MetricCard label="Tracked Assets" value={watchlistItems.length} change={null} />
        <MetricCard label="Total Value (est.)" value={formatMarketCap(totalValue * 1e6, currencySymbol)} change={null} />
        <MetricCard label="Best Performer" value={bestPerformer?.name ?? "-"} change={bestPerformer?.change24h ?? null} badge={bestPerformer?.change24h != null ? `${bestPerformer.change24h >= 0 ? '+' : ''}${bestPerformer.change24h.toFixed(2)}%` : undefined} />
        <MetricCard label="Lowest Performer" value={lowestPerformer?.name ?? "-"} change={lowestPerformer?.change24h ?? null} badge={lowestPerformer?.change24h != null ? `${lowestPerformer.change24h >= 0 ? '+' : ''}${lowestPerformer.change24h.toFixed(2)}%` : undefined} />
        <MetricCard label="Gainers / Losers" value={`${gainers} / ${losers}`} change={null} />
      </div>

      {/* Search and Actions Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <TabBar tabs={tabs} active={activeTab} onChange={t => { setActiveTab(t); setCurrentPage(1); }} size="sm" />
          <div className="flex items-center gap-2 bg-surface border border-default rounded-lg p-2 min-w-[200px] flex-1 max-w-[400px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input placeholder="Filter your list..." value={filterText} onChange={e => { setFilterText(e.target.value); setCurrentPage(1); }} className="bg-transparent border-none outline-none text-sm text-primary placeholder:text-muted flex-1" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-1.5 bg-surface border border-default rounded-lg px-2.5 py-1.5 text-xs text-primary cursor-pointer hover:bg-overlay"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              Columns
            </button>
            {showColumnMenu && (
              <div className="absolute top-full right-0 mt-1 bg-surface border border-default rounded-lg p-1 min-w-[150px] z-50 shadow-lg">
                {AVAILABLE_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-overlay rounded text-xs text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      className="accent-accent"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <button className="flex items-center gap-1.5 bg-accent text-white border-none rounded-lg py-2 px-4.5 text-sm font-semibold cursor-pointer hover:opacity-90" onClick={() => setShowAddModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Asset
          </button>
        </div>
      </div>

      {/* Market Table */}
      <div className="bg-surface border border-default rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-default">
          <span className="text-xs font-semibold text-muted uppercase">Watchlist</span>
          <span className="text-xs text-muted">{filtered.length} coins</span>
        </div>
        
        <div className="overflow-x-auto">
          <div 
            className="w-full border-collapse" 
            style={{ display: 'grid', gridTemplateColumns: visibleColumns.map(getColumnWidth).join(' '), gap: '0' }}
          >
            {visibleColumns.map((colKey) => {
              const col = AVAILABLE_COLUMNS.find(c => c.key === colKey);
              const isLeftAligned = colKey === 'name' || colKey === 'price';
              return (
                <div 
                  key={colKey} 
                  className="sticky top-0 z-10 bg-surface border-b border-default px-2 py-2 text-xs font-semibold text-muted uppercase"
                  style={{ 
                    display: 'flex',
                    textAlign: isLeftAligned ? 'left' : 'right',
                    justifyContent: isLeftAligned ? 'flex-start' : 'flex-end',
                    alignItems: 'center'
                  }}
                >
                  <span className="cursor-pointer" onClick={() => handleSort(colKey)}>
                    {col?.label}{colKey !== 'actions' ? <SortIcon col={colKey} sortKey={sortKey} sortDir={sortDir} /> : ''}
                  </span>
                </div>
              );
            })}
            
            {loading ? (
              <div className="col-span-full text-center py-15 text-secondary">Loading watchlist...</div>
            ) : paginated.length === 0 ? (
              <div className="col-span-full text-center py-15 text-secondary">
                <div className="text-[2.5rem] mb-2">-</div>
                <div className="font-semibold mb-1 text-primary">{filterText ? "No matching assets" : "Your watchlist is empty"}</div>
                <div className="text-xs">{filterText ? "Try a different search term" : "Add coins to start tracking"}</div>
              </div>
            ) : (
              paginated.map(coin => 
                visibleColumns.map((colKey) => (
                  <div 
                    key={`${coin.coinId}-${colKey}`}
                    className="border-b border-subtle hover:bg-overlay cursor-pointer transition-colors px-2 py-2"
                    style={{ 
                      display: 'flex',
                      textAlign: (colKey === 'name' || colKey === 'price') ? 'left' : 'right',
                      justifyContent: (colKey === 'name' || colKey === 'price') ? 'flex-start' : 'flex-end',
                      alignItems: 'center'
                    }}
                  >
                    {renderCell(coin, colKey)}
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-default bg-overlay">
            <span className="text-xs text-muted">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs rounded border border-default bg-surface text-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-overlay"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 text-xs rounded border ${pageNum === currentPage ? 'bg-accent text-white border-accent' : 'bg-surface text-primary border-default hover:bg-overlay'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs rounded border border-default bg-surface text-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-overlay"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} onAdd={handleAddCoin} existing={watchlistItems} currency={currency} />}
      {removeTarget && <RemoveModal coin={removeTarget} onConfirm={confirmRemove} onCancel={() => setRemoveTarget(null)} />}
      {alertTarget && (
        <AlertModal 
          coin={alertTarget} 
          currentPrice={alertTarget.price} 
          currencySymbol={currencySymbol} 
          existingAlert={alerts[alertTarget.coinId || alertTarget.id]} 
          onSave={handleSaveAlert} 
          onCancel={() => setAlertTarget(null)} 
        />
      )}
      {addToPortfolioTarget && (
        <AddToPortfolioModal
          coin={addToPortfolioTarget}
          currentPrice={addToPortfolioTarget.price}
          currencySymbol={currencySymbol}
          onConfirm={handleConfirmAddToPortfolio}
          onCancel={() => setAddToPortfolioTarget(null)}
        />
      )}

      <footer className="text-center text-xs text-muted pt-4 border-t border-subtle flex justify-center gap-5 mt-auto">
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