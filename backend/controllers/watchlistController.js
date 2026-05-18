import Watchlist, { mergeCoins, normalizeStoredCoin } from "../models/watchlist.js";

// Extract raw coins array from a watchlist document
const getPlainCoins = (watchlist) => {
  if (!watchlist) return [];

  if (typeof watchlist.toObject === "function") {
    return watchlist.toObject().coins || [];
  }

  return watchlist.coins || [];
};

// Deduplicate watchlist coins and optionally delete if empty
const cleanWatchlistCoins = async (watchlist, { deleteIfEmpty = false } = {}) => {
  if (!watchlist) {
    return {
      watchlist: null,
      coins: []
    };
  }

  const storedCoins = getPlainCoins(watchlist);
  const coins = mergeCoins(storedCoins);

  if (coins.length === 0 && deleteIfEmpty) {
    await Watchlist.deleteOne({ _id: watchlist._id });

    return {
      watchlist: null,
      coins: []
    };
  }

  const hasChanges = JSON.stringify(storedCoins) !== JSON.stringify(coins);

  if (hasChanges) {
    watchlist.coins = coins;
    await watchlist.save();
  }

  return {
    watchlist,
    coins
  };
};

// Build a standardized watchlist API response
const buildResponse = (watchlist, message = "", coins = mergeCoins(watchlist?.coins || [])) => {

  return {
    message,
    _id: watchlist?._id,
    userId: watchlist?.userId,
    coins,
    createdAt: watchlist?.createdAt,
    updatedAt: watchlist?.updatedAt
  };
};

// GET handler — return the user's watchlist coins
const getMyWatchlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const watchlist = await Watchlist.findOne({ userId });

    if (!watchlist) {
      return res.json([]);
    }

    const cleaned = await cleanWatchlistCoins(watchlist, { deleteIfEmpty: true });

    return res.json(cleaned.coins);
  } catch (error) {
    console.error("Get watchlist error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST handler — add a coin to the user's watchlist
const addWatchlistItem = async (req, res) => {
  try {
    const userId = req.user._id;

    const coin = normalizeStoredCoin(req.body);

    if (!coin) {
      return res.status(400).json({ message: "coinId is required" });
    }

    let watchlist = await Watchlist.findOne({ userId });

    if (!watchlist) {
      watchlist = await Watchlist.create({ userId, coins: [coin] });
    } else {
      const storedCoins = getPlainCoins(watchlist);
      const mergedCoins = mergeCoins([...storedCoins, coin]);

      watchlist.coins = mergedCoins;
      await watchlist.save();
    }

    const cleaned = await cleanWatchlistCoins(watchlist);

    return res.status(201).json(
      buildResponse(cleaned.watchlist, "Coin added to watchlist", cleaned.coins)
    );
  } catch (error) {
    console.error("Add watchlist item error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE handler — remove a coin from the user's watchlist
const removeWatchlistItem = async (req, res) => {
  try {
    const userId = req.user._id;

    const coinId = String(req.params.coinId || "").trim().toLowerCase();

    if (!coinId) {
      return res.status(400).json({ message: "coinId is required" });
    }

    const watchlist = await Watchlist.findOneAndUpdate(
      { userId },
      {
        $pull: {
          coins: { coinId }
        }
      },
      {
        returnDocument: "after"
      }
    );

    if (!watchlist) {
      return res.json([]);
    }

    const cleaned = await cleanWatchlistCoins(watchlist, { deleteIfEmpty: true });

    if (!cleaned.watchlist) {
      return res.json([]);
    }

    return res.json(
      buildResponse(cleaned.watchlist, "Coin removed from watchlist", cleaned.coins)
    );
  } catch (error) {
    console.error("Remove watchlist item error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export { getMyWatchlist, addWatchlistItem, removeWatchlistItem };
