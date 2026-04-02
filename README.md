# 📈 CryptoLive

A real-time cryptocurrency monitoring dashboard built with React — track prices, set alerts, visualize trends, and manage your watch list with a clean, fast interface.

---

## ✨ Features

- **Live Price Tracking** — Real-time price updates via WebSocket
- **Interactive Charts** — Historical and live candlestick/line charts
- **Price Alerts** — Get notified when a coin hits your target price
- **Authentication** — Secure user accounts with personal dashboards

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Routing | React Router v6 |
| State Management | Zustand / Context API |
| Charts | Recharts / Chart.js |
| Styling | CSS Modules / Tailwind CSS |
| Auth | Firebase Auth / JWT |
| Data | CoinGecko API / Binance WebSocket |

---

## 📁 Project Structure

```
crypto-live/
├── public/
│   └── index.html
├── src/
│   ├── assets/             # Images, icons, fonts
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Button, Input, Modal, etc.
│   │   ├── charts/         # Chart components
│   │   ├── layout/         # Navbar, Sidebar, Footer
│   │   └── crypto/         # CoinCard, PriceTable, AlertForm
│   ├── pages/              # Route-level pages
│   │   ├── Dashboard/
│   │   ├── CoinDetail/
│   │   ├── Alerts/
│   │   └── Auth/
│   ├── hooks/              # Custom React hooks
│   │   ├── useCryptoPrices.js
│   │   ├── useWebSocket.js
│   │   └── useAlerts.js
│   ├── services/           # API calls & WebSocket logic
│   │   ├── api.js
│   │   └── websocket.js
│   ├── store/              # Global state
│   ├── utils/              # Helpers & formatters
│   ├── context/            # Auth & theme context
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/crypto-live.git
cd crypto-live

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your API keys in .env

# Start development server
npm run dev
```

---

## 🔑 Environment Variables

```env
VITE_COINGECKO_API_KEY=your_key_here
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_WS_URL=wss://stream.binance.com:9443/ws
```

> ⚠️ Never commit your `.env` file. It's already listed in `.gitignore`.

---

## 📜 Available Scripts

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Lint the codebase
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
