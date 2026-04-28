import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.js";
import Setting from "../models/setting.js";
import Watchlist from "../models/watchlist.js";
import generateToken from "../utils/generateToken.js";

const createGoogleOAuthClient = () => (
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "postmessage"
  )
);

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || "",
  provider: user.provider || "local",
  token: generateToken(user._id)
});

const getGoogleClientId = (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      message: "GOOGLE_CLIENT_ID is missing in backend .env"
    });
  }

  return res.json({
    clientId: process.env.GOOGLE_CLIENT_ID
  });
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  await Setting.create({
    userId: user._id
  });

  await Watchlist.create({
    userId: user._id,
    coins: []
  });

  res.status(201).json(buildAuthResponse(user));
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user?.password && (await bcrypt.compare(password, user.password))) {
    res.json(buildAuthResponse(user));
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { code } = req.body;

    console.log("Google code exists:", Boolean(code));
    console.log("GOOGLE_CLIENT_ID exists:", Boolean(process.env.GOOGLE_CLIENT_ID));
    console.log("GOOGLE_CLIENT_SECRET exists:", Boolean(process.env.GOOGLE_CLIENT_SECRET));

    if (!code) {
      return res.status(400).json({
        message: "Google authorization code is missing"
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        message: "Google OAuth backend environment variables are missing"
      });
    }

    const oauth2Client = createGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.id_token) {
      return res.status(400).json({
        message: "Google id_token is missing"
      });
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload?.sub;
    const email = payload?.email;
    const name = payload?.name;
    const picture = payload?.picture;

    console.log("Google payload email:", email);

    if (!email) {
      return res.status(400).json({
        message: "Google email is missing"
      });
    }

    if (!googleId) {
      return res.status(400).json({
        message: "Google account id is missing"
      });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      if (!user.provider) user.provider = "google";
      await user.save();
    } else {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId,
        avatar: picture || "",
        provider: "google"
      });

      await Setting.create({
        userId: user._id
      });

      await Watchlist.create({
        userId: user._id,
        coins: []
      });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    console.error("Google auth backend error:", error);

    return res.status(500).json({
      message: "Google authentication failed",
      error: error.message
    });
  }
};

export { registerUser, loginUser, googleAuth, getGoogleClientId };
