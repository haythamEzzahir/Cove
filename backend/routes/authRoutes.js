import express from "express";
import {
  registerUser,
  loginUser,
  googleAuth,
  getGoogleClientId,
  verifyEmail,
  resendVerificationEmail
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/google/client-id", getGoogleClientId);
router.post("/google", googleAuth);
router.get("/verify/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

export default router;
