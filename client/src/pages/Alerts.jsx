import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import Badge from "../components/shared/Badge";
import MetricCard from "../components/dashboard/MetricCard";
import { API_URL } from "../config";

// Format a number as price with symbol and adaptive decimals
function formatPrice(price, symbol = "$") {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return "-";
  const value = Number(price);
  if (value >= 1000) return `${symbol}${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (value >= 1) return `${symbol}${value.toFixed(2)}`;
  return `${symbol}${value.toFixed(4)}`;
}

// Convert a timestamp to a human-readable "time ago" string
function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Animated pulsing dot for triggered alerts
function AlertPulse({ triggered }) {
  if (!triggered) return null;
  return (
    <span className="absolute -top-1 -right-1 w-3 h-3">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-danger" />
    </span>
  );
}

// Icon for an alert (up arrow for above, down arrow for below)
function AlertIcon({ condition, triggered }) {
  const color = triggered ? "text-danger" : condition === "above" ? "text-success" : "text-warning";
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${triggered ? "bg-danger/15" : condition === "above" ? "bg-success/15" : "bg-warning/15"}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={color}>
        {condition === "above" ? (
          <path d="M12 19V5M5 12l7-7 7 7" />
        ) : (
          <path d="M12 5v14M19 12l-7 7-7-7" />
        )}
      </svg>
    </div>
  );
}

// Tiny sparkline chart for a coin in alert cards
function CoinMiniChart({ coinId, currency }) {
  const [sparkline, setSparkline] = useState([]);
  const [positive, setPositive] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadChartData() {
      try {
        const res = await window.fetch(`${API_URL}/chart/${coinId}?days=7&currency=${currency}`);
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.prices) {
          const last100 = data.prices.slice(-100).map(p => p[1]);
          setSparkline(last100);
          setPositive(last100[last100.length - 1] >= last100[0]);
        }
      } catch { /* silent */ }
    }
    loadChartData();
    return () => { active = false; };
  }, [coinId, currency]);

  if (!sparkline.length) return null;

  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = sparkline.map((v, i) => {
    const x = (i / (sparkline.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const color = positive ? "rgb(var(--color-success))" : "rgb(var(--color-danger))";

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Card showing a single alert with current price and mini chart
function AlertCard({ coin, alert, onDismiss, currencySymbol, currency }) {
  const [coinData, setCoinData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    let active = true;
    const safeCoinId = String(coin.coinId || "").trim().toLowerCase();

    if (!safeCoinId) {
      if (active) {
        setFetchError('Invalid coin ID');
        setLoading(false);
      }
      return;
    }

    async function loadCoinData() {
      setFetchError('');
      try {
        const url = `${API_URL}/coins/${safeCoinId}?currency=${currency}`;
        const res = await window.fetch(url);
        const data = await res.json();

        if (active) {
          if (data.error) {
            setFetchError('Price data unavailable');
          } else {
            setCoinData(data);
          }
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setFetchError('Failed to load price');
          setLoading(false);
        }
      }
    }
    loadCoinData();
    return () => { active = false; };
  }, [coin.coinId, currency]);

  const currentPrice = coinData?.current_price ?? null;
  const change24h = coinData?.price_change_percentage_24h ?? null;
  const triggeredAt = alert.triggeredAt ?? alert.timestamp;
  const priceDiff = currentPrice !== null ? ((currentPrice - alert.targetPrice) / alert.targetPrice * 100) : null;

  return (
    <div className={`bg-surface border rounded-xl p-4 transition-all duration-300 hover:border-default ${alert.triggered ? "border-danger/30" : "border-default"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <AlertIcon condition={alert.condition} triggered={alert.triggered} />
            <AlertPulse triggered={alert.triggered} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-primary truncate">{coin.name}</h3>
              {alert.triggered && (
                <Badge variant="danger" className="text-[10px] px-1.5 py-0.5">Triggered</Badge>
              )}
            </div>
            <p className="text-xs text-muted">{coin.ticker} · {alert.condition === "above" ? "Above" : "Below"} {formatPrice(alert.targetPrice, currencySymbol)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {triggeredAt && (
            <span className="text-[11px] text-muted whitespace-nowrap">{timeAgo(triggeredAt)}</span>
          )}
          <button
            onClick={() => onDismiss(coin.coinId)}
            className="p-1.5 rounded-lg border-none text-muted hover:text-danger hover:bg-danger/10 cursor-pointer transition-colors"
            title="Dismiss alert"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-base rounded-lg p-2.5">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Target</p>
          <p className="text-sm font-semibold text-primary">{formatPrice(alert.targetPrice, currencySymbol)}</p>
        </div>
        <div className="bg-base rounded-lg p-2.5">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Current</p>
          <p className={`text-sm font-semibold ${loading ? "text-muted" : fetchError ? "text-warning" : (alert.triggered && currentPrice !== null) ? "text-danger" : "text-primary"}`}>
            {loading ? "Loading..." : fetchError ? fetchError : (currentPrice !== null ? formatPrice(currentPrice, currencySymbol) : "N/A")}
          </p>
        </div>
        <div className="bg-base rounded-lg p-2.5">
          <p className="text-[10px] text-muted uppercase tracking-wider mb-1">24h Change</p>
          <p className={`text-sm font-semibold ${loading ? "text-muted" : fetchError ? "text-muted" : (change24h !== null ? (change24h >= 0 ? "text-success" : "text-danger") : "text-muted")}`}>
            {loading ? "Loading..." : fetchError ? "-" : (change24h !== null ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%` : "N/A")}
          </p>
        </div>
      </div>

      {currentPrice !== null && priceDiff !== null && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">Deviation</span>
            <span className={`text-xs font-medium ${priceDiff >= 0 ? "text-success" : "text-danger"}`}>
              {priceDiff >= 0 ? "+" : ""}{priceDiff.toFixed(2)}%
            </span>
          </div>
          <CoinMiniChart coinId={coin.coinId} currency={currency} />
        </div>
      )}
    </div>
  );
}

// Two-step modal to create a new price alert (select coin → set target)
function CreateAlertModal({ onClose, onCreateAlert, currencySymbol }) {
  const [search, setSearch] = useState("");
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [condition, setCondition] = useState("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [step, setStep] = useState(1);
  const [suggestions, setSuggestions] = useState([]);

  const suggestedIds = ["bitcoin", "ethereum", "solana", "dogecoin", "xrp", "cardano", "avalanche-2", "chainlink"];

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await window.fetch(`${API_URL}/coins?currency=usd`);
        const data = await res.json();
        if (active && Array.isArray(data)) {
          setCoins(data);
          const sug = suggestedIds.map(id => data.find(c => c.id === id)).filter(Boolean);
          setSuggestions(sug);
        }
      } catch { /* silent */ } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const filtered = search
    ? coins.filter(c => {
        const q = search.toLowerCase();
        return c.id?.toLowerCase().includes(q) || c.symbol?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q);
      }).slice(0, 20)
    : suggestions;

  const handleCreate = () => {
    if (!selectedCoin || !targetPrice) return;
    onCreateAlert(selectedCoin.id, {
      name: selectedCoin.name,
      ticker: selectedCoin.symbol?.toUpperCase() || selectedCoin.id.toUpperCase().slice(0, 6),
      targetPrice: parseFloat(targetPrice),
      condition,
      triggered: false,
      createdAt: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-surface border border-default rounded-xl p-6 w-[460px] max-w-[92vw] max-h-[88vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-semibold text-primary">Create Price Alert</h2>
            <p className="text-xs text-secondary mt-0.5">Choose a coin and set your target price.</p>
          </div>
          <button className="bg-transparent border-none cursor-pointer text-secondary p-1 rounded hover:text-primary" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {step === 1 ? (
          <>
            <div className="flex items-center gap-2 bg-base border border-default rounded-lg p-2.5 mb-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input placeholder="Search coin..." value={search} onChange={e => setSearch(e.target.value)} autoFocus className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder:text-muted" />
            </div>
            <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[350px]">
              {loading && <p className="text-xs text-secondary text-center py-5">Loading coins...</p>}
              {!loading && !search && <p className="text-xs text-muted px-3 pb-1.5 uppercase tracking-wider font-semibold text-[10px]">Popular coins</p>}
              {!loading && search && filtered.length === 0 && <p className="text-xs text-muted text-center py-5">No results found</p>}
              {filtered.map(coin => (
                <div key={coin.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border-none transition-colors ${selectedCoin?.id === coin.id ? "bg-accent/15 border border-accent/30" : "hover:bg-overlay"}`} onClick={() => setSelectedCoin(coin)}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={coin.image} alt="" className="w-8 h-8 rounded-full shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{coin.name}</p>
                      <p className="text-xs text-secondary">{coin.symbol?.toUpperCase()}</p>
                    </div>
                  </div>
                  <span className="text-sm text-primary shrink-0 ml-2">{currencySymbol}{coin.current_price?.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <button disabled={!selectedCoin} className="mt-3 w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed" onClick={() => setStep(2)}>Next</button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-base border border-default mb-4">
              <img src={selectedCoin?.image} alt="" className="w-9 h-9 rounded-full" />
              <div>
                <p className="text-sm font-semibold text-primary">{selectedCoin?.name}</p>
                <p className="text-xs text-secondary">{selectedCoin?.symbol?.toUpperCase()} · {currencySymbol}{selectedCoin?.current_price?.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button className={`flex-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${condition === "above" ? "bg-success/15 border-success/30 text-success" : "bg-base border-default text-secondary"}`} onClick={() => setCondition("above")}>Goes Above</button>
              <button className={`flex-1 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${condition === "below" ? "bg-danger/15 border-danger/30 text-danger" : "bg-base border-default text-secondary"}`} onClick={() => setCondition("below")}>Goes Below</button>
            </div>

            <div className="flex items-center gap-2 bg-base border border-default rounded-lg p-2.5 mb-5">
              <span className="text-xs text-muted">{currencySymbol}</span>
              <input type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="Target price" className="flex-1 bg-transparent border-none outline-none text-sm text-primary" />
            </div>

            <button disabled={!targetPrice || isNaN(parseFloat(targetPrice)) || parseFloat(targetPrice) <= 0} className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-lg border-none cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleCreate}>Create Alert</button>
          </>
        )}
      </div>
    </div>
  );
}

// Empty state shown when the user has no alerts
function EmptyState({ onCreateAlert }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-surface border border-default flex items-center justify-center mb-5">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-primary mb-1.5">No alerts yet</h3>
      <p className="text-sm text-muted max-w-sm">Set price alerts on your watchlist to get notified when coins hit your target prices.</p>
      <button onClick={() => onCreateAlert()} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Create Your First Alert
      </button>
    </div>
  );
}

