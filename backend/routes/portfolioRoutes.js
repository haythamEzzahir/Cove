import express from "express";
import {
  addPortfolioAsset,
  getMyPortfolio
} from "../controllers/portfolioController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validatePortfolioAsset, handleValidationErrors } from "../utils/validators.js";

const router = express.Router();

router.get("/", protect, getMyPortfolio);
router.get("/me", protect, getMyPortfolio);
router.post("/", protect, validatePortfolioAsset, handleValidationErrors, addPortfolioAsset);
router.post("/me", protect, validatePortfolioAsset, handleValidationErrors, addPortfolioAsset);
router.post("/assets", protect, validatePortfolioAsset, handleValidationErrors, addPortfolioAsset);

export default router;
