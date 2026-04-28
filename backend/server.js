import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";

import authRoutes from "./routes/authRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import { ensureWatchlistIndexes } from "./models/watchlist.js";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/watchlist", watchlistRoutes);

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

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch coins" });
  }
});

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000
  })
  .then(async () => {
    console.log("MongoDB connected");
    await ensureWatchlistIndexes();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

app.get("/chart/:coinId", async (req, res) => {
  try {
    const { coinId } = req.params;
    const currency = req.query.currency || "usd";
    const days = req.query.days || "7";

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
      throw new Error("Failed to fetch chart data");
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});


app.get("/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          "x-cg-demo-api-key": process.env.CG_API_KEY,
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to search coins" });
  }
});

