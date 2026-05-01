import express from "express";
import {
  registerUser,
  loginUser,
  googleAuth,
  getGoogleClientId,
  verifyOTP,
  resendVerificationOTP
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/google/client-id", getGoogleClientId);
router.post("/google", googleAuth);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendVerificationOTP);

export default router;
