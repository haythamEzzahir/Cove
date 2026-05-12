import express from "express";
import { getMe, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateProfileUpdate, handleValidationErrors } from "../utils/validators.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.get("/profile", protect, getMe);
router.put("/me", protect, validateProfileUpdate, handleValidationErrors, updateProfile);
router.put("/profile", protect, validateProfileUpdate, handleValidationErrors, updateProfile);

export default router;
