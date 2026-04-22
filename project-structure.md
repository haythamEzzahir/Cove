# FinTracker - Project Structure & Logic

## Overview
A cryptocurrency tracking dashboard built with React + Vite.

---

## Folder Structure

```
src/
├── components/
│   ├── dashboard/     # Dashboard-specific components
│   │   ├── MetricCard.jsx   → Displays KPI metric (value, change %, badge)
│   │   ├── PriceChart.jsx   → Line chart for featured coin (uses Recharts)
│   │   ├── TrendingPanel.jsx → Shows top trending coins
│   │   └── MarketTable.jsx  → Table of top assets by market cap
│   │
│   ├── icons/        # Custom inline SVG icons (no external lib dependency)
│   │   └── SidebarIcons.jsx → DashboardIcon, MarketsIcon, WatchlistIcon, etc.
│   │
│   ├── layout/       # App shell components
│   │   ├── AppLayout.jsx    → Wraps all pages; provides Sidebar + TopBar + Outlet
│   │   ├── Sidebar.jsx      → Navigation menu with icons, active state, upgrade CTA
│   │   └── TopBar.jsx       → User profile, theme toggle, search
│   │
│   ├── settings/     # Settings/profile UI components
│   │   ├── ProfileCard.jsx  → User avatar card with "View Profile" button
│   │   ├── SettingsSection.jsx → Collapsible section wrapper
│   │   ├── SettingItem.jsx   → Label + description + control (toggle/select)
│   │   ├── ToggleSwitch.jsx  → Styled on/off toggle
│   │   └── CurrencySelect.jsx → Dropdown for currency selection
│   │
│   └── shared/       # Reusable across pages
│       ├── Badge.jsx        → Colored badge (green/red for +/-)
│       ├── CoinLogo.jsx     → Colored circle with ticker letter
│       └── TabBar.jsx       → Tab switcher (All/Gainers/Losers)
│
├── context/
│   └── SettingsContext.jsx  → Global settings state (dark mode, currency, alerts)
│                            → Persists to localStorage
│                            → Applies CSS variables to :root on theme change
│
├── data/
│   └── mockData.jsx  → Static mock market data (replace with live API)
│
├── hooks/
│   └── useMarketData.jsx → Central hook for market data fetching
│                           → Currently returns mock data
│                           → TODO: replace with CoinGecko/Binance API
│
├── pages/
│   ├── Dashboard.jsx  → Main page: metrics + chart + trending + market table
│   ├── Watchlist.jsx  → Paginated watchlist with add/remove, sort, filter, star
│   ├── Settings.jsx   → App preferences (theme, currency, notifications)
│   └── Profile.jsx    → User profile form, security, notification settings
│
├── router/
│   └── routes.jsx     → Route definitions (used by Sidebar, etc.)
│
├── styles/
│   ├── tokens.jsx     → Color tokens + applyTheme() function
│   │                   → Exports `themes.dark` / `themes.light` palettes
│   │                   → applyTheme() sets CSS variables on :root
│   ├── dashboard.css  → Dashboard page styles
│   ├── settings.css   → Settings page styles
│   └── profile.css     → Profile page styles
│
├── App.jsx            → Redirects to "/" (legacy, routes defined in main.jsx)
├── main.jsx           → Entry point: wraps App with SettingsProvider + RouterProvider
└── index.css          → Global reset + CSS variable defaults + body styling
```

---

## Routing

Routes are defined in `main.jsx` using React Router v6:

| Path               | Component      | Description              |
|--------------------|----------------|--------------------------|
| `/`                | Dashboard      | Home / market overview   |
| `/markets`         | Dashboard      | (shares Dashboard)       |
| `/watchlist`       | Watchlist      | Personal tracked assets  |
| `/portfolio`       | Dashboard      | (placeholder)            |
| `/alerts`          | Dashboard      | (placeholder)            |
| `/news`            | Dashboard      | (placeholder)            |
| `/settings`        | Settings       | App preferences          |
| `/settings/profile`| Profile        | User account form        |

All routes are nested under `AppLayout` which provides the Sidebar + TopBar shell.

---

## Theme System

1. `SettingsContext` holds `darkMode` boolean
2. On `darkMode` change → calls `applyTheme(mode)` from `tokens.jsx`
3. `applyTheme()` loops over theme object and sets CSS variables on `:root`
4. `index.css` provides fallback dark values to prevent white flash on load
5. Components use `var(--color-text-primary)` etc. — automatically react to theme

---

## Data Flow

```
mockData.jsx / useMarketData.jsx
        ↓
  useMarketData() hook (in Dashboard.jsx)
        ↓
  props → MetricCard, PriceChart, TrendingPanel, MarketTable
```

Currently static/mock. To integrate a live API:
1. Replace mock data in `useMarketData.jsx`
2. Add `useEffect` with `fetch` call
3. Update `useState` with real response
4. Components require no changes

---

## Key Patterns

- **Inline styles for dynamic values** — `colors.textPrimary` from `tokens.jsx`
- **CSS classes for layout** — `dashboard.css`, `settings.css`, `profile.css`
- **No Tailwind** — pure CSS + inline style objects
- **No router state in Sidebar** — uses `NavLink` with `isActive` for auto highlighting
- **Settings persisted** — `localStorage.setItem('fintracker_settings', ...)`