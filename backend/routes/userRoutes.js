import express from "express";
import { getMe, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/profile", protect, updateProfile);

export default router;
