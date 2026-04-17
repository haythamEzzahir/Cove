# ZARVIS — Crypto Dashboard Design System

> Figma-ready specification. All values are provided in formats directly usable in Figma (HEX, px, border-radius tokens). Includes Light & Dark mode.

---

## 1. Brand Identity

| Property | Value |
|----------|-------|
| **App Name** | ZARVIS |
| **Logo** | Rounded square icon, mint-green background with a stylized "Z" or lightning bolt |
| **Tagline** | Crypto portfolio & market dashboard |

---

## 2. Color Palette

### Light Mode (Default)

| Token | HEX | Usage |
|-------|-----|-------|
| `--bg-primary` | `#FFFFFF` | Page background, cards |
| `--bg-secondary` | `#F5F6FA` | Dashboard content area background |
| `--bg-sidebar` | `#FFFFFF` | Sidebar background |
| `--text-primary` | `#1A1D2E` | Headings, primary text |
| `--text-secondary` | `#7B7F95` | Subtext, labels, timestamps |
| `--accent-green` | `#2ED8A3` | Primary accent, active nav, positive values, CTA buttons |
| `--accent-green-light` | `#E6FBF4` | Light green tint for badges, highlights |
| `--accent-coral` | `#FF6B6B` | Negative/loss indicator |
| `--accent-pink` | `#FF7EB3` | Secondary chart line, ETH icon bg |
| `--accent-purple` | `#7B61FF` | Card gradients (balance cards) |
| `--accent-purple-light` | `#A78BFA` | Card gradient end |
| `--border` | `#E8EAF0` | Card borders, dividers |
| `--shadow-card` | `0 2px 12px rgba(0,0,0,0.06)` | Card elevation |

### Dark Mode

| Token | HEX | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0F1120` | Page background |
| `--bg-secondary` | `#161832` | Cards, panels |
| `--bg-sidebar` | `#0D0F1E` | Sidebar |
| `--text-primary` | `#ECEDF3` | Headings, primary text |
| `--text-secondary` | `#6B6F8A` | Subtext, labels |
| `--accent-green` | `#2ED8A3` | Same — primary accent |
| `--accent-green-light` | `#1A3D35` | Muted green surface |
| `--accent-coral` | `#FF6B6B` | Negative indicator |
| `--accent-pink` | `#FF7EB3` | Chart line |
| `--accent-purple` | `#7B61FF` | Card gradient |
| `--accent-purple-light` | `#A78BFA` | Card gradient end |
| `--border` | `#1E2042` | Borders, dividers |
| `--shadow-card` | `0 2px 16px rgba(0,0,0,0.3)` | Card elevation |

---

## 3. Typography

| Element | Font | Weight | Size | Line Height | Color Token |
|---------|------|--------|------|-------------|-------------|
| App title (ZARVIS) | Inter / SF Pro | Bold (700) | 18px | 24px | `--text-primary` |
| Greeting ("Hello Kruluz…") | Inter | SemiBold (600) | 20px | 28px | `--text-primary` |
| Subtitle / date | Inter | Regular (400) | 12px | 16px | `--text-secondary` |
| Card value (9784.79) | Inter | Bold (700) | 28px | 36px | `--text-primary` |
| Card label ("BTC ⇌ USD") | Inter | Medium (500) | 12px | 16px | `--text-secondary` |
| Section title ("Market Overview") | Inter | SemiBold (600) | 16px | 22px | `--text-primary` |
| Nav item | Inter | Medium (500) | 14px | 20px | `--text-secondary` |
| Nav item active | Inter | SemiBold (600) | 14px | 20px | `--accent-green` |
| Table body | Inter | Regular (400) | 13px | 18px | `--text-primary` |
| Status badge | Inter | Medium (500) | 11px | 14px | `--accent-green` or `--accent-coral` |

---

## 4. Spacing & Grid

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| Sidebar width | 200px |
| Content padding | 24px |
| Card gap | 16px |
| Desktop grid | 12-column, 24px gutter |
| Mobile breakpoint | ≤ 768px (single column) |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Small badges, pills |
| `--radius-md` | 12px | Buttons, inputs |
| `--radius-lg` | 16px | Cards |
| `--radius-xl` | 20px | Outer dashboard container |
| `--radius-full` | 9999px | Avatars, circular icons |

---

## 6. Component Specifications

### 6.1 Sidebar

```
┌──────────────────┐
│  🟢 ZARVIS       │  ← Logo + brand
│                  │
│  ● Dashboard  ◄  │  ← Active (green dot + green text)
│  ○ Exchange      │
│  ○ Library       │
│  ○ Schedules     │
│  ○ Payouts       │
│  ○ Settings      │
│                  │
│  ┌──────────┐    │
│  │ Security │    │  ← CTA card (green bg, white text)
│  │  Banner  │    │
│  └──────────┘    │
└──────────────────┘
```

- **Width**: 200px
- **Background**: `--bg-sidebar`
- **Active indicator**: Left border 3px `--accent-green` + text color `--accent-green`
- **Nav icons**: 20×20px, stroke style, 1.5px
- **Security CTA card**: `--accent-green` bg, radius `--radius-lg`, padding 20px

### 6.2 Top Bar / Header

- **Height**: 64px
- **Contains**: Greeting text (left), Search input (center), User avatar (right)
- **Search input**: 240px wide, `--bg-secondary` bg, `--radius-md`, 36px height, placeholder "Search"
- **Avatar**: 40×40px, `--radius-full`

### 6.3 Crypto Price Cards (row of 3–4)

