import express from "express";
import {
  registerUser,
  loginUser,
  googleAuth,
  getGoogleClientId,
  getCurrentUser,
  verifyOTP,
  resendVerificationOTP,
  deleteAccount
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);
router.get("/google/config", getGoogleClientId);
router.get("/google/client-id", getGoogleClientId);
router.post("/google", googleAuth);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendVerificationOTP);
router.delete("/account", protect, deleteAccount);


export default router;
