import express from "express";
import {
  registerUser,
  loginUser,
  googleAuth,
  getGoogleClientId,
  getCurrentUser,
  refreshAccessToken,
  logoutUser,
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

// POST /api/auth/register — create a new account
router.post("/register", validateRegistration, handleValidationErrors, registerUser);
// POST /api/auth/login — sign in with email + password
router.post("/login", validateLogin, handleValidationErrors, loginUser);
// POST /api/auth/refresh — get a new access token from refresh token
router.post("/refresh", refreshAccessToken);
// POST /api/auth/logout — sign out and clear auth cookies
router.post("/logout", logoutUser);
// GET /api/auth/me — get current user from token (protected)
router.get("/me", protect, getCurrentUser);
// GET /api/auth/google/config — get Google OAuth client ID for frontend
router.get("/google/config", getGoogleClientId);
// GET /api/auth/google/client-id — alias for config endpoint
router.get("/google/client-id", getGoogleClientId);
// POST /api/auth/google — authenticate via Google OAuth code
router.post("/google", googleAuth);
// POST /api/auth/verify-otp — confirm email with 6-digit code
router.post("/verify-otp", validateOTP, handleValidationErrors, verifyOTP);
// POST /api/auth/resend-otp — resend the verification code
router.post("/resend-otp", validateResendOTP, handleValidationErrors, resendVerificationOTP);
// DELETE /api/auth/account — permanently delete account (protected)
router.delete("/account", protect, deleteAccount);

export default router;
