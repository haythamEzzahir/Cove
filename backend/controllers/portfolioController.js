import mongoose from "mongoose";
import Portfolio from "../models/portfolio.js";

const ALLOCATION_COLORS = [
  "#F7931A",
  "#627EEA",
  "#9945FF",
  "#2A5ADA",
  "#6B7280",
  "#22C55E",
  "#F59E0B"
];

const roundCurrency = (value) => Math.round((Number(value) || 0) * 100) / 100;
const roundPercent = (value) => Math.round((Number(value) || 0) * 100) / 100;

const toNumber = (value, fallback = 0) => {
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getUserObjectId = (req) => {
  const userId = req.user?._id || req.user?.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(userId);
};

const getHoldingKey = (holding) => {
  const coinId = String(holding.coinId || "").trim().toLowerCase();
  const symbol = String(holding.symbol || "").trim().toLowerCase();

  if (coinId) return `coin:${coinId}`;
  if (symbol) return `symbol:${symbol}`;

  return "";
};

const normalizeStoredHolding = (holding) => {
  const averageBuyFallback = toNumber(holding.currentPrice);
  const averageBuyPrice = Math.max(
    0,
    toNumber(holding.averageBuyPrice, averageBuyFallback)
  );
  const currentPrice = Math.max(
    0,
    toNumber(holding.currentPrice, averageBuyPrice)
  );

  return {
    coinId: String(holding.coinId || "").trim().toLowerCase(),
    symbol: String(holding.symbol || "").trim().toUpperCase(),
    name: String(holding.name || holding.coinId || "").trim(),
    quantity: Math.max(0, toNumber(holding.quantity)),
    averageBuyPrice,
    currentPrice,
    priceChange24h: holding.priceChange24h === null || holding.priceChange24h === undefined
      ? null
      : toNumber(holding.priceChange24h, null),
    priceChangePercentage24h: holding.priceChangePercentage24h === null || holding.priceChangePercentage24h === undefined
      ? null
      : toNumber(holding.priceChangePercentage24h, null),
    image: holding.image || ""
  };
};

const mergeDuplicateHoldings = (holdings = []) => {
  const mergedHoldings = new Map();
  const holdingAliases = new Map();

  holdings.forEach((rawHolding) => {
    const holding = normalizeStoredHolding(rawHolding);
    const coinKey = holding.coinId ? `coin:${holding.coinId}` : "";
    const symbolKey = holding.symbol ? `symbol:${holding.symbol.toLowerCase()}` : "";
    const key = coinKey || symbolKey;

    if (!key || holding.quantity <= 0) return;

    const existingKey = holdingAliases.get(coinKey)
      || holdingAliases.get(symbolKey)
      || key;
    const existingHolding = mergedHoldings.get(existingKey);

    if (!existingHolding) {
      mergedHoldings.set(existingKey, holding);
      if (coinKey) holdingAliases.set(coinKey, existingKey);
      if (symbolKey) holdingAliases.set(symbolKey, existingKey);
      return;
    }

    const oldQuantity = toNumber(existingHolding.quantity);
    const newQuantity = toNumber(holding.quantity);
    const totalQuantity = oldQuantity + newQuantity;
    const oldAverageBuyPrice = toNumber(
      existingHolding.averageBuyPrice,
      existingHolding.currentPrice
    );
    const newAverageBuyPrice = toNumber(
      holding.averageBuyPrice,
      holding.currentPrice
    );

    existingHolding.quantity = totalQuantity;
    existingHolding.averageBuyPrice = totalQuantity > 0
      ? ((oldQuantity * oldAverageBuyPrice) + (newQuantity * newAverageBuyPrice)) / totalQuantity
      : 0;
    existingHolding.currentPrice = holding.currentPrice > 0
      ? holding.currentPrice
      : existingHolding.currentPrice;
    existingHolding.coinId = existingHolding.coinId || holding.coinId;
    existingHolding.symbol = existingHolding.symbol || holding.symbol;
    existingHolding.name = holding.name || existingHolding.name;
    existingHolding.image = holding.image || existingHolding.image;
    existingHolding.priceChange24h = holding.priceChange24h !== null
      ? holding.priceChange24h
      : existingHolding.priceChange24h;
    existingHolding.priceChangePercentage24h = holding.priceChangePercentage24h !== null
      ? holding.priceChangePercentage24h
      : existingHolding.priceChangePercentage24h;

    if (coinKey) holdingAliases.set(coinKey, existingKey);
    if (symbolKey) holdingAliases.set(symbolKey, existingKey);
  });

  return [...mergedHoldings.values()];
};

const holdingsAreEqual = (leftHoldings = [], rightHoldings = []) => {
  if (leftHoldings.length !== rightHoldings.length) return false;

  return leftHoldings.every((leftHolding, index) => {
    const rightHolding = rightHoldings[index];

    return [
      "coinId",
      "symbol",
      "name",
      "quantity",
      "averageBuyPrice",
      "currentPrice",
      "priceChange24h",
      "priceChangePercentage24h",
      "image"
    ].every((field) => leftHolding[field] === rightHolding[field]);
  });
};

const dedupePortfolioHoldings = async (portfolio) => {
  if (!portfolio) return null;

  const currentHoldings = (portfolio.holdings || [])
    .map(normalizeStoredHolding)
    .filter((holding) => getHoldingKey(holding) && holding.quantity > 0);
  const mergedHoldings = mergeDuplicateHoldings(currentHoldings);

  if (!holdingsAreEqual(currentHoldings, mergedHoldings)) {
    portfolio.holdings = mergedHoldings;
    await portfolio.save();
  }

  return portfolio;
};

const findOrCreateUserPortfolio = async (userId) => {
  const existingPortfolio = await Portfolio.findOne({ userId });

  if (existingPortfolio) return existingPortfolio;

  try {
    return await Portfolio.create({
      userId,
      holdings: [],
      chartData: []
    });
  } catch (error) {
    if (error?.code === 11000) {
      const portfolio = await Portfolio.findOne({ userId });
      if (portfolio) return portfolio;
    }

    throw error;
  }
};

const getEmptyPortfolioResponse = () => ({
  totalBalance: 0,
  investedAmount: 0,
  profitLoss24h: 0,
  profitLoss24hPercent: 0,
  allTimeProfit: 0,
  allTimeProfitPercent: 0,
  assetAllocation: [],
  chartData: [],
  holdings: []
});

const fetchMarketPrices = async (holdings) => {
  const coinIds = [...new Set(
    holdings
      .map((holding) => String(holding.coinId || "").trim().toLowerCase())
      .filter(Boolean)
  )];

  if (coinIds.length === 0) return new Map();

  try {
    const headers = process.env.CG_API_KEY
      ? { "x-cg-demo-api-key": process.env.CG_API_KEY }
      : {};
    const ids = encodeURIComponent(coinIds.join(","));
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=${coinIds.length}&page=1&sparkline=false&price_change_percentage=24h`,
      { method: "GET", headers }
    );

    if (!response.ok) return new Map();

    const coins = await response.json();

    return new Map(
      coins.map((coin) => [
        String(coin.id || "").toLowerCase(),
        coin
      ])
    );
  } catch {
    return new Map();
  }
};

const normalizeHolding = (holding, marketCoin) => {
  const quantity = Math.max(0, toNumber(holding.quantity));
  const averageBuyPrice = Math.max(0, toNumber(holding.averageBuyPrice));
  const currentPrice = Math.max(
    0,
    toNumber(marketCoin?.current_price, toNumber(holding.currentPrice, averageBuyPrice))
  );
  const priceChangePercentage24h = toNumber(
    marketCoin?.price_change_percentage_24h,
    toNumber(holding.priceChangePercentage24h, null)
  );
  const priceChange24h = holding.priceChange24h === null || holding.priceChange24h === undefined
    ? null
    : toNumber(holding.priceChange24h, null);
  const currentValue = quantity * currentPrice;
  const investedValue = quantity * averageBuyPrice;
  const unrealizedPnl = currentValue - investedValue;
  const pnlPct = investedValue > 0 ? (unrealizedPnl / investedValue) * 100 : 0;
  const hasPercentageChange = Number.isFinite(priceChangePercentage24h)
    && priceChangePercentage24h > -100;
  const previousPrice = hasPercentageChange
    ? currentPrice / (1 + (priceChangePercentage24h / 100))
    : null;
  const calculatedDayPnl = previousPrice !== null
    ? quantity * (currentPrice - previousPrice)
    : null;
  const dayPnl = calculatedDayPnl !== null
    ? calculatedDayPnl
    : priceChange24h !== null
      ? quantity * priceChange24h
      : 0;

  return {
    coinId: String(holding.coinId || marketCoin?.id || "").trim().toLowerCase(),
    symbol: String(marketCoin?.symbol || holding.symbol || "").trim().toUpperCase(),
    name: String(marketCoin?.name || holding.name || holding.coinId || "").trim(),
    quantity,
    averageBuyPrice: roundCurrency(averageBuyPrice),
    currentPrice: roundCurrency(currentPrice),
    image: marketCoin?.image || holding.image || "",
    priceChangePercentage24h: roundPercent(priceChangePercentage24h || 0),
    currentValue: roundCurrency(currentValue),
    investedValue: roundCurrency(investedValue),
    unrealizedPnl: roundCurrency(unrealizedPnl),
    pnlPct: roundPercent(pnlPct),
    dayPnl: roundCurrency(dayPnl)
  };
};

const buildAssetAllocation = (holdings, totalBalance) => {
  if (totalBalance <= 0) return [];

  const allocations = holdings
    .filter((holding) => holding.currentValue > 0)
    .map((holding) => ({
      name: holding.name,
      symbol: holding.symbol,
      value: holding.currentValue,
      percentage: roundPercent((holding.currentValue / totalBalance) * 100)
    }))
    .sort((a, b) => b.value - a.value);

  const topAllocations = allocations.slice(0, 4).map((allocation, index) => ({
    ...allocation,
    color: ALLOCATION_COLORS[index]
  }));
  const otherAllocations = allocations.slice(4);

  if (otherAllocations.length > 0) {
    const otherValue = otherAllocations.reduce((sum, allocation) => sum + allocation.value, 0);

    topAllocations.push({
      name: "Others",
      symbol: "OTH",
      value: roundCurrency(otherValue),
      percentage: roundPercent((otherValue / totalBalance) * 100),
      color: ALLOCATION_COLORS[4]
    });
  }

  return topAllocations;
};

const buildChartData = (portfolio, totalBalance) => {
  const storedPoints = (portfolio.chartData || [])
    .map((point) => ({
      label: String(point.label || "").trim(),
      value: roundCurrency(point.value)
    }))
    .filter((point) => point.label && point.value >= 0);

  if (storedPoints.length > 0) {
    return storedPoints;
  }

  return totalBalance > 0
    ? [{ label: "Now", value: roundCurrency(totalBalance) }]
    : [];
};

const buildPortfolioResponse = async (portfolio) => {
  if (!portfolio) return getEmptyPortfolioResponse();

  const rawHoldings = mergeDuplicateHoldings(portfolio.holdings || []);
  const marketPrices = await fetchMarketPrices(rawHoldings);
  const holdings = rawHoldings
    .map((holding) => normalizeHolding(holding, marketPrices.get(String(holding.coinId || "").toLowerCase())))
    .filter((holding) => holding.coinId && holding.quantity > 0);

  const totalBalance = roundCurrency(
    holdings.reduce((sum, holding) => sum + holding.currentValue, 0)
  );
  const investedAmount = roundCurrency(
    holdings.reduce((sum, holding) => sum + holding.investedValue, 0)
  );
  const profitLoss24h = roundCurrency(
    holdings.reduce((sum, holding) => sum + holding.dayPnl, 0)
  );
  const previousDayBalance = totalBalance - profitLoss24h;
  const profitLoss24hPercent = previousDayBalance > 0
    ? roundPercent((profitLoss24h / previousDayBalance) * 100)
    : 0;
  const allTimeProfit = roundCurrency(totalBalance - investedAmount);
  const allTimeProfitPercent = investedAmount > 0
    ? roundPercent((allTimeProfit / investedAmount) * 100)
    : 0;

  return {
    totalBalance,
    investedAmount,
    profitLoss24h,
    profitLoss24hPercent,
    allTimeProfit,
    allTimeProfitPercent,
    assetAllocation: buildAssetAllocation(holdings, totalBalance),
    chartData: buildChartData(portfolio, totalBalance),
    holdings: holdings.map((holding, index) => ({
      rank: index + 1,
      ...holding
    }))
  };
};

const getMyPortfolio = async (req, res) => {
  try {
    const userId = req.user._id;
    const portfolio = await findOrCreateUserPortfolio(userId);
    await dedupePortfolioHoldings(portfolio);

    const responseData = await buildPortfolioResponse(portfolio);

    return res.json(responseData);
  } catch (error) {
    console.error("Get portfolio error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const addPortfolioAsset = async (req, res) => {
  try {
    const userId = req.user._id;

    const coinId = String(req.body.coinId || req.body.id || "").trim().toLowerCase();
    const name = String(req.body.name || "").trim();
    const symbol = String(req.body.symbol || req.body.ticker || "").trim().toUpperCase();
    const quantity = toNumber(req.body.quantity ?? req.body.amount);
    const currentPrice = toNumber(req.body.currentPrice ?? req.body.price);
    const averageBuyPrice = toNumber(req.body.averageBuyPrice ?? req.body.avgBuy, currentPrice);

    if (!coinId) {
      return res.status(400).json({ message: "coinId is required" });
    }

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    if (!symbol) {
      return res.status(400).json({ message: "symbol is required" });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "quantity must be greater than 0" });
    }

    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      return res.status(400).json({ message: "currentPrice must be greater than 0" });
    }

    if (!Number.isFinite(averageBuyPrice) || averageBuyPrice <= 0) {
      return res.status(400).json({ message: "averageBuyPrice must be greater than 0" });
    }

    const portfolio = await findOrCreateUserPortfolio(userId);
    const newHolding = {
      coinId,
      symbol,
      name,
      quantity,
      averageBuyPrice,
      currentPrice,
      image: req.body.image || ""
    };

    portfolio.holdings = mergeDuplicateHoldings(portfolio.holdings || []);

    const existingHolding = portfolio.holdings.find((holding) => (
      holding.coinId === coinId
      || String(holding.symbol || "").toLowerCase() === symbol.toLowerCase()
    ));

    if (existingHolding) {
      const oldQuantity = toNumber(existingHolding.quantity);
      const oldAverageBuyPrice = toNumber(existingHolding.averageBuyPrice, currentPrice);
      const mergedQuantity = oldQuantity + quantity;
      const mergedInvested = (
        (oldQuantity * oldAverageBuyPrice)
        + (quantity * averageBuyPrice)
      );

      existingHolding.quantity = mergedQuantity;
      existingHolding.averageBuyPrice = mergedQuantity > 0 ? mergedInvested / mergedQuantity : 0;
      existingHolding.currentPrice = currentPrice;
      existingHolding.symbol = newHolding.symbol || existingHolding.symbol;
      existingHolding.name = newHolding.name || existingHolding.name;
      existingHolding.image = newHolding.image || existingHolding.image;
    } else {
      portfolio.holdings.push(newHolding);
    }

    portfolio.holdings = mergeDuplicateHoldings(portfolio.holdings || []);
    await portfolio.save();

    const responseData = await buildPortfolioResponse(portfolio);

    return res.status(201).json(responseData);
  } catch (error) {
    console.error("Add portfolio holding error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export {
  addPortfolioAsset,
  getMyPortfolio
};
