# FinTracker — Complete Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Frontend Structure](#frontend-structure)
4. [Backend Structure](#backend-structure)
5. [Authentication & Session Management](#authentication--session-management)
6. [Email Verification (OTP)](#email-verification-otp)
7. [Theme System (Dark/Light Mode)](#theme-system-darklight-mode)
8. [Currency System](#currency-system)
9. [Features](#features)
10. [API Endpoints](#api-endpoints)
11. [Database Schema](#database-schema)
12. [Security Measures](#security-measures)
13. [CoinGeProxy Caching System](#coingecko-proxy-caching-system)
14. [Avatar Upload (Cloudinary)](#avatar-upload-cloudinary)
15. [Environment Variables](#environment-variables)
16. [How to Run](#how-to-run)
17. [File Cleanup Summary](#file-cleanup-summary)

---

## Overview

FinTracker is a full-stack cryptocurrency portfolio tracking application that allows users to monitor live market data, manage a personal portfolio, maintain a watchlist, set price alerts, and customize their experience with themes and currency preferences.

**Tech Stack:**
- **Frontend:** React 19, Vite, Tailwind CSS, React Router, Recharts (for charts), html2canvas + jsPDF (for PDF export)
- **Backend:** Express.js 5, MongoDB (Mongoose), JWT authentication, Cookie-based sessions
- **External APIs:** CoinGecko (market data), Binance WebSocket (live prices), Google OAuth, Resend (email), Cloudinary (avatar hosting)

---

## Architecture

```
fintracker/
├── client/                     # React SPA (Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── auth/           # AuthModal
│   │   │   ├── dashboard/      # MetricCard, PriceChart
│   │   │   ├── icons/          # Sidebar icons
│   │   │   ├── layout/         # AppLayout, Sidebar, TopBar
│   │   │   ├── settings/       # ProfileCard, ToggleSwitch, etc.
│   │   │   └── shared/         # TabBar, CoinLogo, Badge
│   │   ├── context/            # React Context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Route-level page components
│   │   ├── styles/             # Design tokens
│   │   ├── config.js           # Centralized config & helpers
│   │   ├── main.jsx            # App entry + router
│   │   └── index.css           # Design tokens + CSS utilities
│   ├── .env
│   └── vite.config.js
├── backend/                    # Express API server
│   ├── controllers/            # Request handlers
│   ├── middleware/             # Auth, rate limiting, error handling
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express route definitions
│   ├── utils/                  # Cache, validators, email, tokens, uploads
│   ├── scripts/                # Maintenance scripts
│   ├── server.js               # Server entry point
│   └── .env
└── .env.example                # Environment template
```

### How the App Works (High Level)

1. User signs up → receives email verification OTP → verifies → can log in
2. After login, auth tokens are stored as HttpOnly cookies (not accessible via JS)
3. The app fetches market data from CoinGecko API via backend proxy (cached in-memory)
4. Live prices stream from Binance WebSocket in the browser
5. User can add coins to portfolio (tracks holdings, P&L, allocation)
6. User can add coins to watchlist (only user-chosen coins appear)
7. All settings (theme, currency, language) are persisted in localStorage
8. Portfolio can be exported as CSV or PDF report
9. Avatars are uploaded to Cloudinary — only the URL is stored in MongoDB

---

## Frontend Structure

### Context Providers

The app wraps everything in these providers (in `main.jsx`):

| Provider | File | Purpose |
|---|---|---|
| `GoogleProviderWrapper` | `src/main.jsx` | Dynamically loads Google OAuth Client ID from backend |
| `ThemeProvider` | `src/context/ThemeContext.jsx` | Manages dark/light theme, persists to localStorage |
| `SettingsProvider` | `src/context/SettingsContext.jsx` | User settings (theme, language, notifications, compact view) |
| `CurrencyProvider` | `src/context/CurrencyContext.jsx` | Active currency (USD, EUR, GBP, etc.) |
| `AuthProvider` | `src/context/AuthContext.jsx` | Cookie-based auth, user state, watchlist, login/signup/logout |

### Centralized Config (`src/config.js`)

Single source of truth for:
- `API_URL` — backend base URL
- `AUTH_REDIRECT_KEY` — session storage key for post-login redirects
- `getSafeRedirectPath(path)` — validates redirect URLs (prevents open redirect)
- `getInitials(name)` — extracts initials from a name string
- `getJson(response)` — safely parses JSON with content-type check
- `formatPrice(value, symbol)` — formats numbers as currency (e.g., `$68,250.34`)
- `formatMarketCap(value)` — formats large numbers (e.g., `$1.34T`, `$84.2B`)
- `fetchWithAuth(url, options)` — fetch wrapper with `credentials: 'include'` and auto-refresh on 401

### Pages

| Page | Path | Description |
|---|---|---|
| `Login.jsx` | `/login` | Email/password + Google OAuth login. Shows verification resend if account unverified |
| `Signup.jsx` | `/signup` | Registration form. Redirects to `/verify-pending` on success (stores email in sessionStorage) |
| `VerifyPending.jsx` | `/verify-pending` | 6-digit OTP input. Resend code button. Email input fallback if email is missing from URL |
| `Dashboard.jsx` | `/` | Main dashboard: market metrics, price chart, asset table with pagination, watchlist star column |
| `Portfolio.jsx` | `/portfolio` | Holdings table, balance overview, donut chart (allocation), CSV/PDF export, add asset modal |
| `Watchlist.jsx` | `/watchlist` | User-chosen tracked coins with live prices, add/remove coins, set price alerts inline |
| `Alerts.jsx` | `/alerts` | Dedicated alerts page. Create/edit/delete price alerts with notification triggers |
| `Settings.jsx` | `/settings` | User preferences: currency, theme toggle, notifications, language |
| `Profile.jsx` | `/settings/profile` | Profile editing: name, email, avatar (URL or base64 → Cloudinary), password change |

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

- **Unauthenticated users:** Auth modal pops up when accessing protected routes (`/watchlist`, `/portfolio`, `/alerts`, `/news`, `/settings`)
- **Unverified users:** If `user.isVerified === false`, automatically redirected to `/verify-pending`
- **Loading state:** Shows nothing while auth state is being hydrated from cookies

### Hooks

| Hook | File | Purpose |
|---|---|---|
| `useMarketData` | `hooks/useMarketData.jsx` | Fetches coins, chart data from backend proxy (uses `fetchWithAuth`) |
| `useBinanceWebSocket` | `hooks/useBinanceWebSocket.jsx` | Subscribes to Binance WebSocket streams for real-time price updates |

### How Live Prices Work

1. Dashboard and Watchlist load initial data via `useMarketData` (CoinGecko through backend proxy)
2. `useBinanceWebSocket` opens a WebSocket connection to `wss://stream.binance.com:9443/ws`
3. Subscribes to `<coinId>usdt@trade` streams for each coin in the user's watchlist
4. On each price tick, updates are dispatched to components via callback

---

## Backend Structure

### Server (`server.js`)

**Middleware chain:**
1. `helmet()` — Security headers (CSP, X-Frame, HSTS, etc.)
2. `cors()` — Cross-origin requests (allows `localhost:5173` + `CLIENT_URL`, credentials enabled)
3. `compression()` — Gzip response compression
4. `express.json({ limit: "500kb" })` — JSON body parsing (supports base64 avatars)
5. `cookieParser()` — Parses HttpOnly auth cookies
6. `globalLimiter` — 100 requests per 15 minutes
7. Custom middleware — Sets `X-Content-Type-Options: nosniff`

**Route mounting:**
- `/api/auth` — with `authLimiter` (30 requests/15min)
- `/api/auth/verify-otp` — with `otpLimiter` (5 attempts/15min)
- `/api/auth/resend-otp` — with `otpResendLimiter` (3 resends/10min)
- `/api/portfolio`, `/api/users`, `/api/settings`, `/api/watchlist` — with `apiLimiter` (200/15min)

**CoinGecko Proxy Endpoints (Public + Cached):**
- `GET /coins` — Market list (100 coins by market cap)
- `GET /coins/:coinId` — Single coin details
- `GET /chart/:coinId` — Historical price chart data
- `GET /coins/exchange-rates` — Currency exchange rates
- `GET /search?q=...` — Coin search
- `GET /api/public/coins` — Top 10 coins (lightweight public preview)

All proxy routes use:
- `publicProxyLimiter` — 20 requests per minute per IP
- In-memory cache (see [Caching System](#coingecko-proxy-caching-system))
- No auth required — cached responses prevent CoinGecko API key abuse

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
| `validateOTP` | `POST /api/auth/verify-otp` | Non-empty email, exactly 6 digits |
| `validateResendOTP` | `POST /api/auth/resend-otp` | Non-empty email |
| `validateProfileUpdate` | `PUT /api/users/me` | Name 1-100, valid email, bio max 500, avatar URL or base64 |
| `validatePortfolioAsset` | `POST /api/portfolio` | Valid coinId (alphanumeric), name, symbol, quantity > 0, price > 0 |
| `validateWatchlistItem` | `POST /api/watchlist` | Valid coinId |
| `validateSettings` | `PUT /api/settings/me` | Theme: dark/light/system, Language: en/fr/ar, booleans |
| `validateChartQuery` | `GET /chart/:coinId` | coinId alphanumeric, days 1-365 |
| `handleValidationErrors` | After any validator | Returns 400 with formatted error details |

### Rate Limiting (`middleware/rateLimiter.js`)

| Limiter | Window | Max Requests | Applies To |
|---|---|---|---|
| `globalLimiter` | 15 min | 100 | All requests |
| `authLimiter` | 15 min | 30 | `/api/auth/*` |
| `otpLimiter` | 15 min | 5 | `/api/auth/verify-otp` |
| `otpResendLimiter` | 10 min | 3 | `/api/auth/resend-otp` |
| `apiLimiter` | 15 min | 200 | `/api/portfolio`, `/api/users`, `/api/settings`, `/api/watchlist` |
| `proxyLimiter` | 5 min | 30 | (legacy, unused) |
| `publicProxyLimiter` | 1 min | 20 | All CoinGecko proxy routes |

### CoinGecko Validation

All `/coins/:coinId` and `/chart/:coinId` routes validate the coin ID against `/^[a-z0-9-]+$/i` to prevent injection attacks.

---

## Authentication & Session Management

### Token Strategy

FinTracker uses a dual-token system with **HttpOnly cookies** (never stored in localStorage):

| Token | Lifespan | Cookie Name | Purpose |
|---|---|---|---|
| Access Token | 15 minutes | `token` | Authenticates API requests |
| Refresh Token | 7 days | `refreshToken` | Issues new access tokens |

Both tokens are:
- `httpOnly: true` — JavaScript cannot read them (XSS-safe)
- `secure: true` in production — HTTPS only
- `sameSite: "none"` in production, `"lax"` in development
- `path: "/"` — Available across entire domain

### Registration Flow

1. **User submits signup form** (`POST /api/auth/register`)
   - Name, email, password validated
   - Checks if user already exists
   - Hashes password with bcrypt (salt rounds: 10)
   - Generates 6-digit OTP, sets expiry to 10 minutes
   - Creates user with `isVerified: false`
   - Sends verification email via Resend API
   - Creates user settings document
   - Sets access + refresh token cookies
   - Returns user data

2. **Redirect to `/verify-pending`** with email in query params AND stored in `sessionStorage`

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
   - If verified: creates new access + refresh token pair
   - Sets both as HttpOnly cookies
   - Returns user data

2. **Frontend hydrates user** by calling `GET /api/auth/me` (cookies sent automatically)
3. **Loads watchlist** by calling `GET /api/watchlist`

### Google OAuth

1. `GoogleProviderWrapper` fetches `clientId` from `GET /api/auth/google/config`
2. User clicks "Continue with Google"
3. Google login flow returns authorization code
4. Code sent to `POST /api/auth/google`
5. Backend verifies with Google, finds or creates user
6. Google users are auto-verified (Google already verified the email)
7. Sets access + refresh token cookies

### Refresh Token Flow

1. Access token expires after 15 minutes → request returns 401
2. Frontend (`fetchWithAuth` or `AuthContext`) automatically calls `POST /api/auth/refresh`
3. Backend reads `refreshToken` cookie
4. Hashes it (SHA-256), looks up in `RefreshToken` collection
5. If valid and not expired:
   - Generates NEW access + refresh tokens (rotation)
   - Deletes old refresh token from DB
   - Sets new cookies
6. If invalid: clears cookies, returns 403 (user must log in again)

### Logout

1. `POST /api/auth/logout`
2. Deletes refresh token from MongoDB (by hash)
3. Clears both `token` and `refreshToken` cookies
4. Returns success message

### Account Deletion

1. `DELETE /api/auth/account` (protected)
2. Deletes all refresh tokens, settings, watchlist, portfolio for user
3. Deletes user document
4. Clears cookies

### Password Change

- Requires `currentPassword`, `newPassword`, `confirmPassword`
- Validates current password with bcrypt.compare
- Enforces 6-char minimum on new password
- Not available for Google-authenticated accounts

---

## Email Verification (OTP)

- 6-digit numeric code generated on signup and resend
- Expires after 10 minutes
- Max 5 failed attempts per code (then locked until resend)
- OTP stored directly on User document (`verificationOTP`, `otpExpiry`, `otpAttempts`)
- Sent via Resend API (`sendVerificationEmail`)
- Google OAuth users skip verification (auto-verified)

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
  --bg-base: 248, 249, 250;
  --bg-surface: 243, 245, 247;
  --text-primary: 33, 37, 41;
  --text-secondary: 75, 85, 99;
  --color-primary: 37, 99, 235;
  --color-danger: 190, 24, 33;
  --color-success: 22, 101, 52;
}

/* Dark Theme (when .dark class is on <html>) */
.dark {
  --bg-base: 13, 17, 23;
  --bg-surface: 22, 27, 34;
  --text-primary: 230, 237, 243;
  --text-secondary: 201, 209, 217;
  --color-primary: 59, 130, 246;
  --color-danger: 248, 81, 73;
  --color-success: 63, 185, 80;
}
```

Components use Tailwind utility classes like `bg-base`, `text-primary`, `border-default` — these automatically adapt because the CSS variables change when the `.dark` class is toggled.

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

- **Market Metrics Cards:** Total market cap, 24h volume, BTC dominance, Fear & Greed index, BTC ATH, Global cap
- **Price Chart:** Recharts line chart showing historical prices. Supports time ranges: 24H, 7D, 1M, 1Y, All
- **Asset Table:** Paginated table of top 100 coins with columns: Rank, Watchlist (star), Name, Price, 1h%, 7d%, 24h%, Market Cap, Volume, ATH, ATH Change %, ATL
- **Column Customization:** Toggle visibility of columns via column menu
- **Filter:** Dropdown to filter by All, Trending, Gainers, Losers, New
- **Search:** Filter coins by name or symbol
- **Watchlist Star:** Click star to add/remove from user's watchlist (requires login)
- **Live Prices:** Updated via Binance WebSocket in real-time with flash indicators

### Portfolio (`/portfolio`)

- **Balance Overview:** Total balance, invested amount, 24h P&L, all-time P&L with percentages
- **Asset Allocation Donut Chart:** Recharts pie chart showing portfolio distribution (top 4 + "Others")
- **Holdings Table:** Rank, name, quantity, avg buy price, current price, value, P&L, 24h change, day P&L
- **Add Asset Modal:** Search for coin, select, enter amount. Automatically uses current market price as buy price
- **Export:** CSV file download or PDF report (using html2canvas + jsPDF)
- **Empty State:** Helpful message when no holdings exist

### Watchlist (`/watchlist`)

- **User-Chosen Coins Only:** Only coins the user explicitly added from Dashboard or via "Add Asset" modal
- **Live Prices:** Real-time price updates via Binance WebSocket
- **Add/Remove:** Add coins via search modal, remove with confirmation dialog
- **Price Alerts:** Set target prices inline with condition (above/below). Triggers in-app notification and email
- **Stats:** Total value, gainers/losers count, best/worst performer
- **Pagination:** 8 items per page with filter options
- **Column Customization:** Toggle visibility of columns

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
- **Avatar:** URL string or base64 data URI (uploaded to Cloudinary automatically)
- **Password Change:** Current password verification + new password (min 6 chars)
- **Account Deletion:** Removes all user data (portfolio, watchlist, settings, user document)

---

## API Endpoints

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register new user (sends OTP email) |
| `POST` | `/api/auth/login` | No | Login with email/password |
| `POST` | `/api/auth/google` | No | Google OAuth login |
| `POST` | `/api/auth/refresh` | No | Refresh access token using refresh cookie |
| `POST` | `/api/auth/logout` | No | Logout (deletes refresh token + clears cookies) |
| `GET` | `/api/auth/me` | Yes | Get current user profile |
| `POST` | `/api/auth/verify-otp` | No | Verify email with 6-digit code |
| `POST` | `/api/auth/resend-otp` | No | Resend verification code |
| `DELETE` | `/api/auth/account` | Yes | Delete account and all user data |
| `GET` | `/api/auth/google/config` | No | Get Google Client ID for frontend |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | Yes | Get current user |
| `GET` | `/api/users/profile` | Yes | Alias for GET /me |
| `PUT` | `/api/users/me` | Yes | Update profile (name, email, avatar, password) |
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

### CoinGecko Proxy (Public + Cached)

| Method | Path | Cache TTL | Description |
|---|---|---|---|
| `GET` | `/coins` | 60s | Get top 100 market coins (supports `?ids=` filter) |
| `GET` | `/coins/:coinId` | 60s | Get single coin details |
| `GET` | `/chart/:coinId` | 300s | Get historical chart data (supports `?days=`) |
| `GET` | `/coins/exchange-rates` | 3600s | Get currency exchange rates |
| `GET` | `/search?q=` | 120s | Search coins by name |
| `GET` | `/api/public/coins` | 60s | Top 10 coins (lightweight public preview) |

All proxy routes use `publicProxyLimiter` (20 req/min per IP) — no auth required.

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
| `avatar` | String | `""` | Cloudinary URL or empty string (max 500 chars) |
| `bio` | String | `""` | Trimmed |
| `isVerified` | Boolean | `false` | Email verified status |
| `verificationOTP` | String | `""` | 6-digit verification code |
| `otpExpiry` | Date | `null` | OTP expiration time |
| `otpAttempts` | Number | `0` | Failed OTP attempts counter |
| `createdAt` | Date | auto | Timestamp |
| `updatedAt` | Date | auto | Timestamp |

### RefreshToken (`models/refreshToken.js`)

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Reference to User |
| `tokenHash` | String | SHA-256 hash of raw refresh token (indexed) |
| `userAgent` | String | Browser user agent |
| `isRevoked` | Boolean | Revocation flag |
| `createdAt` | Date | Auto, with TTL index (7 days auto-delete) |

TTL index: `{ createdAt: 1, expireAfterSeconds: 7 * 24 * 60 * 60 }`

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
| **CORS** | Restricts origins to `localhost:5173` + `CLIENT_URL`, credentials enabled | `server.js` |
| **Cookie-Parser** | Parses HttpOnly auth cookies | `server.js` |
| **Rate Limiting** | Prevents brute force on auth, OTP spamming, API abuse, proxy exhaustion | `middleware/rateLimiter.js` |
| **OTP Throttling** | Max 5 failed attempts per code, then locked until resend | `authController.js` |
| **Input Validation** | express-validator on all endpoints | `utils/validators.js` |
| **Password Hashing** | bcrypt with salt rounds of 10 | `authController.js` |
| **HttpOnly Cookies** | JWT tokens stored in HttpOnly cookies (not localStorage) — XSS safe | `authController.js` |
| **Refresh Token Rotation** | Each refresh invalidates the old token — stolen tokens are unusable | `authController.js` |
| **Hashed Refresh Tokens** | SHA-256 hash stored in DB, never the raw token | `authController.js` |
| **Short-Lived Access Tokens** | 15-minute expiry limits damage window | `generateToken.js` |
| **XSS Protection** | Helmet CSP headers, no dangerous rendering | Global |
| **Open Redirect Prevention** | `getSafeRedirectPath()` validates redirect URLs | `config.js` |
| **Body Size Limit** | 500KB max JSON body (supports small avatars) | `server.js` |
| **CoinGecko ID Validation** | Alphanumeric-only regex prevents injection | `server.js` |
| **Email Enumeration Prevention** | Generic error messages on OTP verification | `authController.js` |
| **Avatar Cloudinary Upload** | Base64 never stored in MongoDB — only Cloudinary URL | `uploadAvatar.js` |
| **In-Memory Cache** | Prevents CoinGecko API key abuse from rapid unauthenticated requests | `utils/cache.js` |

### Authentication Flow

```
1. POST /api/auth/register
   → validates input
   → hashes password
   → generates OTP
   → creates user (isVerified: false)
   → sends email
   → sets access + refresh token cookies

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
   → creates new access + refresh token pair
   → sets both as HttpOnly cookies

4. Any protected route
   → reads token from req.cookies.token (cookie only, no Bearer fallback)
   → verifies JWT with JWT_SECRET
   → fetches user from DB
   → attaches req.user
   → proceeds to handler

5. Access token expired (401)
   → frontend calls POST /api/auth/refresh
   → backend reads refreshToken cookie
   → hashes it, looks up in DB
   → if valid: issues NEW access + refresh tokens (rotation)
   → if invalid: clears cookies, returns 403

6. POST /api/auth/logout
   → deletes refresh token from DB
   → clears both cookies
```

---

## CoinGecko Proxy Caching System

### Purpose

CoinGecko free tier allows ~30 req/min. All proxy routes are public (no auth), so a caching layer prevents API key abuse while keeping data reasonably fresh.

### Implementation (`utils/cache.js`)

```js
const store = new Map();

export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key, data, ttlSeconds) {
  store.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}
```

### Cache Keys & TTLs

| Route | Cache Key | TTL | Rationale |
|---|---|---|---|
| `/coins` | `coins_list` or `coins_list_{ids}_{currency}` | 60s (30s for filtered) | Market data changes frequently |
| `/coins/:coinId` | `coin_{coinId}_{currency}` | 60s | Single coin details |
| `/chart/:coinId` | `chart_{coinId}_{days}_{currency}` | 300s | Historical chart — 5 min is fine |
| `/coins/exchange-rates` | `exchange_rates` | 3600s | Exchange rates rarely change |
| `/search?q=` | `search_{query}` | 120s | Search results — 2 min |
| `/api/public/coins` | `coins_list_public` | 60s | Public preview |

### Rate Limiting

All proxy routes use `publicProxyLimiter`:
- **20 requests per minute per IP**
- Combined with caching, this means even a cold cache only triggers 20 real CoinGecko fetches per minute per IP

### Future Upgrade Path

If the app scales beyond a single server, replace the Map-based cache with Redis using `ioredis`. The `getCache`/`setCache` interface stays identical — only the implementation changes (~20 lines).

---

## Avatar Upload (Cloudinary)

### Flow

1. Frontend sends base64 data URI (`data:image/png;base64,...`) or URL string
2. Backend validator accepts both formats
3. In `updateProfile` controller:
   - If base64: uploads to Cloudinary → stores returned URL in MongoDB
   - If URL string: stores as-is
   - If empty: deletes from Cloudinary (if applicable) and clears field
4. MongoDB only stores the Cloudinary URL (max 500 chars), never base64

### Configuration (`utils/uploadAvatar.js`)

- Cloudinary initialized lazily (to avoid ES module import hoisting before `dotenv.config()`)
- Folder: `fintracker/avatars`
- Transformations: 400x400 crop, face gravity, auto quality/format
- `deleteAvatar` removes old avatar from Cloudinary when updating

### Environment Variables Required

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | No | Environment mode | `development` |
| `PORT` | No | Server port (default: 5000) | `5000` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Yes | JWT signing secret | `random_string_32+_chars` |
| `CLIENT_URL` | No | Frontend URL for CORS | `http://localhost:5173` |
| `CG_API_KEY` | Yes | CoinGecko API key | `CG-xxxxx` |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret | `GOCSP-xxxxx` |
| `GOOGLE_REDIRECT_URI` | No | Google OAuth redirect | `postmessage` |
| `RESEND_API_KEY` | Yes | Resend email API key | `re_xxxxx` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account name | `dnlfuymxo` |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret | `AbCdEfGhIjKlMnOp` |

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
- Cloudinary account (free tier: 25 GB storage, 25 GB bandwidth/month)

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
npm run dev
```

### Development URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Backend API root: `http://localhost:5000` (returns "Backend API is running")

---

## File Cleanup Summary

The following files were removed as they were dead/unused:

- `client/src/App.jsx` — Never imported, just a redirect
- `client/src/context/CoinContext.jsx` — Broken (typos, missing imports), unused
- `client/src/components/layout/ThemeToggle.jsx` — Never imported
- `client/src/components/dashboard/TrendingPanel.jsx` — Never imported
- `client/src/components/dashboard/MarketTable.jsx` — Never imported
- `client/src/pages/VerifyEmail.jsx` — Orphaned page, no route defined
- `client/src/router/routes.jsx` — Never imported
- `client/src/data/mockData.jsx` — Never imported
- `backend/config/db.js` — Never imported (MongoDB connects inline in server.js)
- `backend/render.yaml` — Deployment file (removed)
- `backend/Procfile` — Deployment file (removed)
- `client/vercel.json` — Deployment file (removed)
