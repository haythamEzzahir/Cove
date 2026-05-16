import mongoose from "mongoose";

export const SUPPORTED_CURRENCIES = ["usd", "eur", "gbp", "jpy", "aed", "sar", "egp"];

const settingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    theme: {
      type: String,
      default: "dark"
    },
    compactView: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Boolean,
      default: true
    },
    currency: {
      type: String,
      default: "usd",
      enum: SUPPORTED_CURRENCIES
    }
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;
