import express from "express";
import { getMySettings, updateMySettings } from "../controllers/settingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateSettings, handleValidationErrors } from "../utils/validators.js";

const router = express.Router();

// GET /api/settings/me — get user settings (protected)
router.get("/me", protect, getMySettings);
// PUT /api/settings/me — update user settings (protected)
router.put("/me", protect, validateSettings, handleValidationErrors, updateMySettings);

export default router;
