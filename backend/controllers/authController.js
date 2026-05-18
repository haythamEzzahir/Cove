import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.js";
import Setting from "../models/setting.js";
import Watchlist from "../models/watchlist.js";
import Portfolio from "../models/portfolio.js";
import RefreshToken from "../models/refreshToken.js";
import generateToken from "../utils/generateToken.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const MAX_OTP_ATTEMPTS = 5;

// Generate a random 6-digit OTP code for email verification
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Create a configured Google OAuth2 client
const createGoogleOAuthClient = () => (
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "postmessage"
  )
);

// Verify Google auth code/credential and return user payload
const getGooglePayload = async ({ code, credential }) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is missing");
  }

  const oauth2Client = createGoogleOAuthClient();

  if (credential) {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    return ticket.getPayload();
  }

  if (!code) {
    const error = new Error("Google authorization code or credential is missing");
    error.statusCode = 400;
    throw error;
  }

  if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_SECRET is missing");
  }

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.id_token) {
    const error = new Error("Google id_token is missing");
    error.statusCode = 400;
    throw error;
  }

  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  return ticket.getPayload();
};

// Find existing user by email or create a new one from Google profile
const findOrCreateGoogleUser = async (payload) => {
  const googleId = payload?.sub;
  const email = payload?.email;
  const name = payload?.name;
  const picture = payload?.picture;

  if (!email) {
    const error = new Error("Google email is missing");
    error.statusCode = 400;
    throw error;
  }

  if (!googleId) {
    const error = new Error("Google account id is missing");
    error.statusCode = 400;
    throw error;
  }

  let user = await User.findOne({ email });

  if (user) {
    let changed = false;
    if (!user.googleId) { user.googleId = googleId; changed = true; }
    if (!user.avatar && picture) { user.avatar = picture; changed = true; }
    if (!user.provider) { user.provider = "google"; changed = true; }
    if (!user.isVerified) { user.isVerified = true; changed = true; }
    if (changed) await user.save();
    return user;
  }

  user = await User.create({
    name: name || email.split("@")[0],
    email,
    googleId,
    avatar: picture || "",
    provider: "google",
    isVerified: true
  });

  await Setting.create({ userId: user._id });

  return user;
};

// Set HTTP-only cookies for access and refresh tokens
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000,
    path: "/"
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  });
};

// Clear both auth cookies (token + refreshToken)
const clearAuthCookies = (res) => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none", path: "/" });
  res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "none", path: "/" });
};

// Generate a JWT access token + random refresh token, store hash in DB
const createRefreshTokenPair = async (user, req) => {
  const accessToken = generateToken(user._id, "15m");
  const rawRefreshToken = crypto.randomBytes(40).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    userAgent: req?.headers["user-agent"] || ""
  });

  return { accessToken, refreshToken: rawRefreshToken };
};

// Build a safe user object (no password) to send to the client
const buildUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || "",
  bio: user.bio || "",
  provider: user.provider || "local",
  isVerified: user.isVerified || false,
  role: user.role || "user",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

// Return the Google OAuth client ID to the frontend
const getGoogleClientId = (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      message: "Google configuration is not available"
    });
  }

  return res.json({
    clientId: process.env.GOOGLE_CLIENT_ID
  });
};

// Return the currently authenticated user's data
const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json(user);
};

