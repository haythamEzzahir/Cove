# Cove

A real-time cryptocurrency tracking app — monitor prices, manage portfolios, set alerts, and keep a watchlist. Built with React + Express.

## Features

- **Landing Page** — Full-screen entry point with live ticker tape, 3D card stack, and CTA to Markets
- **Markets** — Sortable/filterable table of top 100 coins with search, pagination, and customizable columns
- **Price Chart** — Recharts area chart with time ranges (1D, 7D, 1M, 1Y, All), cached per period
- **Metric Cards** — Market cap, 24h volume, BTC dominance, Fear & Greed index
- **Watchlist** — Starred coins with live WebSocket price updates from Binance
- **Portfolio** — Holdings table with P&L, allocation donut chart, CSV/PDF export
- **Alerts** — Price threshold alerts with email notifications
- **Settings** — Theme (dark/light), currency selection, compact view, notification toggles
- **Auth** — Email/password + Google OAuth, email verification via OTP, HttpOnly cookie sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, React Router v6 |
| Charts | Recharts |
| Backend | Express.js 5, MongoDB (Mongoose) |
| Auth | JWT (HttpOnly cookies), Google OAuth |
| Market Data | CoinGecko API (backend proxy with in-memory cache) |
| Live Prices | Binance WebSocket (Watchlist only) |
| Email | Resend API |
| Avatars | Cloudinary |

## Project Structure

```
cove/
├── client/                     # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/           # AuthModal
│   │   │   ├── dashboard/      # MetricCard, PriceChart, WalletChart
│   │   │   ├── icons/          # SidebarIcons (Markets, Watchlist, etc.)
│   │   │   ├── layout/         # AppLayout, Sidebar, TopBar
│   │   │   ├── settings/       # CurrencySelect, ProfileCard, ToggleSwitch
│   │   │   └── shared/         # Badge, CoinLogo, TabBar
│   │   ├── context/            # Auth, Currency, Settings, Theme
│   │   ├── hooks/              # useMarketData, useBinanceWebSocket
│   │   ├── pages/              # Landing, Markets, Watchlist, Portfolio, Alerts, etc.
│   │   ├── styles/             # Design tokens (colors, radius, fontSize)
│   │   ├── config.js           # API_URL, formatPrice, fetchWithAuth, etc.
│   │   ├── main.jsx            # Entry point + React Router config
│   │   └── index.css           # CSS variables + semantic utility classes
│   └── public/favicon.svg      # Cove logo
├── backend/                    # Express API
│   ├── controllers/            # auth, market, portfolio, user, watchlist, settings
│   ├── middleware/             # authMiddleware, errorHandler, rateLimiter
│   ├── models/                 # user, refreshToken, portfolio, watchlist, setting
│   ├── routes/                 # authRoutes, marketRoutes, portfolioRoutes, etc.
│   ├── utils/                  # cache, generateToken, sendEmail, uploadAvatar, validators
│   ├── scripts/                # mergeDuplicatePortfolios
│   └── server.js               # Entry point
└── .env.example
```

## Routing

| Path | Page | Auth Required |
|------|------|---------------|
| `/` | Landing (full-screen, no sidebar) | No |
| `/markets` | Market table + chart + metrics | No |
| `/watchlist` | Starred coins with live prices | Yes |
| `/portfolio` | Holdings + P&L + export | Yes |
| `/alerts` | Price alerts management | Yes |
| `/settings` | App preferences | Yes |
| `/settings/profile` | Account details | Yes |
| `/login` | Sign in | No |
| `/signup` | Create account | No |
| `/verify-pending` | OTP verification | No |

Protected routes show an auth modal if the user is not logged in. Unverified users are redirected to `/verify-pending`.

## How It Works

1. **Landing page** (`/`) introduces the app with a live ticker, stats, and staggered card preview
2. **Markets** (`/markets`) fetches top 100 coins from CoinGecko via the backend proxy — cached in-memory for 60s. The price chart is cached per period/coin/currency in a React ref so switching tabs is instant after first load
3. **Watchlist** subscribes to Binance WebSocket streams for real-time price updates (only when on the Watchlist page)
4. **Portfolio** tracks holdings with average buy price, calculates P&L, exports as CSV or PDF (jsPDF + html2canvas)
5. **Alerts** check price thresholds on the client and trigger email via `POST /api/alerts/trigger`
6. **Auth** uses dual HttpOnly cookies — access token (15min) + refresh token (7 days, rotated on use)

## Getting Started

```bash
# Backend
cd backend
cp .env.example .env   # Fill in MongoDB URI, JWT secret, API keys
npm install
npm run dev

# Frontend (separate terminal)
cd client
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

## Environment Variables

See `.env.example` for backend. Frontend only needs `VITE_API_URL` (defaults to `http://localhost:5000`).
