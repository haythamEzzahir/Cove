import bcrypt from "bcryptjs";
import User from "../models/user.js";

const buildUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || "",
  bio: user.bio || "",
  provider: user.provider || "local",
  role: user.role || "user",
  isVerified: Boolean(user.isVerified),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const getMe = async (req, res) => {
  res.json(buildUserResponse(req.user));
};

const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { firstName, lastName, name, email, bio, avatar, currentPassword, newPassword, confirmPassword } = req.body;

  const nextName = typeof name === "string"
    ? name.trim()
    : [firstName, lastName]
      .filter((part) => typeof part === "string" && part.trim())
      .map((part) => part.trim())
      .join(" ");

  if (nextName) {
    user.name = nextName;
  }

  if (typeof email === "string") {
    const nextEmail = email.trim().toLowerCase();

    if (!nextEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (nextEmail !== user.email) {
      const existingUser = await User.findOne({ email: nextEmail });

      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Email is already in use" });
      }

      user.email = nextEmail;
    }
  }

  if (typeof bio === "string") {
    user.bio = bio.trim();
  }

  if (typeof avatar === "string") {
    user.avatar = avatar.trim();
  }

  if (currentPassword || newPassword || confirmPassword) {
    if (user.provider !== "local" || !user.password) {
      return res.status(400).json({ message: "Password update is not available for this account" });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all password fields" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
  }

  const updatedUser = await user.save();

  res.json(buildUserResponse(updatedUser));
};

export { getMe, updateProfile };
