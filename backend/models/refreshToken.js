import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    tokenHash: {
      type: String,
      required: true,
      index: true
    },
    userAgent: {
      type: String,
      default: ""
    },
    isRevoked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

refreshTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
