import express from "express";
import { getMySettings, updateMySettings } from "../controllers/settingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMySettings);
router.put("/me", protect, updateMySettings);

export default router;