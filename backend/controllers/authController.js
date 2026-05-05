import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.js";
import Setting from "../models/setting.js";
import Watchlist from "../models/watchlist.js";
import Portfolio from "../models/portfolio.js";
import generateToken from "../utils/generateToken.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const MAX_OTP_ATTEMPTS = 5;

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const createGoogleOAuthClient = () => (
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "postmessage"
  )
);

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

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || "",
  bio: user.bio || "",
  provider: user.provider || "local",
  isVerified: user.isVerified || false,
  token: generateToken(user._id)
});

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

const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json(user);
};

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

    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

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

    res.json(buildAuthResponse(user));
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { code, credential } = req.body;
    const payload = await getGooglePayload({ code, credential });
    const user = await findOrCreateGoogleUser(payload);

    return res.json(buildAuthResponse(user));
  } catch (error) {
    console.error("Google auth backend error:", error);

    return res.status(error.statusCode || 500).json({
      message: "Google authentication failed"
    });
  }
};

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
    Setting.deleteMany({ userId }),
    Watchlist.deleteMany({ userId }),
    Portfolio.deleteMany({ userId })
  ]);

  await User.findByIdAndDelete(userId);

  return res.json({ message: "Account deleted successfully" });
};

export {
  registerUser,
  loginUser,
  googleAuth,
  getGoogleClientId,
  getCurrentUser,
  verifyOTP,
  resendVerificationOTP,
  deleteAccount
};
