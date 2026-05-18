import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";

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
  apiLimiter,
} from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

// Security & Optimization Middleware
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
app.use(cookieParser());
app.use(globalLimiter);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

// Routes
// Health check endpoint
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

// Market Proxy Routes (Consolidated)
app.use("/", marketRoutes);

// Trigger a price alert email when user-defined threshold is hit
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

app.use(errorHandler);

// Catch-all 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Database Connection & Server Start
// Connect to DB, ensure indexes, then start listening
connectDB().then(async () => {
  await ensurePortfolioIndexes();
  await ensureWatchlistIndexes();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${NODE_ENV})`);
  });
});

export default app;
