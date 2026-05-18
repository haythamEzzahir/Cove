import mongoose from "mongoose";

// Define the User schema with name, email, password, Google OAuth, and verification fields
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: function requirePassword() {
        return this.provider === "local";
      }
    },
    googleId: {
      type: String,
      trim: true,
      default: ""
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    role: {
      type: String,
      default: "user"
    },
    avatar: {
      type: String,
      default: "",
      maxlength: 500
    },
    bio: {
      type: String,
      trim: true,
      default: ""
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationOTP: {
      type: String,
      default: ""
    },
    otpExpiry: {
      type: Date,
      default: null
    },
    otpAttempts: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
