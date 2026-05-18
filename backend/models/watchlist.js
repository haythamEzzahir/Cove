import mongoose from "mongoose";

// Sub-schema for a coin stored in the watchlist
const coinSchema = new mongoose.Schema(
  {
    coinId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    symbol: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },
    name: {
      type: String,
      trim: true,
      default: ""
    },
    image: {
      type: String,
      default: ""
    },
    current_price: {
      type: Number,
      default: null
    }
  },
  { _id: false }
);

// Watchlist schema: one doc per user, stores array of tracked coins
const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    coins: {
      type: [coinSchema],
      default: []
    }
  },
  { timestamps: true, autoIndex: false }
);

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

// Normalize a coin ID to lowercase trimmed string
const normalizeCoinId = (value) => String(value || "").trim().toLowerCase();

// Normalize an optional string field with a fallback for null/undefined
const normalizeOptionalString = (value, fallback = "") => (
  value === undefined || value === null ? fallback : String(value).trim()
);

// Normalize a coin object for consistent storage in the watchlist
const normalizeStoredCoin = (coin) => {
  if (typeof coin === "string") {
    const coinId = normalizeCoinId(coin);
    return coinId ? { coinId } : null;
  }

  if (!coin || typeof coin !== "object") {
    return null;
  }

  const coinId = normalizeCoinId(coin.coinId || coin.id);

  if (!coinId) {
    return null;
  }

  const hasCurrentPrice = (
    coin.current_price !== undefined
    && coin.current_price !== null
    && coin.current_price !== ""
  );
  const currentPrice = Number(coin.current_price);

  return {
    coinId,
    symbol: normalizeOptionalString(coin.symbol || coin.ticker).toLowerCase(),
    name: normalizeOptionalString(coin.name, coinId),
    image: normalizeOptionalString(coin.image),
    current_price: hasCurrentPrice && Number.isFinite(currentPrice) ? currentPrice : null
  };
};

// Merge duplicate coins by coinId, keeping the latest data for each
const mergeCoins = (coins = []) => {
  const byCoinId = new Map();

  for (const coin of coins) {
    const normalized = normalizeStoredCoin(coin);

    if (!normalized) continue;

    const existing = byCoinId.get(normalized.coinId) || {};

    byCoinId.set(normalized.coinId, {
      coinId: normalized.coinId,
      symbol: normalized.symbol || existing.symbol || "",
      name: normalized.name || existing.name || normalized.coinId,
      image: normalized.image || existing.image || "",
      current_price: normalized.current_price ?? existing.current_price ?? null
    });
  }

  return [...byCoinId.values()];
};

// Merge duplicate watchlist documents for the same user into one
const mergeDuplicateWatchlists = async () => {
  const documents = await Watchlist.collection.find({}).toArray();
  const byUserId = new Map();
  const invalidDocumentIds = [];
  const summary = {
    documentsScanned: documents.length,
    usersScanned: 0,
    duplicateGroupsMerged: 0,
    documentsUpdated: 0,
    duplicateDocumentsDeleted: 0,
    emptyDocumentsDeleted: 0,
    invalidDocumentsDeleted: 0,
    duplicateCoinsRemoved: 0
  };

  for (const document of documents) {
    if (!document.userId) {
      invalidDocumentIds.push(document._id);
      continue;
    }

    const userId = String(document.userId);
    const userWatchlists = byUserId.get(userId) || [];
    userWatchlists.push(document);
    byUserId.set(userId, userWatchlists);
  }

  if (invalidDocumentIds.length > 0) {
    const result = await Watchlist.collection.deleteMany({
      _id: { $in: invalidDocumentIds }
    });

    summary.invalidDocumentsDeleted = result.deletedCount || 0;
  }

  summary.usersScanned = byUserId.size;

  for (const userWatchlists of byUserId.values()) {
    const sortedWatchlists = userWatchlists.sort((a, b) => (
      new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    ));
    const primary = sortedWatchlists[0];
    const duplicateIds = sortedWatchlists.slice(1).map((document) => document._id);
    const originalCoins = sortedWatchlists.flatMap((document) => document.coins || []);
    const mergedCoins = mergeCoins(
      originalCoins
    );

    summary.duplicateCoinsRemoved += Math.max(0, originalCoins.length - mergedCoins.length);

    if (mergedCoins.length === 0) {
      const result = await Watchlist.collection.deleteMany({
        _id: { $in: sortedWatchlists.map((document) => document._id) }
      });

      summary.emptyDocumentsDeleted += result.deletedCount || 0;
      continue;
    }

    const primaryCoins = mergeCoins(primary.coins || []);
    const hasCoinChanges = JSON.stringify(primaryCoins) !== JSON.stringify(mergedCoins);

    if (duplicateIds.length > 0 || hasCoinChanges) {
      await Watchlist.collection.updateOne(
        { _id: primary._id },
        {
          $set: {
            coins: mergedCoins,
            updatedAt: new Date()
          }
        }
      );

      summary.documentsUpdated += 1;
    }

    if (duplicateIds.length > 0) {
      const result = await Watchlist.collection.deleteMany({
        _id: { $in: duplicateIds }
      });

      summary.duplicateGroupsMerged += 1;
      summary.duplicateDocumentsDeleted += result.deletedCount || 0;
    }
  }

  return summary;
};

// Clean up old indexes and create a fresh userId index for the watchlist collection
const ensureWatchlistIndexes = async () => {
  try {
    let indexes = [];

    try {
      indexes = await Watchlist.collection.indexes();
    } catch (error) {
      if (error.code !== 26 && error.codeName !== "NamespaceNotFound") {
        throw error;
      }
    }

    const cleanupSummary = await mergeDuplicateWatchlists();

    const obsoleteIndexes = indexes.filter((index) => {
      if (index.name === "_id_") return false;

      const keys = Object.keys(index.key || {});
      const isCoinIndex = keys.some((key) => (
        key === "coinId" || key.endsWith(".coinId")
      ));
      const isUniqueUserIndex = index.key?.userId === 1 && index.unique === true;

      return isCoinIndex || isUniqueUserIndex;
    });

    for (const index of obsoleteIndexes) {
      await Watchlist.collection.dropIndex(index.name);
    }

    await Watchlist.collection.createIndex(
      { userId: 1 },
      { name: "userId_1" }
    );

    return cleanupSummary;
  } catch (error) {
    console.warn("Watchlist index warning:", error.message);
    throw error;
  }
};

export {
  ensureWatchlistIndexes,
  mergeCoins,
  mergeDuplicateWatchlists,
  normalizeStoredCoin
};

export default Watchlist;
