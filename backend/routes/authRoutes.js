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
import {
  validateRegistration,
  validateLogin,
  validateOTP,
  validateResendOTP,
  handleValidationErrors
} from "../utils/validators.js";

const router = express.Router();

router.post("/register", validateRegistration, handleValidationErrors, registerUser);
router.post("/login", validateLogin, handleValidationErrors, loginUser);
router.get("/me", protect, getCurrentUser);
router.get("/google/config", getGoogleClientId);
router.get("/google/client-id", getGoogleClientId);
router.post("/google", googleAuth);
router.post("/verify-otp", validateOTP, handleValidationErrors, verifyOTP);
router.post("/resend-otp", validateResendOTP, handleValidationErrors, resendVerificationOTP);
router.delete("/account", protect, deleteAccount);

export default router;
