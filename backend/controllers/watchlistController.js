import mongoose from "mongoose";
import Watchlist, { mergeCoins, normalizeStoredCoin } from "../models/watchlist.js";

const getUserId = (req) => req.user?.id;

const getUserObjectId = (req) => {
  const userId = getUserId(req);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(userId);
};

const getPlainCoins = (watchlist) => {
  if (!watchlist) return [];

  if (typeof watchlist.toObject === "function") {
    return watchlist.toObject().coins || [];
  }

  return watchlist.coins || [];
};

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

const buildAddCoinPipeline = (userId, coin) => [
  {
    $set: {
      userId,
      coins: {
        $let: {
          vars: {
            currentCoins: {
              $cond: [
                { $isArray: "$coins" },
                "$coins",
                []
              ]
            }
          },
          in: {
            $cond: [
              {
                $in: [
                  coin.coinId,
                  {
                    $map: {
                      input: "$$currentCoins",
                      as: "coin",
                      in: {
                        $toLower: {
                          $ifNull: [
                            "$$coin.coinId",
                            {
                              $ifNull: [
                                "$$coin.id",
                                ""
                              ]
                            }
                          ]
                        }
                      }
                    }
                  }
                ]
              },
              "$$currentCoins",
              {
                $concatArrays: [
                  "$$currentCoins",
                  [coin]
                ]
              }
            ]
          }
        }
      },
      createdAt: {
        $ifNull: [
          "$createdAt",
          "$$NOW"
        ]
      },
      updatedAt: "$$NOW"
    }
  }
];

const getMyWatchlist = async (req, res) => {
  try {
    const userId = getUserObjectId(req);

    if (!userId) {
      return res.status(401).json({ message: "Not authorized, no user" });
    }

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

const addWatchlistItem = async (req, res) => {
  try {
    const userId = getUserObjectId(req);

    if (!userId) {
      return res.status(401).json({ message: "Not authorized, no user" });
    }

    const coin = normalizeStoredCoin(req.body);

    if (!coin) {
      return res.status(400).json({ message: "coinId is required" });
    }

    const watchlist = await Watchlist.findOneAndUpdate(
      { userId },
      buildAddCoinPipeline(userId, coin),
      {
        upsert: true,
        new: true,
        returnDocument: "after",
        setDefaultsOnInsert: true
      }
    );
    const cleaned = await cleanWatchlistCoins(watchlist);

    return res.status(201).json(
      buildResponse(cleaned.watchlist, "Coin added to watchlist", cleaned.coins)
    );
  } catch (error) {
    console.error("Add watchlist item error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const removeWatchlistItem = async (req, res) => {
  try {
    const userId = getUserObjectId(req);

    if (!userId) {
      return res.status(401).json({ message: "Not authorized, no user" });
    }

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
        new: true,
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