```
┌──────────────────────────┐
│  [Icon]  BTC ⇌ USD       │
│          9784.79          │  ← Bold large value
│  [Sparkline]    ▲22%     │  ← Mini chart + percentage badge
└──────────────────────────┘
```

- **Size**: ~200×110px
- **Background**: `--bg-primary`
- **Border**: 1px `--border`
- **Radius**: `--radius-lg`
- **Icon**: 36×36px circle, colored per coin (BTC=orange, LTC=blue, ETH=pink, BNB=green)
- **Sparkline**: 80×30px, stroke 2px, colored per trend
- **Percentage badge**: Green text for positive, coral for negative, font 11px

### 6.4 Market Overview Chart

- **Card padding**: 24px
- **Chart type**: Area / Line chart
- **Lines**: 2 (Buy = `--accent-green`, Sell = `--accent-purple`)
- **Fill**: Gradient from line color → transparent (10% opacity)
- **Time filters**: Pill buttons (All, 1M, 3M, 1Y, YTD), active = `--accent-green` bg + white text
- **Y-axis label**: `--text-secondary`, 11px
- **Tooltip**: Rounded card, shows value at point

### 6.5 Balances Card

```
┌───────────────────────┐
│  Balances          [+] │
│  $ Dollar              │
│  9784.79               │  ← Large bold
│  [Credit Card Image]   │  ← Purple gradient card with chip
└───────────────────────┘
```

- **Credit card visual**: Gradient `--accent-purple` → `--accent-purple-light`, radius 12px
- **Card numbers**: Masked (•••• •••• •••• XXXX), white text
- **Chip icon**: Gold/silver small rectangle

### 6.6 Recent Activities Table

| Column | Width | Align |
|--------|-------|-------|
| Coin icon + name | 40% | Left |
| Time | 25% | Left |
| Amount | 20% | Right |
| Status | 15% | Right |

- **Row height**: 48px
- **Status badges**: "Completed" = green text, "Pending" = orange/yellow text
- **Dividers**: 1px `--border` between rows

### 6.7 Team Card

```
┌───────────────────────┐
│  Team                  │
│  [Avatar] Total Admin  │  ← Purple bg pill
│           8            │
│  [Avatar] Team Member  │  ← Green bg pill
│           12           │
└───────────────────────┘
```

- **Role pills**: Rounded, colored bg, white text
- **Avatar**: 32×32px circle

---

## 7. Iconography

| Icon | Style | Size | Source |
|------|-------|------|--------|
| Navigation icons | Line/Stroke | 20px | Lucide / Feather |
| Coin logos | Filled circles | 36px | Custom or CoinGecko |
| Action icons (+, search) | Line | 20px | Lucide |
| Arrows (↑↓) | Filled | 12px | Custom |

---

## 8. Layout — Desktop (1440×900)

```
┌─────────┬──────────────────────────────────────┐
│         │  Header Bar (64px)                    │
│         ├────────┬────────┬────────┬────────────┤
│ Sidebar │ BTC    │ LTC    │ ETH    │ BNB        │
│ (200px) │ Card   │ Card   │ Card   │ Card       │
│         ├────────┴────────┴──┬─────┴────────────┤
│         │ Market Overview    │ Balances          │
│         │ (Chart)            │                   │
│         ├──────────────────┬─┴──────────────────┤
│         │ Recent Activities│ Team               │
│         │                  │                    │
└─────────┴──────────────────┴────────────────────┘
```

---

## 9. Layout — Mobile (375×812)

- **Sidebar**: Collapsed into hamburger menu (top-left)
- **Header**: Icons row (hamburger, logo, bell, avatar)
- **Cards**: Full-width, stacked vertically, swipeable carousel for crypto cards
- **"See More" link** below crypto cards
- **Chart**: Full-width, reduced height
- **Activities**: Card-style list (label: value rows instead of table)
- **All sections**: Stack vertically with `--space-lg` gap

---

## 10. Effects & Micro-interactions

| Effect | Description |
|--------|-------------|
| Card hover | Subtle lift: `translateY(-2px)` + shadow increase |
| Nav hover | Text color → `--accent-green`, 150ms ease |
| Button press | Scale 0.97, 100ms |
| Chart tooltip | Fade in 200ms on hover |
| Page transition | Fade 200ms |
| Sparkline | Animated draw-in on load (500ms) |
| Balance card | Subtle shimmer/shine effect on the credit card |

---

## 11. Figma Structure (Recommended)

```
📁 ZARVIS Design System
├── 📄 Colors (Light + Dark)
├── 📄 Typography
├── 📄 Spacing & Grid
├── 📄 Icons
├── 📁 Components
│   ├── Sidebar
│   ├── Header
│   ├── CryptoCard
│   ├── ChartCard
│   ├── BalanceCard
│   ├── ActivityRow
│   ├── TeamCard
│   ├── StatusBadge
│   ├── NavItem
│   └── SearchInput
├── 📁 Pages
│   ├── Dashboard — Light
│   ├── Dashboard — Dark
│   ├── Mobile — Light
│   └── Mobile — Dark
```

---

## 12. Dark Mode Preview Reference

Apply the **Dark Mode** tokens from Section 2. Key differences:
- All card backgrounds → `#161832`
- Page background → `#0F1120`
- Text flips to light (`#ECEDF3`)
- Borders become subtle (`#1E2042`)
- Green accent stays the same for continuity
- Chart area fills become more vibrant against dark bg
- Credit card gradient remains purple (works on both themes)

---

*Generated from ZARVIS dashboard screenshot. Ready for Figma import via tokens plugin (e.g., Figma Tokens / Style Dictionary).*
