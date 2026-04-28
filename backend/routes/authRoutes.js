import express from "express";
import {
  registerUser,
  loginUser,
  googleAuth,
  getGoogleClientId
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/google/client-id", getGoogleClientId);
router.post("/google", googleAuth);

export default router;