// Register a new user with name/email/password, send OTP email, and set auth cookies
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return res.status(400).json({ message: "Name must be 1-100 characters" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const userExists = await User.findOne({ email: trimmedEmail });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      isVerified: false,
      verificationOTP: otp,
      otpExpiry
    });

    try {
      await sendVerificationEmail(trimmedEmail, trimmedName, otp);
    } catch (error) {
      console.error("Verification email error:", error.message);
    }

    await Setting.create({
      userId: user._id
    });

    const { accessToken, refreshToken } = await createRefreshTokenPair(user, req);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json(buildUserResponse(user));
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Authenticate user with email + password and set auth cookies
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.provider !== "local" || !user.password) {
      return res.status(401).json({ message: "Please sign in with Google" });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
        needsVerification: true,
        email: user.email
      });
    }

    const { accessToken, refreshToken } = await createRefreshTokenPair(user, req);
    setAuthCookies(res, accessToken, refreshToken);

    res.json(buildUserResponse(user));
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Authenticate or register user via Google OAuth and set auth cookies
const googleAuth = async (req, res) => {
  try {
    const { code, credential } = req.body;
    const payload = await getGooglePayload({ code, credential });
    const user = await findOrCreateGoogleUser(payload);

    const { accessToken, refreshToken } = await createRefreshTokenPair(user, req);
    setAuthCookies(res, accessToken, refreshToken);

    return res.json(buildUserResponse(user));
  } catch (error) {
    console.error("Google auth backend error:", error);

    return res.status(error.statusCode || 500).json({
      message: "Google authentication failed"
    });
  }
};

// Issue a new access token using a valid refresh token, rotate both
const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  const tokenHash = crypto.createHash("sha256").update(incomingRefreshToken).digest("hex");

  try {
    const storedToken = await RefreshToken.findOne({ tokenHash, isRevoked: false });

    if (!storedToken) {
      clearAuthCookies(res);
      return res.status(403).json({ message: "Invalid or revoked refresh token" });
    }

    const user = await User.findById(storedToken.userId).select("-password");

    if (!user || !user.isVerified) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      clearAuthCookies(res);
      return res.status(403).json({ message: "User not found or not verified" });
    }

    const { accessToken, refreshToken: newRefreshToken } = await createRefreshTokenPair(user, req);

    await RefreshToken.deleteOne({ _id: storedToken._id });

    setAuthCookies(res, accessToken, newRefreshToken);

    res.json(buildUserResponse(user));
  } catch (error) {
    clearAuthCookies(res);
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

// Delete the refresh token from DB and clear auth cookies
const logoutUser = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await RefreshToken.deleteOne({ tokenHash });
  }

  clearAuthCookies(res);
  return res.json({ message: "Logged out successfully" });
};

// Verify a user's email using the 6-digit OTP code
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification request" });
    }

    if (user.isVerified) {
      return res.json({ message: "Email already verified. You can now log in." });
    }

    const attempts = user.otpAttempts || 0;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        message: "Too many failed attempts. Please request a new code."
      });
    }

    if (user.verificationOTP !== otp || !user.otpExpiry || new Date() > user.otpExpiry) {
      user.otpAttempts = attempts + 1;
      await user.save();

      const remaining = MAX_OTP_ATTEMPTS - (attempts + 1);
      if (remaining <= 0) {
        return res.status(429).json({
          message: "Too many failed attempts. Please request a new code."
        });
      }

      return res.status(400).json({
        message: "Invalid or expired code",
        attemptsRemaining: remaining
      });
    }

    user.isVerified = true;
    user.verificationOTP = "";
    user.otpExpiry = null;
    user.otpAttempts = 0;
    await user.save();

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("OTP verification error:", error.message);
    res.status(500).json({ message: "Server error during verification" });
  }
};

// Generate and send a new OTP to the user's email
const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "Invalid request" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const otp = generateOTP();
    user.verificationOTP = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();

    await sendVerificationEmail(user.email, user.name, otp);

    res.json({ message: "Verification code sent. Please check your inbox." });
  } catch (error) {
    console.error("Resend OTP error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Permanently delete the user and all their data (settings, watchlist, portfolio)
const deleteAccount = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const user = await User.findById(userId).select("_id");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await Promise.all([
    RefreshToken.deleteMany({ userId }),
    Setting.deleteMany({ userId }),
    Watchlist.deleteMany({ userId }),
    Portfolio.deleteMany({ userId })
  ]);

  await User.findByIdAndDelete(userId);

  clearAuthCookies(res);

  return res.json({ message: "Account deleted successfully" });
};

export {
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
};
