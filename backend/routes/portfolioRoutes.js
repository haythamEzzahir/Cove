import express from "express";
import {
  addPortfolioAsset,
  getMyPortfolio
} from "../controllers/portfolioController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMyPortfolio);
router.get("/me", protect, getMyPortfolio);
router.post("/", protect, addPortfolioAsset);
router.post("/me", protect, addPortfolioAsset);
router.post("/assets", protect, addPortfolioAsset);

export default router;
