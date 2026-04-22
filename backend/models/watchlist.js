import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [
      {
        symbol: { type: String, required: true },
        name: { type: String, required: true }
      }
    ]
  },
  { timestamps: true }
);

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

export default Watchlist;