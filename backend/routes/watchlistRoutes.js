import express from "express";
import {
  addWatchlistItem,
  getMyWatchlist,
  removeWatchlistItem
} from "../controllers/watchlistController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateWatchlistItem, handleValidationErrors } from "../utils/validators.js";

const router = express.Router();

// GET /api/watchlist — get user's watchlist (protected)
router.get("/", protect, getMyWatchlist);
// POST /api/watchlist — add a coin to watchlist (protected)
router.post("/", protect, validateWatchlistItem, handleValidationErrors, addWatchlistItem);
// DELETE /api/watchlist/:coinId — remove a coin from watchlist (protected)
router.delete("/:coinId", protect, removeWatchlistItem);

export default router;
