import rateLimit from "express-rate-limit";

// Global rate limit: 100 requests per 15 min
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." }
});

// Auth rate limit: 30 requests per 15 min (login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts, please try again later." }
});

// OTP rate limit: 5 attempts per 15 min
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many OTP attempts, please request a new code." }
});

// OTP resend rate limit: 3 requests per 10 min
export const otpResendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many resend attempts, please wait before requesting a new code." }
});

// General API rate limit: 200 requests per 15 min
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many API requests, please try again later." }
});

// CoinGecko proxy rate limit: 30 requests per 5 min
export const proxyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many CoinGecko requests, please wait a moment." }
});

// Public proxy rate limit: 20 requests per 1 min (landing page)
export const publicProxyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." }
});
