import express from "express";
import { getMe, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateProfileUpdate, handleValidationErrors } from "../utils/validators.js";

const router = express.Router();

// GET /api/users/me — get current user profile (protected)
router.get("/me", protect, getMe);
// GET /api/users/profile — alias for getting profile
router.get("/profile", protect, getMe);
// PUT /api/users/me — update profile fields (protected)
router.put("/me", protect, validateProfileUpdate, handleValidationErrors, updateProfile);
// PUT /api/users/profile — alias for updating profile
router.put("/profile", protect, validateProfileUpdate, handleValidationErrors, updateProfile);

export default router;