// Alerts page: view, filter, create, and dismiss price alerts
export default function Alerts() {
  const navigate = useNavigate();
  const { currency, currencyData } = useCurrency();
  const currencySymbol = currencyData?.symbol || "$";
  const [alerts, setAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem("fintracker_alerts");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateAlert = useCallback((coinId, alertData) => {
    setAlerts(prev => {
      const next = { ...prev, [coinId]: alertData };
      localStorage.setItem("fintracker_alerts", JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem("fintracker_alerts");
        if (saved) setAlerts(JSON.parse(saved));
      } catch { /* silent */ }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const alertEntries = Object.entries(alerts).map(([coinId, alert]) => ({
    coinId,
    name: alert.name || coinId.charAt(0).toUpperCase() + coinId.slice(1),
    ticker: alert.ticker || coinId.toUpperCase().slice(0, 6),
    ...alert,
  }));

  const filtered = alertEntries
    .filter(a => {
      if (filter === "triggered") return a.triggered;
      if (filter === "active") return !a.triggered;
      return true;
    })
    .filter(a => {
      if (!search) return true;
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.coinId.toLowerCase().includes(q) || a.ticker.toLowerCase().includes(q);
    });

  const triggeredCount = alertEntries.filter(a => a.triggered).length;
  const activeCount = alertEntries.filter(a => !a.triggered).length;

  const handleDismiss = useCallback((coinId) => {
    setAlerts(prev => {
      const next = { ...prev };
      delete next[coinId];
      localStorage.setItem("fintracker_alerts", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleDismissAll = useCallback(() => {
    localStorage.setItem("fintracker_alerts", "{}");
    setAlerts({});
  }, []);

  const filters = [
    { key: "all", label: "All", count: alertEntries.length },
    { key: "active", label: "Active", count: activeCount },
    { key: "triggered", label: "Triggered", count: triggeredCount },
  ];

  return (
    <div className="p-3 sm:p-5 flex flex-col gap-4 min-h-full">
      <p className="text-sm text-secondary">Monitor your price alerts and get notified when targets are reached.</p>

      {alertEntries.length > 0 && (
        <div className="flex overflow-x-auto gap-2 pb-1">
          <MetricCard label="Total Alerts" value={alertEntries.length} change={null} />
          <MetricCard label="Active" value={activeCount} change={null} />
          <MetricCard label="Triggered" value={triggeredCount} change={null} />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer transition-colors ${filter === f.key ? "bg-accent text-white" : "bg-surface border border-default text-secondary hover:bg-overlay"}`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`ml-1.5 text-[10px] ${filter === f.key ? "text-white/80" : "text-muted"}`}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-accent text-white border-none rounded-lg py-1.5 px-3 text-xs font-semibold cursor-pointer hover:opacity-90 whitespace-nowrap"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Alert
          </button>
          <div className="flex items-center gap-2 bg-surface border border-default rounded-lg p-2 min-w-[200px] max-w-[300px] flex-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="Search alerts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-primary placeholder:text-muted flex-1"
            />
          </div>
          {triggeredCount > 0 && (
            <button
              onClick={handleDismissAll}
              className="px-3 py-1.5 rounded-lg bg-danger/15 text-danger text-xs font-medium border border-danger/30 cursor-pointer hover:bg-danger/25 transition-colors whitespace-nowrap"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        search ? (
          <div className="text-center py-15">
            <p className="text-sm font-medium text-primary mb-1">No alerts found</p>
            <p className="text-xs text-muted">Try a different search term</p>
          </div>
        ) : (
          <EmptyState onCreateAlert={() => setShowCreateModal(true)} />
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(a => (
            <AlertCard
              key={a.coinId}
              coin={{ coinId: a.coinId, name: a.name, ticker: a.ticker }}
              alert={a}
              onDismiss={handleDismiss}
              currencySymbol={currencySymbol}
              currency={currency}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAlertModal
          onClose={() => setShowCreateModal(false)}
          onCreateAlert={handleCreateAlert}
          currencySymbol={currencySymbol}
        />
      )}

      <footer className="text-center text-xs text-muted pt-4 border-t border-subtle flex justify-center gap-5 mt-auto">
        <span>© 2026 Cove. All rights reserved.</span>
        <div className="flex gap-3.5">
          <a href="#" className="text-inherit no-underline">Terms</a>
          <a href="#" className="text-inherit no-underline">Privacy</a>
          <a href="#" className="text-inherit no-underline">Support</a>
        </div>
      </footer>
    </div>
  );
}
