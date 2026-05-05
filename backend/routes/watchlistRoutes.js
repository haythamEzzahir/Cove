import express from "express";
import {
  addWatchlistItem,
  getMyWatchlist,
  removeWatchlistItem
} from "../controllers/watchlistController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateWatchlistItem, handleValidationErrors } from "../utils/validators.js";

const router = express.Router();

router.get("/", protect, getMyWatchlist);
router.post("/", protect, validateWatchlistItem, handleValidationErrors, addWatchlistItem);
router.delete("/:coinId", protect, removeWatchlistItem);

export default router;
