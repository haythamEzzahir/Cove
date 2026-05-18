import mongoose from "mongoose";

// Settings schema: one per user, stores theme, language, compact view, notifications
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
    language: {
      type: String,
      default: "fr"
    }
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;