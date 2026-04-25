import express from "express";
import {
  addWatchlistItem,
  getMyWatchlist,
  removeWatchlistItem
} from "../controllers/watchlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMyWatchlist);
router.post("/", protect, addWatchlistItem);

router.get("/me", protect, getMyWatchlist);
router.post("/me", protect, addWatchlistItem);

router.delete("/:coinId", protect, removeWatchlistItem);

export default router;
