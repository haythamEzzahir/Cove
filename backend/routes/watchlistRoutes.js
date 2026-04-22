import express from "express";
import { getMyWatchlist, addWatchlistItem } from "../controllers/watchlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMyWatchlist);
router.post("/me", protect, addWatchlistItem);

export default router;