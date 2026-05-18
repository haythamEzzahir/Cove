import mongoose from "mongoose";

// Sub-schema for a single portfolio holding (coin + quantity + price info)
const holdingSchema = new mongoose.Schema(
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
      uppercase: true,
      default: ""
    },
    name: {
      type: String,
      trim: true,
      default: ""
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    averageBuyPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    currentPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    priceChange24h: {
      type: Number,
      default: null
    },
    priceChangePercentage24h: {
      type: Number,
      default: null
    },
    image: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

// Sub-schema for a single chart data point (timestamp + portfolio value)
const chartPointSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

// Portfolio schema: one per user, holds array of holdings + chart history
const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    holdings: {
      type: [holdingSchema],
      default: []
    },
    chartData: {
      type: [chartPointSchema],
      default: []
    }
  },
  { timestamps: true }
);

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

// Create a unique index on userId to prevent duplicate portfolios
const ensurePortfolioIndexes = async () => {
  try {
    await Portfolio.collection.createIndex(
      { userId: 1 },
      { unique: true, name: "userId_1" }
    );
  } catch (error) {
    console.error("Portfolio index error:", error.message);
  }
};

export { ensurePortfolioIndexes };
export default Portfolio;
