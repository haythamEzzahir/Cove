import { body, param, query, validationResult } from "express-validator";
import { SUPPORTED_CURRENCIES } from "../models/setting.js";

export const validateRegistration = [
  body("name").trim().isLength({ min: 1, max: 100 }).withMessage("Name must be 1-100 characters"),
  body("email").isEmail().normalizeEmail().isLength({ max: 255 }).withMessage("Valid email is required"),
  body("password").isLength({ min: 8, max: 128 }).withMessage("Password must be 8-128 characters"),
];

export const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const validateOTP = [
  body("email").notEmpty().withMessage("Email is required"),
  body("otp").isLength({ min: 6, max: 6 }).matches(/^\d+$/).withMessage("OTP must be a 6-digit code"),
];

export const validateResendOTP = [
  body("email").notEmpty().withMessage("Email is required"),
];

const isValidAvatar = (value) => {
  if (!value || typeof value !== "string") return true;
  if (value.startsWith("data:image/")) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const validateProfileUpdate = [
  body("name").optional().trim().isLength({ min: 1, max: 100 }).withMessage("Name must be 1-100 characters"),
  body("email").optional().isEmail().normalizeEmail().isLength({ max: 255 }).withMessage("Valid email is required"),
  body("bio").optional().trim().isLength({ max: 500 }).withMessage("Bio must be under 500 characters"),
  body("avatar").optional().custom(isValidAvatar).withMessage("Avatar must be a valid URL"),
  body("currentPassword").optional().notEmpty().withMessage("Current password is required"),
  body("newPassword").optional().isLength({ min: 8, max: 128 }).withMessage("Password must be 8-128 characters"),
  body("confirmPassword").optional().notEmpty().withMessage("Password confirmation is required"),
];

export const validatePortfolioSell = [
  body("coinId").trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/i).withMessage("Invalid coinId"),
  body("quantity").isFloat({ min: 0.00000001 }).withMessage("Quantity must be greater than 0"),
];

export const validatePortfolioAsset = [
  body("coinId").trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/i).withMessage("Invalid coinId"),
  body("name").trim().isLength({ min: 1, max: 200 }).withMessage("Name is required"),
  body("symbol").trim().isLength({ min: 1, max: 20 }).withMessage("Symbol is required"),
  body("quantity").isFloat({ min: 0.00000001 }).withMessage("Quantity must be greater than 0"),
  body("currentPrice").isFloat({ min: 0.00000001 }).withMessage("Current price must be greater than 0"),
  body("averageBuyPrice").optional({ values: "falsy" }).isFloat({ min: 0.00000001 }).withMessage("Average buy price must be greater than 0"),
  body("image").optional({ values: "falsy" }).trim().isLength({ max: 2000 }).withMessage("Image URL too long"),
];

export const validateWatchlistItem = [
  body("coinId").trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/i).withMessage("Invalid coinId"),
  body("name").optional().trim().isLength({ max: 200 }),
  body("symbol").optional().trim().isLength({ max: 20 }),
  body("image").optional().trim().isURL({ require_tld: false }),
];

export const validateCoinIdParam = [
  param("coinId").trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/i).withMessage("Invalid coinId"),
];

export const validateChartQuery = [
  param("coinId").trim().isLength({ min: 1, max: 100 }).matches(/^[a-z0-9-]+$/i).withMessage("Invalid coinId"),
  query("days").optional().isInt({ min: 1, max: 365 }).withMessage("Days must be 1-365"),
];

export const validateSettings = [
  body("theme").optional().isIn(["dark", "light", "system"]).withMessage("Theme must be dark, light, or system"),
  body("compactView").optional().isBoolean(),
  body("notifications").optional().isBoolean(),
  body("currency").optional().isIn(SUPPORTED_CURRENCIES).withMessage("Currency is not supported"),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => `${e.path}: ${e.msg}`).join("; ");
    console.log("Validation errors:", details);
    return res.status(400).json({ message: `Validation failed: ${details}` });
  }
  next();
};
