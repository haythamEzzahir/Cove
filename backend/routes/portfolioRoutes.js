import express from "express";
import {
  addPortfolioAsset,
  sellPortfolioAsset,
  getMyPortfolio
} from "../controllers/portfolioController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validatePortfolioAsset, validatePortfolioSell, handleValidationErrors } from "../utils/validators.js";

const router = express.Router();

// GET /api/portfolio — get user's portfolio (protected)
router.get("/", protect, getMyPortfolio);
// GET /api/portfolio/me — alias for portfolio root
router.get("/me", protect, getMyPortfolio);
// POST /api/portfolio — add an asset to portfolio (protected)
router.post("/", protect, validatePortfolioAsset, handleValidationErrors, addPortfolioAsset);
// POST /api/portfolio/me — alias for adding asset
router.post("/me", protect, validatePortfolioAsset, handleValidationErrors, addPortfolioAsset);
// POST /api/portfolio/assets — add asset (used by Watchlist)
router.post("/assets", protect, validatePortfolioAsset, handleValidationErrors, addPortfolioAsset);
// POST /api/portfolio/sell — sell/reduce a portfolio holding (protected)
router.post("/sell", protect, validatePortfolioSell, handleValidationErrors, sellPortfolioAsset);

export default router;
