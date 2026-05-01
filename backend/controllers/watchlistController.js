import Watchlist from "../models/watchlist.js";

const normalizeCoinIds = (coins = []) => {
  const coinIds = coins
    .map((coinId) => String(coinId || "").trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(coinIds)];
};

const getOrCreateWatchlist = async (userId) => {
  let watchlist = await Watchlist.findOne({ userId });

  if (!watchlist) {
    watchlist = await Watchlist.create({
      userId,
      coins: []
    });
  }

  return watchlist;
};

const fetchCoinDetails = async (coinIds, currency = "usd") => {
  const coins = normalizeCoinIds(coinIds);

  if (coins.length === 0) {
    return [];
  }

  try {
    const headers = process.env.CG_API_KEY
      ? { "x-cg-demo-api-key": process.env.CG_API_KEY }
      : {};

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${encodeURIComponent(currency)}&ids=${encodeURIComponent(coins.join(","))}&order=market_cap_desc&per_page=${coins.length}&page=1&sparkline=true&price_change_percentage=1h%2C7d`,
      {
        method: "GET",
        headers
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko request failed with status ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Fetch watchlist coin details error:", error.message);
    return [];
  }
};

const buildWatchlistResponse = async (watchlist, currency) => {
  const coins = normalizeCoinIds(watchlist.coins);
  const items = await fetchCoinDetails(coins, currency);

  return {
    _id: watchlist._id,
    userId: watchlist.userId,
    coins,
    items,
    createdAt: watchlist.createdAt,
    updatedAt: watchlist.updatedAt
  };
};

const getMyWatchlist = async (req, res) => {
  try {
    const watchlist = await getOrCreateWatchlist(req.user._id);
    const response = await buildWatchlistResponse(
      watchlist,
      req.query.currency || "usd"
    );

    res.json(response);
  } catch (error) {
    console.error("Get watchlist error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const addWatchlistItem = async (req, res) => {
  const coinId = String(req.body?.coinId || "").trim().toLowerCase();

  try {
    if (!coinId) {
      return res.status(400).json({ message: "coinId is required" });
    }

    const watchlist = await Watchlist.findOneAndUpdate(
      { userId: req.user._id },
      { $addToSet: { coins: coinId } },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    const response = await buildWatchlistResponse(
      watchlist,
      req.query.currency || "usd"
    );

    return res.status(201).json(response);
  } catch (error) {
    console.error("Add watchlist item error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const removeWatchlistItem = async (req, res) => {
  try {
    const coinId = String(req.params.coinId || "").trim().toLowerCase();

    if (!coinId) {
      return res.status(400).json({ message: "coinId is required" });
    }

    let watchlist = await Watchlist.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { coins: coinId } },
      { returnDocument: 'after' }
    );

    if (!watchlist) {
      watchlist = await Watchlist.create({
        userId: req.user._id,
        coins: []
      });
    }

    const response = await buildWatchlistResponse(
      watchlist,
      req.query.currency || "usd"
    );

    return res.json(response);
  } catch (error) {
    console.error("Remove watchlist item error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export { getMyWatchlist, addWatchlistItem, removeWatchlistItem };
