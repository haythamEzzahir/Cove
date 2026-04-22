import { useState } from "react";
import CoinLogo from "../components/shared/CoinLogo";
import Badge from "../components/shared/Badge";
import TabBar from "../components/shared/TabBar";
import { radius, fontSize } from "../styles/tokens";

// Mock watchlist data
const mockWatchlist = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    ticker: "BTC",
    price: 67420.5,
    change24h: 2.34,
    marketCap: 1327000000000,
    volume24h: 28400000000,
    sparkline: [64000, 65200, 63800, 66100, 65700, 67000, 67420],
    starred: true,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    ticker: "ETH",
    price: 3541.2,
    change24h: -1.12,
    marketCap: 425700000000,
    volume24h: 14200000000,
    sparkline: [3600, 3580, 3620, 3510, 3490, 3530, 3541],
    starred: true,
  },
  {
    id: "solana",
    name: "Solana",
    ticker: "SOL",
    price: 184.88,
    change24h: 5.67,
    marketCap: 84600000000,
    volume24h: 4100000000,
    sparkline: [170, 172, 175, 178, 180, 183, 184],
    starred: false,
  },
  {
    id: "cardano",
    name: "Cardano",
    ticker: "ADA",
    price: 0.4452,
    change24h: -3.22,
    marketCap: 16160000000,
    volume24h: 520000000,
    sparkline: [0.47, 0.46, 0.46, 0.45, 0.45, 0.44, 0.445],
    starred: false,
  },
  {
    id: "polkadot",
    name: "Polkadot",
    ticker: "DOT",
    price: 7.34,
    change24h: 1.15,
    marketCap: 10380000000,
    volume24h: 310000000,
    sparkline: [7.1, 7.15, 7.2, 7.25, 7.28, 7.31, 7.34],
    starred: false,
  },
];

// Suggested coins for the Add modal
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
    <span style={{ marginLeft: 4, opacity: sortKey === col ? 1 : 0.3, fontSize: '10px' }}>
      {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );
}

// Mini sparkline SVG
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
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
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

