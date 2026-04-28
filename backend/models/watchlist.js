import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    coins: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

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

    const obsoleteIndexes = indexes.filter((index) => (
      index.name !== "_id_" && Object.keys(index.key || {}).includes("coinId")
    ));

    for (const index of obsoleteIndexes) {
      await Watchlist.collection.dropIndex(index.name);
    }

    await Watchlist.collection.createIndex(
      { userId: 1 },
      { unique: true, name: "userId_1" }
    );
  } catch (error) {
    console.warn("Watchlist index warning:", error.message);
  }
};

export { ensureWatchlistIndexes };

export default Watchlist;
