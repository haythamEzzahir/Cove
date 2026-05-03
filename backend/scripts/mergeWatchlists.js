import dotenv from "dotenv";
import dns from "dns";
import mongoose from "mongoose";
import Watchlist, { ensureWatchlistIndexes } from "../models/watchlist.js";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is missing");
}

await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000
});

const cleanup = await ensureWatchlistIndexes();

const count = await Watchlist.countDocuments();
const indexes = await Watchlist.collection.indexes();

console.log("Watchlist cleanup complete.");
console.log(JSON.stringify({
  ...cleanup,
  documentsRemaining: count,
  indexes: indexes.map((index) => ({
    name: index.name,
    key: index.key,
    unique: Boolean(index.unique)
  }))
}, null, 2));

await mongoose.disconnect();
