import Watchlist from "../models/watchlist.js";

const getMyWatchlist = async (req, res) => {
  const watchlist = await Watchlist.findOne({ userId: req.user._id });
  res.json(watchlist);
};

const addWatchlistItem = async (req, res) => {
  const { symbol, name } = req.body;

  if (!symbol || !name) {
    return res.status(400).json({ message: "symbol and name are required" });
  }

  const watchlist = await Watchlist.findOne({ userId: req.user._id });

  if (!watchlist) {
    return res.status(404).json({ message: "Watchlist not found" });
  }

  watchlist.items.push({ symbol, name });

  const updated = await watchlist.save();

  res.json(updated);
};

export { getMyWatchlist, addWatchlistItem };