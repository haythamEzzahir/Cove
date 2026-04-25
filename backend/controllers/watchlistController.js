import Watchlist, { ensureWatchlistIndexes } from "../models/watchlist.js";

const getUserCoinIds = async (userId) => {
  const watchlist = await Watchlist.find({
    userId,
    coinId: { $exists: true, $ne: null }
  })
    .sort({ createdAt: 1 })
    .select("coinId -_id");

  return watchlist.map((item) => item.coinId);
};

const getMyWatchlist = async (req, res) => {
  try {
    const coinIds = await getUserCoinIds(req.user._id);
    res.json(coinIds);
  } catch (error) {
    console.error("Get watchlist error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const isOldUserIdUniqueIndexError = (error) => {
  if (error.code !== 11000) return false;
  if (error.keyPattern?.userId && !error.keyPattern?.coinId) return true;
  return error.message?.includes("index: userId_1 ");
};

const addWatchlistItem = async (req, res) => {
  const coinId = req.body?.coinId?.trim().toLowerCase();

  try {
    if (!coinId) {
      return res.status(400).json({ message: "coinId is required" });
    }

    const coinExists = await Watchlist.findOne({
      userId: req.user._id,
      coinId
    });

    if (coinExists) {
      return res.status(409).json({ message: "Coin already in watchlist" });
    }

    await Watchlist.create({
      userId: req.user._id,
      coinId
    });

    const coinIds = await getUserCoinIds(req.user._id);

    res.status(201).json(coinIds);
  } catch (error) {
    if (isOldUserIdUniqueIndexError(error)) {
      try {
        await ensureWatchlistIndexes();

        const coinExists = await Watchlist.findOne({
          userId: req.user._id,
          coinId
        });

        if (coinExists) {
          return res.status(409).json({ message: "Coin already in watchlist" });
        }

        await Watchlist.create({
          userId: req.user._id,
          coinId
        });

        const coinIds = await getUserCoinIds(req.user._id);
        return res.status(201).json(coinIds);
      } catch (retryError) {
        console.error("Retry add watchlist item error:", retryError.message);
        return res.status(500).json({ message: "Server error" });
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "Coin already in watchlist" });
    }

    console.error("Add watchlist item error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const removeWatchlistItem = async (req, res) => {
  try {
    const coinId = req.params.coinId?.trim().toLowerCase();

    const deleted = await Watchlist.findOneAndDelete({
      userId: req.user._id,
      coinId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Coin not found in watchlist" });
    }

    const coinIds = await getUserCoinIds(req.user._id);

    res.json(coinIds);
  } catch (error) {
    console.error("Remove watchlist item error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export { getMyWatchlist, addWatchlistItem, removeWatchlistItem };
