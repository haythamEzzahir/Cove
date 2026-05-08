import { useCallback, useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
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

const PORTFOLIO_EXPORT_COLUMNS = [
  'Coin',
  'Symbol',
  'Quantity',
  'Average Buy Price',
  'Current Price',
  'Total Value',
  'Invested Amount',
  'Profit/Loss',
  'Profit/Loss %',
];

function escapeCsvValue(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function formatCsvNumber(value) {
  const number = toNumber(value);
  return number.toLocaleString('en-US', {
    maximumFractionDigits: 12,
    useGrouping: false,
  });
}

function formatReportCurrency(value) {
  return `$${toNumber(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatReportPercent(value) {
  const number = toNumber(value);
  return `${number >= 0 ? '+' : ''}${number.toFixed(2)}%`;
}

function buildHoldingExportRows(holdings) {
  return holdings.map((holding) => {
    const quantity = toNumber(holding.amount);
    const averageBuyPrice = toNumber(holding.avgBuy);
    const currentPrice = toNumber(holding.currentPrice);
    const totalValue = quantity * currentPrice;
    const investedAmount = quantity * averageBuyPrice;
    const profitLoss = totalValue - investedAmount;
    const profitLossPercent = investedAmount > 0
      ? (profitLoss / investedAmount) * 100
      : 0;

    return {
      coin: holding.name,
      symbol: holding.ticker,
      quantity,
      averageBuyPrice,
      currentPrice,
      totalValue,
      investedAmount,
      profitLoss,
      profitLossPercent,
    };
  });
}

function buildPortfolioCsv(holdings) {
  const rows = buildHoldingExportRows(holdings).map((holding) => [
    holding.coin,
    holding.symbol,
    formatCsvNumber(holding.quantity),
    holding.averageBuyPrice.toFixed(2),
    holding.currentPrice.toFixed(2),
    holding.totalValue.toFixed(2),
    holding.investedAmount.toFixed(2),
    holding.profitLoss.toFixed(2),
    holding.profitLossPercent.toFixed(2),
  ]);

  return [PORTFOLIO_EXPORT_COLUMNS, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');
}

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function addPdfFooter(doc, pageNumber) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(226, 232, 240);
  doc.line(40, pageHeight - 34, pageWidth - 40, pageHeight - 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('FinTracker Portfolio Report', 40, pageHeight - 18);
  doc.text(`Page ${pageNumber}`, pageWidth - 40, pageHeight - 18, { align: 'right' });
}

function createPortfolioReportPdf({ portfolioData, holdings, user }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const exportDate = new Date();
  const exportDateLabel = exportDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  let pageNumber = 1;
  let cursorY = 44;

  const addPage = () => {
    addPdfFooter(doc, pageNumber);
    doc.addPage();
    pageNumber += 1;
    cursorY = 44;
  };

  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 86, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('FinTracker', margin, 38);
  doc.setFontSize(14);
  doc.text('Portfolio Report', margin, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Export date: ${exportDateLabel}`, pageWidth - margin, 38, { align: 'right' });
  doc.text(`User: ${user?.name || user?.email || 'Connected user'}`, pageWidth - margin, 58, { align: 'right' });

  cursorY = 112;

  const summaryCards = [
    ['Total Balance', formatReportCurrency(portfolioData.totalBalance)],
    ['24H Profit/Loss', `${portfolioData.profitLoss24h >= 0 ? '+' : '-'}${formatReportCurrency(Math.abs(portfolioData.profitLoss24h))} (${formatReportPercent(portfolioData.profitLoss24hPercent)})`],
    ['All-Time Profit', `${portfolioData.allTimeProfit >= 0 ? '+' : '-'}${formatReportCurrency(Math.abs(portfolioData.allTimeProfit))} (${formatReportPercent(portfolioData.allTimeProfitPercent)})`],
  ];
  const cardWidth = (pageWidth - (margin * 2) - 24) / 3;

  summaryCards.forEach(([label, value], index) => {
    const x = margin + (index * (cardWidth + 12));

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cursorY, cardWidth, 62, 6, 6, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + 14, cursorY + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(value, x + 14, cursorY + 44);
  });

  cursorY += 92;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Asset Allocation', margin, cursorY);
  cursorY += 18;

  if (portfolioData.assetAllocation.length > 0) {
    portfolioData.assetAllocation.forEach((allocation) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`${allocation.name} (${allocation.ticker || 'N/A'})`, margin, cursorY);
      doc.text(
        `${formatReportCurrency(allocation.amount)} - ${toNumber(allocation.value).toFixed(2)}%`,
        pageWidth - margin,
        cursorY,
        { align: 'right' }
      );
      cursorY += 14;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No allocation data available.', margin, cursorY);
    cursorY += 14;
  }

  cursorY += 18;

  const columns = [
    { label: 'Coin', key: 'coin', width: 112 },
    { label: 'Symbol', key: 'symbol', width: 54 },
    { label: 'Quantity', key: 'quantity', width: 76 },
    { label: 'Avg Buy', key: 'averageBuyPrice', width: 82 },
    { label: 'Current', key: 'currentPrice', width: 82 },
    { label: 'Total Value', key: 'totalValue', width: 94 },
    { label: 'P/L', key: 'profitLoss', width: 84 },
    { label: 'P/L %', key: 'profitLossPercent', width: 58 },
  ];
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const tableX = margin;
  const tableHeaderHeight = 24;
  const rows = buildHoldingExportRows(holdings);

  const drawTableHeader = () => {
    if (cursorY + tableHeaderHeight > pageHeight - 54) addPage();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Holdings', margin, cursorY);
    cursorY += 14;

    doc.setFillColor(30, 41, 59);
    doc.rect(tableX, cursorY, tableWidth, tableHeaderHeight, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    let x = tableX;
    columns.forEach((column) => {
      doc.text(column.label, x + 6, cursorY + 16);
      x += column.width;
    });

    cursorY += tableHeaderHeight;
  };

  drawTableHeader();

  rows.forEach((row, index) => {
    const coinLines = doc.splitTextToSize(row.coin || 'Asset', columns[0].width - 12);
    const rowHeight = Math.max(26, (coinLines.length * 10) + 12);

    if (cursorY + rowHeight > pageHeight - 54) {
      addPage();
      drawTableHeader();
    }

    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    doc.rect(tableX, cursorY, tableWidth, rowHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(tableX, cursorY + rowHeight, tableX + tableWidth, cursorY + rowHeight);

    let x = tableX;
    const y = cursorY + 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(coinLines, x + 6, y);
    x += columns[0].width;
    doc.text(row.symbol || '', x + 6, y);
    x += columns[1].width;
    doc.text(formatCsvNumber(row.quantity), x + columns[2].width - 6, y, { align: 'right' });
    x += columns[2].width;
    doc.text(formatReportCurrency(row.averageBuyPrice), x + columns[3].width - 6, y, { align: 'right' });
    x += columns[3].width;
    doc.text(formatReportCurrency(row.currentPrice), x + columns[4].width - 6, y, { align: 'right' });
    x += columns[4].width;
    doc.text(formatReportCurrency(row.totalValue), x + columns[5].width - 6, y, { align: 'right' });
    x += columns[5].width;
    doc.setTextColor(row.profitLoss >= 0 ? 22 : 220, row.profitLoss >= 0 ? 163 : 38, row.profitLoss >= 0 ? 74 : 38);
    doc.text(`${row.profitLoss >= 0 ? '+' : '-'}${formatReportCurrency(Math.abs(row.profitLoss))}`, x + columns[6].width - 6, y, { align: 'right' });
    x += columns[6].width;
    doc.text(formatReportPercent(row.profitLossPercent), x + columns[7].width - 6, y, { align: 'right' });

    cursorY += rowHeight;
  });

  addPdfFooter(doc, pageNumber);

  const filenameDate = exportDate.toISOString().slice(0, 10);
  doc.save(`portfolio-report-${filenameDate}.pdf`);
}

function DonutLabel({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-8" className="text-[10px]" fill="rgb(var(--text-secondary))">Total</tspan>
      <tspan x={cx} dy="18" className="text-xs font-bold" fill="rgb(var(--text-primary))">{fmt(total)}</tspan>
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
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [portfolioData, setPortfolioData] = useState(EMPTY_PORTFOLIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPortfolioData = useCallback(async () => {
    if (!user) {
      setPortfolioData(EMPTY_PORTFOLIO);
      setError('Please login to view your portfolio');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/portfolio/me`, {
        credentials: 'include',
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
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  const handleAddAsset = async (asset) => {
    if (!user) {
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
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
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

  const canExportPortfolio = useCallback(() => {
    if (!user) {
      setError('Please login to export your portfolio');
      return false;
    }

    if (loading) {
      setError('Portfolio is still loading');
      return false;
    }

    if (holdingsList.length === 0) {
      setError(error || 'No portfolio data to export');
      return false;
    }

    return true;
  }, [error, holdingsList.length, loading, user]);

  const handleExportCsv = useCallback(() => {
    if (!canExportPortfolio()) {
      setShowExportMenu(false);
      return;
    }

    const exportDate = new Date().toISOString().slice(0, 10);
    const csv = buildPortfolioCsv(holdingsList);

    downloadCsv(`portfolio-export-${exportDate}.csv`, csv);
    setShowExportMenu(false);
    setError('');
  }, [canExportPortfolio, holdingsList]);

  const handleExportPdf = useCallback(() => {
    if (!canExportPortfolio()) {
      setShowExportMenu(false);
      return;
    }

    createPortfolioReportPdf({
      portfolioData,
      holdings: holdingsList,
      user,
    });
    setShowExportMenu(false);
    setError('');
  }, [canExportPortfolio, holdingsList, portfolioData, user]);

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
        <div className="relative">
          <button className="flex items-center gap-1.5 bg-transparent border border-default rounded-lg px-3 py-2 text-sm text-primary cursor-pointer font-medium hover:bg-overlay" onClick={() => setShowExportMenu((current) => !current)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          {showExportMenu && (
            <div className="absolute left-0 top-full mt-2 z-20 min-w-[140px] bg-surface border border-default rounded-lg shadow-lg overflow-hidden">
              <button type="button" className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-overlay" onClick={handleExportPdf}>
                Export PDF
              </button>
              <button type="button" className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-overlay" onClick={handleExportCsv}>
                Export CSV
              </button>
            </div>
          )}
        </div>
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
