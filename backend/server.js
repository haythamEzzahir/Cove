import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import { ensurePortfolioIndexes } from "./models/portfolio.js";
import { ensureWatchlistIndexes } from "./models/watchlist.js";
import { sendPriceAlertEmail } from "./utils/sendEmail.js";
import { protect } from "./middleware/authMiddleware.js";
import errorHandler from "./middleware/errorHandler.js";
import {
  globalLimiter,
  authLimiter,
  otpLimiter,
  otpResendLimiter,
  apiLimiter
} from "./middleware/rateLimiter.js";
import { validateCoinIdParam, validateChartQuery, handleValidationErrors } from "./utils/validators.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: "500kb" }));
app.use(globalLimiter);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

app.get("/", (req, res) => {
  res.send("Backend API is running");
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/auth/verify-otp", otpLimiter);
app.use("/api/auth/resend-otp", otpResendLimiter);
app.use("/api/portfolio", apiLimiter, portfolioRoutes);
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/settings", apiLimiter, settingRoutes);
app.use("/api/watchlist", apiLimiter, watchlistRoutes);

const validateCoinGeckoId = (req, res, next) => {
  const { coinId } = req.params;
  if (!/^[a-z0-9-]+$/i.test(coinId)) {
    return res.status(400).json({ error: "Invalid coin identifier" });
  }
  next();
};

app.get("/coins", async (req, res) => {
  try {
    const currency = req.query.currency || "usd";
    const ids = req.query.ids;
    const idsParam = ids ? `&ids=${encodeURIComponent(ids)}` : "";
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}${idsParam}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h%2C7d`,
      {
        method: "GET",
        headers: {
          "x-cg-demo-api-key": process.env.CG_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: "Failed to fetch market data" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Fetch coins error:", error.message);
    res.status(502).json({ error: "Failed to fetch coins" });
  }
});

app.get("/coins/:coinId", validateCoinGeckoId, async (req, res) => {
  try {
    const { coinId } = req.params;
    const currency = req.query.currency || "usd";
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`,
      {
        method: "GET",
        headers: {
          "x-cg-demo-api-key": process.env.CG_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const status = response.status === 404 ? 404 : response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: "Failed to fetch coin data" });
    }

    const data = await response.json();
    const marketData = data.market_data || {};

    const priceChange24h = marketData.price_change_percentage_24h;
    const normalizedChange24h = typeof priceChange24h === 'object' ? priceChange24h?.[currency] ?? null : priceChange24h;

    res.json({
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image?.small || "",
      current_price: marketData.current_price?.[currency] ?? null,
      market_cap: marketData.market_cap?.[currency] ?? null,
      total_volume: marketData.total_volume?.[currency] ?? null,
      high_24h: marketData.high_24h?.[currency] ?? null,
      low_24h: marketData.low_24h?.[currency] ?? null,
      price_change_percentage_24h: normalizedChange24h ?? null,
      price_change_percentage_1h_in_currency: typeof marketData.price_change_percentage_1h_in_currency === 'object' ? marketData.price_change_percentage_1h_in_currency?.[currency] ?? null : marketData.price_change_percentage_1h_in_currency ?? null,
      price_change_percentage_7d_in_currency: typeof marketData.price_change_percentage_7d_in_currency === 'object' ? marketData.price_change_percentage_7d_in_currency?.[currency] ?? null : marketData.price_change_percentage_7d_in_currency ?? null,
      ath: marketData.ath?.[currency] ?? null,
      ath_change_percentage: marketData.ath_change_percentage?.[currency] ?? null,
      atl: marketData.atl?.[currency] ?? null,
      sparkline_in_7d: marketData.sparkline_7d,
      market_cap_rank: data.market_cap_rank,
    });
  } catch (error) {
    console.error("Get single coin error:", error.message);
    res.status(502).json({ error: "Failed to fetch coin" });
  }
});

app.get("/chart/:coinId", validateCoinGeckoId, validateChartQuery, handleValidationErrors, async (req, res) => {
  try {
    const { coinId } = req.params;
    const currency = req.query.currency || "usd";
    const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 7));

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`,
      {
        method: "GET",
        headers: {
          "x-cg-demo-api-key": process.env.CG_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const status = response.status === 404 ? 404 : response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: "Failed to fetch chart data" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Chart data error:", error.message);
    res.status(502).json({ error: "Failed to fetch chart data" });
  }
});

app.post("/api/alerts/trigger", protect, async (req, res) => {
  try {
    const { coinName, condition, targetPrice, currentPrice, currencySymbol } = req.body;

    if (!coinName || !condition || targetPrice == null || currentPrice == null) {
      return res.status(400).json({ error: "Missing required alert fields" });
    }

    await sendPriceAlertEmail(
      req.user.email,
      req.user.name,
      coinName,
      condition,
      targetPrice,
      currentPrice,
      currencySymbol || "$"
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Alert email error:", error);
    res.status(500).json({ error: "Failed to send alert email" });
  }
});

app.get("/coins/exchange-rates", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/exchange_rates`,
      {
        method: "GET",
        headers: {
          "x-cg-demo-api-key": process.env.CG_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: "Failed to fetch exchange rates" });
    }

    const data = await response.json();
    res.json(data.rates);
  } catch (error) {
    console.error("Exchange rates error:", error.message);
    res.status(502).json({ error: "Failed to fetch exchange rates" });
  }
});

app.get("/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    if (query.length > 100) {
      return res.status(400).json({ error: "Search query too long" });
    }
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          "x-cg-demo-api-key": process.env.CG_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return res.status(status).json({ error: "Failed to search coins" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Search coins error:", error.message);
    res.status(502).json({ error: "Failed to search coins" });
  }
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    tls: true,
    tlsAllowInvalidCertificates: false,
    family: 4
  })
  .then(async () => {
    console.log("MongoDB connected");
    await ensurePortfolioIndexes();
    await ensureWatchlistIndexes();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${NODE_ENV})`);
});

export { app, server };
export default app;
