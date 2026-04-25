import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    coinId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }
  },
  { timestamps: true }
);

watchlistSchema.index(
  { userId: 1, coinId: 1 },
  {
    unique: true,
    name: "userId_1_coinId_1",
    partialFilterExpression: {
      coinId: { $exists: true }
    }
  }
);

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

const isWrongUniqueWatchlistIndex = (index) => {
  if (!index.unique || index.name === "_id_") return false;

  const keys = Object.keys(index.key || {});
  return keys.length === 1 && (keys[0] === "userId" || keys[0] === "coinId");
};

const ensureWatchlistIndexes = async () => {
  let indexes = [];

  try {
    indexes = await Watchlist.collection.indexes();
  } catch (error) {
    if (error.code !== 26 && error.codeName !== "NamespaceNotFound") {
      throw error;
    }
  }

  for (const index of indexes.filter(isWrongUniqueWatchlistIndex)) {
    await Watchlist.collection.dropIndex(index.name);
  }

  await Watchlist.collection.createIndex(
    { userId: 1, coinId: 1 },
    {
      unique: true,
      name: "userId_1_coinId_1",
      partialFilterExpression: {
        coinId: { $exists: true }
      }
    }
  );
};

export { ensureWatchlistIndexes };

export default Watchlist;
