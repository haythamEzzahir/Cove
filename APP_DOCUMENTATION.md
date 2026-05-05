# FinTracker — Complete Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Frontend Structure](#frontend-structure)
4. [Backend Structure](#backend-structure)
5. [Authentication & Email Verification](#authentication--email-verification)
6. [Theme System (Dark/Light Mode)](#theme-system-darklight-mode)
7. [Currency System](#currency-system)
8. [Features](#features)
9. [API Endpoints](#api-endpoints)
10. [Database Schema](#database-schema)
11. [Security Measures](#security-measures)
12. [Environment Variables](#environment-variables)
13. [How to Run](#how-to-run)

---

## Overview

FinTracker is a full-stack cryptocurrency portfolio tracking application that allows users to monitor live market data, manage a personal portfolio, maintain a watchlist, set price alerts, and customize their experience with themes and currency preferences.

**Tech Stack:**
- **Frontend:** React 19, Vite, Tailwind CSS, React Router, Recharts (for charts), html2canvas + jsPDF (for PDF export)
- **Backend:** Express.js 5, MongoDB (Mongoose), JWT authentication
- **External APIs:** CoinGecko (market data), Binance WebSocket (live prices), Google OAuth, Resend (email)

---

## Architecture

```
fintracker/
├── client/                 # React SPA (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Route-level page components
│   │   ├── config.js       # Centralized config & helpers
│   │   ├── main.jsx        # App entry + router
│   │   └── index.css       # Design tokens + CSS utilities
│   └── vite.config.js
├── backend/                # Express API server
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth, rate limiting, error handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express route definitions
│   ├── utils/              # Validators, email sender, token generator
│   └── server.js           # Server entry point
└── .env                    # Environment variables
```

### How the App Works (High Level)

1. User signs up → receives email verification OTP → verifies → can log in
2. After login, the app fetches market data from CoinGecko API via backend proxy
3. Live prices stream from Binance WebSocket in the browser
4. User can add coins to portfolio (tracks holdings, P&L, allocation)
5. User can add coins to watchlist with optional price alerts
6. All settings (theme, currency, language) are persisted in localStorage and synced with the backend
7. Portfolio can be exported as CSV or PDF report

---

## Frontend Structure

### Context Providers

The app wraps everything in these providers (in `main.jsx`):

| Provider | File | Purpose |
|---|---|---|
| `ThemeProvider` | `src/context/ThemeContext.jsx` | Manages dark/light theme |
| `SettingsProvider` | `src/context/SettingsContext.jsx` | User settings (theme, language, notifications, compact view) |
| `CurrencyProvider` | `src/context/CurrencyContext.jsx` | Active currency (USD, EUR, GBP, etc.) |
| `AuthProvider` | `src/context/AuthContext.jsx` | JWT auth, user state, watchlist, login/signup/logout |

### Centralized Config (`src/config.js`)

Single source of truth for:
- `API_URL` — backend base URL
- `AUTH_REDIRECT_KEY` — session storage key for post-login redirects
- `getSafeRedirectPath(path)` — validates redirect URLs (prevents open redirect)
- `getInitials(name)` — extracts initials from a name string
- `getJson(response)` — safely parses JSON with content-type check
- `getStoredToken()` — retrieves JWT from localStorage
- `formatPrice(value, symbol)` — formats numbers as currency (e.g., `$68,250.34`)
- `formatMarketCap(value)` — formats large numbers (e.g., `$1.34T`, `$84.2B`)
- `clearStoredAuth()` — clears all auth data from localStorage

### Pages

| Page | Path | Description |
|---|---|---|
| `Login.jsx` | `/login` | Email/password + Google OAuth login. Shows verification resend if account unverified |
| `Signup.jsx` | `/signup` | Registration form. Redirects to `/verify-pending` on success |
| `VerifyPending.jsx` | `/verify-pending` | 6-digit OTP input. Resend code button. Shows attempts remaining |
| `Dashboard.jsx` | `/` | Main dashboard: market metrics, price chart, asset table with pagination |
| `Portfolio.jsx` | `/portfolio` | Holdings table, balance overview, donut chart (allocation), CSV/PDF export, add asset modal |
| `Watchlist.jsx` | `/watchlist` | Tracked coins with live prices, add/remove coins, set price alerts inline |
| `Alerts.jsx` | `/alerts` | Dedicated alerts page. Create/edit/delete price alerts with notification triggers |
| `Settings.jsx` | `/settings` | User preferences: currency, theme toggle, notifications, language |
| `Profile.jsx` | `/settings/profile` | Profile editing: name, email, avatar (URL or base64), password change |

### Routing (`main.jsx`)

```jsx
createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/verify-pending', element: <VerifyPending /> },
  { path: '/', element: <AppLayout />, children: [
    { index: true, element: <Dashboard /> },
    { path: 'markets', element: <Dashboard /> },
    { path: 'watchlist', element: <Watchlist /> },
    { path: 'portfolio', element: <Portfolio /> },
    { path: 'alerts', element: <Alerts /> },
    { path: 'news', element: <Dashboard /> },
    { path: 'settings', element: <Settings /> },
    { path: 'settings/profile', element: <Profile /> },
  ]},
]);
```

### Route Guards (`components/layout/AppLayout.jsx`)

- **Unauthenticated users:** Auth modal pops up when accessing protected routes
- **Unverified users:** If `user.isVerified === false`, automatically redirected to `/verify-pending`
- **Loading state:** Shows nothing while auth state is being hydrated from localStorage

### Hooks

| Hook | File | Purpose |
|---|---|---|
| `useMarketData` | `hooks/useMarketData.jsx` | Fetches coins, chart data, exchange rates from backend proxy |
| `useBinanceWebSocket` | `hooks/useBinanceWebSocket.jsx` | Subscribes to Binance WebSocket streams for real-time price updates |

### How Live Prices Work

1. Dashboard and Watchlist load initial data via `useMarketData` (CoinGecko through backend proxy)
2. `useBinanceWebSocket` opens a WebSocket connection to `wss://stream.binance.com:9443/ws`
3. Subscribes to `<coinId>usdt@trade` streams for each coin in the user's watchlist
4. On each price tick, updates are dispatched to components via callback
5. Watchlist uses an interval to poll portfolio data every 5 seconds to sync with backend

---

## Backend Structure

### Server (`server.js`)

**Middleware chain:**
1. `helmet()` — Security headers (CSP, X-Frame, HSTS, etc.)
2. `cors()` — Cross-origin requests (allows `localhost:5173` + `CLIENT_URL`)
3. `compression()` — Gzip response compression
4. `express.json({ limit: "500kb" })` — JSON body parsing (supports base64 avatars)
5. `globalLimiter` — 100 requests per 15 minutes
6. Custom middleware — Sets `X-Content-Type-Options: nosniff`

**Route mounting:**
- `/api/auth` — with `authLimiter` (10 requests/15min)
- `/api/auth/verify-otp` — with `otpLimiter` (5 attempts/15min)
- `/api/auth/resend-otp` — with `otpResendLimiter` (3 resends/10min)
- `/api/portfolio`, `/api/users`, `/api/settings`, `/api/watchlist` — with `apiLimiter` (200/15min)

**CoinGecko Proxy Endpoints (in `server.js`):**
- `GET /coins` — Market list (100 coins by market cap)
- `GET /coins/:coinId` — Single coin details
- `GET /chart/:coinId` — Historical price chart data
- `GET /coins/exchange-rates` — Currency exchange rates
- `GET /search?q=...` — Coin search

**Error handling:**
- `errorHandler` middleware is wired at the end of the stack
- 404 handler for unmatched routes
- MongoDB connection failure calls `process.exit(1)`

### Input Validation (`utils/validators.js`)

Uses `express-validator` library:

| Validator | Applies To | Rules |
|---|---|---|
| `validateRegistration` | `POST /api/auth/register` | Name 1-100 chars, valid email, password 8-128 chars |
| `validateLogin` | `POST /api/auth/login` | Valid email, non-empty password |
| `validateOTP` | `POST /api/auth/verify-otp` | Valid email, exactly 6 digits |
| `validateResendOTP` | `POST /api/auth/resend-otp` | Valid email |
| `validateProfileUpdate` | `PUT /api/users/me` | Name 1-100, valid email, bio max 500, avatar as URL or base64 (max 500KB) |
| `validatePortfolioAsset` | `POST /api/portfolio` | Valid coinId (alphanumeric), name, symbol, quantity > 0, price > 0 |
| `validateWatchlistItem` | `POST /api/watchlist` | Valid coinId |
| `validateSettings` | `PUT /api/settings/me` | Theme: dark/light/system, Language: en/fr/ar, booleans |
| `validateChartQuery` | `GET /chart/:coinId` | coinId alphanumeric, days 1-365 |
| `handleValidationErrors` | After any validator | Returns 400 with formatted error array |

### Rate Limiting (`middleware/rateLimiter.js`)

| Limiter | Window | Max Requests | Applies To |
|---|---|---|---|
| `globalLimiter` | 15 min | 100 | All requests |
| `authLimiter` | 15 min | 10 | `/api/auth/*` |
| `otpLimiter` | 15 min | 5 | `/api/auth/verify-otp` |
| `otpResendLimiter` | 10 min | 3 | `/api/auth/resend-otp` |
| `apiLimiter` | 15 min | 200 | `/api/portfolio`, `/api/users`, `/api/settings`, `/api/watchlist` |

### CoinGecko Validation

All `/coins/:coinId` and `/chart/:coinId` routes validate the coin ID against `/^[a-z0-9-]+$/i` to prevent injection attacks.

---

## Authentication & Email Verification

### Registration Flow

1. **User submits signup form** (`POST /api/auth/register`)
   - Name, email, password validated
   - Checks if user already exists
   - Hashes password with bcrypt (salt rounds: 10)
   - Generates 6-digit OTP, sets expiry to 10 minutes
   - Creates user with `isVerified: false`
   - Sends verification email via Resend API
   - Returns JWT token (user is logged in immediately but can't access protected features)

2. **Redirect to `/verify-pending`** with user's email in query params

3. **User enters 6-digit OTP** (`POST /api/auth/verify-otp`)
   - Looks up user by email
   - Checks if already verified
   - Checks OTP attempts (max 5, then locked until resend)
   - Validates OTP matches and hasn't expired
   - On success: sets `isVerified: true`, clears OTP and attempts

4. **If wrong OTP:** Returns remaining attempts count

### Login Flow

1. **User submits login form** (`POST /api/auth/login`)
   - Validates email/password
   - Checks if user is verified
   - If not verified: returns 403 with `needsVerification: true` and email
   - If verified: returns JWT token with user data

2. **Frontend stores JWT** in localStorage under key `token`
3. **Hydrates user** by calling `GET /api/auth/me`
4. **Loads watchlist** by calling `GET /api/watchlist`

### Google OAuth

1. User clicks "Continue with Google"
2. Google login flow returns authorization code
3. Code sent to `POST /api/auth/google`
4. Backend verifies with Google, finds or creates user
5. Google users are auto-verified (Google already verified the email)

### Token

- JWT with `{ id: userId }` payload
- Secret from `JWT_SECRET` env variable
- Expires in 7 days
- Sent as `Authorization: Bearer <token>` header

### Password Change

- Requires `currentPassword`, `newPassword`, `confirmPassword`
- Validates current password with bcrypt.compare
- Enforces 8-char minimum on new password
- Not available for Google-authenticated accounts

---

## Theme System (Dark/Light Mode)

### How It Works

**Theme detection (in `ThemeContext.jsx`):**

1. On first load, checks `localStorage` for key `fintracker_theme`
2. If not found, defaults to `dark`
3. Applies the `dark` CSS class to `<html>` element when theme is `dark`
4. Listens for OS-level `prefers-color-scheme` changes via `window.matchMedia`

**CSS Design Tokens (`index.css`):**

Themes use CSS custom properties (CSS variables) defined as RGB values:

```css
/* Light Theme (default — no .dark class) */
:root {
  --bg-base: 248, 249, 250;        /* light gray background */
  --bg-surface: 243, 245, 247;     /* slightly lighter cards */
  --text-primary: 33, 37, 41;      /* dark text */
  --text-secondary: 75, 85, 99;    /* gray text */
  --color-primary: 37, 99, 235;    /* blue accent */
  --color-danger: 190, 24, 33;     /* red */
  --color-success: 22, 101, 52;    /* green */
}

/* Dark Theme (when .dark class is on <html>) */
.dark {
  --bg-base: 13, 17, 23;           /* near-black background */
  --bg-surface: 22, 27, 34;        /* dark gray cards */
  --text-primary: 230, 237, 243;   /* light text */
  --text-secondary: 201, 209, 217; /* gray text */
  --color-primary: 59, 130, 246;   /* brighter blue */
  --color-danger: 248, 81, 73;     /* brighter red */
  --color-success: 63, 185, 80;    /* brighter green */
}
```

**How components use themes:**

```css
/* Utility classes that read CSS variables */
.bg-base { background-color: rgb(var(--bg-base)); }
.text-primary { color: rgb(var(--text-primary)); }
.border-default { border-color: rgb(var(--border-default)); }
```

Components use Tailwind utility classes like `bg-base`, `text-primary`, `border-default` — these automatically adapt because the CSS variables change when the `.dark` class is toggled.

**SVG elements (charts, icons):**

For SVG `fill` attributes, Tailwind classes like `fill-primary` don't work. Instead, use inline `fill` with CSS variables:

```jsx
<text fill="rgb(var(--text-primary))">...</text>
```

**Theme toggle:**

Located in `TopBar.jsx` — toggles between dark/light via `useTheme().toggleTheme()`. Persists to `localStorage` and updates the `<html>` class.

---

## Currency System

### Supported Currencies (`CurrencyContext.jsx`)

| Code | Symbol | Name |
|---|---|---|
| `usd` | `$` | US Dollar |
| `eur` | `€` | Euro |
| `gbp` | `£` | British Pound |
| `jpy` | `¥` | Japanese Yen |
| `aed` | `د.إ` | UAE Dirham |
| `sar` | `﷼` | Saudi Riyal |
| `egp` | `E£` | Egyptian Pound |

### How It Works

1. Default currency is `usd`
2. Stored in `localStorage` under key `fintracker_currency`
3. Changing currency in Settings page updates the context
4. All CoinGecko API calls pass `?currency=<code>` query parameter
5. Price formatting uses `formatPrice(value, symbol)` from `config.js`

---

## Features

### Dashboard (`/`)

- **Market Metrics Cards:** Total market cap, 24h volume, BTC dominance, Fear & Greed index
- **Price Chart:** Recharts line chart showing historical prices. Supports time ranges: 24H, 7D, 1M, 3M, 1Y, All
- **Asset Table:** Paginated table of top 100 coins with columns: Rank, Name, Price, 1h%, 24h%, 7d%, Market Cap, Volume, ATH
- **Column Customization:** Toggle visibility of columns via column menu
- **Filter:** Dropdown to filter by market cap, price, or volume
- **Search:** Filter coins by name or symbol
- **Watchlist Column:** Star icon to add/remove from watchlist
- **Live Prices:** Updated via Binance WebSocket in real-time

### Portfolio (`/portfolio`)

- **Balance Overview:** Total balance, invested amount, 24h P&L, all-time P&L with percentages
- **Asset Allocation Donut Chart:** Recharts pie chart showing portfolio distribution (top 4 + "Others")
- **Holdings Table:** Rank, name, quantity, avg buy price, current price, value, P&L, 24h change, day P&L
- **Add Asset Modal:** Search for coin, select, enter amount. Automatically uses current market price as buy price
- **Export:** CSV file download or PDF report (using html2canvas + jsPDF)
- **Empty State:** Helpful message when no holdings exist

### Watchlist (`/watchlist`)

- **Tracked Coins:** Custom list of watched cryptocurrencies
- **Live Prices:** Real-time price updates via Binance WebSocket
- **Add/Remove:** Add coins from dashboard or search, remove with confirmation
- **Price Alerts:** Set target prices with condition (above/below). Triggers in-app notification and email
- **Stats:** Total value, gainers/losers count, best/worst performer
- **Pagination:** 8 items per page with filter options

### Alerts (`/alerts`)

- **Alert List:** All active price alerts with status (active, triggered)
- **Create Alert:** Select coin, set target price, choose condition (above/below)
- **Delete Alert:** Remove individual or all alerts
- **Notification:** Browser notification (if permitted) + email when alert triggers
- **Chart Preview:** Shows coin price chart when editing an alert

### Settings (`/settings`)

- **Appearance:** Theme toggle (dark/light)
- **Currency:** Dropdown to change display currency
- **Language:** English, French, Arabic (UI labels stored in settings)
- **Notifications:** Toggle for price alert notifications
- **Compact View:** Toggle for reduced padding UI
- **Portfolio Summary:** Toggle for showing portfolio stats on dashboard

### Profile (`/settings/profile`)

- **Display Name:** First + last name or full name
- **Email:** Can be changed (checks for duplicates)
- **Avatar:** URL string or base64 data URI (max 500KB)
- **Password Change:** Current password verification + new password (min 8 chars)
- **Account Deletion:** Removes all user data (portfolio, watchlist, settings, user document)

---

## API Endpoints

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register new user (sends OTP email) |
| `POST` | `/api/auth/login` | No | Login with email/password |
| `POST` | `/api/auth/google` | No | Google OAuth login |
| `GET` | `/api/auth/me` | Yes | Get current user profile |
| `POST` | `/api/auth/verify-otp` | No | Verify email with 6-digit code |
| `POST` | `/api/auth/resend-otp` | No | Resend verification code |
| `DELETE` | `/api/auth/account` | Yes | Delete account |
| `GET` | `/api/auth/google/config` | No | Get Google Client ID for frontend |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | Yes | Get current user |
| `PUT` | `/api/users/me` | Yes | Update profile (name, email, avatar, password) |
| `GET` | `/api/users/profile` | Yes | Alias for GET /me |
| `PUT` | `/api/users/profile` | Yes | Alias for PUT /me |

### Portfolio

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/portfolio` | Yes | Get portfolio data with holdings |
| `GET` | `/api/portfolio/me` | Yes | Alias for GET / |
| `POST` | `/api/portfolio` | Yes | Add/merge asset holding |
| `POST` | `/api/portfolio/me` | Yes | Alias for POST / |
| `POST` | `/api/portfolio/assets` | Yes | Alias for POST / |

### Watchlist

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/watchlist` | Yes | Get user's watchlist coins |
| `POST` | `/api/watchlist` | Yes | Add coin to watchlist |
| `DELETE` | `/api/watchlist/:coinId` | Yes | Remove coin from watchlist |

### Settings

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/settings/me` | Yes | Get user settings |
| `PUT` | `/api/settings/me` | Yes | Update settings (theme, language, etc.) |

### Alerts

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/alerts/trigger` | Yes | Trigger price alert email |

### CoinGecko Proxy (No Auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/coins` | Get top 100 market coins |
| `GET` | `/coins/:coinId` | Get single coin details |
| `GET` | `/chart/:coinId` | Get historical chart data |
| `GET` | `/coins/exchange-rates` | Get currency exchange rates |
| `GET` | `/search?q=` | Search coins by name |

---

## Database Schema

### User (`models/user.js`)

| Field | Type | Default | Notes |
|---|---|---|---|
| `name` | String | required | Trimmed |
| `email` | String | required | Unique, lowercase, trimmed |
| `password` | String | conditional | Required only for `local` provider |
| `googleId` | String | `""` | Google account ID |
| `provider` | String | `"local"` | `"local"` or `"google"` |
| `role` | String | `"user"` | User role |
| `avatar` | String | `""` | URL or base64 data URI |
| `bio` | String | `""` | Trimmed |
| `isVerified` | Boolean | `false` | Email verified status |
| `verificationOTP` | String | `""` | 6-digit verification code |
| `otpExpiry` | Date | `null` | OTP expiration time |
| `otpAttempts` | Number | `0` | Failed OTP attempts counter |
| `createdAt` | Date | auto | Timestamp |
| `updatedAt` | Date | auto | Timestamp |

### Portfolio (`models/portfolio.js`)

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Unique (one portfolio per user) |
| `holdings[]` | Array of objects | See below |
| `chartData[]` | Array of objects | Historical balance snapshots |

**Holding sub-document:**

| Field | Type | Notes |
|---|---|---|
| `coinId` | String | Required, lowercase |
| `symbol` | String | Uppercase |
| `name` | String | Trimmed |
| `quantity` | Number | Min 0 |
| `averageBuyPrice` | Number | Min 0 |
| `currentPrice` | Number | Min 0 |
| `priceChange24h` | Number | Nullable |
| `priceChangePercentage24h` | Number | Nullable |
| `image` | String | Coin image URL |

### Watchlist (`models/watchlist.js`)

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Required |
| `coins[]` | Array of objects | See below |

**Coin sub-document:**

| Field | Type | Notes |
|---|---|---|
| `coinId` | String | Required, lowercase |
| `symbol` | String | Lowercase |
| `name` | String | Trimmed |
| `image` | String | URL |
| `current_price` | Number | Nullable |

### Settings (`models/setting.js`)

| Field | Type | Default | Notes |
|---|---|---|---|
| `userId` | ObjectId | required | One per user |
| `theme` | String | `"dark"` | `"dark"` or `"light"` |
| `compactView` | Boolean | `false` | Compact UI toggle |
| `notifications` | Boolean | `true` | Alert notifications |
| `language` | String | `"fr"` | `"en"`, `"fr"`, or `"ar"` |

---

## Security Measures

### Implemented

| Measure | Description | Location |
|---|---|---|
| **Helmet** | Security headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options) | `server.js` |
| **Rate Limiting** | Prevents brute force on auth, OTP spamming, API abuse | `middleware/rateLimiter.js` |
| **OTP Throttling** | Max 5 failed attempts per code, then locked until resend | `authController.js` |
| **Input Validation** | express-validator on all endpoints | `utils/validators.js` |
| **Password Hashing** | bcrypt with salt rounds of 10 | `authController.js` |
| **JWT Authentication** | Bearer token on all protected routes | `middleware/authMiddleware.js` |
| **CORS** | Restricts origins to `localhost:5173` + `CLIENT_URL` | `server.js` |
| **XSS Protection** | Helmet CSP headers, no dangerous rendering | Global |
| **Open Redirect Prevention** | `getSafeRedirectPath()` validates redirect URLs | `config.js` |
| **Body Size Limit** | 500KB max JSON body (supports small avatars) | `server.js` |
| **CoinGecko ID Validation** | Alphanumeric-only regex prevents injection | `server.js` |
| **Email Enumeration Prevention** | Generic error messages on OTP verification | `authController.js` |

### How Authentication Works

```
1. POST /api/auth/register
   → validates input
   → hashes password
   → generates OTP
   → creates user (isVerified: false)
   → sends email
   → returns JWT token

2. POST /api/auth/verify-otp
   → checks email exists
   → checks not already verified
   → checks attempts < 5
   → validates OTP
   → sets isVerified: true, clears OTP

3. POST /api/auth/login
   → finds user by email
   → compares password with bcrypt
   → checks isVerified (403 if false)
   → returns JWT token

4. Any protected route
   → extract Bearer token from Authorization header
   → verify JWT with JWT_SECRET
   → fetch user from DB
   → attach req.user
   → proceed to handler
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | No | Environment mode (`development` or `production`) | `development` |
| `PORT` | No | Server port (default: 5000) | `5000` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) | `random_string_32+_chars` |
| `CLIENT_URL` | No | Frontend URL for CORS | `http://localhost:5173` |
| `CG_API_KEY` | Yes | CoinGecko API key | `CG-xxxxx` |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret | `GOCSP-xxxxx` |
| `GOOGLE_REDIRECT_URI` | No | Google OAuth redirect (default: `postmessage`) | `postmessage` |
| `RESEND_API_KEY` | Yes | Resend email API key | `re_xxxxx` |
| `VITE_API_URL` | No | Backend URL for frontend (used by frontend `.env`) | `http://localhost:5000` |
| `VITE_WS_URL` | No | Binance WebSocket URL (used by frontend `.env`) | `wss://stream.binance.com:9443/ws` |

### Frontend (`client/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_URL` | No | Backend API URL | `http://localhost:5000` |
| `VITE_WS_URL` | No | Binance WebSocket URL | `wss://stream.binance.com:9443/ws` |

---

## How to Run

### Prerequisites

- Node.js v18+ (v20 LTS recommended)
- MongoDB Atlas account (free tier works)
- Resend account (free tier: 100 emails/day)
- CoinGecko API key (free tier: 10-30 req/min)
- Google OAuth credentials (for Google login)

### Backend Setup

```bash
cd backend
npm install
# Copy .env.example to .env and fill in your values
cp .env.example .env
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
# Copy .env.example to .env
npm run dev
```

### Development URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Backend API root: `http://localhost:5000` (returns "Backend API is running")

### Production Deployment

- **Backend:** Deploy to Render, Railway, or any Node.js host
- **Frontend:** Deploy to Vercel, Netlify, or any static host
- Set `NODE_ENV=production` on the backend
- Configure `CLIENT_URL` to match your frontend domain
- Generate a strong `JWT_SECRET` (use `openssl rand -hex 32`)

---

## File Cleanup Summary (What Was Removed)

The following files were removed during the code review as they were dead/unused:

- `client/src/App.jsx` — Never imported, just a redirect
- `client/src/context/CoinContext.jsx` — Broken (typos, missing imports), unused
- `client/src/components/layout/ThemeToggle.jsx` — Never imported
- `client/src/components/dashboard/TrendingPanel.jsx` — Never imported
- `client/src/components/dashboard/MarketTable.jsx` — Never imported
- `client/src/pages/VerifyEmail.jsx` — Orphaned page, no route defined
- `client/src/router/routes.jsx` — Never imported
- `client/src/data/mockData.jsx` — Never imported
- `backend/config/db.js` — Never imported (MongoDB connects inline in server.js)
