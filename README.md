# 🪙 Cove — Crypto Portfolio & Market Tracker

> A modern crypto dashboard to track the market, manage your portfolio, follow your favorite assets, and stay updated with real-time prices.

---

## ✨ Features

* 🔐 **User Authentication** — Secure login, registration, and Google authentication
* 📊 **Crypto Market Tracking** — Explore real-time cryptocurrency prices and market data
* 📈 **Interactive Charts** — Analyze cryptocurrency price movements
* ⭐ **Watchlist** — Follow your favorite cryptocurrencies with live price updates
* 💼 **Portfolio Management** — Manage holdings and track profit & loss
* 🔔 **Price Alerts** — Create personalized cryptocurrency price alerts
* ⚙️ **Account Settings** — Manage your profile and preferences
* 📱 **Responsive Interface** — Clean and modern interface for different screen sizes

---

## 🛠️ Technologies Used

### Frontend

* **React 19**
* **Vite**
* **Tailwind CSS**
* **React Router**
* **Recharts**

### Backend

* **Node.js**
* **Express 5**
* **MongoDB**
* **Mongoose**
* **JWT Authentication**
* **Google OAuth**

### APIs & Services

* **CoinGecko API** — Cryptocurrency market data
* **Binance WebSocket** — Real-time price updates
* **Resend** — Email notifications
* **Cloudinary** — Profile image storage

---

## 🏗️ Architecture

```text
Cove/
├── client/          # React frontend
│   ├── components/  # Reusable UI components
│   ├── pages/       # Application pages
│   ├── hooks/       # Custom React hooks
│   ├── contexts/    # Global state
│   └── ...
│
├── backend/         # Express backend
│   ├── controllers/ # Business logic
│   ├── models/      # MongoDB models
│   ├── routes/      # API routes
│   ├── middleware/  # Authentication & middleware
│   └── ...
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/haythamEzzahir/Cove.git
cd Cove
```

### 2. Install dependencies

```bash
cd client
npm install
```

```bash
cd ../backend
npm install
```

### 3. Configure environment variables

Create the required `.env` files and configure your API keys, database connection, authentication, and external services.

### 4. Run the application

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd client
npm run dev
```

---

## 🌐 Live Demo

🚀 **Cove Web App:** https://covemoney.vercel.app/

**Frontend:** Vercel  
**Backend:** Render  
**Database:** MongoDB Atlas

---

## 📄 License

This project is licensed under the **MIT License**.
