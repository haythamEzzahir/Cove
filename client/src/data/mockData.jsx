import {
  AlertsIcon,
  DashboardIcon,
  MarketsIcon,
  NewsIcon,
  PortfolioIcon,
  WatchlistIcon,
} from '../components/icons/SidebarIcons';

// Mock market data - replace with live API calls via useMarketData hook

export const metrics = [
  { id: 'marketCap', label: 'Market Cap', value: '$2.64T', change: +4.2, icon: '🌐' },
  { id: 'volume', label: '24h Volume', value: '$84.2B', change: -4.5, icon: '💧' },
  { id: 'dominance', label: 'BTC Dominance', value: '52.4%', change: +0.1, icon: '₿' },
  { id: 'fearGreed', label: 'Fear & Greed', value: '72/100', change: null, icon: '😨', badge: 'Greed' },
];

export const chartData = [
  { t: '04:00', price: 66200 },
  { t: '06:00', price: 66800 },
  { t: '08:00', price: 66100 },
  { t: '10:00', price: 67400 },
  { t: '12:00', price: 67900 },
  { t: '14:00', price: 67200 },
  { t: '16:00', price: 67800 },
  { t: '18:00', price: 68100 },
  { t: '20:00', price: 67600 },
  { t: '22:00', price: 68500 },
  { t: '23:59', price: 68150 },
];

export const featuredCoin = {
  name: 'Bitcoin',
  ticker: 'BTC',
  status: 'Market Open',
  price: 68150.24,
  change: +2.45,
  changeAbs: +1632.18,
};

export const trendingCoins = [
  { name: 'Solana', ticker: 'SOL', price: '$145.30', change: +6.4 },
  { name: 'Chainlink', ticker: 'LINK', price: '$16.54', change: +4.5 },
  { name: 'Pepe', ticker: 'PEPE', price: '$0.0000688', change: +68.1 },
  { name: 'Avalanche', ticker: 'AVAX', price: '$35.12', change: -6.1 },
];

export const assets = [
  { rank: 1, name: 'Bitcoin', ticker: 'BTC', price: '$68,250.34', change: +2.45, marketCap: '$1.34T', volume: '$32.1B' },
  { rank: 2, name: 'Ethereum', ticker: 'ETH', price: '$3,453.38', change: +1.93, marketCap: '$415.3B', volume: '$15.4B' },
  { rank: 3, name: 'Tether', ticker: 'USDT', price: '$1.00', change: +0.01, marketCap: '$110.4B', volume: '$45.3B' },
  { rank: 4, name: 'BNB', ticker: 'BNB', price: '$594.12', change: -0.45, marketCap: '$88.3B', volume: '$1.2B' },
  { rank: 5, name: 'Solana', ticker: 'SOL', price: '$145.20', change: +6.42, marketCap: '$64.5B', volume: '$4.1B' },
];

export const navItems = [
  { icon: <DashboardIcon />, label: 'Dashboard', href: '#', active: true },
  { icon: <MarketsIcon />, label: 'Markets', href: '#', active: false },
  { icon: <WatchlistIcon />, label: 'Watchlist', href: '#', active: false },
  { icon: <PortfolioIcon />, label: 'Portfolio', href: '#', active: false },
  { icon: <AlertsIcon />, label: 'Alerts', href: '#', active: false },
  { icon: <NewsIcon />, label: 'News', href: '#', active: false },
];

export const user = {
  name: 'Alex Sivera',
  role: 'Pro Trader',
  initials: 'AS',
};
