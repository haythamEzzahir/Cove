import express from "express";
import { getMySettings, updateMySettings } from "../controllers/settingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateSettings, handleValidationErrors } from "../utils/validators.js";

const router = express.Router();

router.get("/me", protect, getMySettings);
router.put("/me", protect, validateSettings, handleValidationErrors, updateMySettings);

export default router;