// Add to Watchlist Modal
function AddModal({ onClose, onAdd, existing }) {
  const [search, setSearch] = useState("");
  const [added, setAdded] = useState([]);

  const filtered = suggestedCoins.filter(
    (c) =>
      !existing.includes(c.ticker) &&
      (search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.ticker.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = (coin) => {
    setAdded((prev) => [...prev, coin.ticker]);
    onAdd(coin);
  };

  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    modal: {
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: radius.xl,
      padding: "28px",
      width: "420px",
      maxWidth: "90vw",
      boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      animation: "modalIn 0.2s ease",
    },
    header: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: "6px",
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: 600,
      color: "var(--color-text-primary)",
      margin: 0,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: "var(--color-text-secondary)",
      marginBottom: "18px",
    },
    closeBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--color-text-secondary)",
      padding: "4px",
      borderRadius: radius.sm,
      display: "flex",
      alignItems: "center",
    },
    searchWrap: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: "var(--color-bg)",
      border: "1px solid var(--color-border)",
      borderRadius: radius.md,
      padding: "10px 14px",
      marginBottom: "18px",
    },
    searchInput: {
      background: "none",
      border: "none",
      outline: "none",
      color: "var(--color-text-primary)",
      fontSize: fontSize.sm,
      flex: 1,
    },
    coinRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: "1px solid var(--color-border)",
    },
    coinName: {
      fontSize: fontSize.sm,
      fontWeight: 500,
      color: "var(--color-text-primary)",
    },
    addBtn: {
      background: "var(--color-accent)",
      color: "#fff",
      border: "none",
      borderRadius: radius.md,
      padding: "6px 16px",
      fontSize: fontSize.sm,
      fontWeight: 500,
      cursor: "pointer",
      transition: "opacity 0.15s",
    },
    addedBtn: {
      background: "var(--color-success-bg, rgba(34,197,94,0.15))",
      color: "#22c55e",
      border: "1px solid rgba(34,197,94,0.3)",
      borderRadius: radius.md,
      padding: "6px 16px",
      fontSize: fontSize.sm,
      fontWeight: 500,
      cursor: "default",
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:none; } }`}</style>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Add to Watchlist</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p style={styles.subtitle}>Search and add assets to your personal tracking list.</p>
        <div style={styles.searchWrap}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            style={styles.searchInput}
            placeholder="Enter coin name or ticker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          {filtered.length === 0 && (
            <p style={{ color: "var(--color-text-secondary)", fontSize: fontSize.sm, textAlign: "center", padding: "20px 0" }}>
              No results found
            </p>
          )}
          {filtered.map((coin) => (
            <div key={coin.ticker} style={styles.coinRow}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CoinLogo ticker={coin.ticker} size={32} />
                <span style={styles.coinName}>{coin.name} ({coin.ticker})</span>
              </div>
              {added.includes(coin.ticker) ? (
                <span style={styles.addedBtn}>Added ✓</span>
              ) : (
                <button style={styles.addBtn} onClick={() => handleAdd(coin)}>Add</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Confirm Remove Modal
function RemoveModal({ coin, onConfirm, onCancel }) {
  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(3px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    modal: {
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: radius.xl,
      padding: "28px",
      width: "360px",
      textAlign: "center",
      boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      animation: "modalIn 0.15s ease",
    },
    icon: {
      width: 44, height: 44,
      background: "rgba(239,68,68,0.12)",
      borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 14px",
    },
    title: { fontSize: fontSize.md, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 },
    sub: { fontSize: fontSize.sm, color: "var(--color-text-secondary)", marginBottom: 24 },
    actions: { display: "flex", gap: 10 },
    cancelBtn: {
      flex: 1, padding: "10px", background: "var(--color-bg)",
      border: "1px solid var(--color-border)", borderRadius: radius.md,
      color: "var(--color-text-primary)", fontSize: fontSize.sm, fontWeight: 500, cursor: "pointer",
    },
    confirmBtn: {
      flex: 1, padding: "10px", background: "#ef4444",
      border: "none", borderRadius: radius.md,
      color: "#fff", fontSize: fontSize.sm, fontWeight: 500, cursor: "pointer",
    },
  };
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.icon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </div>
        <p style={styles.title}>Remove {coin.name}?</p>
        <p style={styles.sub}>This will remove <strong>{coin.ticker}</strong> from your watchlist. You can add it back anytime.</p>
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={styles.confirmBtn} onClick={onConfirm}>Remove</button>
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
  const gainers = watchlist.filter((c) => c.change24h > 0).length;
  const losers = watchlist.filter((c) => c.change24h < 0).length;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = watchlist
    .filter((c) => {
      const matchText =
        filterText === "" ||
        c.name.toLowerCase().includes(filterText.toLowerCase()) ||
        c.ticker.toLowerCase().includes(filterText.toLowerCase());
      const matchTab =
        activeTab === "All" ||
        (activeTab === "Gainers" && c.change24h > 0) ||
        (activeTab === "Losers" && c.change24h < 0);
      return matchText && matchTab;
    })
    .sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (typeof va === "string") va = va.toLowerCase(), (vb = vb.toLowerCase());
      return sortDir === "asc" ? (va < vb ? -1 : 1) : va > vb ? -1 : 1;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAddCoin = (coin) => {
    const newCoin = {
      id: coin.ticker.toLowerCase(),
      name: coin.name,
      ticker: coin.ticker,
      price: Math.random() * 500 + 0.5,
      change24h: (Math.random() - 0.5) * 10,
      marketCap: Math.random() * 50e9,
      volume24h: Math.random() * 2e9,
      sparkline: Array.from({ length: 7 }, () => Math.random() * 100),
      starred: false,
    };
    setWatchlist((prev) => [...prev, newCoin]);
  };

  const handleRemove = (coin) => setRemoveTarget(coin);
  const confirmRemove = () => {
    setWatchlist((prev) => prev.filter((c) => c.ticker !== removeTarget.ticker));
    setRemoveTarget(null);
  };

  const toggleStar = (ticker) => {
    setWatchlist((prev) =>
      prev.map((c) => (c.ticker === ticker ? { ...c, starred: !c.starred } : c))
    );
  };

  const s = {
    page: {
      padding: "28px 32px",
      minHeight: "100%",
      background: "var(--color-bg)",
      color: "var(--color-text-primary)",
    },
    breadcrumb: {
      display: "flex", alignItems: "center", gap: 6,
      fontSize: fontSize.xs, color: "var(--color-text-secondary)",
      marginBottom: 6,
    },
    breadcrumbActive: { color: "var(--color-accent)", fontWeight: 500 },
    liveDot: {
      width: 6, height: 6, borderRadius: "50%",
      background: "#22c55e",
      display: "inline-block",
      marginRight: 4,
      animation: "pulse 2s infinite",
    },
    heading: { fontSize: "1.75rem", fontWeight: 700, marginBottom: 4, color: "var(--color-text-primary)" },
    subheading: { fontSize: fontSize.sm, color: "var(--color-text-secondary)", marginBottom: 24 },

    statsRow: {
      display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap",
    },
    statCard: {
      flex: "1 1 140px",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: radius.lg,
      padding: "16px 20px",
    },
    statLabel: { fontSize: fontSize.xs, color: "var(--color-text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" },
    statValue: { fontSize: fontSize.xl, fontWeight: 700, color: "var(--color-text-primary)" },

    toolbar: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, marginBottom: 16, flexWrap: "wrap",
    },
    filterWrap: {
      display: "flex", alignItems: "center", gap: 8,
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: radius.md,
      padding: "9px 14px",
      minWidth: 220,
    },
    filterInput: {
      background: "none", border: "none", outline: "none",
      color: "var(--color-text-primary)", fontSize: fontSize.sm, flex: 1,
    },
    addBtn: {
      display: "flex", alignItems: "center", gap: 6,
      background: "var(--color-accent)",
      color: "#fff",
      border: "none",
      borderRadius: radius.md,
      padding: "9px 18px",
      fontSize: fontSize.sm,
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "opacity 0.15s",
    },

    table: { width: "100%", borderCollapse: "collapse" },
    thead: { borderBottom: "1px solid var(--color-border)" },
    th: {
      padding: "10px 14px",
      textAlign: "left",
      fontSize: fontSize.xs,
      color: "var(--color-text-secondary)",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      cursor: "pointer",
      userSelect: "none",
      whiteSpace: "nowrap",
    },
    thRight: { textAlign: "right" },
    tr: {
      borderBottom: "1px solid var(--color-border)",
      transition: "background 0.12s",
    },
    td: {
      padding: "13px 14px",
      fontSize: fontSize.sm,
      color: "var(--color-text-primary)",
      verticalAlign: "middle",
    },
    tdRight: { textAlign: "right" },
    coinCell: { display: "flex", alignItems: "center", gap: 10 },
    coinName: { fontWeight: 600, fontSize: fontSize.sm, color: "var(--color-text-primary)" },
    coinTicker: { fontSize: fontSize.xs, color: "var(--color-text-secondary)", marginTop: 1 },

    actionBtn: {
      background: "none", border: "none", cursor: "pointer",
      color: "var(--color-text-secondary)", padding: "5px",
      borderRadius: radius.sm, display: "inline-flex", alignItems: "center",
      transition: "color 0.15s, background 0.15s",
    },

    emptyState: {
      textAlign: "center", padding: "60px 20px",
      color: "var(--color-text-secondary)",
    },
    pagination: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginTop: 16, gap: 12,
    },
    pageInfo: { fontSize: fontSize.sm, color: "var(--color-text-secondary)" },
    pageBtn: {
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: radius.md,
      padding: "7px 14px",
      fontSize: fontSize.sm,
      color: "var(--color-text-primary)",
      cursor: "pointer",
    },
    pageBtnDisabled: { opacity: 0.4, cursor: "default" },
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .wl-row:hover { background: var(--color-surface) !important; }
        .wl-action:hover { color: var(--color-text-primary) !important; background: var(--color-bg) !important; }
        .wl-addBtn:hover { opacity: 0.88; }
        .wl-sortable:hover { color: var(--color-text-primary) !important; }
        .wl-star-active { color: #f59e0b !important; }
        .wl-pageBtn:hover:not(:disabled) { background: var(--color-accent) !important; color: #fff !important; border-color: var(--color-accent) !important; }
      `}</style>

      {/* Breadcrumb */}
      <div style={s.breadcrumb}>
        <span>Active Tracking</span>
        <span>›</span>
        <span style={s.breadcrumbActive}>
          <span style={s.liveDot} />
          V3.4 LIVE
        </span>
      </div>

      <h1 style={s.heading}>My Watchlist</h1>
      <p style={s.subheading}>Monitor your selected assets with real-time price feeds and trend analysis.</p>

      {/* Stats Row */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Tracked Assets</div>
          <div style={s.statValue}>{watchlist.length}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total Value (est.)</div>
          <div style={{ ...s.statValue, fontSize: fontSize.lg }}>{formatMarketCap(totalValue * 1e6)}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Top Gainer (24h)</div>
          <div style={{ ...s.statValue, color: "#22c55e", fontSize: fontSize.lg }}>
            {watchlist.reduce((best, c) => (c.change24h > (best?.change24h ?? -Infinity) ? c : best), null)?.name ?? "—"}
          </div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Gainers / Losers</div>
          <div style={{ ...s.statValue, fontSize: fontSize.lg }}>
            <span style={{ color: "#22c55e" }}>{gainers}</span>
            {" / "}
            <span style={{ color: "#ef4444" }}>{losers}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <TabBar tabs={tabs} active={activeTab} onChange={(t) => { setActiveTab(t); setCurrentPage(1); }} size="sm" />
          <div style={s.filterWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              style={s.filterInput}
              placeholder="Filter your list..."
              value={filterText}
              onChange={(e) => { setFilterText(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
        <button
          className="wl-addBtn"
          style={s.addBtn}
          onClick={() => setShowAddModal(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Asset
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: radius.lg, overflow: "hidden" }}>
        <table style={s.table}>
          <thead style={s.thead}>
            <tr>
              <th style={{ ...s.th, width: 32 }}></th>
              <th className="wl-sortable" style={s.th} onClick={() => handleSort("name")}>
                Asset <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="wl-sortable" style={{ ...s.th, ...s.thRight }} onClick={() => handleSort("price")}>
                Price <SortIcon col="price" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="wl-sortable" style={{ ...s.th, ...s.thRight }} onClick={() => handleSort("change24h")}>
                24h % <SortIcon col="change24h" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th className="wl-sortable" style={{ ...s.th, ...s.thRight }} onClick={() => handleSort("marketCap")}>
                Market Cap <SortIcon col="marketCap" sortKey={sortKey} sortDir={sortDir} />
              </th>
              <th style={{ ...s.th, ...s.thRight }}>Last 24h</th>
              <th style={{ ...s.th, ...s.thRight }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} style={s.emptyState}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📋</div>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--color-text-primary)" }}>
                    {filterText ? "No matching assets" : "Your watchlist is empty"}
                  </div>
                  <div style={{ fontSize: fontSize.sm }}>
                    {filterText ? "Try a different search term" : "Click 'Add Asset' to start tracking cryptocurrencies"}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((coin) => (
                <tr
                  key={coin.ticker}
                  className="wl-row"
                  style={s.tr}
                >
                  {/* Star */}
                  <td style={{ ...s.td, paddingRight: 0 }}>
                    <button
                      className={`wl-action${coin.starred ? " wl-star-active" : ""}`}
                      style={{ ...s.actionBtn, color: coin.starred ? "#f59e0b" : undefined }}
                      onClick={() => toggleStar(coin.ticker)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24"
                        fill={coin.starred ? "#f59e0b" : "none"}
                        stroke={coin.starred ? "#f59e0b" : "currentColor"}
                        strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  </td>
                  {/* Coin */}
                  <td style={s.td}>
                    <div style={s.coinCell}>
                      <CoinLogo ticker={coin.ticker} size={34} />
                      <div>
                        <div style={s.coinName}>{coin.name}</div>
                        <div style={s.coinTicker}>{coin.ticker}</div>
                      </div>
                    </div>
                  </td>
                  {/* Price */}
                  <td style={{ ...s.td, ...s.tdRight, fontWeight: 600 }}>
                    {formatPrice(coin.price)}
                  </td>
                  {/* 24h */}
                  <td style={{ ...s.td, ...s.tdRight }}>
                    <Badge variant={coin.change24h >= 0 ? "green" : "red"}>
                      {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                    </Badge>
                  </td>
                  {/* Market Cap */}
                  <td style={{ ...s.td, ...s.tdRight, color: "var(--color-text-secondary)" }}>
                    {formatMarketCap(coin.marketCap)}
                  </td>
                  {/* Sparkline */}
                  <td style={{ ...s.td, ...s.tdRight }}>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Sparkline data={coin.sparkline} positive={coin.change24h >= 0} />
                    </div>
                  </td>
                  {/* Actions */}
                  <td style={{ ...s.td, ...s.tdRight }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                      <button className="wl-action" style={s.actionBtn} title="View details">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="wl-action" style={s.actionBtn} title="Set alert">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </button>
                      <button
                        className="wl-action"
                        style={{ ...s.actionBtn }}
                        title="Remove from watchlist"
                        onClick={() => handleRemove(coin)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6" /><path d="M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={s.pagination}>
        <span style={s.pageInfo}>
          Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} tracked asset{filtered.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="wl-pageBtn"
            style={{ ...s.pageBtn, ...(currentPage === 1 ? s.pageBtnDisabled : {}) }}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              className="wl-pageBtn"
              style={{
                ...s.pageBtn,
                ...(pg === currentPage
                  ? { background: "var(--color-accent)", color: "#fff", borderColor: "var(--color-accent)" }
                  : {}),
              }}
              onClick={() => setCurrentPage(pg)}
            >
              {pg}
            </button>
          ))}
          <button
            className="wl-pageBtn"
            style={{ ...s.pageBtn, ...(currentPage === totalPages ? s.pageBtnDisabled : {}) }}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCoin}
          existing={watchlist.map((c) => c.ticker)}
        />
      )}
      {removeTarget && (
        <RemoveModal
          coin={removeTarget}
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}
