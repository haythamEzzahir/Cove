# Cove — Complete Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Frontend Structure](#frontend-structure)
4. [Backend Structure](#backend-structure)
5. [Authentication & Session Management](#authentication--session-management)
6. [Email Verification (OTP)](#email-verification-otp)
7. [Theme System (Dark/Light Mode)](#theme-system-darklight-mode)
8. [Currency System](#currency-system)
9. [Pages & Features](#pages--features)
10. [Key Components & Hooks](#key-components--hooks)
11. [API Endpoints](#api-endpoints)
12. [Database Schema](#database-schema)
13. [Security Measures](#security-measures)
14. [CoinGecko Proxy & Caching](#coingecko-proxy--caching)
15. [Avatar Upload (Cloudinary)](#avatar-upload-cloudinary)
16. [Environment Variables](#environment-variables)
17. [How to Run](#how-to-run)

---

## Overview

Cove is a full-stack cryptocurrency tracking application. Users can browse live market data, manage a portfolio, maintain a watchlist with real-time prices, set price alerts, and customize themes/currencies.

**Tech Stack:**
- **Frontend:** React 19, Vite 6, Tailwind CSS, React Router v6, Recharts, jsPDF + html2canvas
- **Backend:** Express.js 5, MongoDB (Mongoose), JWT (HttpOnly cookies)
- **External APIs:** CoinGecko (market data), Binance WebSocket (live prices), Google OAuth, Resend (email), Cloudinary (avatars)

---

## Architecture

```
cove/
├── client/                     # React SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/           # AuthModal — login/signup overlay
│   │   │   ├── dashboard/      # MetricCard, PriceChart, WalletChart
│   │   │   ├── icons/          # SVG icon components for sidebar
│   │   │   ├── layout/         # AppLayout, Sidebar, TopBar
│   │   │   ├── settings/       # CurrencySelect, ProfileCard, SettingItem, ToggleSwitch
│   │   │   └── shared/         # Badge, CoinLogo, TabBar
│   │   ├── context/            # AuthContext, CurrencyContext, SettingsContext, ThemeContext
│   │   ├── hooks/              # useMarketData, useBinanceWebSocket
│   │   ├── pages/              # Landing, Markets, Watchlist, Portfolio, Alerts, Settings, etc.
│   │   ├── styles/             # Design tokens (colors, radius, fontSize)
│   │   ├── config.js           # Centralized config — API_URL, formatPrice, fetchWithAuth
│   │   ├── main.jsx            # Entry + React Router config
│   │   └── index.css           # CSS variables (dark/light) + semantic utility classes
│   ├── public/favicon.svg      # Cove logo SVG
│   ├── .env
│   └── vite.config.js
├── backend/                    # Express API server
│   ├── controllers/            # auth, market, portfolio, user, watchlist, settings
│   ├── middleware/             # authMiddleware (JWT verify), errorHandler, rateLimiter
│   ├── models/                 # Mongoose schemas: user, refreshToken, portfolio, watchlist, setting
│   ├── routes/                 # Express route definitions
│   ├── utils/                  # cache (Map-based), generateToken (JWT), sendEmail (Resend), uploadAvatar (Cloudinary), validators (express-validator)
│   ├── scripts/                # mergeDuplicatePortfolios
│   ├── server.js               # Entry point — middleware chain + route mounting
│   └── .env
└── .env.example
```

### High-Level Data Flow

1. **Landing page** (`/`) — static hero with live ticker tape animation, no API calls
2. **Markets** (`/markets`) — `useMarketData` fetches top 100 coins from backend proxy (`GET /coins`), which proxies CoinGecko with 60s in-memory cache. Price chart fetches from `GET /chart/:coinId` with 300s cache
3. **Watchlist** (`/watchlist`) — fetches user's saved coins from `GET /api/watchlist`, then opens Binance WebSocket for real-time price updates (only on this page)
4. **Portfolio** (`/portfolio`) — CRUD operations on `GET/POST /api/portfolio`, PDF/CSV export client-side
5. **Alerts** (`/alerts`) — price checks on frontend, email trigger via `POST /api/alerts/trigger`
6. **Auth** — all auth routes under `/api/auth/*`, dual HttpOnly cookie system

---

## Frontend Structure

### Context Providers (wrapping order in `main.jsx`)

| Provider | File | Purpose |
|---|---|---|
| `ThemeProvider` | `ThemeContext.jsx` | Dark/light theme, persists to localStorage, toggles `.dark` class on `<html>` |
| `SettingsProvider` | `SettingsContext.jsx` | User preferences (compactView, priceAlerts, portfolioSummary) |
| `CurrencyProvider` | `CurrencyContext.jsx` | Active currency (usd/eur/gbp/jpy/aed/sar/egp), persists to localStorage |
| `AuthProvider` | `AuthContext.jsx` | Cookie-based auth, user state, watchlist management, login/signup/logout |
| `GoogleProviderWrapper` | `main.jsx` (inline) | Dynamically loads Google OAuth Client ID from backend |

### Routing (`main.jsx`)

```
createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/verify-pending', element: <VerifyPending /> },
  { path: '/', element: <AppLayout />, children: [
    { index: true, element: <Landing /> },       // No sidebar, full-screen
    { path: 'markets', element: <Markets /> },
    { path: 'watchlist', element: <Watchlist /> },
    { path: 'portfolio', element: <Portfolio /> },
    { path: 'alerts', element: <Alerts /> },
    { path: 'settings', element: <Settings /> },
    { path: 'settings/profile', element: <Profile /> },
  ]},
])
```

**Route protection** (`AppLayout.jsx`):
- `AppLayout` checks `location.pathname === '/'` and renders `<Outlet />` alone (no sidebar/TopBar for the Landing page)
- Protected routes (`/watchlist`, `/portfolio`, `/alerts`, `/settings`) show an auth modal if `!user`
- Unverified users are redirected to `/verify-pending`

### Centralized Config (`config.js`)

| Export | Purpose |
|---|---|
| `API_URL` | Backend base URL (from `VITE_API_URL` env) |
| `getSafeRedirectPath` | Prevents open redirect attacks |
| `getInitials(name)` | Extracts initials (e.g., "John Doe" → "JD") |
| `formatPrice(value, symbol)` | Formats as currency — handles large/small values |
| `formatMarketCap(value)` | Formats large numbers (1.34T, 84.2B, 5.1M) |
| `fetchWithAuth(url, options)` | Fetch with `credentials: 'include'`, auto-refreshes on 401 |

### Key Components

#### AppLayout (`components/layout/AppLayout.jsx`)
- Renders Sidebar (desktop) + TopBar + `<Outlet />`
- Handles sidebar collapse state (persisted to localStorage)
- Shows AuthModal overlay for unauthenticated users on protected routes
- Detects mobile (< 1024px) for responsive sidebar behavior

#### Sidebar (`components/layout/Sidebar.jsx`)
- Fixed left column: `56px` (collapsed) or `220px` (expanded)
- Logo SVG (cove + dot) is clickable → navigates to `/`
- Nav items: Markets, Watchlist, Portfolio, Alerts (each with SVG icon)
- "Upgrade to Pro" card with emerald gradient
- Logout button (visible when authenticated), Settings link at bottom
- Collapse button (chevron icon) in header

#### TopBar (`components/layout/TopBar.jsx`)
- Fixed height `h-14` (56px) matching Sidebar header
- Page title + optional subtitle (from `PAGE_DATA` in AppLayout)
- Currency selector dropdown
- Theme toggle (dark/light)
- Notification bell → navigates to `/alerts`
- User avatar (clickable → `/settings/profile`) or Sign In/Sign Up buttons

### Pages

| Page | Path | Description |
|---|---|---|
| `Landing.jsx` | `/` | Full-screen hero with scrolling ticker tape (BTC/ETH/etc.), split layout: left has headline + CTA + stats, right has 3D staggered card stack (BTC chart, watchlist preview, alert) with parallax tilt on mouse move. No sidebar. |
| `Markets.jsx` | `/markets` | Price chart (Recharts area chart with 1D/7D/1M/1Y/All tabs), 6 metric cards (market cap, volume, BTC dominance, Fear & Greed, BTC ATH, global cap), sortable/filterable coin table with 30 items/page, search, column visibility toggles, filter dropdown (All/Trending/Gainers/Losers/New). Data from `useMarketData`. |
| `Watchlist.jsx` | `/watchlist` | User's starred coins only. Live prices via Binance WebSocket. Stats bar (total value, gainers/losers, best/worst). Set price alerts inline. Add/remove coins. Customizable columns, pagination. |
| `Portfolio.jsx` | `/portfolio` | Holdings table with rank, name, quantity, avg buy price, current price, value, P&L, 24h change. Donut chart of allocation. Add asset modal (search coins). CSV + PDF export. |
| `Alerts.jsx` | `/alerts` | List of price alerts with status. Create/edit/delete alerts. Email trigger on threshold. |
| `Settings.jsx` | `/settings` | Profile card, dark mode toggle, compact view, notification toggles (price alerts, portfolio summary), currency selector (uses `CurrencyContext` directly). |
| `Profile.jsx` | `/settings/profile` | Edit name, email, avatar (base64 → Cloudinary), change password, delete account. |
| `Login.jsx` | `/login` | Email/password + Google OAuth. Shows resend verification link if unverified. |
| `Signup.jsx` | `/signup` | Registration form. Creates account with `isVerified: false`, sends OTP, redirects to `/verify-pending`. |
| `VerifyPending.jsx` | `/verify-pending` | 6-digit OTP input with resend button. Puts email in sessionStorage as fallback. |

---

## Hooks

### useMarketData (`hooks/useMarketData.jsx`)

Central hook for the Markets page.

**State:**
- `metrics[]` — 6 metric card values (market cap, volume, BTC dominance, Fear & Greed, BTC ATH, global cap)
- `chartData[]` — formatted price history for the featured coin
- `chartPeriod` — currently active time range string
- `featuredCoin` — currently selected coin (defaults to #1 by market cap)
- `trendingCoins` — top 4 coins for preview
- `assets[]` — all coins with formatted prices, market caps, direction indicators
- `loading`, `error`

**Key functions:**

| Function | Purpose |
|---|---|
| `fetchChartData(period, coinId?)` | Fetches chart data from backend proxy. Uses `chartCacheRef` to cache results keyed by `coinId_period_currency` — switching between already-viewed periods is instant. Samples raw data to ~48-80 points depending on range. |
| `selectCoin(coin)` | Changes featured coin and resets chart. Fetches 7D chart for the new coin. |
| `formatPrice(price)` | Formats a number with the active currency symbol |
| `formatMarketCap(cap)` | Formats large numbers (T/B/M suffixes) |

**Data flow:**
1. `useEffect` on mount/currency change fetches top 100 coins from backend
2. Computes derived metrics (total market cap, BTC dominance, etc.)
3. Formats all prices using active currency

### useBinanceWebSocket (`hooks/useBinanceWebSocket.jsx`)

Opens a WebSocket connection to Binance for real-time price updates.

**Usage (only in Watchlist):**
```js
const { isConnected } = useBinanceWebSocket(
  coins.map(c => ({ ticker: c.symbol, coinId: c.id })),
  handlePriceUpdate,
  currency
);
```

**How it works:**
1. Builds stream names from coin tickers + currency quote (`btcusdt@trade`, `ethusdt@trade`, etc.)
2. Subscribes via Binance combined streams (`wss://stream.binance.com:9443/stream`)
3. On each `@trade` event, extracts price and calls `onPriceUpdateRef.current(coinId, price)`
4. Uses `useRef` for the callback to avoid re-subscribing when the callback changes
5. Reconnects with 5s delay on disconnect
6. Connection key (`streamKey`) is derived from sorted unique streams via `useMemo`

---

## Backend Structure

### Server (`server.js`)

**Middleware chain (in order):**
1. `helmet()` — Security headers (CSP, X-Frame-Options, HSTS, etc.)
2. `cors()` — Allows `localhost:5173` + `CLIENT_URL`, credentials enabled
3. `compression()` — Gzip response compression
4. `express.json({ limit: "500kb" })` — JSON body parsing
5. `cookieParser()` — Parses HttpOnly auth cookies
6. `globalLimiter` — 100 requests per 15 minutes
7. Custom `nosniff` header middleware
8. Error handler (last)
9. 404 handler (last)

**Route mounting:**
| Prefix | Rate Limiter |
|---|---|
| `/api/auth` | `authLimiter` (30/15min) |
| `/api/auth/verify-otp` | `otpLimiter` (5/15min) |
| `/api/auth/resend-otp` | `otpResendLimiter` (3/10min) |
| `/api/portfolio`, `/api/users`, `/api/settings`, `/api/watchlist` | `apiLimiter` (200/15min) |
| `/coins`, `/chart`, `/search`, `/api/public/coins` | `publicProxyLimiter` (20/1min per IP) |

### Controllers

| Controller | Key Functions |
|---|---|
| `authController.js` | `register`, `login`, `googleAuth`, `refreshToken`, `logout`, `verifyOTP`, `resendOTP`, `getMe`, `deleteAccount` |
| `marketController.js` | `getCoins` (list), `getCoin` (single), `getChart`, `getExchangeRates`, `searchCoins`, `getPublicCoins` — all proxy CoinGecko with caching |
| `portfolioController.js` | `getPortfolio`, `addAsset` (upserts holding — merges if same coinId) |
| `watchlistController.js` | `getWatchlist`, `addCoin`, `removeCoin` |
| `userController.js` | `updateProfile` (handles base64 → Cloudinary upload), `getProfile` |
| `settingController.js` | `getSettings`, `updateSettings` |

### Input Validation (`utils/validators.js`)

Uses `express-validator`:

| Validator | Endpoint | Rules |
|---|---|---|
| `validateRegistration` | `POST /register` | Name 1-100, valid email, password 8-128 |
| `validateLogin` | `POST /login` | Valid email, non-empty password |
| `validateOTP` | `POST /verify-otp` | Non-empty email, exactly 6 digits |
| `validateResendOTP` | `POST /resend-otp` | Non-empty email |
| `validateProfileUpdate` | `PUT /users/me` | Name 1-100, valid email, bio max 500, avatar URL or base64 |
| `validatePortfolioAsset` | `POST /portfolio` | Valid coinId, name, symbol, quantity > 0, price > 0 |
| `validateWatchlistItem` | `POST /watchlist` | Valid coinId |
| `validateSettings` | `PUT /settings/me` | Theme: dark/light, language: en/fr/ar, booleans |
| `validateChartQuery` | `GET /chart/:coinId` | coinId alphanumeric, days 1-365 |

### Rate Limiters (`middleware/rateLimiter.js`)

| Limiter | Window | Max | Applies To |
|---|---|---|---|
| `globalLimiter` | 15 min | 100 | All routes |
| `authLimiter` | 15 min | 30 | `/api/auth/*` |
| `otpLimiter` | 15 min | 5 | OTP verification |
| `otpResendLimiter` | 10 min | 3 | OTP resend |
| `apiLimiter` | 15 min | 200 | Portfolio, users, settings, watchlist |
| `publicProxyLimiter` | 1 min | 20 | CoinGecko proxy routes |

---

## Authentication & Session Management

### Token Strategy

Dual HttpOnly cookies (never accessible via JavaScript — XSS-safe):

| Token | Lifespan | Cookie Name |
|---|---|---|
| Access Token | 15 minutes | `token` |
| Refresh Token | 7 days | `refreshToken` |

Cookie settings: `httpOnly: true`, `secure: true` in production, `sameSite: "lax"` (dev) / `"none"` (prod).

### Auth Flow

```
1. Register → POST /api/auth/register
   - Validates input → hashes password (bcrypt, 10 rounds)
   - Generates 6-digit OTP (10 min expiry)
   - Creates user (isVerified: false)
   - Sends email via Resend
   - Sets access + refresh token cookies

2. Verify OTP → POST /api/auth/verify-otp
   - Checks email exists
   - Max 5 attempts per OTP (locks until resend)
   - Validates OTP match + expiry
   - Sets isVerified: true, clears OTP

3. Login → POST /api/auth/login
   - Validates credentials
   - Checks isVerified (403 if false)
   - Creates new access + refresh tokens
   - Sets both as HttpOnly cookies

4. Protected route access
   - Reads token from req.cookies.token
   - Verifies JWT with JWT_SECRET
   - Attaches req.user

5. Token refresh → POST /api/auth/refresh
   - Triggered automatically on 401 (fetchWithAuth or AuthContext)
   - Reads refreshToken cookie
   - SHA-256 hashes it → looks up in RefreshToken collection
   - If valid: rotates (new access + refresh tokens, deletes old)
   - If invalid: clears cookies, returns 403

6. Logout → POST /api/auth/logout
   - Deletes refresh token from DB
   - Clears both cookies

7. Google OAuth
   - Frontend fetches clientId from GET /api/auth/google/config
   - Google login returns auth code
   - POST /api/auth/google verifies + creates/finds user
   - Google users auto-verified (Google verified email)
   - Sets access + refresh token cookies
```

### Account Deletion

`DELETE /api/auth/account` — deletes all user data: refresh tokens, settings, watchlist, portfolio, user document. Clears cookies.

### Password Change

Requires current password verification (bcrypt.compare). Not available for Google accounts. Enforces 6-char minimum.

---

## Email Verification (OTP)

- 6-digit numeric code, expires after 10 minutes
- Max 5 failed attempts per code (locked until resend)
- OTP stored on User document (`verificationOTP`, `otpExpiry`, `otpAttempts`)
- Sent via Resend API (`sendVerificationEmail`)
- Google OAuth users are auto-verified

---

## Theme System (Dark/Light Mode)

### Implementation (`ThemeContext.jsx`)

1. Default: `"dark"` (stored in localStorage as `fintracker_theme`)
2. On theme change: toggles `.dark` class on `<html>`, persists to localStorage
3. Listens for OS `prefers-color-scheme` changes

### CSS Variables (`index.css`)

All colors are CSS custom properties in RGB format. The `.dark` class overrides them:

```css
:root { /* Light theme */
  --bg-base: 248, 249, 250;
  --bg-surface: 243, 245, 247;
  --text-primary: 33, 37, 41;
  --color-primary: 5, 150, 105;       /* emerald-600 */
  --color-success: 22, 101, 52;
  --color-danger: 190, 24, 33;
}

.dark { /* Dark theme — zinc palette */
  --bg-base: 0, 0, 0;                 /* black */
  --bg-surface: 18, 18, 20;           /* near-black */
  --bg-overlay: 30, 30, 33;           /* zinc-900 */
  --text-primary: 250, 250, 250;
  --text-muted: 113, 113, 122;        /* zinc-500 */
  --border-default: 63, 63, 70;       /* zinc-700 */
  --color-primary: 16, 185, 129;      /* emerald-500 */
}
```

Components use semantic classes: `bg-base`, `bg-surface`, `text-primary`, `text-muted`, `border-default`, `bg-accent`, `text-accent` — defined as CSS utilities in `index.css`.

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

1. Stored in localStorage as `fintracker_currency`
2. Currency selector in **Settings** page calls `setCurrency()` from `CurrencyContext` directly (not SettingsContext)
3. TopBar currency dropdown also uses `useCurrency()` — they stay in sync
4. All CoinGecko API calls pass `?currency=<code>` query parameter
5. Price formatting uses `formatPrice(value, symbol)` and `formatMarketCap(value)` from `config.js`

---

## Pages & Features

### Landing (`/`)
- Scrolling ticker tape at top showing BTC/ETH/SOL/etc prices
- Split hero: left has live status badge, "stop guessing, start *watching*" headline, stats row (2.4M+ coins, $4.2B volume, 99.9% uptime), two CTAs (Explore Markets, Create Account)
- Right side: 3D card stack (BTC mini chart, watchlist cards, alert card) with mouse-follow parallax rotation
- Feature grid with tags (60+ exchanges, unlimited, multi-wallet, push + email)
- Custom cursor dot, zinc-based dark palette

### Markets (`/markets`)
- **PriceChart** — Recharts `AreaChart` with linear gradient fill. Time tabs: 1D, 7D, 1M, 1Y, All. Data cached per `coinId_period_currency` so switching tabs is instant after first load. Line color: `#10b981` (emerald-500)
- **Metric Cards** — 6 cards in a 3x2 grid: Market Cap, 24h Volume, BTC Dominance, Fear & Greed, BTC ATH, Global Cap
- **Asset Table** — CSS grid with configurable columns. Search by name/symbol. Filters: All, Trending, Gainers, Losers, New. Pagination: 30 items/page. Column visibility menu
- **Watchlist star** — click to add/remove from watchlist (requires auth)

### Watchlist (`/watchlist`)
- Only coins user explicitly added (fetched from `GET /api/watchlist`)
- **Live prices** via `useBinanceWebSocket` — updates prices in real-time with direction indicators
- Stats: total value, gainers count, losers count, best/worst performer
- Set price alerts inline with condition (above/below target)
- Add coins via search modal, remove with confirmation
- 8 items per page, customizable columns

### Portfolio (`/portfolio`)
- Balance overview: total, invested, 24h P&L, all-time P&L
- Allocation donut chart (top 4 coins + "Others")
- Holdings table with all columns
- Add asset modal: search coin → enter quantity → uses current market price as buy price
- CSV export + PDF report (jsPDF + html2canvas)

### Alerts (`/alerts`)
- List of price alerts with status (active/triggered)
- Create: select coin, target price, condition (above/below)
- Edit/delete individual alerts, delete all
- Email notification when triggered

### Settings (`/settings`)
- Profile card → links to `/settings/profile`
- Dark mode toggle
- Compact view toggle
- Notification toggles (price alerts, portfolio summary)
- Currency selector (drives `CurrencyContext` directly)

---

## API Endpoints

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register + send OTP email |
| `POST` | `/api/auth/login` | No | Login with email/password |
| `POST` | `/api/auth/google` | No | Google OAuth |
| `POST` | `/api/auth/refresh` | No | Refresh token rotation |
| `POST` | `/api/auth/logout` | No | Clear cookies + delete refresh token |
| `GET` | `/api/auth/me` | Yes | Current user from DB |
| `POST` | `/api/auth/verify-otp` | No | 6-digit OTP verification |
| `POST` | `/api/auth/resend-otp` | No | Resend OTP email |
| `DELETE` | `/api/auth/account` | Yes | Delete all user data |
| `GET` | `/api/auth/google/config` | No | Google Client ID for frontend |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | Yes | Get user profile |
| `PUT` | `/api/users/me` | Yes | Update name, email, avatar, password |

### Portfolio

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/portfolio` | Yes | Get holdings + chart data |
| `POST` | `/api/portfolio` | Yes | Add/merge asset holding |

### Watchlist

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/watchlist` | Yes | Get watchlist coins |
| `POST` | `/api/watchlist` | Yes | Add coin |
| `DELETE` | `/api/watchlist/:coinId` | Yes | Remove coin |

### Settings

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/settings/me` | Yes | Get settings |
| `PUT` | `/api/settings/me` | Yes | Update settings |

### Alerts

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/alerts/trigger` | Yes | Send price alert email |

### CoinGecko Proxy (Public + Cached)

| Method | Path | Cache TTL | Description |
|---|---|---|---|
| `GET` | `/coins` | 60s | Top 100 coins by market cap |
| `GET` | `/coins/:coinId` | 60s | Single coin details |
| `GET` | `/chart/:coinId` | 300s | Historical price chart |
| `GET` | `/coins/exchange-rates` | 3600s | Currency exchange rates |
| `GET` | `/search?q=` | 120s | Coin search |
| `GET` | `/api/public/coins` | 60s | Top 10 coins |

All proxy routes: `publicProxyLimiter` (20 req/min per IP), no auth required.

---

## Database Schema

### User (`models/user.js`)

| Field | Type | Default | Notes |
|---|---|---|---|
| `name` | String | required | Trimmed |
| `email` | String | required | Unique, lowercase, trimmed |
| `password` | String | conditional | Required for `local` provider |
| `googleId` | String | `""` | Google account ID |
| `provider` | String | `"local"` | `"local"` or `"google"` |
| `role` | String | `"user"` | User role |
| `avatar` | String | `""` | Cloudinary URL (max 500 chars) |
| `bio` | String | `""` | Trimmed |
| `isVerified` | Boolean | `false` | Email verified |
| `verificationOTP` | String | `""` | 6-digit code |
| `otpExpiry` | Date | `null` | Expiration |
| `otpAttempts` | Number | `0` | Failed attempts counter |

### RefreshToken (`models/refreshToken.js`)

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Reference to User |
| `tokenHash` | String | SHA-256 hash (indexed) |
| `userAgent` | String | Browser user agent |
| `isRevoked` | Boolean | Revocation flag |
| `createdAt` | Date | TTL index: 7 days auto-delete |

### Portfolio (`models/portfolio.js`)

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Unique per user |
| `holdings[]` | Array | See below |
| `chartData[]` | Array | Historical balance snapshots |

**Holding sub-document:** `coinId`, `symbol`, `name`, `quantity`, `averageBuyPrice`, `currentPrice`, `priceChange24h`, `priceChangePercentage24h`, `image`

### Watchlist (`models/watchlist.js`)

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Required |
| `coins[]` | Array | `{ coinId, symbol, name, image, current_price }` |

### Settings (`models/setting.js`)

| Field | Type | Default | Notes |
|---|---|---|---|
| `userId` | ObjectId | required | One per user |
| `theme` | String | `"dark"` | `"dark"` or `"light"` |
| `compactView` | Boolean | `false` | Compact UI |
| `notifications` | Boolean | `true` | Alert notifications |
| `language` | String | `"fr"` | `"en"`, `"fr"`, or `"ar"` |

---

## Security Measures

| Measure | Location |
|---|---|
| Helmet security headers | `server.js` |
| CORS origin restriction | `server.js` |
| Rate limiting (6 tiers) | `middleware/rateLimiter.js` |
| OTP throttling (max 5 attempts) | `authController.js` |
| Input validation (express-validator) | `utils/validators.js` |
| Password hashing (bcrypt, 10 rounds) | `authController.js` |
| HttpOnly cookies (XSS-safe) | `authController.js` |
| Refresh token rotation | `authController.js` |
| SHA-256 hashed refresh tokens in DB | `authController.js` |
| Short-lived access tokens (15min) | `utils/generateToken.js` |
| Open redirect prevention | `config.js` |
| Body size limit (500KB) | `server.js` |
| CoinGecko ID validation (alphanumeric regex) | `server.js` |
| Generic OTP error messages (no email enumeration) | `authController.js` |
| Cloudinary upload (no base64 in DB) | `utils/uploadAvatar.js` |
| In-memory cache (prevents API abuse) | `utils/cache.js` |

---

## CoinGecko Proxy & Caching

### Implementation (`utils/cache.js`)

Simple in-memory Map-based cache:
- `getCache(key)` — returns data if not expired, deletes expired entries
- `setCache(key, data, ttlSeconds)` — stores with expiration timestamp

### Cache Keys & TTLs

| Route | Cache Key Pattern | TTL |
|---|---|---|
| `/coins` | `coins_list_{currency}` or `coins_list_{ids}_{currency}` | 60s |
| `/coins/:coinId` | `coin_{coinId}_{currency}` | 60s |
| `/chart/:coinId` | `chart_{coinId}_{days}_{currency}` | 300s |
| `/coins/exchange-rates` | `exchange_rates` | 3600s |
| `/search?q=` | `search_{query}` | 120s |
| `/api/public/coins` | `coins_list_public` | 60s |

Frontend also has its own **chart cache** (`chartCacheRef` in `useMarketData.jsx`) — a `useRef` Map keyed by `coinId_period_currency` so switching chart tabs is instant after the first load per session.

---

## Avatar Upload (Cloudinary)

1. Frontend sends base64 data URI or URL string
2. `updateProfile` controller checks format:
   - base64 → uploads to Cloudinary → stores returned URL in MongoDB
   - URL → stores as-is
   - empty → deletes from Cloudinary + clears field
3. MongoDB stores only the Cloudinary URL (max 500 chars)
4. Cloudinary folder: `fintracker/avatars`, transforms: 400x400 crop, face gravity

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | 5000 | Server port |
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `CLIENT_URL` | No | `http://localhost:5173` | CORS origin |
| `CG_API_KEY` | Yes | — | CoinGecko API key |
| `GOOGLE_CLIENT_ID` | Yes | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | — | Google OAuth secret |
| `RESEND_API_KEY` | Yes | — | Resend email API key |
| `CLOUDINARY_CLOUD_NAME` | Yes | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | — | Cloudinary API secret |

### Frontend (`client/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Backend API URL |

---

## How to Run

### Prerequisites
- Node.js v18+ (v20 LTS recommended)
- MongoDB Atlas (free tier)
- CoinGecko API key (free tier)
- Google OAuth credentials
- Resend account (free: 100 emails/day)
- Cloudinary account (free tier)

### Backend
```bash
cd backend
cp .env.example .env   # Fill in all values
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

### URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
